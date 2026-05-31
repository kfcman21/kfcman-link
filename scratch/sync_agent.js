const fs = require('fs');
const path = require('path');
const http = require('http');
const { exec } = require('child_process');

const SERVER_URL = "http://140.245.76.33";  // Oracle VM IP
const SYNC_DIR = path.join(require('os').homedir(), 'Desktop', 'KFC_MAN_Sync');

if (!fs.existsSync(SYNC_DIR)) {
  fs.mkdirSync(SYNC_DIR, { recursive: true });
}

let watchedFiles = {}; // {filename: {doc_id, last_mtime}}

console.log("==================================================");
console.log("🍀 KFC MAN.HWP 실시간 로컬 폴더 동기화 에이전트");
console.log(`📂 감시 대상 바탕화면 폴더: ${SYNC_DIR}`);
console.log("==================================================");

function log(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}

// REST helper to fetch json
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download file helper
function downloadFile(docId, filename) {
  const fileUrl = `${SERVER_URL}/api/docs/${docId}/download`;
  const fileWriter = fs.createWriteStream(path.join(SYNC_DIR, filename));
  
  return new Promise((resolve, reject) => {
    http.get(fileUrl, (res) => {
      res.pipe(fileWriter);
      fileWriter.on('finish', () => {
        fileWriter.close();
        const mtime = fs.statSync(path.join(SYNC_DIR, filename)).mtimeMs;
        resolve(mtime);
      });
    }).on('error', reject);
  });
}

// Force sync docs from server
async function forceSync() {
  log("🔄 서버로부터 한글 파일 목록 동기화 중...");
  try {
    const data = await fetchJson(`${SERVER_URL}/api/docs`);
    const docs = data.docs || [];
    const hwpDocs = docs.filter(d => d.hasHwpData);
    
    log(`발견된 클라우드 문서: ${hwpDocs.length}개`);
    
    for (const doc of hwpDocs) {
      const docId = doc.id;
      const filename = doc.hwpName || `${doc.title}.hwp`;
      const filePath = path.join(SYNC_DIR, filename);
      
      if (!fs.existsSync(filePath)) {
        log(`📥 새 문서 다운로드 중: ${filename}`);
        const mtime = await downloadFile(docId, filename);
        watchedFiles[filename] = { doc_id: docId, last_mtime: mtime };
        log(`✅ 다운로드 완료: ${filename}`);
      } else if (!watchedFiles[filename]) {
        // If file exists locally but not in memory list, record its mtime
        const mtime = fs.statSync(filePath).mtimeMs;
        watchedFiles[filename] = { doc_id: docId, last_mtime: mtime };
      }
    }
  } catch (err) {
    log(`❌ 동기화 중 오류 발생: ${err.message}`);
  }
}

// Put request upload helper
function uploadFile(docId, filename, filePath) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = "data:application/x-hwp;base64," + fileBuffer.toString('base64');
    
    const payload = JSON.stringify({
      title: filename,
      hwpData: base64Data,
      hwpName: filename
    });
    
    const url = new URL(`${SERVER_URL}/api/docs/${docId}`);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${responseBody}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Watch loop
async function watchLoop() {
  await forceSync();
  
  setInterval(async () => {
    try {
      const files = fs.readdirSync(SYNC_DIR);
      for (const filename of files) {
        if (! (filename.endsWith('.hwp') || filename.endsWith('.hwpx')) ) continue;
        
        const filePath = path.join(SYNC_DIR, filename);
        const stats = fs.statSync(filePath);
        const mtime = stats.mtimeMs;
        
        if (!watchedFiles[filename]) continue;
        
        const { doc_id, last_mtime } = watchedFiles[filename];
        if (mtime > last_mtime) {
          log(`⚡ 바탕화면 한글 파일 변경 감지! 업로드 중: ${filename}`);
          try {
            await uploadFile(doc_id, filename, filePath);
            watchedFiles[filename].last_mtime = mtime;
            log(`✅ 클라우드 업로드 동기화 완료!`);
          } catch (uploadErr) {
            log(`❌ 업로드 실패: ${uploadErr.message}`);
          }
        }
      }
    } catch (e) {
      // Quiet errors
    }
  }, 2000);
}

// Open folder natively
exec(`explorer "${SYNC_DIR}"`);

// Run
watchLoop();
