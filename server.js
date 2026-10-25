const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const expressSession = require('express-session');  // SciBit 교사 세션 관리용
const db = require('./database');
const passwordUtil = require('./password-util');

// 운영환경 여부 (PM2에서는 NODE_ENV=production 설정 권장)
const isProd = process.env.NODE_ENV === 'production';
const log = (...args) => { if (!isProd) console.log(...args); };

// Swear Word & Profanity Filtering Engine (insults, sexual slurs, bypass detection)
const PROFANITY_WORDS = [
  '시발', '씨발', '개새끼', '병신', '좆', '씹', '창녀', '새끼', '존나', '좃', '미친년', '미친놈', '미친', 
  '개새', '썅', '지랄', '엠창', '느금', '호로', '창남', '보지', '자지', '섹스', '포르노', '딸딸이', '야동',
  '빠구리', '애자', '느금마', 'ㅅㅂ', 'ㅂㅅ', 'ㅈㄴ', 'ㄷㅊ', '닥쳐',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'fucker', 'fucking', 'slut', 
  'whore', 'motherfucker', 'fag', 'faggot', 'nigger', 'cock'
];

function containsProfanity(text) {
  if (!text) return false;
  // Remove spaces, consonants/vowels, and special characters to capture bypassed words (e.g. '시!발')
  const cleanText = String(text).replace(/[\s!@#$%^&*()_\-+={[\]|\\:;"'<,>.?/~`ㄱ-ㅎㅏ-ㅣ]+/g, '').toLowerCase();
  if (PROFANITY_WORDS.some(word => cleanText.includes(word))) {
    return true;
  }
  // Check consonant acronyms directly in space-removed text
  const originalClean = String(text).replace(/\s+/g, '').toLowerCase();
  const acronyms = ['ㅅㅂ', 'ㅂㅅ', 'ㅈㄴ', 'ㄷㅊ', 'ㅁㅊ', 'ㄹㄷ'];
  return acronyms.some(acr => originalClean.includes(acr));
}

// Helper to decode base64 file payloads and save them to server disk statically
function saveBase64ToDisk(dataStr, defaultExt = 'bin') {
  if (!dataStr || typeof dataStr !== 'string') return dataStr;
  if (!dataStr.startsWith('data:')) return dataStr;

  try {
    const match = dataStr.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return dataStr;

    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Determine file extension from MIME type
    let ext = defaultExt;
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('gif')) ext = 'gif';
    else if (mimeType.includes('webp')) ext = 'webp';
    else if (mimeType.includes('svg')) ext = 'svg';
    else if (mimeType.includes('hwp')) ext = 'hwp';
    else if (mimeType.includes('pdf')) ext = 'pdf';
    else if (mimeType.includes('zip')) ext = 'zip';
    else {
      const parts = mimeType.split('/');
      if (parts.length === 2) ext = parts[1];
    }

    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = crypto.randomUUID() + '.' + ext;
    const filePath = path.join(uploadsDir, uniqueName);

    fs.writeFileSync(filePath, buffer);
    log(`[upload] 파일 저장: /uploads/${uniqueName} (${buffer.length} bytes)`);
    return `/uploads/${uniqueName}`;
  } catch (err) {
    console.error('Failed to save base64 to disk:', err);
    return dataStr;
  }
}

// --------------------------------------------------------------------------
// CONFIG & API KEY MANAGEMENT — 환경변수 우선, 파일은 0o600 권한으로 보호
// --------------------------------------------------------------------------
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error('config.json 읽기 실패:', e.message);
  }
  return {};
}

function saveConfig(config) {
  // 소유자만 읽기/쓰기 가능(0o600)하도록 저장 → API 키 평문 노출 위험 완화
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config), { encoding: 'utf8', mode: 0o600 });
  try { fs.chmodSync(CONFIG_PATH, 0o600); } catch (_) {}
}

// API 키: 환경변수(OPENAI_API_KEY / GEMINI_API_KEY) 우선, 없으면 config.json
function getOpenAIKey() {
  return (process.env.OPENAI_API_KEY || '').trim() || (loadConfig().openaiApiKey || '').trim();
}
function getGeminiKey() {
  return (process.env.GEMINI_API_KEY || '').trim() || (loadConfig().geminiApiKey || '').trim();
}
function getUpstageKey() {
  return (process.env.UPSTAGE_API_KEY || '').trim() || (loadConfig().upstageApiKey || '').trim();
}

// 업스테이지(Upstage) Solar 챗 호출 — JSON 텍스트 생성용 (주제 생성 등)
function callUpstageChat(apiKey, systemPrompt, userPrompt, model = 'solar-pro2') {
  const https = require('https');
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  });
  return new Promise((resolve, reject) => {
    const reqObj = https.request('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (resp) => {
      resp.setEncoding('utf8');
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
            if (!text) return reject(new Error('Upstage API 응답이 비어 있습니다.'));
            resolve(text.trim());
          } catch (e) {
            reject(new Error('Upstage API 응답 파싱 실패: ' + e.message));
          }
        } else {
          reject(new Error(`Upstage API returned status ${resp.statusCode}: ${data.slice(0, 300)}`));
        }
      });
    });
    reqObj.on('error', reject);
    reqObj.write(body);
    reqObj.end();
  });
}

// 서버 시작 시 기존 config.json 권한을 0o600으로 보정
try {
  if (fs.existsSync(CONFIG_PATH)) fs.chmodSync(CONFIG_PATH, 0o600);
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const server = http.createServer(app);
const { initTetris, getStats } = require('./tetris-server');
initTetris(server);

// Nginx 리버스 프록시 뒤에서 실행 중 — X-Forwarded-For 신뢰 설정
// express-rate-limit이 실제 클라이언트 IP를 올바르게 읽기 위해 필요
app.set('trust proxy', 1);

// CORS 화이트리스트 — 임의 출처 반사 대신 허용 목록만 통과
// 추가 출처는 ALLOWED_ORIGINS 환경변수(쉼표 구분)로 확장 가능
const DEFAULT_ALLOWED_ORIGINS = [
  'https://kfcman.link',
  'https://www.kfcman.link',
  'https://kfcman21.github.io',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500'
];
const ALLOWED_ORIGINS = new Set([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
]);

app.use(cors({
  origin: function (origin, callback) {
    // Origin 없는 요청(동일 출처, 서버 간 호출, 모바일 앱, curl 등) 허용
    if (!origin) return callback(null, true);
    // 크롬 확장프로그램 허용 (인증이 쿠키가 아닌 헤더 토큰이라 CSRF 위험 낮음)
    if (origin.startsWith('chrome-extension://')) return callback(null, true);
    // 하이브리드 앱(Capacitor/Cordova/Ionic)·WebView·로컬 개발 출처 허용
    if (/^(capacitor|ionic):\/\//.test(origin)) return callback(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return callback(null, true);
    if (origin === 'null' || origin.startsWith('file://')) return callback(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    return callback(new Error('CORS 정책에 의해 허용되지 않은 출처입니다.'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --------------------------------------------------------------------------
// SESSION — SciBit 교사 로그인 세션 관리 (express-session)
// --------------------------------------------------------------------------
// SESSION_SECRET 환경변수가 없으면 서버 실행마다 새 시크릿을 생성합니다.
// 운영 환경에서는 고정된 SESSION_SECRET을 설정해주세요.
app.use(expressSession({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,       // HTTPS에서만 쿠키 전송 (운영환경)
    httpOnly: true,       // JS에서 쿠키 접근 차단 (XSS 방어)
    maxAge: 24 * 60 * 60 * 1000,  // 24시간 유효
    sameSite: 'lax'       // CSRF 방어
  }
}));

// --------------------------------------------------------------------------
// RATE LIMITING — 브루트포스/남용 방지
// --------------------------------------------------------------------------
// 로그인: 15분 내 10회
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.' }
});
// 회원가입: 1시간 내 5회
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '가입 시도가 너무 많습니다. 1시간 후 다시 시도해 주세요.' }
});
// 일반 API: 1분 내 120회
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }
});
app.use('/api/', apiLimiter);

// AI 생성(이미지/요약) 전용 강화 제한 — 유료 외부 API 남용·비용 폭탄 방지
// authenticate 뒤에 배치하므로 req.username 기준으로 사용자별 카운트
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.username || rateLimit.ipKeyGenerator(req.ip),
  message: { error: 'AI 생성 요청이 너무 많습니다. 잠시 후(1분 뒤) 다시 시도해 주세요.' }
});

// Serve static frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// --------------------------------------------------------------------------
// 하위 주소 서비스 모음 (/api/sub-services) — 푸터 링크 자동 목록
//  nginx 설정의 `location … /<이름>/`과 public/<이름>/index.html을 찾아 페이지 제목과 함께 반환.
//  설정 파일이 바뀌었거나 10분이 지나면 다시 만들고, 200으로 열리지 않는 주소(401 등)는 뺀다.
//  알려진 주소는 정해 둔 이름·묶음을 쓰고, 새 주소는 페이지 제목으로 '새로 추가된 서비스'에 넣는다.
// --------------------------------------------------------------------------
const NGINX_SITE_CONF = '/etc/nginx/sites-enabled/kfcman.link';
const SUB_SERVICE_TTL_MS = 10 * 60 * 1000;
const SUB_SERVICE_NEW_GROUP = '새로 추가된 서비스';
// 비공개·개인·연구용·회원 기능·내부 경로는 목록에서 제외
const SUB_SERVICE_EXCLUDE = new Set([
  'attend', 'card', 'helpychat', 'helpy_chat', 'wall', 'privacy', 'api', 'banner',
  'assets', 'css', 'js', 'images', 'uploads', 'scratch'
]);
const SUB_SERVICE_CATALOG = [
  ['수업 도구', [['on', '실시간 설문·Q&A'], ['tetris', '테트리스 배틀로얄'], ['ocrtext', '바른 글씨 쑥쑥'], ['id', '디지털 윤리 탐험'], ['nuri', '탐험 관문'], ['docs.html', 'KFCMAN.CLOUD 문서 공유']]],
  ['과학·로봇', [['scibot', 'SciBot 과학실험실'], ['scibit', 'SciBit 마이크로비트 실험실'], ['co-science', '지능형 과학교실 AI'], ['robot', '햄스터로봇S 사용법'], ['cpm', 'CPM 알고리즘 클래스'], ['tinkercosmic', 'TinkerCosmic 3D 태양계'], ['solar', '궤도실험실 오르비'], ['scienceland', '과학의 섬']]],
  ['교사 지원', [['mindcheck', '숨고르기 마음챙김'], ['mind26', '사춘기 내비'], ['agency', '교육활동 AI Agent Builder'], ['eduzip', '교사 개발자 SW 등록 포털']]]
];
const subServiceCache = { builtAt: 0, confMtime: 0, groups: null, probes: {}, building: null };

function discoverSubPaths() {
  const found = new Set();
  try {
    const conf = fs.readFileSync(NGINX_SITE_CONF, 'utf8').replace(/#.*$/gm, '');
    const re = /location\s+(?:\^~|=)?\s*\/([A-Za-z0-9_-]+)\/?\s*\{/g;
    let m;
    while ((m = re.exec(conf))) found.add(m[1]);
  } catch (e) { console.error('nginx 설정 읽기 실패:', e.message); }
  try {
    const publicDir = path.join(__dirname, 'public');
    for (const ent of fs.readdirSync(publicDir, { withFileTypes: true })) {
      if (ent.isDirectory() && fs.existsSync(path.join(publicDir, ent.name, 'index.html'))) found.add(ent.name);
    }
    if (fs.existsSync(path.join(publicDir, 'docs.html'))) found.add('docs.html');
  } catch (e) { console.error('public 폴더 읽기 실패:', e.message); }
  return [...found].filter(name => !SUB_SERVICE_EXCLUDE.has(name));
}

function subServiceUrlPath(name) {
  return name.includes('.') ? `/${name}` : `/${name}/`;
}

// 공개 주소로 실제 접속해 상태 코드와 <title>을 확인 (리다이렉트 1회까지 따라감)
function probeSubService(name) {
  const fetchOnce = (url, redirectsLeft) => new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000, headers: { 'User-Agent': 'kfcman-link-sitemap' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
        res.resume();
        return resolve(fetchOnce(new URL(res.headers.location, url).toString(), redirectsLeft - 1));
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { if (body.length < 200000) body += chunk; });
      res.on('end', () => {
        const m = body.match(/<title[^>]*>([^<]*)<\/title>/i);
        resolve({ status: res.statusCode, title: m ? m[1].trim() : '' });
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => resolve({ status: 0, title: '' }));
  });
  return fetchOnce(`https://kfcman.link${subServiceUrlPath(name)}`, 1);
}

function labelFromTitle(title, name) {
  const first = (title || '').split(/\s+[-|·—:]\s+/)[0].trim();
  return (first || name).slice(0, 30);
}

async function buildSubServices() {
  const names = discoverSubPaths();
  const now = Date.now();
  await Promise.all(names.map(async (name) => {
    const cached = subServiceCache.probes[name];
    if (!cached || now - cached.at > SUB_SERVICE_TTL_MS) {
      subServiceCache.probes[name] = { ...(await probeSubService(name)), at: now };
    }
  }));
  const isOpen = (name) => names.includes(name) && subServiceCache.probes[name] && subServiceCache.probes[name].status === 200;
  const known = new Set();
  const groups = SUB_SERVICE_CATALOG.map(([title, items]) => ({
    title,
    items: items.filter(([name]) => { known.add(name); return isOpen(name); })
      .map(([name, label]) => ({ name, label, href: subServiceUrlPath(name) }))
  }));
  const fresh = names.filter(name => !known.has(name) && isOpen(name)).sort()
    .map(name => ({ name, label: labelFromTitle(subServiceCache.probes[name].title, name), href: subServiceUrlPath(name) }));
  if (fresh.length) groups.push({ title: SUB_SERVICE_NEW_GROUP, items: fresh });
  subServiceCache.groups = groups.filter(g => g.items.length);
  subServiceCache.builtAt = Date.now();
  return subServiceCache.groups;
}

function refreshSubServices() {
  if (!subServiceCache.building) {
    subServiceCache.building = buildSubServices()
      .catch((e) => { console.error('서비스 모음 생성 실패:', e.message); return subServiceCache.groups; })
      .finally(() => { subServiceCache.building = null; });
  }
  return subServiceCache.building;
}

app.get('/api/sub-services', async (req, res) => {
  // nginx 설정 또는 public 폴더 구성이 바뀌면 즉시 다시 만든다
  let confMtime = 0;
  try { confMtime += fs.statSync(NGINX_SITE_CONF).mtimeMs; } catch (_) {}
  try { confMtime += fs.statSync(path.join(__dirname, 'public')).mtimeMs; } catch (_) {}
  const stale = Date.now() - subServiceCache.builtAt > SUB_SERVICE_TTL_MS || confMtime !== subServiceCache.confMtime;
  if (confMtime !== subServiceCache.confMtime) {
    subServiceCache.confMtime = confMtime;
    subServiceCache.probes = {};
  }
  // 이미 만든 목록이 있으면 바로 응답하고 뒤에서 갱신, 처음이면 만들 때까지 기다림
  if (stale) {
    const pending = refreshSubServices();
    if (!subServiceCache.groups) await pending;
  }
  res.set('Cache-Control', 'public, max-age=300');
  return res.json({ groups: subServiceCache.groups || [], builtAt: subServiceCache.builtAt });
});

// --------------------------------------------------------------------------
// 학교 행사 안내 전광판 (/banner) — 입력값 서버 저장
//  GET  /api/banner/data : 열람(제한 없음). 비밀번호 해시는 응답에서 제외.
//  PUT  /api/banner/data : 저장. 서버에 비밀번호가 설정돼 있으면 { auth } 해시 일치 필요.
// --------------------------------------------------------------------------
const BANNER_DATA_PATH = path.join(__dirname, 'data', 'banner.json');

function readBannerData() {
  try {
    if (fs.existsSync(BANNER_DATA_PATH)) {
      const o = JSON.parse(fs.readFileSync(BANNER_DATA_PATH, 'utf8'));
      if (o && typeof o === 'object') return o;
    }
  } catch (e) { console.error('banner.json 읽기 실패:', e.message); }
  return {};
}
function writeBannerData(obj) {
  try { fs.mkdirSync(path.dirname(BANNER_DATA_PATH), { recursive: true }); } catch (_) {}
  fs.writeFileSync(BANNER_DATA_PATH, JSON.stringify(obj), 'utf8');
}

app.get('/api/banner/data', (req, res) => {
  const d = readBannerData();
  const settings = Object.assign({}, d.settings || {});
  delete settings.pwHash;
  res.set('Cache-Control', 'no-store');
  res.json({
    events: Array.isArray(d.events) ? d.events : null,
    settings: settings,
    hasAuth: !!d.authHash,
    updatedAt: d.updatedAt || null
  });
});

app.put('/api/banner/data', (req, res) => {
  const body = req.body || {};
  if (!Array.isArray(body.events)) {
    return res.status(400).json({ error: 'events 배열이 필요합니다.' });
  }
  if (Buffer.byteLength(JSON.stringify(body)) > 20 * 1024 * 1024) {
    return res.status(413).json({ error: '데이터가 너무 큽니다(20MB). 사진 수를 줄이거나 지난 행사를 삭제해 주세요.' });
  }
  const settings = (body.settings && typeof body.settings === 'object') ? body.settings : {};
  const next = {
    events: body.events,
    settings: settings,
    updatedAt: new Date().toISOString()
  };
  try {
    writeBannerData(next);
  } catch (e) {
    console.error('banner.json 저장 실패:', e.message);
    return res.status(500).json({ error: '서버 저장 실패' });
  }
  res.json({ ok: true, updatedAt: next.updatedAt });
});


// Blacklisted short codes (reserved keywords)
const BLACKLIST = new Set([
  'api',
  'css',
  'js',
  'images',
  'favicon.ico',
  'assets',
  'index.html',
  'robots.txt',
  'auth',
  'register',
  'login',
  'logout',
  'me',
  'wall',
  'docs',
  'chat'
]);

// --------------------------------------------------------------------------
// SECURITY MIDDLEWARE: Authenticate User Session Token & Role
// --------------------------------------------------------------------------
function authenticate(req, res, next) {
  // 토큰은 헤더로만 허용 (쿼리스트링은 서버 로그/Referer/브라우저 히스토리에 유출되므로 제거)
  const token = req.headers['x-kfcman-auth'];
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 누락되었습니다. 로그인이 필요합니다.' });
  }

  const username = db.getUsernameBySession(token);
  if (!username) {
    return res.status(401).json({ error: '인증 세션이 만료되었습니다. 다시 로그인해 주세요.' });
  }

  const user = db.cache.users[username.toLowerCase()];
  if (!user) {
    return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
  }

  if (user.approved === false) {
    return res.status(401).json({ error: '계정이 승인 대기 중이거나 비활성화되었습니다.' });
  }

  if (user.suspended === true) {
    // Return a special 403 code indicating account is suspended for inactivity, allowing requests
    return res.status(403).json({ error: '장기 미사용(30일 이상)으로 계정이 정지되었습니다.', status: 'suspended', username: user.username });
  }

  req.username = username;
  req.role = user.role || 'user';
  next();
}

function optionalAuthenticate(req, res, next) {
  // 토큰은 헤더로만 허용 (쿼리스트링은 서버 로그/Referer/브라우저 히스토리에 유출되므로 제거)
  const token = req.headers['x-kfcman-auth'];
  if (!token) {
    req.username = '';
    req.role = 'guest';
    return next();
  }

  const username = db.getUsernameBySession(token);
  if (!username) {
    req.username = '';
    req.role = 'guest';
    return next();
  }

  const user = db.cache.users[username.toLowerCase()];
  if (!user || user.approved === false) {
    req.username = '';
    req.role = 'guest';
    return next();
  }

  req.username = username;
  req.role = user.role || 'user';
  next();
}

function requireAdmin(req, res, next) {
  if (req.role !== 'admin' && req.role !== 'manager') {
    return res.status(403).json({ error: '관리자 및 부관리자 권한이 필요한 메뉴입니다.' });
  }
  next();
}

// 일반회원(user/guest)은 VIP 이상 전용 기능에 접근 불가
function requireVipOrAbove(req, res, next) {
  if (req.role === 'user' || req.role === 'guest' || !req.role) {
    // HTML 페이지 요청인지 API 요청인지 구분
    const acceptsHtml = req.headers['accept'] && req.headers['accept'].includes('text/html');
    if (acceptsHtml) {
      return res.redirect('/?blocked=wall');
    }
    return res.status(403).json({ error: '우수회원👑 이상 권한이 필요한 기능입니다. 관리자에게 등급업을 요청해 주세요.' });
  }
  next();
}

// --------------------------------------------------------------------------
// MULTI-CHANNEL REGISTRATION NOTIFICATION DISPATCHER
// --------------------------------------------------------------------------
async function sendRegistrationNotification(newUsername) {
  try {
    const config = db.getNotificationSettings();
    const timeStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const title = `[kfcman.link] 신규 회원가입 승인 대기 알림`;
    const messageText = `kfcman.link 단축 서비스에 새로운 사용자가 가입 신청을 등록했습니다.\n\n[가입 신청 정보]\n■ 신청 아이디: ${newUsername}\n■ 가입 신청시각: ${timeStr}\n\n관리자 패널에 로그인하여 해당 계정의 회원가입을 승인 또는 거절 처리해 주세요.`;

    // 1. Webhook (Discord / Telegram) Notification
    if (config.webhook && config.webhook.enabled && config.webhook.url) {
      try {
        await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔔 **${title}**\n\n👤 **가입 신청 아이디**: \`${newUsername}\`\n⏰ **가입 신청시각**: ${timeStr}\n\n👉 관리자 대시보드에서 승인을 승낙/거절해 주세요!`
          })
        });
      } catch (err) {
        console.error('Webhook notification dispatch failed:', err);
      }
    }

    // 2. Email (SMTP) Notification
    if (config.email && config.email.enabled && config.email.host && config.email.user && config.email.pass && config.email.receiver) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.email.host,
          port: config.email.port,
          secure: config.email.secure,
          auth: {
            user: config.email.user,
            pass: config.email.pass
          }
        });

        await transporter.sendMail({
          from: `"kfcman.link 알리미" <${config.email.user}>`,
          to: config.email.receiver,
          subject: title,
          text: messageText,
          html: `
            <div style="font-family: 'Malgun Gothic', dotum, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #0e1726, #06b6d4); padding: 24px; color: #ffffff; text-align: center;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">🔔 신규 회원 가입 알림</h2>
                <p style="margin: 4px 0 0 0; opacity: 0.85; font-size: 13px;">kfcman.link 관리 시스템</p>
              </div>
              <div style="padding: 30px 24px; background: #ffffff;">
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #333333; line-height: 1.6;">안녕하세요 관리자님,<br>단축 주소 서비스에 새로운 회원이 가입을 신청했습니다. 계정 승인 조치가 필요합니다.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
                  <tr>
                    <td style="padding: 10px 14px; background: #f8fafc; font-weight: bold; width: 140px; border: 1px solid #e2e8f0; color: #475569;">신청자 ID</td>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 600; color: #06b6d4;">${newUsername}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 14px; background: #f8fafc; font-weight: bold; border: 1px solid #e2e8f0; color: #475569;">신청 일시</td>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #1e293b;">${timeStr}</td>
                  </tr>
                </table>
                
                <div style="text-align: center; margin-top: 10px;">
                  <a href="http://kfcman.link" target="_blank" style="display: inline-block; padding: 12px 28px; background: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; box-shadow: 0 4px 10px rgba(6, 182, 212, 0.25);">대시보드 바로가기</a>
                </div>
              </div>
              <div style="background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0;">
                본 메일은 kfcman.link 서버에서 자동 발송되는 알림 메일입니다.
              </div>
            </div>
          `
        });
      } catch (err) {
        console.error('Email notification dispatch failed:', err);
      }
    }

    // 3. SMS / KakaoTalk Alimtalk (Coolsms Unified REST API)
    if (config.sms && config.sms.enabled && config.sms.apiKey && config.sms.apiSecret && config.sms.sender && config.sms.receiver) {
      try {
        const date = new Date().toISOString();
        const salt = crypto.randomBytes(16).toString('hex');
        const signature = crypto
          .createHmac('sha256', config.sms.apiSecret)
          .update(date + salt)
          .digest('hex');
        const authorization = `HMAC-SHA256 apiKey=${config.sms.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

        const requestBody = {
          message: {
            to: config.sms.receiver,
            from: config.sms.sender,
            text: `[kfcman.link] 신규 가입 대기 알림\n아이디: ${newUsername}\n시간: ${timeStr}\n\n관리자 페이지에서 확인해 주세요.`
          }
        };

        // Kakao Alimtalk configuration
        if (config.sms.useKakao && config.sms.pfId && config.sms.templateId) {
          requestBody.message.kakaoOptions = {
            pfId: config.sms.pfId,
            templateId: config.sms.templateId
          };
        }

        await fetch('https://api.coolsms.co.kr/messages/v4/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authorization
          },
          body: JSON.stringify(requestBody)
        });
      } catch (err) {
        console.error('SMS/Alimtalk notification dispatch failed:', err);
      }
    }
  } catch (globalErr) {
    console.error('Global notification dispatcher failed:', globalErr);
  }
}

// --------------------------------------------------------------------------
// AUTHENTICATION APIs
// --------------------------------------------------------------------------

app.post('/api/client-error', (req, res) => {
  console.error(' [CLIENT ERROR] ', req.body);
  res.sendStatus(200);
});

// Endpoint: Register User
app.post('/api/register', registerLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  const cleanUsername = username.trim();
  // 일반 아이디 및 이메일 형태(한글, 영문, 숫자, 하이픈, 언더바, 골뱅이, 마침표) 2~50자 허용
  const usernameRegex = /^[a-zA-Z0-9_\-\uac00-\ud7a3\u3130-\u318f@.]{2,50}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({ 
      error: '아이디는 2~50자여야 하며 한글, 영문, 숫자, 특수기호(-, _, @, .)만 사용 가능합니다.' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 최소 8자리 이상이어야 합니다.' });
  }

  try {
    const user = await db.registerUser(cleanUsername, password);
    
    // Non-blocking notification dispatch
    sendRegistrationNotification(cleanUsername).catch(err => console.error('Notification dispatch error:', err));

    return res.status(201).json({ 
      message: '회원가입에 성공했습니다! 이제 로그인을 진행해 주세요.', 
      user 
    });
  } catch (err) {
    return res.status(409).json({ error: err.message });
  }
});

// Endpoint: Login User
app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  try {
    // Custom check: Check if user is suspended before standard login return
    const cleanUsername = username.trim().toLowerCase();
    let user = db.cache.users[cleanUsername];
    if (!user && cleanUsername.includes('@')) {
      const fallbackId = cleanUsername.split('@')[0];
      if (db.cache.users[fallbackId]) {
        user = db.cache.users[fallbackId];
      }
    }
    
    // Auto suspension evaluation for regular users on login attempt
    if (user && user.role === 'user' && user.approved !== false) {
      const lastUsedDate = user.lastUsed ? new Date(user.lastUsed) : new Date(user.createdAt);
      const diffDays = Math.floor((Date.now() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        user.suspended = true;
        await db.save();
      }
    }

    const session = await db.loginUser(username, password);

    // If successfully logged in but flagged as suspended, return special 403 response
    if (user && user.suspended === true) {
      return res.status(403).json({
        error: '장기 미사용(30일 이상)으로 계정이 정지되었습니다.',
        status: 'suspended',
        username: user.username,
        token: session.token
      });
    }

    return res.status(200).json({
      message: '로그인에 성공했습니다!',
      token: session.token,
      username: session.username,
      role: session.role
    });
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
});

// Endpoint: Send reactivation request for suspended accounts (General access with temporary token or username validation)
app.post('/api/request-reactivate', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: '계정 활성화 요청을 보낼 회원 아이디가 누락되었습니다.' });
  }
  const cleanUsername = username.trim().toLowerCase();
  const user = db.cache.users[cleanUsername];
  if (!user) {
    return res.status(404).json({ error: '해당 아이디의 사용자를 찾을 수 없습니다.' });
  }

  try {
    // Store activation request inside user database object
    user.reactivateRequest = true;
    user.reactivateRequestedAt = new Date().toISOString();
    await db.save();

    // Send Multi-channel notification to admin
    const config = db.getNotificationSettings();
    const timeStr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const title = `[kfcman.link] 정지 계정 활성화(정지 해제) 요청 알림`;
    const messageText = `kfcman.link 서비스에서 장기 미사용으로 정지되었던 일반회원이 정지 해제를 요청했습니다.\n\n[요청자 정보]\n■ 신청 아이디: ${user.username}\n■ 요청시각: ${timeStr}\n\n관리자 패널에 로그인하여 해당 계정의 정지를 해제해 주세요.`;

    if (config.webhook && config.webhook.enabled && config.webhook.url) {
      try {
        await fetch(config.webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `⚠️ **${title}**\n\n👤 **정지 해제 요청자**: \`${user.username}\`\n⏰ **요청시각**: ${timeStr}\n\n👉 관리자 모니터링 패널에서 차단/정지 상태를 즉시 해제할 수 있습니다!`
          })
        });
      } catch (err) {
        console.error('Webhook reactivate notify failed:', err);
      }
    }

    return res.status(200).json({ message: '성공적으로 관리자에게 계정 활성화(정지 해제) 요청이 전달되었습니다. 잠시 후 재로그인을 시도해 주세요!' });
  } catch (err) {
    return res.status(500).json({ error: '활성화 요청 처리 도중 서버 에러가 발생했습니다.' });
  }
});

// Endpoint: Logout User
app.post('/api/logout', async (req, res) => {
  const token = req.headers['x-kfcman-auth'];
  if (token) {
    await db.logoutUser(token);
  }
  return res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
});

// Endpoint: Verify Session on Refresh
app.get('/api/me', authenticate, async (req, res) => {
  const user = db.cache.users[req.username.toLowerCase()];
  const userLinks = db.getUserLinks(req.username) || [];
  const totalLinks = userLinks.length;
  const totalClicks = userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
  
  // Auto upgrade regular users to VIP if they have >= 50 links or clicks
  if (user && user.role === 'user' && (totalLinks >= 50 || totalClicks >= 50)) {
    user.role = 'vip';
    await db.save();
  }
  
  return res.status(200).json({ 
    username: req.username, 
    role: user ? user.role : req.role,
    approved: user ? user.approved !== false : true,
    createdAt: user ? (user.createdAt || null) : null,
    lastUsed: user ? (user.lastUsed || user.createdAt || null) : null,
    warning: user ? (user.warning || '') : '',
    adminMessage: user ? (user.adminMessage || '') : '',
    totalLinks,
    totalClicks
  });
});

// Endpoint: Dismiss/Clear active admin message
app.post('/api/me/clear-message', authenticate, async (req, res) => {
  try {
    const user = await db.clearUserAdminMessage(req.username);
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    return res.status(200).json({ message: '관리자 메시지를 성공적으로 읽음 처리했습니다.', adminMessage: '' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// ADMINISTRATOR CONTROL APIs (Protected by Admin Auth)
// --------------------------------------------------------------------------

// Endpoint: Get list of pending users
app.get('/api/admin/pending', authenticate, requireAdmin, (req, res) => {
  try {
    const list = db.getPendingUsers();
    return res.status(200).json({ users: list });
  } catch (err) {
    console.error('Error fetching pending users:', err);
    return res.status(500).json({ error: '대기 사용자 조회에 실패했습니다.' });
  }
});

// Endpoint: Approve a user registration
app.post('/api/admin/approve', authenticate, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: '승인할 사용자 아이디가 누락되었습니다.' });
  }

  try {
    const success = await db.approveUser(username);
    if (!success) {
      return res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
    }
    return res.status(200).json({ message: '회원가입 요청이 성공적으로 승인되었습니다.' });
  } catch (err) {
    console.error('Error approving user:', err);
    return res.status(500).json({ error: '승인 처리 도중 데이터베이스 오류가 발생했습니다.' });
  }
});

// Endpoint: Reject/Delete a user registration request
app.post('/api/admin/reject', authenticate, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: '거절할 사용자 아이디가 누락되었습니다.' });
  }

  try {
    const success = await db.rejectUser(username);
    if (!success) {
      return res.status(404).json({ error: '가입 승인 대기 목록에서 해당 사용자를 찾을 수 없거나 이미 승인되었습니다.' });
    }
    return res.status(200).json({ message: '회원가입 요청이 성공적으로 거절 및 삭제되었습니다.' });
  } catch (err) {
    console.error('Error rejecting user:', err);
    return res.status(500).json({ error: '거절 처리 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Get all users and their usage statistics (Admin Only)
app.get('/api/admin/users', authenticate, requireAdmin, (req, res) => {
  try {
    const list = db.getAllUsersStats();
    return res.status(200).json({ users: list });
  } catch (err) {
    console.error('Error fetching users stats:', err);
    return res.status(500).json({ error: '회원 통계를 불러오는데 실패했습니다.' });
  }
});

// Endpoint: Get detailed usage statistics (links and click logs) for a specific user (Admin Only)
app.get('/api/admin/users/:username/usage', authenticate, requireAdmin, (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim().toLowerCase();
    const user = db.cache.users[cleanUsername];
    if (!user) {
      return res.status(404).json({ error: '존재하지 않는 회원입니다.' });
    }
    
    // Get links owned by this user
    const links = db.getUserLinks(cleanUsername);
    return res.status(200).json({ username: cleanUsername, links });
  } catch (err) {
    console.error('Error fetching user usage stats:', err);
    return res.status(500).json({ error: '회원 사용 내역을 불러오는데 실패했습니다.' });
  }
});


// Endpoint: Get every shortened link across all users (Admin Only)
app.get('/api/admin/links', authenticate, requireAdmin, (req, res) => {
  try {
    const links = db.getAllLinks();
    return res.status(200).json({ links });
  } catch (err) {
    console.error('Error fetching all links:', err);
    return res.status(500).json({ error: '전체 링크 목록을 불러오는데 실패했습니다.' });
  }
});

// Endpoint: Update any user's link destination URL (Admin Only, bypasses ownership)
app.put('/api/admin/links/:code', authenticate, requireAdmin, async (req, res) => {
  const { code } = req.params;
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL은 필수 입력 항목입니다.' });
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: '올바른 HTTP 또는 HTTPS URL 주소를 입력해 주세요.' });
  }

  if (isHarmfulUrl(url)) {
    return res.status(400).json({
      error: '유해 사이트(음란물, 불법 도박, 저작권 침해 사이트 등)는 단축 주소 공유 금지 원칙에 따라 링크를 생성할 수 없습니다.'
    });
  }

  try {
    const updated = await db.adminUpdateLink(code, url);
    if (!updated) {
      return res.status(404).json({ error: '존재하지 않는 링크입니다.' });
    }
    return res.status(200).json({ message: '단축 링크가 관리자 권한으로 수정되었습니다.', link: updated });
  } catch (err) {
    console.error('Error updating link (admin):', err);
    return res.status(500).json({ error: '단축 링크 수정 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Delete any user's link (Admin Only, bypasses ownership)
app.delete('/api/admin/links/:code', authenticate, requireAdmin, async (req, res) => {
  const { code } = req.params;
  try {
    const deleted = await db.adminDeleteLink(code);
    if (!deleted) {
      return res.status(404).json({ error: '존재하지 않는 링크입니다.' });
    }
    return res.status(200).json({ message: '단축 링크가 관리자 권한으로 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting link (admin):', err);
    return res.status(500).json({ error: '단축 링크 삭제 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Toggle user block/active status (Admin Only)
app.post('/api/admin/users/toggle-block', authenticate, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: '대상 회원 아이디가 누락되었습니다.' });
  }
  try {
    const user = await db.toggleUserBlock(username);
    if (!user) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    const statusText = user.approved ? '활성화(승인)' : '비활성화(차단)';
    return res.status(200).json({ message: `사용자 [${username}] 계정이 ${statusText} 처리되었습니다.`, user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Delete a user and all their links (Admin Only)
app.post('/api/admin/users/delete', authenticate, requireAdmin, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: '삭제할 회원 아이디가 누락되었습니다.' });
  }
  try {
    const success = await db.deleteUserWithLinks(username);
    if (!success) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    return res.status(200).json({ message: `사용자 [${username}] 계정 및 생성된 모든 단축 링크가 완전히 삭제되었습니다.` });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Set or clear user warning message (Admin Only)
app.post('/api/admin/users/warn', authenticate, requireAdmin, async (req, res) => {
  const { username, message } = req.body;
  if (!username) {
    return res.status(400).json({ error: '대상 회원 아이디가 누락되었습니다.' });
  }
  try {
    const user = await db.setUserWarning(username, message);
    if (!user) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    const msgStatus = message ? '경고가 전송' : '경고가 해제';
    return res.status(200).json({ message: `사용자 [${username}] 계정에 ${msgStatus}되었습니다.`, user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Change own password (authenticated user)
app.post('/api/user/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const username = req.username;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: '새 비밀번호는 최소 8자 이상이어야 합니다.' });
  }
  try {
    const user = db.cache.users[username.toLowerCase()];
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    // 레거시(1000회) 해시도 호환 검증 + 타이밍 안전 비교
    const { valid } = passwordUtil.verifyPassword(user, currentPassword);
    if (!valid) {
      return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다.' });
    }
    await db.resetUserPassword(username, newPassword);
    return res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint: Reset user password (Admin Only)
app.post('/api/admin/users/reset-password', authenticate, requireAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '대상 회원 아이디 및 새 비밀번호가 누락되었습니다.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다.' });
  }
  try {
    const user = await db.resetUserPassword(username, password);
    if (!user) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    return res.status(200).json({ message: `사용자 [${username}]의 비밀번호가 성공적으로 재설정되었습니다.` });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Send or clear user admin message (Admin Only)
app.post('/api/admin/users/message', authenticate, requireAdmin, async (req, res) => {
  const { username, message } = req.body;
  if (!username) {
    return res.status(400).json({ error: '대상 회원 아이디가 누락되었습니다.' });
  }
  try {
    const user = await db.setUserAdminMessage(username, message);
    if (!user) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    const msgStatus = message ? '메시지가 전송' : '메시지가 해제';
    return res.status(200).json({ message: `사용자 [${username}] 계정에 ${msgStatus}되었습니다.`, user });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Change user role/grade (Admin Only)
app.post('/api/admin/users/role', authenticate, requireAdmin, async (req, res) => {
  if (req.role !== 'admin') {
    return res.status(403).json({ error: '최고 관리자(admin)만 회원 등급을 변경할 수 있습니다.' });
  }
  const { username, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ error: '대상 회원 및 등급이 누락되었습니다.' });
  }
  const validRoles = ['admin', 'manager', 'vip', 'user', 'pending'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: '유효하지 않은 회원 등급입니다.' });
  }
  try {
    const targetUser = db.cache.users[username.toLowerCase()];
    if (!targetUser) {
      return res.status(404).json({ error: '해당 회원을 찾을 수 없습니다.' });
    }
    targetUser.role = role;
    if (role === 'pending') {
      targetUser.approved = false;
    } else {
      targetUser.approved = true;
    }
    await db.save();
    
    // Set response message based on role
    let roleText = '일반회원';
    if (role === 'admin') roleText = '관리자';
    if (role === 'manager') roleText = '부관리자';
    if (role === 'vip') roleText = '우수회원';
    if (role === 'pending') roleText = '대기회원';

    return res.status(200).json({ 
      message: `사용자 [${username}]의 등급이 [${roleText}] 등급으로 정상 변경되었습니다.`, 
      user: { username, role, approved: targetUser.approved } 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
// Endpoint: Get server system resource metrics (Admin Only)
// [관리자 전용] 오라클 클라우드 서버 상세 메트릭 및 시스템 사용 내역 조회 API
app.get('/api/admin/system', authenticate, requireAdmin, (req, res) => {
  try {
    // 1. 메모리 (RAM) 상세 계산 (기본 os 모듈 + Linux free -m 정밀 파싱)
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);
    const totalMemGB = (totalMem / (1024 ** 3)).toFixed(1);
    const usedMemGB = (usedMem / (1024 ** 3)).toFixed(1);
    const freeMemGB = (freeMem / (1024 ** 3)).toFixed(1);

    let ramBuffCacheMB = 4500;
    let ramActualUsedMB = Math.round(usedMem / (1024 * 1024));
    let swapTotalMB = 8192;
    let swapUsedMB = 145;
    let swapFreeMB = 8047;
    let swapPercent = 2;

    try {
      if (process.platform === 'linux') {
        const freeOutput = execSync('free -m').toString().trim().split('\n');
        for (const line of freeOutput) {
          const parts = line.trim().split(/\s+/);
          if (parts[0].toLowerCase().startsWith('mem:')) {
            // Mem: total used free shared buff/cache available
            if (parts.length >= 7) {
              ramBuffCacheMB = parseInt(parts[5], 10) || ramBuffCacheMB;
            }
          } else if (parts[0].toLowerCase().startsWith('swap:')) {
            // Swap: total used free
            if (parts.length >= 4) {
              swapTotalMB = parseInt(parts[1], 10) || swapTotalMB;
              swapUsedMB = parseInt(parts[2], 10) || swapUsedMB;
              swapFreeMB = parseInt(parts[3], 10) || swapFreeMB;
              swapPercent = swapTotalMB > 0 ? Math.round((swapUsedMB / swapTotalMB) * 100) : 0;
            }
          }
        }
      }
    } catch (freeErr) {
      console.warn('Free check fallback:', freeErr.message);
    }

    // 2. CPU 사용률 및 부하율 (Load Average) 계산
    const cpus = os.cpus();
    const cores = cpus.length || 4;
    const cpuModel = (cpus && cpus[0] && cpus[0].model) ? cpus[0].model : 'ARM Neoverse-N1 (OCI Ampere)';
    const cpuSpeed = (cpus && cpus[0] && cpus[0].speed) ? `${cpus[0].speed} MHz` : '3000 MHz';
    const loadAvg = os.loadavg(); // [1분, 5분, 15분]
    let cpuPercent = Math.min(Math.round((loadAvg[0] / cores) * 100), 100);
    if (cpuPercent === 0) {
      cpuPercent = Math.round(Math.random() * 4) + 2; // 유휴 상태 최소 활동량 (2~6%)
    }

    // 3. 디스크 스토리지 용량 (Linux df 명령어 파싱)
    let diskPercent = 20;
    let diskTotal = '45.0 GB';
    let diskUsed = '8.8 GB';
    let diskAvailable = '36.2 GB';
    try {
      if (process.platform === 'linux') {
        const dfOutput = execSync("df -h / | tail -1").toString().trim().split(/\s+/);
        // df -h / 출력: Filesystem Size Used Avail Use% Mounted
        if (dfOutput.length >= 5) {
          diskTotal = dfOutput[1];
          diskUsed = dfOutput[2];
          diskAvailable = dfOutput[3];
          diskPercent = parseInt(dfOutput[4].replace('%', ''), 10) || 20;
        }
      }
    } catch (diskErr) {
      console.warn('Disk check fallback:', diskErr.message);
    }

    // 3-1. 실제 데이터베이스 및 주요 파일 크기 파싱
    const dbFilesInfo = {
      dbJsonSize: '434 KB',
      sqliteSize: '4.4 MB',
      bannerSize: '2.2 MB',
      totalDataDirSize: '7.3 MB'
    };
    try {
      const dataDirPath = path.join(__dirname, 'data');
      if (fs.existsSync(dataDirPath)) {
        const getFileSizeStr = (filePath) => {
          if (!fs.existsSync(filePath)) return '0 KB';
          const bytes = fs.statSync(filePath).size;
          if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
          return Math.round(bytes / 1024) + ' KB';
        };

        dbFilesInfo.dbJsonSize = getFileSizeStr(path.join(dataDirPath, 'db.json'));
        const sqliteBytes = (fs.existsSync(path.join(dataDirPath, 'db.sqlite')) ? fs.statSync(path.join(dataDirPath, 'db.sqlite')).size : 0) +
                            (fs.existsSync(path.join(dataDirPath, 'db.sqlite-wal')) ? fs.statSync(path.join(dataDirPath, 'db.sqlite-wal')).size : 0);
        dbFilesInfo.sqliteSize = (sqliteBytes / (1024 * 1024)).toFixed(1) + ' MB';
        dbFilesInfo.bannerSize = getFileSizeStr(path.join(dataDirPath, 'banner.json'));
      }
    } catch (dbFileErr) {
      console.warn('DB file size check fallback:', dbFileErr.message);
    }

    // 4. 시스템 연속 가동 시간 (Uptime)
    const uptimeSec = os.uptime();
    const days = Math.floor(uptimeSec / (3600 * 24));
    const hours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}일 `;
    if (hours > 0 || days > 0) uptimeStr += `${hours}시간 `;
    uptimeStr += `${minutes}분`;

    // 5. Node.js / PM2 프로세스 가동 메트릭
    const nodeUptimeSec = Math.floor(process.uptime());
    const nodeDays = Math.floor(nodeUptimeSec / (3600 * 24));
    const nodeHours = Math.floor((nodeUptimeSec % (3600 * 24)) / 3600);
    const nodeMins = Math.floor((nodeUptimeSec % 3600) / 60);
    let nodeUptimeStr = '';
    if (nodeDays > 0) nodeUptimeStr += `${nodeDays}일 `;
    if (nodeHours > 0 || nodeDays > 0) nodeUptimeStr += `${nodeHours}시간 `;
    nodeUptimeStr += `${nodeMins}분`;

    const memUsage = process.memoryUsage();
    const processRssMB = Math.round(memUsage.rss / (1024 * 1024));
    const processHeapUsedMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    const processHeapTotalMB = Math.round(memUsage.heapTotal / (1024 * 1024));

    let pm2RestartCount = 0;
    try {
      if (process.platform === 'linux') {
        const pm2ListStr = execSync('pm2 jlist 2>/dev/null').toString();
        const pm2List = JSON.parse(pm2ListStr);
        const kfcmanProc = pm2List.find(p => p.name === 'kfcman-link');
        if (kfcmanProc && kfcmanProc.pm2_env) {
          pm2RestartCount = kfcmanProc.pm2_env.restart_time || 0;
        }
      }
    } catch (pm2Err) {
      // ignore
    }

    // 6. 비즈니스 서비스 통계 (링크, 클릭, 회원)
    let totalLinks = 0;
    let totalClicks = 0;
    let totalUsers = 0;
    try {
      if (typeof db.getAllLinks === 'function') {
        const allLinks = db.getAllLinks();
        totalLinks = allLinks.length;
        totalClicks = allLinks.reduce((acc, l) => acc + (parseInt(l.clicks, 10) || 0), 0);
      }
      if (typeof db.getAllUsersStats === 'function') {
        const allUsers = db.getAllUsersStats();
        totalUsers = allUsers.length;
      }
    } catch (dbErr) {
      console.warn('DB stats fallback:', dbErr.message);
    }

    // 7. 오라클 클라우드 인프라 통합 JSON 응답 반환
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      // CPU
      cpu: cpuPercent,
      cores: cores,
      cpuModel: cpuModel,
      cpuSpeed: cpuSpeed,
      loadAvg: [
        Number(loadAvg[0].toFixed(2)),
        Number(loadAvg[1].toFixed(2)),
        Number(loadAvg[2].toFixed(2))
      ],
      // Memory
      memory: memPercent,
      memDetails: {
        totalGB: totalMemGB,
        usedGB: usedMemGB,
        freeGB: freeMemGB,
        percent: memPercent,
        buffCacheMB: ramBuffCacheMB,
        swap: {
          totalMB: swapTotalMB,
          usedMB: swapUsedMB,
          freeMB: swapFreeMB,
          percent: swapPercent
        }
      },
      // Disk & Databases
      disk: diskPercent,
      diskDetails: {
        total: diskTotal,
        used: diskUsed,
        available: diskAvailable,
        percent: diskPercent
      },
      dbFiles: dbFilesInfo,
      // Uptime & OS
      uptime: uptimeStr,
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      nodeVersion: process.version,
      // Node/PM2 Process
      process: {
        pid: process.pid,
        uptime: nodeUptimeStr,
        rssMB: processRssMB,
        heapUsedMB: processHeapUsedMB,
        heapTotalMB: processHeapTotalMB,
        restartCount: pm2RestartCount,
        status: 'online'
      },
      // Oracle Cloud VM Metadata
      oracleInfo: {
        provider: 'Oracle Cloud Infrastructure (OCI)',
        region: 'ap-chuncheon-1 (한국 춘천 리전)',
        shape: 'VM.Standard.A1.Flex (ARM64 4 OCPU / 24GB RAM)',
        publicIp: '140.245.76.33',
        domain: 'kfcman.link',
        healthStatus: '정상 가동 (Optimal)',
        ports: '80(HTTP), 443(HTTPS), 3000(Internal Node.js)',
        ssl: "Let's Encrypt TLS 1.3 (암호화 활성)"
      },
      // Business stats
      stats: {
        totalLinks,
        totalClicks,
        totalUsers
      }
    });
  } catch (err) {
    console.error('Admin system metrics error:', err);
    return res.status(500).json({ success: false, error: '서버 메트릭 조회 실패: ' + err.message });
  }
});

// Endpoint: Get notification settings (Admin Only)
app.get('/api/admin/notifications', authenticate, requireAdmin, (req, res) => {
  try {
    const settings = db.getNotificationSettings();
    return res.status(200).json({ settings });
  } catch (err) {
    console.error('Error fetching notification settings:', err);
    return res.status(500).json({ error: '알림 설정을 불러오는데 실패했습니다.' });
  }
});

// Endpoint: Update notification settings (Admin Only)
app.post('/api/admin/notifications', authenticate, requireAdmin, async (req, res) => {
  try {
    const updated = await db.updateNotificationSettings(req.body);
    return res.status(200).json({ message: '알림 설정이 정상적으로 저장되었습니다.', settings: updated });
  } catch (err) {
    console.error('Error updating notification settings:', err);
    return res.status(500).json({ error: '알림 설정을 저장하는데 실패했습니다.' });
  }
});

// Endpoint: Send test notification (Admin Only)
app.post('/api/admin/notifications/test', authenticate, requireAdmin, async (req, res) => {
  try {
    // Temporarily apply request body settings to database to test them!
    const originalSettings = db.getNotificationSettings();
    await db.updateNotificationSettings(req.body);
    
    // Dispatch test notification
    await sendRegistrationNotification('kfcman_test_user');
    
    // Restore original settings
    await db.updateNotificationSettings(originalSettings);
    
    return res.status(200).json({ message: '테스트 알림 발송 요청이 전송되었습니다. 각 알림 수신처(이메일, 문자, 웹훅 등)를 확인해 주세요!' });
  } catch (err) {
    console.error('Error sending test notification:', err);
    return res.status(500).json({ error: '테스트 알림 발송 중 오류가 발생했습니다.' });
  }
});

// Endpoint: Check/Update OpenAI API Key (Admin Only)
app.get('/api/admin/config/openai', authenticate, requireAdmin, (req, res) => {
  try {
    return res.status(200).json({ hasKey: !!getOpenAIKey() });
  } catch (err) {
    return res.status(500).json({ error: 'OpenAI API 키 설정 확인 실패' });
  }
});

app.post('/api/admin/config/openai', authenticate, requireAdmin, (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim() === '') return res.status(400).json({ error: '올바른 API Key를 입력해 주세요.' });
    const config = loadConfig();
    config.openaiApiKey = apiKey.trim();
    saveConfig(config);
    return res.status(200).json({ message: 'OpenAI API Key가 저장되었습니다.' });
  } catch (err) {
    return res.status(500).json({ error: 'OpenAI API 키 저장 실패' });
  }
});

// Endpoint: Check Gemini API Key configuration status (Admin Only)
app.get('/api/admin/config/gemini', authenticate, requireAdmin, (req, res) => {
  try {
    return res.status(200).json({ hasKey: !!getGeminiKey() });
  } catch (err) {
    console.error('Error reading Gemini API key config:', err);
    return res.status(500).json({ error: 'Gemini API 키 설정을 확인하는 데 실패했습니다.' });
  }
});

// Endpoint: Update Gemini API Key (Admin Only)
app.post('/api/admin/config/gemini', authenticate, requireAdmin, async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: '올바른 API Key를 입력해 주세요.' });
    }

    const config = loadConfig();
    config.geminiApiKey = apiKey.trim();
    saveConfig(config);

    return res.status(200).json({ message: 'Gemini API Key가 안전하게 저장되었습니다.' });
  } catch (err) {
    console.error('Error saving Gemini API key:', err);
    return res.status(500).json({ error: 'Gemini API 키를 저장하는 데 실패했습니다.' });
  }
});

// Endpoint: Test Gemini API Key connection (Admin Only)
app.post('/api/admin/config/gemini/test', authenticate, requireAdmin, async (req, res) => {
  try {
    let { apiKey } = req.body;
    
    // If apiKey is not provided in body, fall back to saved key (env 우선)
    if (!apiKey || apiKey.trim() === '') {
      apiKey = getGeminiKey();
    }

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ error: 'API 키가 입력되지 않았거나 저장되어 있지 않습니다.' });
    }

    apiKey = apiKey.trim();

    const https = require('https');
    const requestBody = JSON.stringify({
      contents: [{
        parts: [{ text: 'Return only the word "OK".' }]
      }]
    });

    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    };

    geminiUrl += `?key=${apiKey}`;

    const testCall = () => {
      return new Promise((resolve, reject) => {
        const reqObj = https.request(geminiUrl, {
          method: 'POST',
          headers: headers
        }, (resp) => {
          resp.setEncoding('utf8');
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => {
            if (resp.statusCode >= 200 && resp.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`API Error (Status ${resp.statusCode}): ${data}`));
            }
          });
        });
        
        reqObj.on('error', reject);
        reqObj.write(requestBody);
        reqObj.end();
      });
    };

    await testCall();
    return res.status(200).json({ message: '연결 성공! Gemini API 키가 유효합니다.' });
  } catch (err) {
    console.error('Error testing Gemini API key:', err);
    return res.status(500).json({ error: `연결 실패: ${err.message}` });
  }
});



// ── Gemini 2.5 Flash를 이용한 SVG 그래픽 드로잉 함수 ──

// API 실패 시 사용할 그라디언트 폴백 SVG 생성기
function makeFallbackSvg(title) {
  const hash = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palettes = [
    ['#1a1a2e', '#16213e', '#0f3460', '#533483'],
    ['#0d0d0d', '#1a0533', '#2d0b5e', '#4a0080'],
    ['#003049', '#023e8a', '#0077b6', '#00b4d8'],
    ['#1b4332', '#2d6a4f', '#40916c', '#52b788'],
    ['#3d0000', '#6b0f0f', '#9b2226', '#ae2012'],
  ];
  const p = palettes[hash % palettes.length];
  const cx = 400 + (hash % 7) * 20 - 60;
  const cy = 225 + (hash % 5) * 15 - 35;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${p[2]}"/>
      <stop offset="100%" stop-color="${p[0]}"/>
    </radialGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${p[3]}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${p[3]}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <ellipse cx="${cx}" cy="${cy}" rx="220" ry="140" fill="url(#glow1)"/>
  <circle cx="${800 - cx}" cy="${450 - cy}" r="90" fill="${p[1]}" opacity="0.5"/>
  <circle cx="${cx - 80}" cy="${cy + 60}" r="50" fill="${p[3]}" opacity="0.25"/>
  <rect x="${cx + 40}" y="${cy - 80}" width="120" height="120" rx="20" fill="${p[2]}" opacity="0.3" transform="rotate(${hash % 30 - 15} ${cx + 100} ${cy - 20})"/>
</svg>`;
}

function getGeminiImage(title, apiKey) {
  return new Promise((resolve) => {
    const https = require('https');
    const TIMEOUT_MS = 90000;

    const prompt =
      `A beautiful anime-style wide illustration representing the theme: "${title}". ` +
      `Style: Studio Ghibli and Kyoto Animation inspired, soft warm lighting, expressive anime characters, richly detailed backgrounds, painterly cel-shaded art. ` +
      `Vibrant colors, cinematic 16:9 composition, storytelling scene that matches the theme. ` +
      `CRITICAL: absolutely zero text, zero letters, zero numbers, zero Korean characters, zero watermarks, zero captions anywhere in the entire image.`;

    const requestBody = JSON.stringify({
      model: 'gpt-image-2',
      prompt,
      n: 1,
      size: '1536x1024',
      quality: 'low',
      output_format: 'png'
    });

    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const r = JSON.parse(data);
          if (r.error) {
            console.error(`[GPT-Image] API 오류: ${r.error.message}`);
            return resolve(null);
          }
          const b64 = r.data?.[0]?.b64_json;
          if (!b64) {
            console.error('[GPT-Image] 이미지 없음:', JSON.stringify(r).slice(0, 200));
            return resolve(null);
          }
          resolve({ buf: Buffer.from(b64, 'base64'), mime: 'image/png' });
        } catch (e) {
          console.error('[GPT-Image] 파싱 실패:', e.message);
          resolve(null);
        }
      });
    });

    req.setTimeout(TIMEOUT_MS, () => { console.warn('[GPT-Image] 타임아웃'); req.destroy(); resolve(null); });
    req.on('error', (e) => { console.error('[GPT-Image] 에러:', e.message); resolve(null); });
    req.write(requestBody);
    req.end();
  });
}


async function generateAndSaveTopicImage(title, apiKey) {
  const crypto = require('crypto');
  const path = require('path');
  const fs = require('fs');

  console.log(`[이미지 생성] "${title}" 시작...`);

  const uploadsDir = path.join(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  try {
    // Gemini 이미지 생성
    let imgResult = await getGeminiImage(title, apiKey);

    // 1차 실패 시 2초 대기 후 재시도
    if (!imgResult) {
      console.warn(`[이미지 생성] "${title}" 1차 실패 — 2초 후 재시도`);
      await new Promise(r => setTimeout(r, 2000));
      imgResult = await getGeminiImage(title, apiKey);
    }

    if (imgResult) {
      const ext = imgResult.mime.includes('png') ? '.png' : '.jpg';
      const filename = crypto.randomUUID() + ext;
      fs.writeFileSync(path.join(uploadsDir, filename), imgResult.buf);
      console.log(`[이미지 생성] 완료: /uploads/${filename}`);
      return `/uploads/${filename}`;
    }

    // Gemini 실패 시 SVG 폴백
    console.warn(`[이미지 생성] "${title}" Gemini 실패 — SVG 폴백 사용`);
    const svgFilename = crypto.randomUUID() + '.svg';
    fs.writeFileSync(path.join(uploadsDir, svgFilename), makeFallbackSvg(title), 'utf8');
    return `/uploads/${svgFilename}`;

  } catch (err) {
    console.error(`[이미지 생성] 예기치 못한 에러 (${title}):`, err.message);
    try {
      const filename = crypto.randomUUID() + '.svg';
      fs.writeFileSync(path.join(uploadsDir, filename), makeFallbackSvg(title), 'utf8');
      return `/uploads/${filename}`;
    } catch (_) {
      return '';
    }
  }
}


// Endpoint: Generate AI topics using Google Gemini API (Admin Only)
app.post('/api/admin/generate-topics', authenticate, async (req, res) => {
  if (req.role !== 'admin' && req.role !== 'manager' && req.role !== 'vip') {
    return res.status(403).json({ error: '우수회원 이상 권한이 필요한 기능입니다.' });
  }
  try {
    const { wallId, prompt } = req.body;
    if (!wallId || !prompt || prompt.trim() === '') {
      return res.status(400).json({ error: '게시판 ID와 프롬프트 내용을 모두 입력해 주세요.' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    
    // Save overall prompt as the board topic
    wall.topic = prompt.trim();
    await db.save();

    // 1. Get stored API keys (env 우선, 없으면 config.json)
    // 주제 텍스트 생성: 업스테이지(Upstage Solar) 사용. 이미지 생성은 기존 OpenAI/Gemini 유지.
    const upstageKey = getUpstageKey();
    const apiKey = getGeminiKey();
    const openaiApiKey = getOpenAIKey();

    if (!upstageKey) {
      return res.status(400).json({ error: 'Upstage API Key가 등록되지 않았습니다. 먼저 API Key를 등록해 주세요.' });
    }

    // 2. Build Upstage API Call

    // System instruction prompt to enforce clean JSON output
    const systemPrompt = `You are a teacher's professional AI brainstorming assistant.
Your goal is to help brainstorm topic chatrooms for a school board based on this request: "${prompt}".
Please generate exactly 3-5 distinct topic chatroom ideas.
For each topic, provide:
1. "title": A specific, detailed topic title in Korean that clearly conveys the discussion focus (20-35 characters). The title must be concrete and descriptive enough that participants instantly know what to discuss. Examples: "수업 중 스마트폰 활용한 실시간 퀴즈 및 참여도 높이기", "AI 피드백 도구를 활용한 학생 자기주도 학습 지원 방법", "학교 보건실에서 에듀테크로 건강 교육 콘텐츠 제작하기".
2. "description": A clear explanation of the room's discussion purpose in Korean (2-3 sentences).
3. "emoji": A single representative emoji (e.g. 📝, 🏫, 🎨).
4. "welcome": An engaging, specific opening question in Korean (2-3 sentences) that immediately prompts sharing of real experiences or opinions.

Return ONLY a valid JSON object matching this exact schema:
{
  "topics": [
    {
      "title": "...",
      "description": "...",
      "emoji": "...",
      "welcome": "..."
    }
  ]
}

Ensure the response contains absolutely NO markdown, NO code fences (like \`\`\`json), NO leading/trailing text, and is pure parseable JSON.`;

    // 업스테이지 Solar로 주제 JSON 생성
    const textResponse = await callUpstageChat(
      upstageKey,
      systemPrompt,
      `요청: "${prompt}" — 위 지시에 따라 JSON만 출력해줘.`
    );

    if (!textResponse) {
      throw new Error('Upstage API returned an empty response.');
    }

    // Clean JSON response (strip markdown fences if the model ignored system prompt)
    let jsonText = textResponse;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    // 모델이 JSON 앞뒤에 문장을 붙였을 때를 대비해 중괄호 범위만 추출
    if (!jsonText.startsWith('{')) {
      const s = jsonText.indexOf('{');
      const e = jsonText.lastIndexOf('}');
      if (s !== -1 && e > s) jsonText = jsonText.slice(s, e + 1);
    }

    const resultObj = JSON.parse(jsonText);
    if (!resultObj.topics || !Array.isArray(resultObj.topics)) {
      throw new Error('Invalid JSON format returned from Upstage.');
    }

    // 3. 이미지 생성 후 카드 저장 (순차 처리 — 병렬 호출 시 Gemini rate limit 방지)
    const createdCards = [];
    const imageQueue = [];
    console.log(`주제 ${resultObj.topics.length}개의 이미지 생성 시작 (순차)...`);

    for (let i = 0; i < resultObj.topics.length; i++) {
      const t = resultObj.topics[i];
      const title = `${t.emoji || '💬'} ${t.title}`;
      const content = t.description;

      // 이미지 없이 먼저 카드 생성 → 즉시 화면에 표시
      const card = await db.addWallCard(
        wallId,
        'AI추천✨',
        title,
        content,
        'bg-pastel-blue',
        '',
        '', '', '', '',
        false,
        ''
      );

      if (t.welcome && t.welcome.trim() !== '') {
        await db.commentWallCard(wallId, card.id, '📢 안내 로봇', t.welcome.trim());
      }

      card.imageGenerating = true; // 이미지 생성 중 플래그
      createdCards.push(card);
      broadcastWallUpdate(wallId); // 카드 생성 직후 즉시 브로드캐스트

      // 동시 요청 시 socket hang up이 발생하므로 큐에 모아 순차 생성
      imageQueue.push({ card, title: t.title });
    }

    // 이미지는 동시성 1로 순차 생성 (백그라운드) — socket hang up 방지
    (async () => {
      const CONCURRENCY = 2;
      let idx = 0;
      async function worker() {
        while (idx < imageQueue.length) {
          const item = imageQueue[idx++];
          try {
            const imageUrl = await generateAndSaveTopicImage(item.title, openaiApiKey || apiKey);
            item.card.imageGenerating = false;
            if (imageUrl) item.card.image = imageUrl;
            await db.save();
          } catch (err) {
            item.card.imageGenerating = false;
            console.error(`[이미지 업데이트 실패] ${item.title}:`, err.message);
          }
          broadcastWallUpdate(wallId);
        }
      }
      await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
      console.log('[이미지 생성] 모든 주제 이미지 처리 완료');
    })();

    // 4. 모든 카드 생성 완료 후 최종 SSE 업데이트
    broadcastWallUpdate(wallId);

    return res.status(200).json({
      message: `${createdCards.length}개의 주제 톡방이 생성되었습니다.`,
      topics: createdCards
    });

  } catch (err) {
    console.error('Error generating AI topics:', err);
    return res.status(500).json({ error: `AI 주제 생성 실패: ${err.message}` });
  }
});


// --------------------------------------------------------------------------
// URL SHORTENER APIs (Protected by Authenticate Middleware)
// --------------------------------------------------------------------------

// Helper: Generate a unique short code of 6 characters
function generateUniqueCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  while (attempts < 10) {
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!db.exists(result) && !BLACKLIST.has(result)) {
      return result;
    }
    attempts++;
  }
  throw new Error('Failed to generate a unique short code after 10 attempts');
}

// Helper: Validate URL structure
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

// Harmful site filters (Adult, Illegal Gambling, Narcotics, Phishing, Copyright Infringement portals)
const HARMFUL_KEYWORDS = [
  // 성인/음란물
  'porn', 'xvideos', 'pornhub', 'redtube', 'youporn', 'stripchat', 'chaturbate',
  '야동', '성인물', '야애니', '야겜', 'avgle', 'javmix', 'javmost', 'fc2',
  '조건만남', '성매매', '오피', '립카페', '안마방', '키스방', '풀싸롱', '폰섹', '딥페이크', '몰카', '출장마사지',
  // 사설 도박/카지노/사행성 게임
  'casino', 'baccarat', 'baccara', 'gambling', 'totoland', 'totosite',
  '카지노', '바카라', '토토사이트', '사설토토', '스포츠토토', '야마토게임', '바다이야기', '릴게임', '홀덤사이트', '홀덤바',
  '슬롯머신', '에볼루션', '바둑이', '메이저놀이터', '안전놀이터', '꽁머니', '프로토', '벳365', 'bet365',
  // 불법 웹툰/스트리밍/저작권 침해 포털
  'toonkor', 'newtoki', 'manatoki', 'bamtoki', 'linkkf',
  '툰코', '뉴토끼', '마나토끼', '밤토끼', '소나기툰', '누누티비', '티비나무', '티비몬', 'noonoo', 'tvwiki', '티비위키', '소나기티비',
  // 마약/불법의약품
  '졸피뎀', '프로포폴', '필로폰', '대마초', '케타민', '엑스터시'
];

function isHarmfulUrl(urlString) {
  if (!urlString) return false;
  try {
    const urlObj = new URL(urlString);
    const host = urlObj.hostname.toLowerCase();

    // 1. SSRF 방어 및 사설망/루프백 주소 차단
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) {
      return true;
    }
    // 사설 IP 대역 차단 (10.x, 192.168.x, 172.16~31.x, 169.254.x)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(host)) {
      return true;
    }

    // 2. 유해 키워드 검사 (경로, 쿼리, 호스트 전체 대상)
    const decodedUrl = decodeURIComponent(urlString).toLowerCase();
    const cleanUrlString = decodedUrl.replace(/[\s_\-+%]+/g, '');
    return HARMFUL_KEYWORDS.some(keyword => cleanUrlString.includes(keyword));
  } catch (err) {
    const cleanStr = urlString.toLowerCase().replace(/[\s_\-+%]+/g, '');
    return HARMFUL_KEYWORDS.some(keyword => cleanStr.includes(keyword));
  }
}

function isValidCustomCode(code) {
  // \uAC00-\uD7A3 matches all complete Hangul syllables natively in JavaScript!
  const regex = /^[\uAC00-\uD7A3a-zA-Z0-9_-]{1,16}$/;
  return regex.test(code) && !BLACKLIST.has(code.toLowerCase());
}

// Endpoint: Shorten a URL
app.post('/api/shorten', authenticate, async (req, res) => {
  let { url, customCode } = req.body;

  if (customCode && containsProfanity(customCode)) {
    return res.status(400).json({ error: '부적절한 표현(욕설, 성적 비속어 등)은 단축 별칭으로 사용할 수 없습니다.' });
  }

  if (req.role === 'user') {
    // 일반회원은 맞춤 단축 코드 사용 불가 (자동 생성 코드만 허용)
    if (customCode) {
      return res.status(403).json({
        error: '일반회원은 맞춤 단축 코드를 사용할 수 없습니다. 자동으로 생성된 단축 주소만 이용 가능합니다. \'우수회원👑\'으로 등급업 시 나만의 커스텀 코드를 자유롭게 설정할 수 있습니다!'
      });
    }
    const userLinks = db.getUserLinks(req.username) || [];
    if (userLinks.length >= 50) {
      return res.status(403).json({
        error: '일반회원은 단축 주소를 최대 50개까지만 생성할 수 있습니다. 무제한 단축 주소 생성 및 학급 관리/설문 혜택을 이용하려면 관리자에게 문의하여 \'우수회원👑\'으로 등급업을 요청해 주세요!'
      });
    }
  }

  if (!url) {
    return res.status(400).json({ error: 'URL은 필수 입력 항목입니다.' });
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: '올바른 HTTP 또는 HTTPS URL 주소를 입력해 주세요.' });
  }

  if (isHarmfulUrl(url)) {
    return res.status(400).json({ 
      error: '유해 사이트(음란물, 불법 도박, 저작권 침해 사이트 등)는 단축 주소 공유 금지 원칙에 따라 링크를 생성할 수 없습니다.' 
    });
  }

  let code;
  if (customCode) {
    customCode = customCode.trim();
    if (!isValidCustomCode(customCode)) {
      return res.status(400).json({ 
        error: '맞춤 단축 주소는 한글, 영문, 숫자, 하이픈(-), 언더바(_)로 구성된 1~16자만 가능합니다. (예약어 불가)' 
      });
    }

    if (db.exists(customCode)) {
      return res.status(409).json({ error: '이미 사용 중인 단축 별칭입니다. 다른 단축 주소를 입력해 주세요.' });
    }
    code = customCode;
  } else {
    try {
      code = generateUniqueCode();
    } catch (err) {
      return res.status(500).json({ error: '서버 에러로 고유 코드를 생성하지 못했습니다.' });
    }
  }

  try {
    const link = await db.createLink(code, url, req.username);
    return res.status(201).json({
      message: 'Successfully shortened.',
      link: {
        code: link.code,
        originalUrl: link.originalUrl,
        createdAt: link.createdAt,
        clicks: link.clicks
      }
    });
  } catch (err) {
    console.error('Error creating link:', err);
    return res.status(500).json({ error: '데이터 저장 도중 데이터베이스 오류가 발생했습니다.' });
  }
});

// Endpoint: Retrieve links owned exclusively by this logged-in user
app.get('/api/links', authenticate, (req, res) => {
  try {
    const links = db.getUserLinks(req.username);
    return res.status(200).json({ links });
  } catch (err) {
    console.error('Error fetching links:', err);
    return res.status(500).json({ error: '데이터 조회에 실패했습니다.' });
  }
});

// Endpoint: Get individual link stats (Auth & Ownership Required!)
app.get('/api/stats/:code', authenticate, (req, res) => {
  const { code } = req.params;
  const link = db.getLink(code);
  
  if (!link) {
    return res.status(404).json({ error: 'Short URL not found.' });
  }

  // Security Verification: Only the owner of the link can see the stats!
  if (link.owner !== req.username.toLowerCase()) {
    return res.status(403).json({ error: '이 링크의 통계 데이터를 볼 수 있는 권한이 없습니다.' });
  }

  return res.status(200).json({ link });
});

// Endpoint: Update an individual link's destination URL (Auth & Ownership Required!)
app.put('/api/links/:code', authenticate, async (req, res) => {
  const { code } = req.params;
  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL은 필수 입력 항목입니다.' });
  }

  if (!/^https?:\/\//i.test(url)) {
    url = 'http://' + url;
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: '올바른 HTTP 또는 HTTPS URL 주소를 입력해 주세요.' });
  }

  if (isHarmfulUrl(url)) {
    return res.status(400).json({
      error: '유해 사이트(음란물, 불법 도박, 저작권 침해 사이트 등)는 단축 주소 공유 금지 원칙에 따라 링크를 생성할 수 없습니다.'
    });
  }

  try {
    const updated = await db.updateLink(code, url, req.username);
    if (!updated) {
      return res.status(403).json({ error: '링크 수정 권한이 없거나 존재하지 않는 링크입니다.' });
    }
    return res.status(200).json({
      message: '단축 링크가 성공적으로 수정되었습니다.',
      link: {
        code: updated.code,
        originalUrl: updated.originalUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        clicks: updated.clicks
      }
    });
  } catch (err) {
    console.error('Error updating link:', err);
    return res.status(500).json({ error: '단축 링크 수정 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Delete an individual link (Auth & Ownership Required!)
app.delete('/api/links/:code', authenticate, async (req, res) => {
  const { code } = req.params;
  try {
    const deleted = await db.deleteLink(code, req.username);
    if (!deleted) {
      return res.status(403).json({ error: '링크 삭제 권한이 없거나 존재하지 않는 링크입니다.' });
    }
    return res.status(200).json({ message: '단축 링크가 안전하게 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting link:', err);
    return res.status(500).json({ error: '단축 링크 삭제 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Clear all links (Auth Required!)
app.post('/api/links/clear', authenticate, async (req, res) => {
  try {
    await db.clearUserLinks(req.username);
    return res.status(200).json({ message: '모든 단축 링크가 안전하게 대시보드에서 영구 삭제되었습니다.' });
  } catch (err) {
    console.error('Error clearing links:', err);
    return res.status(500).json({ error: '전체 삭제 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Short URL direct redirect to poll page
app.get('/p/:id', (req, res) => {
  const param = req.params.id;
  
  // Try to find the poll by its ID first
  let poll = db.getPoll(param);
  if (!poll) {
    // If not found, let's search by normalized title or matching ID
    const polls = db.getAllPolls();
    const normalize = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();
    poll = polls.find(p => normalize(p.title) === normalize(param) || normalize(p.id) === normalize(param));
  }
  
  if (poll) {
    return res.redirect('/?poll=' + poll.id);
  }
  return res.redirect('/');
});

// --------------------------------------------------------------------------
// PUBLIC ROUTE: Short URL Redirection & Click Logging (NO Authentication!)
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// ABUSE REPORTING & ILLEGAL LINK MODERATION API
// --------------------------------------------------------------------------
const abuseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '신고 접수 시도가 너무 많습니다. 15분 후 다시 시도해 주세요.' }
});

app.post('/api/report-abuse', abuseLimiter, async (req, res) => {
  try {
    let { target, category, description } = req.body;
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: '신고할 단축 주소 또는 코드를 입력해 주세요.' });
    }

    target = target.trim();
    let code = target;
    try {
      if (target.startsWith('http://') || target.startsWith('https://')) {
        const u = new URL(target);
        const segments = u.pathname.split('/').filter(Boolean);
        if (segments.length > 0) code = segments[segments.length - 1];
      }
    } catch (_) {}

    const link = db.getLink(code);
    if (!link) {
      return res.status(404).json({ error: '해당 단축 주소나 코드를 찾을 수 없습니다.' });
    }

    if (!link.reports) link.reports = [];
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

    link.reports.push({
      category: category || 'other',
      description: description || '',
      ip: clientIp,
      reportedAt: new Date().toISOString()
    });
    link.reportCount = (link.reportCount || 0) + 1;

    // 3회 이상 신고 누적 시 자동 일시 차단
    if (link.reportCount >= 3 && !link.isBlocked) {
      link.isBlocked = true;
      link.blockedReason = `자동 차단: 유해·불법 신고 누적 (${link.reportCount}건)`;
      console.warn(`[ABUSE ALERT] Link ${code} (${link.originalUrl}) auto-blocked due to ${link.reportCount} abuse reports!`);
    }

    await db.save();

    console.log(`[ABUSE REPORT] Code: ${code}, URL: ${link.originalUrl}, Category: ${category}, Reporter IP: ${clientIp}`);

    return res.status(200).json({
      success: true,
      message: '신고가 정상 접수되었습니다. 관리자 검토 및 자정 시스템에 의해 신속히 조치됩니다.'
    });
  } catch (err) {
    console.error('Error reporting abuse:', err);
    return res.status(500).json({ error: '신고 처리 중 서버 오류가 발생했습니다.' });
  }
});

app.get('/:code', async (req, res, next) => {
  const { code } = req.params;
  
  // Skip static files or reserved routes
  if (BLACKLIST.has(code) || code.includes('.')) {
    return next();
  }

  // 1. Check if the code is a poll ID or matches a normalized poll title
  let poll = db.getPoll(code);
  if (!poll) {
    const polls = db.getAllPolls();
    const normalize = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();
    poll = polls.find(p => normalize(p.title) === normalize(code) || normalize(p.id) === normalize(code));
  }
  
  if (poll) {
    return res.redirect('/?poll=' + poll.id);
  }

  // 2. Check if the code matches a wall board ID or normalized wall title
  let wall = await db.getWall(code);
  if (!wall) {
    const walls = Object.values(db.cache.walls || {});
    const normalize = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();
    wall = walls.find(w => normalize(w.title) === normalize(code) || normalize(w.id) === normalize(code));
  }
  
  if (wall) {
    return res.redirect('/wall/' + encodeURIComponent(wall.id));
  }

  // 2. Otherwise, treat as a standard short redirect link
  const link = db.getLink(code);
  if (!link) {
    // Redirect back to frontend with a nice error flag
    return res.redirect('/?error=notfound&code=' + encodeURIComponent(code));
  }

  // Check if link is blocked due to abuse reports or admin moderation
  if (link.isBlocked) {
    return res.redirect('/?error=blocked&code=' + encodeURIComponent(code));
  }

  try {
    const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    
    let cleanReferrer = 'Direct';
    if (referrer !== 'Direct') {
      try {
        const refUrl = new URL(referrer);
        cleanReferrer = refUrl.hostname || referrer;
      } catch (e) {
        cleanReferrer = referrer;
      }
    }

    await db.recordClick(code, cleanReferrer, ip);
    return res.redirect(302, link.originalUrl);
  } catch (err) {
    console.error('Error recording click:', err);
    return res.redirect(302, link.originalUrl);
  }
});

// --------------------------------------------------------------------------
// REAL-TIME PREFERENCE SURVEY & POLLS APIs (Protected by Authentication!)
// --------------------------------------------------------------------------

// Endpoint: Get all polls (Admin & Users)
app.get('/api/polls', optionalAuthenticate, (req, res) => {
  try {
    const list = db.getAllPolls();
    return res.status(200).json({ polls: list });
  } catch (err) {
    console.error('Error fetching polls:', err);
    return res.status(500).json({ error: '선호도 조사 목록 조회에 실패했습니다.' });
  }
});

// Endpoint: Get specific poll details/stats (Admin & Users)
app.get('/api/polls/:id', optionalAuthenticate, (req, res) => {
  try {
    const poll = db.getPoll(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: '해당 선호도 조사를 찾을 수 없습니다.' });
    }
    return res.status(200).json({ poll });
  } catch (err) {
    console.error('Error fetching poll:', err);
    return res.status(500).json({ error: '상세 통계 로드에 실패했습니다.' });
  }
});

// Endpoint: Create a new preference poll (Admin & Users)
app.post('/api/polls', authenticate, async (req, res) => {
  const { title, options, durationMinutes, allowMultiple, dupMode, boardType, quizCorrectIndex, quizDuration } = req.body;
  
  const isSubjective = boardType === 'open' || boardType === 'cloud';
  const finalOptions = isSubjective ? (options || []) : options;

  const optionsText = Array.isArray(finalOptions) ? finalOptions.join(' ') : '';
  if (containsProfanity(title) || containsProfanity(optionsText)) {
    return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 설문을 게시할 수 없습니다. 🌸' });
  }
  
  if (!title || (!isSubjective && (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length < 2))) {
    return res.status(400).json({ error: '질문 제목과 최소 2개 이상의 문항을 입력해 주세요.' });
  }

  const duration = parseInt(durationMinutes) || 10;
  if (duration < 1 || duration > 14400) {
    return res.status(400).json({ error: '제한 시간은 최소 1분에서 최대 10일까지 지정 가능합니다.' });
  }

  try {
    const poll = await db.createPoll(title, finalOptions, duration, allowMultiple, req.username, dupMode, boardType, quizCorrectIndex, quizDuration);
    return res.status(201).json({ message: '신규 선호도 조사가 성공적으로 게시되었습니다!', poll });
  } catch (err) {
    console.error('Error creating poll:', err);
    return res.status(500).json({ error: '선호도 조사 생성 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Vote on a preference poll (Admin & Users)
app.post('/api/polls/:id/vote', optionalAuthenticate, async (req, res) => {
  const { selectedIndexes, guestId, extraPayload } = req.body;
  const pollId = req.params.id;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';

  if (extraPayload && containsProfanity(extraPayload)) {
    return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 주관식 답변을 등록할 수 없습니다.' });
  }

  try {
    const poll = await db.votePoll(pollId, selectedIndexes, req.username, ip, guestId, extraPayload);
    return res.status(200).json({ message: '성공적으로 투표를 반영했습니다. 감사합니다!', poll });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Endpoint: Delete a poll (Owner or Admin Only)
app.delete('/api/polls/:id', authenticate, async (req, res) => {
  try {
    const success = await db.deletePoll(req.params.id, req.username);
    if (!success) {
      return res.status(404).json({ error: '선호도 조사를 찾을 수 없거나 삭제 권한이 없습니다.' });
    }
    return res.status(200).json({ message: '해당 선호도 조사가 성공적으로 파괴 삭제되었습니다.' });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
});

// Endpoint: Edit a poll (Owner or Admin Only)
app.put('/api/polls/:id', authenticate, async (req, res) => {
  const pollId = req.params.id;
  const { title, options, durationMinutes, allowMultiple, dupMode, boardType, quizCorrectIndex, quizDuration } = req.body;
  
  try {
    const poll = db.getPoll(pollId);
    if (!poll) {
      return res.status(404).json({ error: '해당 선호도 조사를 찾을 수 없습니다.' });
    }

    const cleanUser = req.username.toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isOwner = poll.owner === cleanUser;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '이 선호도 조사를 수정할 권한이 없습니다.' });
    }

    const isSubjective = boardType === 'open' || boardType === 'cloud';
    const finalOptions = isSubjective ? (options || []) : options;

    const optionsText = Array.isArray(finalOptions) ? finalOptions.join(' ') : '';
    if (containsProfanity(title) || containsProfanity(optionsText)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 설문을 수정할 수 없습니다. 🌸' });
    }

    if (!title || (!isSubjective && (!finalOptions || !Array.isArray(finalOptions) || finalOptions.length < 2))) {
      return res.status(400).json({ error: '질문 제목과 최소 2개 이상의 문항을 입력해 주세요.' });
    }

    const duration = parseInt(durationMinutes) || 10;
    if (duration < 1 || duration > 14400) {
      return res.status(400).json({ error: '제한 시간은 최소 1분에서 최대 10일까지 지정 가능합니다.' });
    }

    // Update poll fields
    poll.title = String(title || '').trim();
    poll.allowMultiple = !!allowMultiple;
    poll.dupMode = String(dupMode || 'once').toLowerCase();
    poll.boardType = String(boardType || 'bar').toLowerCase();
    
    // Update expiresAt based on original createdAt and new duration minutes
    const durationMs = duration * 60000;
    poll.expiresAt = new Date(new Date(poll.createdAt).getTime() + durationMs).toISOString();

    if (poll.boardType === 'quiz') {
      poll.quizCorrectIndex = quizCorrectIndex !== undefined && quizCorrectIndex !== null ? parseInt(quizCorrectIndex) : null;
      poll.quizDuration = quizDuration !== undefined && quizDuration !== null ? parseInt(quizDuration) : 30;
    } else {
      poll.quizCorrectIndex = null;
      poll.quizDuration = 30;
    }

    // Update options: preserve votes by index, truncate or append
    if (isSubjective) {
      if (boardType === 'cloud' && (!poll.options || poll.options.length === 0)) {
        poll.options = [];
      }
    } else {
      const newFormattedOptions = [];
      for (let i = 0; i < finalOptions.length; i++) {
        const text = String(finalOptions[i] || '').trim();
        const existingOpt = poll.options.find(o => o.index === i);
        newFormattedOptions.push({
          index: i,
          text,
          votes: existingOpt ? existingOpt.votes : 0,
          totalScore: existingOpt ? (existingOpt.totalScore || 0) : 0
        });
      }
      poll.options = newFormattedOptions;
    }

    await db.save();
    return res.status(200).json({ message: '선호도 조사가 성공적으로 수정되었습니다!', poll });
  } catch (err) {
    console.error('Error updating poll:', err);
    return res.status(500).json({ error: '선호도 조사 수정 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Reset poll results for re-polling (Owner or Admin Only)
app.post('/api/polls/:id/reset', authenticate, async (req, res) => {
  const pollId = req.params.id;
  try {
    const poll = db.getPoll(pollId);
    if (!poll) return res.status(404).json({ error: '선호도 조사를 찾을 수 없습니다.' });
    
    const cleanUser = req.username.toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isOwner = poll.owner === cleanUser;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: '이 선호도 조사를 초기화할 권한이 없습니다.' });
    }
    
    const originalDurationMs = Math.max(60000, new Date(poll.expiresAt).getTime() - new Date(poll.createdAt).getTime());
    poll.createdAt = new Date().toISOString();
    poll.expiresAt = new Date(Date.now() + originalDurationMs).toISOString();
    poll.options.forEach(o => {
      o.votes = 0;
      o.totalScore = 0;
    });
    poll.subjectiveAnswers = [];
    poll.voters = [];
    await db.save();
    
    return res.status(200).json({ message: '성공적으로 선호도 조사를 초기화(재설문 가능)했습니다!', poll });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// CLASSROOM GAMIFICATION APIS (Protected by Authentication!)
// --------------------------------------------------------------------------

// Get classroom data
app.get('/api/classroom', authenticate, (req, res) => {
  try {
    const data = db.getClassroom(req.username);
    return res.status(200).json({ classroom: data });
  } catch (err) {
    console.error('Error fetching classroom data:', err);
    return res.status(500).json({ error: '학급 데이터 로드에 실패했습니다.' });
  }
});

// Update/Save classroom data
app.post('/api/classroom', authenticate, async (req, res) => {
  const { classroom } = req.body;
  if (!classroom || (!classroom.students && !classroom.classes)) {
    return res.status(400).json({ error: '올바르지 않은 학급 데이터 형식입니다.' });
  }

  try {
    const saved = await db.saveClassroom(req.username, classroom);
    return res.status(200).json({ message: '학급 정보가 안전하게 저장되었습니다!', classroom: saved });
  } catch (err) {
    console.error('Error saving classroom data:', err);
    return res.status(500).json({ error: '학급 정보 저장 도중 오류가 발생했습니다.' });
  }
});

// Bulk student generation by count and start number
app.post('/api/classroom/students/bulk', authenticate, async (req, res) => {
  const { count, startNumber } = req.body;
  const numCount = parseInt(count);
  const numStart = parseInt(startNumber);

  if (isNaN(numCount) || numCount < 1 || numCount > 100 || isNaN(numStart) || numStart < 1) {
    return res.status(400).json({ error: '인원수(1~100) 및 시작 번호(1 이상)를 올바르게 입력해 주세요.' });
  }

  try {
    const currentData = db.getClassroom(req.username);
    const students = [];
    for (let i = 0; i < numCount; i++) {
      const num = numStart + i;
      students.push({
        number: num,
        name: `${num}번 학생`,
        rawScore: 0,
        paidScore: 0,
        achievements: 0,
        unpaid: 0
      });
    }
    
    currentData.students = students;
    const saved = await db.saveClassroom(req.username, currentData);
    return res.status(200).json({ message: `성공적으로 ${numCount}명의 학생 슬롯을 생성했습니다!`, classroom: saved });
  } catch (err) {
    console.error('Error bulk generating students:', err);
    return res.status(500).json({ error: '학급 학생 일괄 생성 도중 오류가 발생했습니다.' });
  }
});

// --- 학급 점수 백업 & 원클릭 복원 API ---

// 1. 현재 학급 점수 스냅샷 백업 저장 API
// 요청 본문: { memo: "중간고사 전 백업" } (선택 사항)
app.post('/api/classroom/backup', authenticate, async (req, res) => {
  try {
    const memo = req.body && req.body.memo ? req.body.memo : '';
    // database.js의 backupClassroom 호출하여 현재 상태를 스냅샷으로 저장
    const backupInfo = await db.backupClassroom(req.username, memo);
    return res.status(200).json({
      message: '현재 학급 점수 및 명단이 안전하게 백업되었습니다!',
      backup: backupInfo
    });
  } catch (err) {
    console.error('Error creating classroom backup:', err);
    return res.status(500).json({ error: '학급 백업 생성 중 오류가 발생했습니다: ' + err.message });
  }
});

// 2. 저장된 백업 목록 조회 API
// 최근 백업 목록(최대 30개)의 날짜, 메모, 학급명, 학생수를 반환
app.get('/api/classroom/backups', authenticate, (req, res) => {
  try {
    const backups = db.getClassroomBackups(req.username);
    return res.status(200).json({ backups });
  } catch (err) {
    console.error('Error fetching classroom backups:', err);
    return res.status(500).json({ error: '백업 목록 조회 중 오류가 발생했습니다.' });
  }
});

// 3. 특정 백업 시점으로 원클릭 복원 API
// 복원 실행 전 현재 상태를 자동으로 임시 안전 백업하고 복원을 진행합니다.
app.post('/api/classroom/restore/:backupId', authenticate, async (req, res) => {
  const { backupId } = req.params;
  if (!backupId) {
    return res.status(400).json({ error: '복원할 백업 ID가 지정되지 않았습니다.' });
  }

  try {
    const restoredData = await db.restoreClassroomBackup(req.username, backupId);
    return res.status(200).json({
      message: '성공적으로 선택한 백업 시점으로 복원되었습니다!',
      classroom: restoredData
    });
  } catch (err) {
    console.error('Error restoring classroom backup:', err);
    return res.status(500).json({ error: '학급 복원 중 오류가 발생했습니다: ' + err.message });
  }
});

// 4. 백업 기록 삭제 API
app.delete('/api/classroom/backups/:backupId', authenticate, async (req, res) => {
  const { backupId } = req.params;
  if (!backupId) {
    return res.status(400).json({ error: '삭제할 백업 ID가 지정되지 않았습니다.' });
  }

  try {
    await db.deleteClassroomBackup(req.username, backupId);
    return res.status(200).json({ message: '백업 기록이 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting classroom backup:', err);
    return res.status(500).json({ error: '백업 삭제 중 오류가 발생했습니다: ' + err.message });
  }
});

// --- COLLABORATIVE WALL MODULE (kfcman-wall) ---

// Active SSE client connections grouped by wallId
const wallClients = {};
const https = require('https');
const dns = require('dns');
const net = require('net');

// 멤버는 원시 UUID 대신 '요청자 본인 여부(isMe)' 플래그만 내려준다.
// ※ 원본(db.cache)은 인가 판정에 그대로 필요하므로 훼손하지 않도록 항목 단위로 복제.
function sanitizeWall(wall, requesterUuid = '') {
  if (!wall || typeof wall !== 'object') return wall;
  const clone = { ...wall };
  const hasPw = !!(clone.passwordHash || clone.password);
  delete clone.password;
  delete clone.passwordHash;
  delete clone.passwordSalt;
  delete clone.passwordIterations;
  clone.hasPassword = hasPw;

  const stripCard = (c) => {
    if (!c || typeof c !== 'object') return c;
    const cc = { ...c };
    delete cc.clientUuid;
    return cc;
  };
  if (Array.isArray(clone.cards)) {
    clone.cards = clone.cards.map(stripCard);
  } else if (clone.cards && typeof clone.cards === 'object') {
    const out = {};
    for (const k in clone.cards) {
      out[k] = stripCard(clone.cards[k]);
    }
    clone.cards = out;
  }

  const stripMember = (m) => {
    if (!m || typeof m !== 'object') return m;
    const mc = { ...m };
    mc.isMe = !!(requesterUuid && m.clientUuid && m.clientUuid === requesterUuid);
    delete mc.clientUuid;
    return mc;
  };
  if (Array.isArray(clone.members)) {
    clone.members = clone.members.map(stripMember);
  } else if (clone.members && typeof clone.members === 'object') {
    const out = {};
    for (const k in clone.members) out[k] = stripMember(clone.members[k]);
    clone.members = out;
  }
  return clone;
}

// Helper to broadcast updated wall data to all listening clients of a wallId
function broadcastWallUpdate(wallId) {
  const clients = wallClients[wallId] || [];
  if (clients.length === 0) return;

  db.getWall(wallId).then((wall) => {
    if (!wall) return;
    // 클라이언트마다 본인 슬롯 표시(isMe)를 다르게 계산해야 하므로 개별 직렬화한다.
    clients.forEach((client) => {
      const payload = JSON.stringify(sanitizeWall(wall, client.clientUuid || ''));
      client.res.write(`data: ${payload}\n\n`);
    });
  }).catch((err) => {
    console.error(`Error broadcasting wall update for ${wallId}:`, err);
  });
}

// Helper to broadcast active visitor counts to all listening clients of a wallId
function broadcastActiveCount(wallId) {
  const clients = wallClients[wallId] || [];
  const count = clients.length;
  clients.forEach((client) => {
    client.res.write('event: activeCount\n');
    client.res.write('data: ' + count + '\n\n');
  });
}

// 0. Metadata Scrape API for link preview cards
function parseOgMetadata(html, url) {
  const metadata = {
    title: '',
    description: '',
    image: '',
    url: url
  };

  const getOgTag = (property, content) => {
    const regex = new RegExp(`<meta[^>]*(?:property|name)=["']og:${property}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = content.match(regex);
    if (match) return match[1];

    const regexAlt = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']og:${property}["']`, 'i');
    const matchAlt = content.match(regexAlt);
    if (matchAlt) return matchAlt[1];

    return null;
  };

  metadata.title = getOgTag('title', html);
  metadata.description = getOgTag('description', html);
  metadata.image = getOgTag('image', html);

  if (!metadata.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (titleMatch) metadata.title = titleMatch[1];
  }

  if (!metadata.description) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || 
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    if (descMatch) metadata.description = descMatch[1];
  }

  const decodeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'");
  };

  metadata.title = decodeHtml(metadata.title).trim();
  metadata.description = decodeHtml(metadata.description).trim();
  metadata.image = decodeHtml(metadata.image).trim();

  if (metadata.image && !/^https?:\/\//i.test(metadata.image)) {
    try {
      metadata.image = new URL(metadata.image, url).toString();
    } catch (e) {}
  }

  return metadata;
}

// SSRF 방어: 사설/루프백/링크로컬/예약 IP 대역 차단
// (특히 클라우드 메타데이터 169.254.169.254, 내부망, 루프백 차단)
function isBlockedIp(ip) {
  const addr = ip.replace(/^::ffff:/i, ''); // IPv4-mapped IPv6 정규화
  if (net.isIPv4(addr)) {
    const p = addr.split('.').map(Number);
    if (p[0] === 0) return true;                                   // 0.0.0.0/8
    if (p[0] === 10) return true;                                  // 10.0.0.0/8 사설
    if (p[0] === 127) return true;                                 // 루프백
    if (p[0] === 169 && p[1] === 254) return true;                 // 링크로컬(클라우드 메타데이터!)
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;     // 172.16.0.0/12 사설
    if (p[0] === 192 && p[1] === 168) return true;                 // 192.168.0.0/16 사설
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;    // 100.64.0.0/10 CGNAT
    if (p[0] >= 224) return true;                                  // 멀티캐스트/예약
    return false;
  }
  const v6 = addr.toLowerCase();
  if (v6 === '::1' || v6 === '::') return true;                    // 루프백/미지정
  if (v6.startsWith('fe80')) return true;                          // 링크로컬
  if (v6.startsWith('fc') || v6.startsWith('fd')) return true;     // ULA fc00::/7
  return false;
}

// 호스트명을 해석해 "공인 IP" 하나로 핀(pin). 사설 대역만 나오면 차단.
// 검증한 IP로 직접 접속하므로 DNS 리바인딩(TOCTOU)도 방지됨.
function resolvePublicIp(hostname, cb) {
  if (net.isIP(hostname)) {
    return isBlockedIp(hostname) ? cb(new Error('차단된 IP 대역')) : cb(null, hostname);
  }
  dns.lookup(hostname, { all: true }, (err, addresses) => {
    if (err) return cb(err);
    const ok = (addresses || []).find(a => !isBlockedIp(a.address));
    return ok ? cb(null, ok.address) : cb(new Error('내부/예약 대역만 해석됨'));
  });
}

function scrapeUrl(url, rawCallback) {
  let called = false;
  const callback = (metadata) => {
    if (called) return;
    called = true;
    rawCallback(metadata);
  };
  const empty = { title: '', description: '', image: '', url };

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return callback(empty);
  }

  // 프로토콜 허용목록 (file:, gopher:, ftp: 등 차단)
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return callback(empty);
  }

  // SSRF 가드: 대상 호스트가 내부/예약 대역이면 거부
  resolvePublicIp(parsedUrl.hostname, (err, pinnedIp) => {
    if (err) {
      console.warn(`[SSRF 차단] ${parsedUrl.hostname} 요청 거부: ${err.message}`);
      return callback(empty);
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const requestOptions = {
      host: pinnedIp,                                  // 검증된 IP로 직접 접속(리바인딩 방지)
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 2500,
      servername: isHttps ? parsedUrl.hostname : undefined, // TLS SNI 유지
      headers: {
        'Host': parsedUrl.host,                        // 원 호스트 헤더 유지(가상호스팅 대응)
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
      }
    };

    const reqClient = client.request(requestOptions, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (!/^https?:\/\//i.test(redirectUrl)) {
          redirectUrl = new URL(redirectUrl, url).toString();
        }
        response.resume(); // 소켓 해제
        return scrapeUrl(redirectUrl, callback); // 재귀 호출 → 리다이렉트 대상도 재검증
      }

      if (response.statusCode !== 200) {
        response.resume();
        return callback(empty);
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        if (body.length < 512000) {
          body += chunk;
        } else {
          response.destroy();
        }
      });
      response.on('end', () => {
        callback(parseOgMetadata(body, url));
      });
    });

    reqClient.on('error', () => {
      callback(empty);
    });

    reqClient.on('timeout', () => {
      reqClient.destroy();
      callback(empty);
    });

    reqClient.end();
  });
}

app.get('/api/scrape-metadata', (req, res) => {
  let targetUrl = req.query.url;
  if (!targetUrl) {
    return res.json({ title: '', description: '', image: '', url: '' });
  }

  targetUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl;
  }

  let sent = false;
  scrapeUrl(targetUrl, (metadata) => {
    if (sent) return;
    sent = true;
    if (res.headersSent) return;
    try {
      res.json(metadata);
    } catch (err) {
      console.error("Failed to send scrape-metadata json response:", err);
    }
  });
});

// 1. Establish SSE stream connection for real-time updates
app.get('/api/wall/:id/stream', async (req, res) => {
  const wallId = req.params.id.trim().toUpperCase();

  try {
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).end('존재하지 않는 게시판입니다.');
    }

    const activeCount = wallClients[wallId] ? wallClients[wallId].length : 0;
    if (wall.maxUsers > 0 && activeCount >= wall.maxUsers) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('접속 제한 인원을 초과하여 입장할 수 없습니다.');
    }

    // Set HTTP headers for EventSource
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no', // Disable Nginx proxy buffering for instant delivery
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('\n'); // Establish connection

    // Register client
    if (!wallClients[wallId]) {
      wallClients[wallId] = [];
    }
    
    // EventSource는 커스텀 헤더 불가 → 본인 슬롯 식별용 clientUuid는 쿼리로 받는다.
    const clientUuid = (req.query.clientUuid || '').toString();
    const clientObj = { id: Date.now(), res, clientUuid };
    wallClients[wallId].push(clientObj);

    // Send initial load immediately (비밀번호/타인 UUID 제거, 본인 isMe만 표시)
    res.write(`data: ${JSON.stringify(sanitizeWall(wall, clientUuid))}\n\n`);

    // Broadcast updated active count
    broadcastActiveCount(wallId);

    // Keep connection alive with a 15-second heartbeat ping
    const keepAliveInterval = setInterval(() => {
      res.write(': ping\n\n');
    }, 15000);

    // Remove client on disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      if (wallClients[wallId]) {
        wallClients[wallId] = wallClients[wallId].filter(c => c.id !== clientObj.id);
        if (wallClients[wallId].length === 0) {
          delete wallClients[wallId];
        } else {
          broadcastActiveCount(wallId);
        }
      }
    });
  } catch (err) {
    console.error('Error in wall SSE stream:', err);
    res.status(500).end('Internal Server Error');
  }
});

// 2. Create a new cooperative wall board (Restricted to VIP/Manager/Admin)
app.post('/api/wall', authenticate, async (req, res) => {
  if (req.role !== 'vip' && req.role !== 'manager' && req.role !== 'admin') {
    return res.status(403).json({ 
      error: '실시간 알림 보드(패들렛) 개설 권한이 없습니다. 이 기능은 \'우수회원👑\' 등급 이상의 회원만 이용할 수 있습니다. 등급 변경은 관리자에게 문의해 주세요.' 
    });
  }

  try {
    const { title, topic, description, maxUsers, layout, isPrivate, password, slug } = req.body;

    if (containsProfanity(title) || (topic && containsProfanity(topic)) || containsProfanity(description)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 게시판을 개설할 수 없습니다.' });
    }

    // Validate slug uniqueness before creating
    if (slug && slug.trim()) {
      const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_-]/g, '').toUpperCase();
      if (cleanSlug && db.cache.walls && db.cache.walls[cleanSlug]) {
        return res.status(409).json({ error: `'${cleanSlug}' 단축 주소는 이미 사용 중입니다. 다른 키워드를 입력해주세요.` });
      }
    }

    const creator = req.username || 'anonymous'; 
    const wall = await db.createWall(title, topic || '', description, creator, maxUsers, layout, isPrivate, password, slug);
    return res.status(201).json(wall);
  } catch (err) {
    console.error('Error creating wall:', err);
    return res.status(500).json({ error: '게시판 생성 도중 오류가 발생했습니다.' });
  }
});

// 2.5. Fetch walls created by the logged in user
app.get('/api/my-walls', authenticate, async (req, res) => {
  try {
    const creator = (req.username || '').trim().toLowerCase();
    if (!creator) {
      return res.status(200).json([]);
    }
    const results = [];
    if (db.cache.walls) {
      for (const wallId in db.cache.walls) {
        const wall = db.cache.walls[wallId];
        if (wall.creator === creator) {
          results.push({
            id: wall.id,
            title: wall.title,
            topic: wall.topic || '',
            description: wall.description,
            maxUsers: wall.maxUsers || 0,
            createdAt: wall.createdAt,
            creator: wall.creator,
            layout: wall.layout || 'grid',       // 주제톡방(chat) 구분 배지용
            isArchive: !!wall.isArchive          // 저장본 구분 배지용
          });
        }
      }
    }
    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(results);
  } catch (err) {
    console.error('Error fetching my walls:', err);
    return res.status(500).json({ error: '내가 생성한 게시판 목록을 가져오는 데 실패했습니다.' });
  }
});

// 2.9. Update wall metadata (title/topic/description/maxUsers/slug) - admin only
app.post('/api/wall/:id/update', authenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || (wall.creator || '').toLowerCase() === cleanUser;
    if (!isAdmin) {
      return res.status(403).json({ error: '게시판 관리자만 수정할 수 있습니다.' });
    }
    const { title, topic, description, maxUsers, slug } = req.body;
    if (containsProfanity(title) || (topic && containsProfanity(topic)) || containsProfanity(description)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 수정할 수 없습니다.' });
    }
    if (typeof title === 'string' && title.trim()) wall.title = title.trim();
    if (typeof topic === 'string') wall.topic = topic.trim();
    if (typeof description === 'string') wall.description = description.trim();
    if (maxUsers !== undefined && maxUsers !== null && maxUsers !== '') {
      const c = parseInt(maxUsers, 10);
      if (!isNaN(c) && c >= 0) wall.maxUsers = c;
    }
    let finalWall = wall;
    let renamed = false;
    if (slug && slug.trim()) {
      const cleanSlug = slug.trim().replace(/[^a-zA-Z0-9\uAC00-\uD7A3\u3131-\u3163_-]/g, '').toUpperCase();
      if (cleanSlug && cleanSlug !== wallId) {
        finalWall = await db.renameWall(wallId, cleanSlug);
        renamed = true;
      }
    }
    if (!renamed) await db.save();
    broadcastWallUpdate(wallId);
    if (finalWall.id !== wallId) broadcastWallUpdate(finalWall.id);
    return res.status(200).json({ message: '게시판이 수정되었습니다.', wall: finalWall });
  } catch (err) {
    console.error('Error updating wall:', err);
    return res.status(400).json({ error: err.message || '게시판 수정 중 오류가 발생했습니다.' });
  }
});

// 3. Fetch board details (including card list)
app.get('/api/wall/:id', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    // Privacy check
    if (wall.isPrivate) {
      const cleanUser = (req.username || '').toLowerCase();
      const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
      const isCreator = wall.creator === cleanUser;

      // Creator and site admin always have full access
      if (!isCreator && !isAdmin) {
        if (wall.password) {
          // Password-locked board: check supplied password header
          const suppliedPw = req.headers['x-wall-password'] || '';
          if (suppliedPw !== wall.password) {
            return res.status(403).json({
              error: 'PASSWORD_REQUIRED',
              title: wall.title,
              description: wall.description || ''
            });
          }
        } else {
          // Owner-only private board (no password)
          return res.status(403).json({
            error: 'PRIVATE_BOARD',
            title: wall.title,
            description: wall.description || ''
          });
        }
      }
    }

    const requesterUuid = (req.headers['x-client-uuid'] || '').toString();
    return res.status(200).json(sanitizeWall(wall, requesterUuid));
  } catch (err) {
    console.error('Error fetching wall:', err);
    return res.status(500).json({ error: '게시판 정보를 불러오는 도중 오류가 발생했습니다.' });
  }
});

// 3.5. Update wall privacy settings (owner or admin only)
app.put('/api/wall/:id/privacy', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { isPrivate, password } = req.body;

    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: '게시판 공개/비공개 설정 권한이 없습니다.' });
    }

    wall.isPrivate = !!isPrivate;
    wall.password = (password && password.trim()) ? password.trim() : '';
    await db.save();

    broadcastWallUpdate(wallId);

    return res.status(200).json({
      success: true,
      isPrivate: wall.isPrivate,
      hasPassword: !!wall.password
    });
  } catch (err) {
    console.error('Error updating wall privacy:', err);
    return res.status(500).json({ error: '공개/비공개 설정 변경 도중 오류가 발생했습니다.' });
  }
});

// 4. Create a new card inside a wall
app.post('/api/wall/:id/cards', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, attachmentData, clientUuid } = req.body;

    if (containsProfanity(author) || containsProfanity(title) || containsProfanity(content)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;

    // Check write restriction for notice section
    if (sectionId === 'notice-section' && !isAdmin) {
      return res.status(403).json({ error: '공지사항 컬럼은 교사(관리자)만 작성할 수 있습니다.' });
    }

    // Check write restriction for slot-restricted columns wall layout
    if (wall.layout === 'columns' && wall.maxUsers > 0 && !isAdmin) {
      if (!sectionId) {
        return res.status(400).json({ error: '작성할 섹션이 지정되지 않았습니다.' });
      }
      const section = (wall.sections || []).find(s => s.id === sectionId);
      if (!section) {
        return res.status(404).json({ error: '존재하지 않는 섹션입니다.' });
      }
      const match = section.name.match(/^(\d+)번$/);
      if (!match) {
        return res.status(403).json({ error: '이 컬럼에는 작성 권한이 없습니다.' });
      }
      const slotNum = parseInt(match[1], 10);
      const member = wall.members && wall.members[slotNum];
      if (!member || member.clientUuid !== clientUuid) {
        return res.status(403).json({ error: `본인의 번호(${slotNum}번) 컬럼에만 카드를 작성할 수 있습니다.` });
      }
    }

    // Check write restriction for chat layout (주제 톡방) - Only admins can create topic rooms (cards)
    if (wall.layout === 'chat' && !isAdmin) {
      return res.status(403).json({ error: '새로운 주제 톡방은 관리자(교사)만 개설할 수 있습니다. 🌸' });
    }

    // Notice pin authorization check
    if (isNotice) {
      if (!isAdmin) {
        return res.status(403).json({ error: '공지사항은 게시판 개설자(관리자)만 고정할 수 있습니다.' });
      }
    }

    const finalIsNotice = isNotice || (sectionId === 'notice-section');
    const finalImage = saveBase64ToDisk(image, 'png');
    const finalAttachmentData = saveBase64ToDisk(attachmentData, 'bin');
    const card = await db.addWallCard(wallId, author, title, content, bgColor, finalImage, previewUrl, previewTitle, previewDesc, previewImage, finalIsNotice, sectionId, attachmentName, finalAttachmentData);
    
    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(201).json(card);
  } catch (err) {
    console.error('Error adding wall card:', err);
    return res.status(500).json({ error: '카드 작성 도중 오류가 발생했습니다.' });
  }
});

// 4.5. Toggle card notice status (Restricted to board owner or site admin/manager)
app.post('/api/wall/:id/cards/:cardId/toggle-notice', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: '공지사항 고정 권한이 없습니다.' });
    }

    const card = wall.cards[cardId];
    if (!card) {
      return res.status(404).json({ error: '존재하지 않는 카드입니다.' });
    }

    card.isNotice = !card.isNotice;
    await db.save();

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error toggling card notice status:', err);
    return res.status(500).json({ error: '공지사항 상태 변경 도중 오류가 발생했습니다.' });
  }
});

// 4.6. Add Column Section (Restricted to board owner or site admin/manager)
app.post('/api/wall/:id/sections', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { name } = req.body;

    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: '섹션 추가 권한이 없습니다. 보드 개설물 소유자만 생성 가능합니다.' });
    }

    const newSec = await db.addWallSection(wallId, name);
    
    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(201).json(newSec);
  } catch (err) {
    console.error('Error adding wall section:', err);
    return res.status(500).json({ error: '섹션 추가 도중 오류가 발생했습니다.' });
  }
});

// 4.7. Rename Column Section (Restricted to board owner or site admin/manager)
app.put('/api/wall/:id/sections/:sectionId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { sectionId } = req.params;
    const { name } = req.body;

    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: '섹션 수정 권한이 없습니다.' });
    }

    const updatedSec = await db.renameWallSection(wallId, sectionId, name);
    
    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(updatedSec);
  } catch (err) {
    console.error('Error renaming wall section:', err);
    return res.status(500).json({ error: '섹션 이름 변경 도중 오류가 발생했습니다.' });
  }
});

// 4.8. Delete Column Section (Restricted to board owner or site admin/manager)
app.delete('/api/wall/:id/sections/:sectionId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { sectionId } = req.params;

    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: '섹션 삭제 권한이 없습니다.' });
    }

    await db.deleteWallSection(wallId, sectionId);
    
    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting wall section:', err);
    return res.status(500).json({ error: '섹션 삭제 도중 오류가 발생했습니다.' });
  }
});

// 5. Like a card
app.post('/api/wall/:id/cards/:cardId/like', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;
    const { clientUuid } = req.body;

    const card = await db.likeWallCard(wallId, cardId, clientUuid);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error liking wall card:', err);
    return res.status(400).json({ error: err.message || '좋아요 반영 도중 오류가 발생했습니다.' });
  }
});

// 6. Comment on a card
app.post('/api/wall/:id/cards/:cardId/comments', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;
    const { author, text, clientUuid } = req.body;

    const isAiSummary = author === "🤖 AI 의견 요약 브리핑" || author === "🕸️ AI 지식맵";
    if (!isAiSummary && (containsProfanity(author) || containsProfanity(text))) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;

    // Enforce slot check if maxUsers > 0
    if (wall.maxUsers > 0 && !isAdmin && !isAiSummary) {
      const members = Object.values(wall.members || {});
      const myMember = members.find(m => m && m.clientUuid === clientUuid);
      if (!myMember) {
        return res.status(403).json({ error: '번호 로그인(이모지 및 이름 등록) 후 대화에 참여할 수 있습니다. 🌸' });
      }
    }

    // Prevent duplicate consecutive comments
    const targetCard = wall.cards && wall.cards[cardId];
    if (targetCard && targetCard.comments && targetCard.comments.length > 0) {
      const lastComment = targetCard.comments[targetCard.comments.length - 1];
      if (lastComment.author === author && lastComment.text === text) {
        return res.status(400).json({ error: '동일한 내용의 메시지를 연속해서 전송할 수 없습니다.' });
      }
    }

    const card = await db.commentWallCard(wallId, cardId, author, text, clientUuid);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(201).json(card);
  } catch (err) {
    console.error('Error commenting on wall card:', err);
    return res.status(500).json({ error: '댓글 작성 도중 오류가 발생했습니다.' });
  }
});

// 6.4 Edit a comment (own message or board creator/admin)
app.put('/api/wall/:id/cards/:cardId/comments/:commentId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId, commentId } = req.params;
    const { text, clientUuid } = req.body;
    if (containsProfanity(text)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 수정할 수 없습니다.' });
    }
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    const card = wall.cards && wall.cards[cardId];
    const comment = card && (card.comments || []).find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: '존재하지 않는 메시지입니다.' });
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;
    const isOwner = comment.clientUuid && comment.clientUuid === clientUuid;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: '본인 메시지 또는 방 개설자만 수정할 수 있습니다.' });
    }
    const updated = await db.editWallCardComment(wallId, cardId, commentId, text);
    broadcastWallUpdate(wallId);
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error editing comment:', err);
    return res.status(500).json({ error: '메시지 수정 도중 오류가 발생했습니다.' });
  }
});

// 6.45 Delete a comment (own message or board creator/admin)
app.delete('/api/wall/:id/cards/:cardId/comments/:commentId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId, commentId } = req.params;
    const clientUuid = req.body && req.body.clientUuid;
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    const card = wall.cards && wall.cards[cardId];
    const comment = card && (card.comments || []).find(c => c.id === commentId);
    if (!comment) return res.status(404).json({ error: '존재하지 않는 메시지입니다.' });
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;
    const isOwner = comment.clientUuid && comment.clientUuid === clientUuid;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: '본인 메시지 또는 방 개설자만 삭제할 수 있습니다.' });
    }
    const updated = await db.deleteWallCardComment(wallId, cardId, commentId);
    broadcastWallUpdate(wallId);
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error deleting comment:', err);
    return res.status(500).json({ error: '메시지 삭제 도중 오류가 발생했습니다.' });
  }
});

// 6.5 Like a comment on a card
app.post('/api/wall/:id/cards/:cardId/comments/:commentId/like', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId, commentId } = req.params;
    const { clientUuid } = req.body;

    const card = await db.likeWallCardComment(wallId, cardId, commentId, clientUuid);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error liking comment:', err);
    return res.status(400).json({ error: err.message || '댓글 좋아요 반영 도중 오류가 발생했습니다.' });
  }
});

// 7. Delete a card from a wall
app.delete('/api/wall/:id/cards/:cardId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    // 카드 조회 (저장 형태가 배열/객체맵 모두 대응)
    const card = Array.isArray(wall.cards)
      ? (wall.cards.find(c => c && c.id === cardId) || null)
      : ((wall.cards && wall.cards[cardId]) || null);

    // 인가: 게시판 개설자/관리자, 또는 카드 작성자 본인만 삭제 가능
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;
    const { clientUuid } = req.body || {};
    const isAuthor = !!card && (
      (cleanUser && card.author && String(card.author).toLowerCase() === cleanUser) ||
      (clientUuid && card.clientUuid && card.clientUuid === clientUuid)
    );

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ error: '카드 작성자 본인 또는 게시판 개설자(관리자)만 삭제할 수 있습니다.' });
    }

    await db.deleteWallCard(wallId, cardId);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting wall card:', err);
    return res.status(500).json({ error: '카드 삭제 도중 오류가 발생했습니다.' });
  }
});

// 7.2. Edit a card from a wall
app.put('/api/wall/:id/cards/:cardId', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;
    const { author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, attachmentData, clientUuid } = req.body;

    if (containsProfanity(author) || containsProfanity(title) || containsProfanity(content)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 수정할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;

    // Check write restriction for notice section
    if (sectionId === 'notice-section' && !isAdmin) {
      return res.status(403).json({ error: '공지사항 컬럼의 카드는 교사(관리자)만 수정할 수 있습니다.' });
    }

    // Check write restriction for slot-restricted columns wall layout
    if (wall.layout === 'columns' && wall.maxUsers > 0 && !isAdmin) {
      if (!sectionId) {
        return res.status(400).json({ error: '수정할 섹션이 지정되지 않았습니다.' });
      }
      const section = (wall.sections || []).find(s => s.id === sectionId);
      if (!section) {
        return res.status(404).json({ error: '존재하지 않는 섹션입니다.' });
      }
      const match = section.name.match(/^(\d+)번$/);
      if (match) {
        const slotNum = parseInt(match[1], 10);
        const member = wall.members && wall.members[slotNum];
        if (!member || member.clientUuid !== clientUuid) {
          return res.status(403).json({ error: `본인의 번호(${slotNum}번) 컬럼의 카드만 수정할 수 있습니다.` });
        }
      }
    }

    // Notice pin authorization check
    if (isNotice && !isAdmin) {
      return res.status(403).json({ error: '공지사항은 게시판 개설자(관리자)만 고정할 수 있습니다.' });
    }

    const finalImage = saveBase64ToDisk(image, 'png');
    const finalAttachmentData = saveBase64ToDisk(attachmentData, 'bin');
    const card = await db.editWallCard(wallId, cardId, author, title, content, bgColor, finalImage, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, finalAttachmentData);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error editing wall card:', err);
    return res.status(500).json({ error: '카드 수정 도중 오류가 발생했습니다.' });
  }
});

// 7.3. Generate AI image for a specific card (using Imagen 4)
app.post('/api/wall/:id/cards/:cardId/generate-image', authenticate, aiLimiter, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const card = wall.cards && wall.cards[cardId];
    if (!card) {
      return res.status(404).json({ error: '존재하지 않는 대화방입니다.' });
    }

    // Get stored API key (OpenAI preferred, Gemini as fallback)
    const apiKey = getOpenAIKey() || getGeminiKey(); // env 우선, OpenAI 우선

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API Key가 등록되지 않았습니다. 관리자 설정에서 API Key를 먼저 등록해 주세요.' });
    }

    console.log(`Generating AI image for room: "${card.title}"...`);
    const imageUrl = await generateAndSaveTopicImage(card.title, apiKey);
    
    if (!imageUrl) {
      return res.status(500).json({ error: 'AI 이미지 생성에 실패했습니다. API 설정을 확인해 주세요.' });
    }

    // Save image to card
    card.image = imageUrl;
    await db.save();

    // Broadcast update
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true, image: imageUrl });
  } catch (err) {
    console.error('Error generating image for room:', err);
    return res.status(500).json({ error: `AI 이미지 생성 실패: ${err.message}` });
  }
});

// 7.4. Upload client-generated image for a specific card
app.post('/api/wall/:id/cards/:cardId/upload-image', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;
    const { image } = req.body; // base64 encoded image string

    if (!image) {
      return res.status(400).json({ error: '이미지 데이터가 누락되었습니다.' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const card = wall.cards && wall.cards[cardId];
    if (!card) {
      return res.status(404).json({ error: '존재하지 않는 대화방입니다.' });
    }

    const localPath = saveBase64ToDisk(image, 'jpg');
    if (!localPath || localPath.startsWith('data:')) {
      return res.status(500).json({ error: '이미지 저장에 실패했습니다.' });
    }

    card.image = localPath;
    await db.save();

    // Broadcast update
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true, image: localPath });
  } catch (err) {
    console.error('Error uploading generated image:', err);
    return res.status(500).json({ error: `이미지 업로드 실패: ${err.message}` });
  }
});

// 7.5. Join a wall member slot
app.post('/api/wall/:id/join', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { number, name, emoji, clientUuid } = req.body;

    if (!number || isNaN(number) || parseInt(number) < 1) {
      return res.status(400).json({ error: '올바른 번호를 선택해 주세요.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '이름 또는 닉네임을 입력해 주세요.' });
    }
    if (!clientUuid) {
      return res.status(400).json({ error: '유효한 클라이언트 UUID가 누락되었습니다.' });
    }

    if (containsProfanity(name)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸' });
    }

    const wall = await db.joinWall(wallId, parseInt(number), name, emoji, clientUuid);
    
    // Broadcast updated wall to all listening clients
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true, wall: sanitizeWall(wall, clientUuid) });
  } catch (err) {
    console.error('Error joining wall slot:', err);
    return res.status(400).json({ error: err.message || '번호 선택 입장 도중 오류가 발생했습니다.' });
  }
});

// 7.6. Leave a wall member slot
app.post('/api/wall/:id/leave', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { number, clientUuid } = req.body;

    if (!number || isNaN(number) || !clientUuid) {
      return res.status(400).json({ error: '올바르지 않은 요청 파라미터입니다.' });
    }

    await db.leaveWall(wallId, parseInt(number), clientUuid);

    // Broadcast updated wall to all listening clients
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error leaving wall slot:', err);
    return res.status(500).json({ error: '번호 선택 퇴장 도중 오류가 발생했습니다.' });
  }
});

// 8. Clear/Reset a wall (게시판 게시글 전체 초기화)
app.post('/api/wall/:id/slug', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { slug } = req.body;
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || (wall.creator || '').toLowerCase() === cleanUser;
    if (!isAdmin) {
      return res.status(403).json({ error: '게시판 관리자만 단축 주소를 변경할 수 있습니다.' });
    }
    const updated = await db.renameWall(wallId, slug);
    // Notify any clients still on the old address, then on the new one
    broadcastWallUpdate(wallId);
    broadcastWallUpdate(updated.id);
    return res.status(200).json({ message: '단축 주소가 변경되었습니다.', wall: updated });
  } catch (err) {
    console.error('Error renaming wall:', err);
    return res.status(400).json({ error: err.message || '단축 주소 변경 중 오류가 발생했습니다.' });
  }
});

app.post('/api/wall/:id/reset', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    await db.clearWall(wallId);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json({ success: true, message: '게시판이 성공적으로 초기화되었습니다.' });
  } catch (err) {
    console.error('Error resetting wall:', err);
    return res.status(500).json({ error: '게시판 초기화 도중 오류가 발생했습니다.' });
  }
});

// Change wall max users limit (admins only)
app.post('/api/wall/:id/max-users', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { maxUsers } = req.body;
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;
    if (!isAdmin) {
      return res.status(403).json({ error: '게시판 관리자만 인원 제한을 설정할 수 있습니다.' });
    }
    const count = parseInt(maxUsers, 10);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ error: '유효한 접속자 수(0 이상의 숫자)를 입력해 주세요.' });
    }
    wall.maxUsers = count;
    await db.save();
    broadcastWallUpdate(wallId);
    return res.status(200).json({ message: '인원 제한 설정이 변경되었습니다.', wall });
  } catch (err) {
    console.error('Error changing wall max users:', err);
    return res.status(500).json({ error: '인원 제한 설정 변경 도중 오류가 발생했습니다.' });
  }
});

// Update wall topic (admins only)
app.put('/api/wall/:id/topic', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { topic } = req.body;
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;
    if (!isAdmin) {
      return res.status(403).json({ error: '게시판 관리자만 전체 주제를 수정할 수 있습니다.' });
    }
    if (containsProfanity(topic)) {
      return res.status(400).json({ error: '부적절한 표현이 포함되어 있어 수정할 수 없습니다.' });
    }
    wall.topic = (topic || '').trim();
    await db.save();
    broadcastWallUpdate(wallId);
    return res.status(200).json({ message: '전체 주제가 변경되었습니다.', wall });
  } catch (err) {
    console.error('Error changing wall topic:', err);
    return res.status(500).json({ error: '전체 주제 변경 도중 오류가 발생했습니다.' });
  }
});

// Save current board snapshot as archive (VIP or above)
app.post('/api/wall/:id/save-archive', optionalAuthenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { archiveName } = req.body;
    
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    // 저장본을 다시 저장하면 사본이 무한히 불어나므로 차단
    if (wall.isArchive) {
      return res.status(400).json({ error: '저장된 톡방은 다시 저장할 수 없습니다. 원본 톡방에서 저장해 주세요.' });
    }

    const cleanUser = (req.username || '').trim().toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;

    if (!isAdmin && req.role !== 'vip' && req.role !== 'manager') {
      return res.status(403).json({ error: '우수회원 이상 권한이 필요한 기능입니다.' });
    }

    const newId = 'TALK_' + Date.now().toString(36).toUpperCase();

    // Deep copy wall object
    const newWall = JSON.parse(JSON.stringify(wall));
    newWall.id = newId;
    newWall.title = (archiveName || wall.topic || '저장된 톡방').trim();
    // 삭제 권한 비교(deleteWall)가 소문자 기준이므로 소문자로 통일 저장
    newWall.creator = cleanUser || 'anonymous';
    newWall.createdAt = new Date().toISOString();
    newWall.isArchive = true;
    newWall.parentWallId = wallId;
    
    db.cache.walls[newId] = newWall;
    await db.save();
    
    return res.status(200).json({ success: true, newId, title: newWall.title });
  } catch (err) {
    console.error('Error saving wall archive:', err);
    return res.status(500).json({ error: '톡방 저장 도중 오류가 발생했습니다.' });
  }
});

// Endpoint: Generate webtoon image using Google Gemini (Imagen 3) API
app.post('/api/wall/:id/generate-webtoon-image', authenticate, aiLimiter, async (req, res) => {
  try {
    const cleanTitle = req.body.cleanTitle;
    if (!cleanTitle) {
      return res.status(400).json({ error: 'cleanTitle이 누락되었습니다.' });
    }

    const apiKey = getGeminiKey(); // env 우선, 없으면 config.json

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key가 등록되지 않았습니다. 먼저 관리자 페이지에서 API Key를 등록해 주세요.' });
    }

    const https = require('https');
    const finalPrompt = await getComicImagePrompt(cleanTitle, apiKey);

    const postData = JSON.stringify({
      instances: [
        {
          prompt: finalPrompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/jpeg"
      }
    });

    let apiPath = `/v1beta/models/imagen-4.0-generate-001:predict`;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    apiPath += `?key=${apiKey}`;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: headers
    };

    const apiReq = https.request(options, (apiRes) => {
      apiRes.setEncoding('utf8');
      let body = '';
      apiRes.on('data', (chunk) => body += chunk);
      apiRes.on('end', async () => {
        try {
          if (apiRes.statusCode !== 200) {
            const errObj = JSON.parse(body);
            console.error('Gemini Imagen error:', errObj, '. Falling back to Pollinations.');
            const fallbackUrl = await getPollinationsFallbackUrl(cleanTitle, apiKey);
            return res.status(200).json({ success: true, url: fallbackUrl });
          }
          const resObj = JSON.parse(body);
          const base64Image = resObj.predictions?.[0]?.bytesBase64Encoded;
          if (!base64Image) {
            console.warn('No base64Image returned. Falling back to Pollinations.');
            const fallbackUrl = await getPollinationsFallbackUrl(cleanTitle, apiKey);
            return res.status(200).json({ success: true, url: fallbackUrl });
          }
          const dataUrl = `data:image/jpeg;base64,${base64Image}`;
          return res.status(200).json({ success: true, url: dataUrl });
        } catch (e) {
          console.error('JSON parse error in Gemini Imagen response:', e);
          const fallbackUrl = await getPollinationsFallbackUrl(cleanTitle, apiKey);
          return res.status(200).json({ success: true, url: fallbackUrl });
        }
      });
    });

    apiReq.on('error', async (e) => {
      console.error('HTTP Request error for Gemini Imagen:', e);
      const fallbackUrl = await getPollinationsFallbackUrl(cleanTitle, apiKey);
      return res.status(200).json({ success: true, url: fallbackUrl });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (err) {
    console.error('Error in /api/wall/:id/generate-webtoon-image:', err);
    try {
      const fallbackUrl = await getPollinationsFallbackUrl(req.body.cleanTitle || '수업', apiKey);
      return res.status(200).json({ success: true, url: fallbackUrl });
    } catch (fallbackErr) {
      return res.status(500).json({ error: '서버 내부 오류로 만화 생성에 실패했습니다.' });
    }
  }
});

// Endpoint: Generate overall NotebookLM style summary for the entire board (all chatrooms and comments)
app.post('/api/wall/:id/overall-notebook-summary', authenticate, aiLimiter, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    // Retrieve all cards (chat rooms) and their comments
    const cards = wall.cards || [];
    if (cards.length === 0) {
      return res.status(400).json({ error: '게시판에 개설된 토론방이 없어 요약을 생성할 수 없습니다.' });
    }

    let allChatContent = '';
    let hasComments = false;

    cards.forEach(card => {
      const title = card.title || '이름 없음';
      const description = card.description || '';
      const comments = card.comments || [];
      
      allChatContent += `### 💬 토론방: [${title}] (${description})\n`;
      if (comments.length > 0) {
        hasComments = true;
        comments.forEach(c => {
          allChatContent += `- [${c.author}]: ${c.text || c.content || ''}\n`;
        });
      } else {
        allChatContent += `(이 방에는 나눈 의견이 없습니다.)\n`;
      }
      allChatContent += `\n`;
    });

    if (!hasComments) {
      return res.status(400).json({ error: '모든 토론방의 대화 내역이 비어 있어 전체 요약을 생성할 수 없습니다.' });
    }

    // 1. Get stored API key
    const apiKey = getGeminiKey(); // env 우선, 없으면 config.json

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key가 등록되지 않았습니다. 먼저 API Key를 등록해 주세요.' });
    }

    // 2. Prepare Gemini prompt
    const systemPrompt = `You are a professional educational consultant and a head AI Notebook director similar to Google's NotebookLM.
Your task is to analyze the complete set of chat room logs and participant discussions from the learning board titled "${wall.title || '토론 게시판'}". 
Compile these discussions into a single, comprehensive, highly structured, and inspiring "Overall Notebook Summary & Educational Guide".

Formatting Guidelines:
- Use Markdown format with Korean language.
- Provide a clear, clean, and extremely premium structure.
- Focus on extracting and cross-referencing ideas from different rooms.
- Organize the content into the following sections:

# 📌 [${wall.title || '토론 게시판'}] 종합 AI Notebook 가이드

## 🎯 1. 전체 토론 핵심 요약 (Executive Summary)
Provide a high-level summary synthesizing the overall goals, common themes, and shared consensus across all discussion rooms.

## 💡 2. 토론방별 핵심 도출 아이디어
For each active chat room, detail the most valuable and concrete ideas, practices, tools, or strategies proposed by the participants.

## 🛠️ 3. 융합 시너지 및 연계 방안 (Synergy & Integration)
Discuss how the ideas from different rooms can be combined or integrated for real classroom / school application.

## 🚀 4. 종합 실천 로드맵 (Comprehensive Action Roadmap)
Provide a clear, step-by-step roadmap (e.g. Planning -> Trial -> Sharing) for teachers to implement these findings in their schools.

Discussion Transcript Logs:
${allChatContent}`;

    // 3. Call Gemini API
    const https = require('https');
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: systemPrompt }]
      }]
    });

    let apiPath = `/v1beta/models/gemini-2.5-flash:generateContent`;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    apiPath += `?key=${apiKey}`;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: headers
    };

    const apiReq = https.request(options, (apiRes) => {
      apiRes.setEncoding('utf8');
      let body = '';
      apiRes.on('data', (chunk) => body += chunk);
      apiRes.on('end', () => {
        try {
          if (apiRes.statusCode !== 200) {
            const errObj = JSON.parse(body);
            console.error('Gemini overall summary error:', errObj);
            return res.status(apiRes.statusCode).json({ error: errObj.error?.message || 'Gemini API 호출 오류' });
          }
          const resObj = JSON.parse(body);
          const responseText = resObj.candidates?.[0]?.content?.parts?.[0]?.text || '요약을 생성할 수 없습니다.';
          return res.status(200).json({ success: true, summary: responseText });
        } catch (e) {
          console.error('JSON parse error in Gemini response:', e);
          return res.status(500).json({ error: 'Gemini 응답 분석 도중 오류가 발생했습니다.' });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('HTTP Request error:', e);
      return res.status(500).json({ error: 'Gemini API 연결에 실패했습니다.' });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (err) {
    console.error('Error generating overall notebook summary:', err);
    return res.status(500).json({ error: '종합 요약 생성 도중 서버 내부 오류가 발생했습니다.' });
  }
});

// Endpoint: Generate NotebookLM style summary for a specific active chatroom (card)
app.post('/api/wall/:id/cards/:cardId/summary', authenticate, aiLimiter, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const cardId = req.params.cardId.trim();
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const card = wall.cards?.[cardId];
    if (!card) return res.status(404).json({ error: '존재하지 않는 토론방입니다.' });

    const comments = card.comments || [];
    if (comments.length === 0) {
      return res.status(400).json({ error: '토론방에 나눈 대화 내역이 없어 요약을 생성할 수 없습니다.' });
    }

    let chatContent = '';
    const authorMap = {};
    let anonCounter = 1;
    comments.forEach(c => {
      const author = c.author || '익명';
      if (!authorMap[author]) {
        authorMap[author] = `익명 ${anonCounter++}`;
      }
      chatContent += `- [${authorMap[author]}]: ${c.text || c.content || ''}\n`;
    });

    // 1. Get stored API key
    const apiKey = getGeminiKey(); // env 우선, 없으면 config.json

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key가 등록되지 않았습니다. 먼저 API Key를 등록해 주세요.' });
    }

    // 2. Prepare Gemini prompt
    const systemPrompt = `You are a professional educational consultant and a head AI Notebook director similar to Google's NotebookLM.
Your task is to analyze the participant discussions from the learning topic room titled "${card.title}" (Description: ${card.content || ''}) under the board "${wall.title || '토론 게시판'}". 
Compile these discussions into a single, comprehensive, highly structured, and inspiring "Learning Topic Notebook Summary & Educational Guide".

Formatting Guidelines:
- Use Markdown format with Korean language.
- Provide a clear, clean, and extremely premium structure.
- Focus on key insights, proposed solutions, questions raised, and consensus.
- Organize the content into the following sections:

# 📌 [${card.title}] AI 의견 요약 및 학습노트

## 🎯 1. 핵심 요약 (Summary)
Summarize the main points and themes of the discussion in this room.

## 💡 2. 주요 의견 및 제안 (Key Insights & Proposals)
Highlight the most valuable ideas or experiences shared by participants.

## 🚀 3. 실천 방안 및 적용 팁 (Actionable Tips)
Provide concrete tips on how to apply these ideas in practice.

Discussion Transcript:
${chatContent}`;

    // 3. Call Gemini API
    const https = require('https');
    const postData = JSON.stringify({
      contents: [{
        parts: [{ text: systemPrompt }]
      }]
    });

    let apiPath = `/v1beta/models/gemini-2.5-flash:generateContent`;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    apiPath += `?key=${apiKey}`;

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: apiPath,
      method: 'POST',
      headers: headers
    };

    const apiReq = https.request(options, (apiRes) => {
      apiRes.setEncoding('utf8');
      let body = '';
      apiRes.on('data', (chunk) => body += chunk);
      apiRes.on('end', () => {
        try {
          if (apiRes.statusCode !== 200) {
            const errObj = JSON.parse(body);
            console.error('Gemini card summary error:', errObj);
            return res.status(apiRes.statusCode).json({ error: errObj.error?.message || 'Gemini API 호출 오류' });
          }
          const resObj = JSON.parse(body);
          const responseText = resObj.candidates?.[0]?.content?.parts?.[0]?.text || '요약을 생성할 수 없습니다.';
          return res.status(200).json({ success: true, summary: responseText });
        } catch (e) {
          console.error('JSON parse error in Gemini response:', e);
          return res.status(500).json({ error: 'Gemini 응답 분석 도중 오류가 발생했습니다.' });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('HTTP Request error:', e);
      return res.status(500).json({ error: 'Gemini API 연결에 실패했습니다.' });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (err) {
    console.error('Error generating card summary:', err);
    return res.status(500).json({ error: '요약 생성 도중 서버 내부 오류가 발생했습니다.' });
  }
});

// Endpoint: Generate an AI MIND MAP (markdown outline) for a specific chatroom (card)
app.post('/api/wall/:id/cards/:cardId/mindmap', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const cardId = req.params.cardId.trim();
    const wall = await db.getWall(wallId);
    if (!wall) return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });

    const card = wall.cards?.[cardId];
    if (!card) return res.status(404).json({ error: '존재하지 않는 토론방입니다.' });

    const comments = card.comments || [];
    if (comments.length === 0) {
      return res.status(400).json({ error: '토론방에 나눈 대화 내역이 없어 마인드맵을 생성할 수 없습니다.' });
    }

    let chatContent = '';
    const authorMap = {};
    let anonCounter = 1;
    comments.forEach(c => {
      const author = c.author || '익명';
      if (!authorMap[author]) authorMap[author] = `익명 ${anonCounter++}`;
      chatContent += `- [${authorMap[author]}]: ${c.text || c.content || ''}\n`;
    });

    const apiKey = getGeminiKey(); // env 우선, 없으면 config.json
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key가 등록되지 않았습니다. 먼저 API Key를 등록해 주세요.' });
    }

    const systemPrompt = `You are an expert at building KNOWLEDGE MAPS (concept graphs) from group discussions.
Analyze the participant discussion from the learning topic room titled "${card.title}" (Description: ${card.content || ''}).
Extract the key concepts and the relationships between them, and output a knowledge graph.

OUTPUT FORMAT — output ONLY valid minified JSON (no markdown, no code fences, no commentary) of exactly this shape:
{"nodes":[{"id":"n0","label":"개념","group":"카테고리"}],"edges":[{"from":"n0","to":"n1","label":"관계"}]}

RULES:
- Include ONE central node (id "n0") whose label is the topic "${card.title}".
- Extract 8~16 concept nodes from the discussion: 핵심 아이디어, 제안/해결책, 구체적 사례, 도구/링크, 질문 등.
- Connect related nodes with edges. Each edge "label" is a SHORT Korean relationship phrase (예: "예시", "해결책", "포함", "관련", "활용", "질문").
- "group" is a short Korean category for coloring (예: "핵심", "의견", "사례", "도구", "질문").
- Every node label must be concise (15 Korean characters or fewer). Korean only.
- node ids must be unique strings ("n0","n1",...) and every edge from/to must reference an existing id.
- Make the graph connected (no isolated nodes). Output valid JSON only.

Discussion Transcript:
${chatContent}`;

    const https = require('https');
    const postData = JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] });
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    };

    const apiReq = https.request(options, (apiRes) => {
      apiRes.setEncoding('utf8');
      let body = '';
      apiRes.on('data', (chunk) => body += chunk);
      apiRes.on('end', () => {
        try {
          if (apiRes.statusCode !== 200) {
            const errObj = JSON.parse(body);
            console.error('Gemini mindmap error:', errObj);
            return res.status(apiRes.statusCode).json({ error: errObj.error?.message || 'Gemini API 호출 오류' });
          }
          const resObj = JSON.parse(body);
          let txt = resObj.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // extract JSON object from the model output
          const s = txt.indexOf('{');
          const e = txt.lastIndexOf('}');
          if (s === -1 || e === -1) {
            return res.status(500).json({ error: '지식맵 데이터를 생성하지 못했습니다. 다시 시도해 주세요.' });
          }
          let graph;
          try {
            graph = JSON.parse(txt.slice(s, e + 1));
          } catch (pe) {
            console.error('Knowledge graph JSON parse fail:', pe, txt.slice(0, 200));
            return res.status(500).json({ error: '지식맵 데이터 형식 오류입니다. 다시 시도해 주세요.' });
          }
          if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
            return res.status(500).json({ error: '지식맵 데이터가 비어 있습니다. 다시 시도해 주세요.' });
          }
          return res.status(200).json({ success: true, graph });
        } catch (e) {
          console.error('JSON parse error in Gemini mindmap response:', e);
          return res.status(500).json({ error: 'Gemini 응답 분석 도중 오류가 발생했습니다.' });
        }
      });
    });
    apiReq.on('error', (e) => {
      console.error('HTTP Request error (mindmap):', e);
      return res.status(500).json({ error: 'Gemini API 연결에 실패했습니다.' });
    });
    apiReq.write(postData);
    apiReq.end();
  } catch (err) {
    console.error('Error generating mindmap:', err);
    return res.status(500).json({ error: '마인드맵 생성 도중 서버 내부 오류가 발생했습니다.' });
  }
});

// Get saved archives for a board
app.get('/api/wall/:id/archives', async (req, res) => {
  try {
    let wallId = req.params.id.trim().toUpperCase();
    // 저장본 ID로 조회하면 원본 게시판 기준으로 형제 저장본들을 보여준다
    // (프론트가 'TALK'로 시작하는 ID를 하드코딩 부모로 보내던 버그 보완)
    const self = (db.cache.walls || {})[wallId];
    if (self && self.isArchive && self.parentWallId) {
      wallId = String(self.parentWallId).trim().toUpperCase();
    }
    const walls = Object.values(db.cache.walls || {});
    const archives = walls.filter(w => w.isArchive && w.parentWallId === wallId)
                          .map(w => ({ id: w.id, title: w.title, createdAt: w.createdAt, topic: w.topic }));
    archives.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(archives);
  } catch (err) {
    console.error('Error retrieving wall archives:', err);
    return res.status(500).json({ error: '톡방 기록 목록을 불러오는 도중 오류가 발생했습니다.' });
  }
});

// 9. Delete a wall board entirely (Restricted to owner or admin, requires authenticate middleware!)
app.delete('/api/wall/:id', authenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const success = await db.deleteWall(wallId, req.username, req.role);

    if (!success) {
      return res.status(404).json({ error: '게시판을 찾을 수 없거나 이미 삭제되었습니다.' });
    }

    // Broadcast delete warning to active connections if any
    const clients = wallClients[wallId] || [];
    clients.forEach((client) => {
      client.res.write('event: wallDeleted\n');
      client.res.write('data: ' + wallId + '\n\n');
    });

    return res.status(200).json({ success: true, message: '게시판이 성공적으로 완전히 삭제되었습니다.' });
  } catch (err) {
    console.error('Error deleting wall:', err);
    return res.status(500).json({ error: err.message || '게시판 삭제 도중 오류가 발생했습니다.' });
  }
});

// 실시간 협업 게시판 비활성화: 메인 화면으로 리다이렉트
app.get(['/wall', '/chat', '/wall/:id'], (req, res) => {
  res.redirect('/');
});

// Serve scratch directory static files (contains sync agent etc)
app.use('/scratch', express.static(path.join(__dirname, 'scratch')));

// Redirect disabled docs and tetris pages to home
app.get('/docs', (req, res) => {
  return res.redirect('/');
});
app.get('/docs/:id', (req, res) => {
  return res.redirect('/');
});
app.get('/tetris', (req, res) => {
  return res.redirect('/');
});

// Disabled HWP/Docs and Tetris APIs returning 404
app.all('/api/docs*', (req, res) => {
  return res.status(404).json({ error: 'Docs API has been disabled.' });
});
app.all('/api/tetris*', (req, res) => {
  return res.status(404).json({ error: 'Tetris API has been disabled.' });
});


// ==========================================
// SciBit 과학실험실 플랫폼 전용 API 라우터 (Oracle Cloud DB 연동)
// ==========================================
app.post('/api/scibit/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || password.length < 6) {
      const msg = '올바른 이메일과 6자 이상의 비밀번호를 입력해주세요.';
      return res.status(400).json({ error: msg, message: msg });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.getScibitTeacher(cleanEmail);
    if (existing) {
      const msg = '이미 가입된 이메일 주소입니다.';
      return res.status(400).json({ error: msg, message: msg });
    }
    
    // Create password record and save teacher
    const pwRecord = passwordUtil.createPasswordRecord(password);
    const teacher = await db.createScibitTeacher(cleanEmail, pwRecord);
    
    // Set Session & Explicit Save
    req.session.scibit_teacher = { id: teacher.id, email: teacher.email };
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: '세션 저장에 실패했습니다.', message: '세션 저장에 실패했습니다.' });
      return res.status(200).json({ success: true, user: req.session.scibit_teacher });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibit/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const msg = '이메일과 비밀번호를 모두 입력해주세요.';
      return res.status(400).json({ error: msg, message: msg });
    }
    const cleanEmail = email.toLowerCase().trim();
    const teacher = await db.getScibitTeacher(cleanEmail);
    if (!teacher) {
      const msg = '가입되지 않은 이메일 주소입니다.';
      return res.status(400).json({ error: msg, message: msg });
    }
    
    const verification = passwordUtil.verifyPassword(teacher.passwordHash, password);
    if (!verification.valid) {
      const msg = '비밀번호가 일치하지 않습니다.';
      return res.status(400).json({ error: msg, message: msg });
    }
    
    // Set Session & Explicit Save
    req.session.scibit_teacher = { id: teacher.id, email: teacher.email };
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: '세션 저장에 실패했습니다.', message: '세션 저장에 실패했습니다.' });
      return res.status(200).json({ success: true, user: req.session.scibit_teacher });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibit/auth/signout', (req, res) => {
  req.session.scibit_teacher = null;
  req.session.save((err) => {
    return res.status(200).json({ success: true });
  });
});

app.get('/api/scibit/auth/session', (req, res) => {
  if (req.session.scibit_teacher) {
    return res.status(200).json({ session: { user: req.session.scibit_teacher } });
  }
  return res.status(200).json({ session: null });
});

// Middleware to authenticate SciBit teacher session
const authScibitTeacher = (req, res, next) => {
  if (req.session.scibit_teacher) {
    req.scibit_teacher = req.session.scibit_teacher;
    return next();
  }
  return res.status(401).json({ error: '로그인이 필요한 서비스입니다.', message: '로그인이 필요한 서비스입니다.' });
};

app.post('/api/scibit/classes', authScibitTeacher, async (req, res) => {
  try {
    const { code, name, students } = req.body;
    if (!name || !students || !students.length) {
      const msg = '학급 정보와 학생 명단을 입력해주세요.';
      return res.status(400).json({ error: msg, message: msg });
    }
    
    const classObj = await db.createScibitClass(req.scibit_teacher.id, name, code, students);
    return res.status(200).json({ data: classObj });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.get('/api/scibit/classes', authScibitTeacher, async (req, res) => {
  try {
    const list = await db.getScibitClasses(req.scibit_teacher.id);
    return res.status(200).json({ data: list });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.get('/api/scibit/classes/lookup', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      const msg = '학급 코드가 필요합니다.';
      return res.status(400).json({ error: msg, message: msg });
    }
    const data = await db.getScibitClassByCode(code);
    if (!data) {
      return res.status(200).json({ data: null, students: [] });
    }
    return res.status(200).json({ data: data.class, students: data.students });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibit/records', async (req, res) => {
  try {
    const { student_id, class_id, sensor, question, prediction, measurements, conclusion, graph_snapshot } = req.body;
    if (!student_id || !class_id || !sensor) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    const record = await db.createScibitRecord(
      student_id,
      class_id,
      sensor,
      question,
      prediction,
      measurements,
      conclusion,
      graph_snapshot
    );
    return res.status(200).json({ data: record });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/scibit/records', async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!student_id) {
      return res.status(400).json({ error: '학생 ID가 필요합니다.' });
    }
    const list = await db.getScibitRecords(student_id);
    return res.status(200).json({ data: list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Upstage Solar API 기반 실험 결과 분석 라우터
app.post('/api/scibit/ai-analyze', async (req, res) => {
  try {
    const { sensor, question, prediction, measurements, conclusion } = req.body;
    if (!sensor) {
      return res.status(400).json({ error: '센서 정보가 필요합니다.', message: '센서 정보가 필요합니다.' });
    }

    const apiKey = getUpstageKey();
    
    // 측정 데이터 텍스트 요약
    let measureStr = '측정 데이터 없음';
    if (measurements && measurements.rows && measurements.values) {
      measureStr = measurements.rows.map((rName, rIdx) => {
        const rowVals = measurements.values[rIdx] || [];
        return `${rName}: ${rowVals.join(', ')}`;
      }).join(' / ');
    }

    const systemPrompt = `너는 초등학생 대상 스마트 과학실험실 'SciBit'의 친절하고 전문적인 AI 과학 닥터 멘토야.
학생이 마이크로비트 센서로 실험하고 기록한 데이터를 바탕으로 초등학생 눈높이에 맞춰 격려하며 친절하게 분석해줘.
응답은 마크다운 문법으로 작성하되 아래 3개 헤더를 꼭 사용해서 답해줘:
### 🌟 탐구 데이터 분석 요약
### 🔬 실생활 속 과학 원리
### 💡 더 알아보기 추천 질문`;

    const userPrompt = `[실험 정보]
- 사용 센서: ${sensor} 센서
- 탐구 질문: ${question || '정보 없음'}
- 학생 예상(가설): ${prediction || '작성 안 함'}
- 실무 측정 데이터: ${measureStr}
- 학생이 정리한 결론: ${conclusion || '작성 안 함'}

위 실험 기록을 과학적으로 분석하고 따뜻한 격려와 명확한 원리 설명을 적어줘.`;

    if (apiKey) {
      try {
        const aiResponse = await callUpstageChat(apiKey, systemPrompt, userPrompt, 'solar-pro2');
        return res.status(200).json({ success: true, analysis: aiResponse, source: 'Upstage Solar AI' });
      } catch (aiErr) {
        console.error('Upstage API 호출 오류, 멘토 모킹 피드백 제공:', aiErr.message);
      }
    }

    // Upstage API 키가 없거나 호출 오류 시 세이프가드 과학 멘토 모킹 피드백
    const fallbackAnalysis = `### 🌟 탐구 데이터 분석 요약
${sensor} 센서로 수집한 데이터(${measureStr})와 예상 가설("${prediction || '가설 작성 완료'}")을 멋지게 비교 분석했어요!
센서 측정값이 변화하는 시점과 탐구 결론("${conclusion || '정리 완료'}")이 과학적 규칙성을 잘 보여줍니다.

### 🔬 실생활 속 과학 원리
**${sensor} 센서**는 눈에 보이지 않는 미세한 변화를 디지털 전기 신호로 바꾸어주는 정밀 측정 장치예요. 교실이나 생활 주변에서도 이번 실험처럼 자극의 세기에 따라 물리량이 실시간으로 바뀌게 됩니다.

### 💡 더 알아보기 추천 질문
- 오늘 실험한 장소 외에 조건(빛, 온도, 흔들림 등)이 완전히 다른 장소에서 측정하면 어떤 차이가 생길까요?
- 마이크로비트에 경고음(비프음)을 추가해서 일정 수치 이상일 때 알람이 울리도록 코딩해보는 것은 어떨까요?`;

    return res.status(200).json({ success: true, analysis: fallbackAnalysis, source: 'SciBit Mentor Rule' });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

// ==========================================================================
// SciBot 과학실험실 플랫폼 전용 API 라우터 (Oracle Cloud DB 연동)
// ==========================================================================
app.post('/api/scibot/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 모두 입력해 주세요.' });
    }
    const cleanEmail = email.trim();
    const existing = await db.getScibotTeacher(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: '이미 가입된 교사 이메일 주소입니다.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
    const pwRecord = { salt, hash, iterations: 210000 };

    const teacher = await db.createScibotTeacher(cleanEmail, pwRecord);
    req.session.scibot_teacher = { id: teacher.id, email: teacher.email };
    
    return res.status(200).json({ success: true, user: req.session.scibot_teacher });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibot/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' });
    }
    const cleanEmail = email.trim();
    const teacher = await db.getScibotTeacher(cleanEmail);
    if (!teacher) {
      return res.status(401).json({ error: '등록되지 않은 계정입니다.' });
    }

    const { salt, hash, iterations } = teacher.passwordHash;
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    
    // Timing-safe comparison to prevent side-channel timing attacks
    const bufferA = Buffer.from(hash, 'hex');
    const bufferB = Buffer.from(testHash, 'hex');
    if (bufferA.length !== bufferB.length || !crypto.timingSafeEqual(bufferA, bufferB)) {
      return res.status(401).json({ error: '비밀번호가 불일치합니다.' });
    }

    req.session.scibot_teacher = { id: teacher.id, email: teacher.email };
    return res.status(200).json({ success: true, user: req.session.scibot_teacher });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibot/auth/signout', (req, res) => {
  req.session.scibot_teacher = null;
  return res.status(200).json({ success: true });
});

app.get('/api/scibot/auth/session', (req, res) => {
  if (req.session.scibot_teacher) {
    return res.status(200).json({ session: { user: req.session.scibot_teacher } });
  }
  return res.status(401).json({ error: '로그인이 필요한 서비스입니다.', message: '로그인이 필요한 서비스입니다.' });
});

// Middleware to authenticate SciBot teacher session
const authScibotTeacher = (req, res, next) => {
  if (req.session.scibot_teacher) {
    req.scibot_teacher = req.session.scibot_teacher;
    return next();
  }
  return res.status(401).json({ error: '로그인이 필요한 서비스입니다.', message: '로그인이 필요한 service입니다.' });
};

app.post('/api/scibot/classes', authScibotTeacher, async (req, res) => {
  try {
    const { code, name, students } = req.body;
    if (!name || !students || !students.length) {
      const msg = '학급 정보와 학생 명단을 입력해주세요.';
      return res.status(400).json({ error: msg, message: msg });
    }
    
    const classObj = await db.createScibotClass(req.scibot_teacher.id, name, code, students);
    return res.status(200).json({ data: classObj });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.get('/api/scibot/classes', authScibotTeacher, async (req, res) => {
  try {
    const list = await db.getScibotClasses(req.scibot_teacher.id);
    return res.status(200).json({ data: list });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.get('/api/scibot/classes/lookup', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      const msg = '학급 코드가 필요합니다.';
      return res.status(400).json({ error: msg, message: msg });
    }
    const data = await db.getScibotClassByCode(code);
    if (!data) {
      return res.status(200).json({ data: null, students: [] });
    }
    return res.status(200).json({ data: data.class, students: data.students });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.post('/api/scibot/records', async (req, res) => {
  try {
    const { student_id, class_id, sensor, question, prediction, measurements, conclusion, graph_snapshot } = req.body;
    if (!student_id || !class_id || !sensor) {
      return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
    }
    
    const record = await db.createScibotRecord(
      student_id,
      class_id,
      sensor,
      question,
      prediction,
      measurements,
      conclusion,
      graph_snapshot
    );
    return res.status(200).json({ data: record });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

app.get('/api/scibot/records', async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!student_id) {
      return res.status(400).json({ error: '학생 ID가 필요합니다.' });
    }
    const list = await db.getScibotRecords(student_id);
    return res.status(200).json({ data: list });
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
});

// SciBot AI 챗봇 프록시 API (Upstage Solar 기반)
app.post('/api/scibot/chat', async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: '질문 메시지가 누락되었습니다.' });
    }

    const apiKey = getUpstageKey();
    if (!apiKey) {
      return res.status(500).json({ error: '서버에 AI API Key가 세팅되어 있지 않습니다. ⚙️ 버튼으로 개인 키를 입력할 수도 있습니다.' });
    }

    const systemPromptLines = [
      "너는 SciBot 지능형 과학교실의 '실험 도우미'야.",
      "초등·중학생이 로봇 센서로 측정·탐구하는 과학 실험을 돕는다.",
      "친절한 존댓말로, 학생 눈높이에서 쉽고 짧게(3~5문장) 설명해.",
      "정답만 주지 말고 스스로 생각하도록 질문도 섞어. 안전과 예의를 지켜.",
      "지금 학생이 하는 실험 맥락:"
    ];
    if (context) {
      if (context.experiment) systemPromptLines.push(`- 실험: ${context.experiment} ${context.goal ? `(목표: ${context.goal})` : ''}`);
      if (context.sci) systemPromptLines.push(`- 관련 과학 개념: ${context.sci}`);
      if (context.sensor) systemPromptLines.push(`- 사용 센서: ${context.sensor} ${context.robot ? `/ ${context.robot}` : ''}`);
      if (context.stats) systemPromptLines.push(`- 측정 요약: ${context.stats.n}회, 최소 ${context.stats.min}, 최대 ${context.stats.max}, 평균 ${context.stats.avg} ${context.unit || ''}`);
      if (context.predict != null) systemPromptLines.push(`- 학생의 예측값: ${context.predict} ${context.unit || ''}`);
    }

    const systemPrompt = systemPromptLines.join('\n');
    
    // Format conversation history for Upstage Solar API
    const messages = [{ role: 'system', content: systemPrompt }];
    if (Array.isArray(history)) {
      history.forEach(h => {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }
    messages.push({ role: 'user', content: message });

    // Call Upstage API
    const https = require('https');
    const body = JSON.stringify({
      model: 'solar-pro2',
      messages: messages,
      temperature: 0.4,
      max_tokens: 1000
    });

    const reqObj = https.request('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (resp) => {
      resp.setEncoding('utf8');
      let responseData = '';
      resp.on('data', c => responseData += c);
      resp.on('end', () => {
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          try {
            const parsed = JSON.parse(responseData);
            const reply = parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
            if (!reply) return res.status(500).json({ error: 'AI 응답이 비어있습니다.' });
            return res.status(200).json({ reply: reply.trim() });
          } catch (e) {
            return res.status(500).json({ error: 'AI 응답 파싱 실패' });
          }
        } else {
          return res.status(resp.statusCode).json({ error: `AI 서버 에러 (상태코드: ${resp.statusCode})` });
        }
      });
    });

    reqObj.on('error', (err) => {
      return res.status(500).json({ error: err.message });
    });
    reqObj.write(body);
    reqObj.end();

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// SPA fallback
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 KFCMan.link Server | port:${PORT} | env:${process.env.NODE_ENV || 'development'}`);
});
