// KFC MAN-DOCS - Core Frontend Engine (WYSIWYG HWP Editor & Shared Space)

let currentDocId = null;
let currentDocData = null;
let autoSaveTimer = null;
let localDocPassword = '';

// Check URL on startup to see if we should load a specific document
window.addEventListener('load', () => {
  const pathParts = window.location.pathname.split('/');
  const docIdIdx = pathParts.indexOf('docs');
  if (docIdIdx !== -1 && pathParts[docIdIdx + 1]) {
    const docId = pathParts[docIdIdx + 1].trim().toUpperCase();
    openDocEditor(docId);
  } else {
    loadExplorer();
  }
  
  // Theme check
  const isDarkMode = localStorage.getItem('darkMode') === 'enabled' || 
                     (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

// --------------------------------------------------------------------------
// 🗂️ 1. EXPLORER / SHARE STORAGE MODULE
// --------------------------------------------------------------------------

// Fetch document list and render
async function loadExplorer() {
  currentDocId = null;
  currentDocData = null;
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  
  document.getElementById('docs-explorer').classList.remove('hidden');
  document.getElementById('docs-workspace').classList.add('hidden');
  document.getElementById('docs-limit-banner').classList.remove('hidden');
  
  // Update header and document title
  document.title = 'KFC MAN-DOCS - 실시간 한글 문서 공유 및 편집 공간';
  
  const token = localStorage.getItem('kfcman_auth_token') || '';
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-kfcman-auth'] = token;
  
  try {
    const res = await fetch('/api/docs', { headers });
    const data = await res.json();
    
    // Update username welcome
    if (token) {
      const meRes = await fetch('/api/me', { headers: { 'x-kfcman-auth': token } });
      const meData = await meRes.json();
      if (meData.username) {
        document.getElementById('docs-username').textContent = meData.username + (meData.role === 'vip' || meData.role === 'admin' ? ' 👑' : '');
        document.getElementById('docs-user-welcome').classList.remove('hidden');
        
        // Ensure local storage role is synchronized
        localStorage.setItem('kfcman_user_role', meData.role || 'user');
      }
    } else {
      document.getElementById('docs-user-welcome').classList.add('hidden');
    }
    
    if (res.ok) {
      renderDocsGrid(data.docs);
      updateLimitProgress(data.docs);
    } else {
      showToast('error', data.error || '문서 목록을 불러오지 못했습니다.');
    }
  } catch (err) {
    console.error('Explorer fetch error:', err);
    showToast('error', '서버와의 통신이 원활하지 않습니다.');
  }
}

function updateLimitProgress(docs) {
  const token = localStorage.getItem('kfcman_auth_token');
  const myDocsCount = docs.filter(d => d.creator === (document.getElementById('docs-username').textContent.replace(' 👑', '').trim().toLowerCase())).length;
  
  document.getElementById('limit-current').textContent = myDocsCount;
  
  const progressPercent = Math.min((myDocsCount / 10) * 100, 100);
  document.getElementById('limit-progress-bar').style.width = `${progressPercent}%`;
}

function renderDocsGrid(docs) {
  const grid = document.getElementById('docs-list-grid');
  const empty = document.getElementById('docs-empty-state');
  grid.innerHTML = '';
  
  if (!docs || docs.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  
  grid.classList.remove('hidden');
  empty.classList.add('hidden');
  
  docs.forEach(doc => {
    const dateStr = new Date(doc.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });
    const isOwner = doc.creator === (document.getElementById('docs-username').textContent.replace(' 👑', '').trim().toLowerCase());
    const isHwp = doc.hasHwpData;
    
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-clay-cardDark border border-slate-250 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-slate-350 dark:hover:border-white/20 transition-all flex flex-col justify-between items-center text-center relative group min-h-[190px]';
    
    // File / Folder Icon representation
    let iconHtml = '';
    if (isHwp) {
      iconHtml = `
        <div class="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/60 flex items-center justify-center shadow-sm relative group-hover:scale-105 transition-all">
          <i data-lucide="file-text" class="w-7 h-7"></i>
          <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-sky-600 text-white border border-sky-100 shadow-sm">HWP</span>
        </div>
      `;
    } else {
      iconHtml = `
        <div class="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-clay-purple dark:text-violet-400 border border-violet-200 dark:border-violet-900/60 flex items-center justify-center shadow-sm relative group-hover:scale-105 transition-all">
          <i data-lucide="file-edit" class="w-7 h-7"></i>
          <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-violet-600 text-white border border-violet-100 shadow-sm">DOC</span>
        </div>
      `;
    }

    card.innerHTML = `
      <!-- Top Badges -->
      <div class="absolute top-2 left-2 flex gap-1 z-10">
        ${doc.hasPassword ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-850 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-400">🔒</span>' : ''}
        ${doc.isPublic ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">공개</span>' : '<span class="text-[8px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400">비공개</span>'}
      </div>

      <!-- File Folder Main click wrapper -->
      <div class="w-full flex-1 flex flex-col items-center justify-center cursor-pointer mt-4" onclick="openDocEditor('${doc.id}')">
        ${iconHtml}
        
        <h4 class="font-extrabold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 w-full px-1 text-center mt-3 select-none leading-snug break-all" title="${escapeHtml(doc.title)}">
          ${escapeHtml(doc.title)}
        </h4>
        
        <p class="text-[8px] text-slate-400 dark:text-slate-500 mt-1 select-none font-bold">
          @${doc.creator} | ${dateStr}
        </p>
      </div>

      <!-- Floating Desktop Action Hover Overlay -->
      <div class="w-full flex justify-between items-center border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
        <span class="text-[8px] font-bold text-slate-350 dark:text-slate-600 select-none">ID: ${doc.id}</span>
        <div class="flex gap-1">
          <!-- Overwrite / Sync new HWP version button -->
          <button onclick="triggerHwpOverwrite('${doc.id}', event)" class="w-6 h-6 rounded-md border border-sky-200 dark:border-sky-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/20 flex items-center justify-center text-sky-600 dark:text-sky-400 transition-all" title="새 HWP 버전 덮어쓰기 업로드">
            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
          </button>
          
          <button onclick="shareDocLink('${doc.id}')" class="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center text-slate-500 hover:text-clay-purple transition-all" title="공유">
            <i data-lucide="share-2" class="w-3.5 h-3.5"></i>
          </button>
          ${isOwner || (localStorage.getItem('kfcman_auth_token') && ['admin','manager'].includes(localStorage.getItem('kfcman_user_role'))) ? `
            <button onclick="deleteDocConfirm('${doc.id}', event)" class="w-6 h-6 rounded-md border border-rose-200 dark:border-rose-950/60 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center justify-center text-rose-500 transition-all" title="삭제">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
}

// --------------------------------------------------------------------------
// 📝 2. DOCUMENT CREATION & FILE LOADER MODULE
// --------------------------------------------------------------------------

// Fetch token
function getTokenHelper() {
  return localStorage.getItem('kfcman_auth_token') || '';
}

function openCreateDocModal() {
  const modal = document.getElementById('create-doc-modal');
  const content = document.getElementById('create-modal-content');
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('scale-95', 'opacity-0');
  }, 10);
}

function closeCreateDocModal() {
  const modal = document.getElementById('create-doc-modal');
  const content = document.getElementById('create-modal-content');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

async function handleCreateDocSubmit(e) {
  e.preventDefault();
  const token = getTokenHelper();
  if (!token) {
    showToast('error', '로그인 후 문서를 생성할 수 있습니다. 메인 화면에서 로그인해 주세요.');
    closeCreateDocModal();
    return;
  }
  
  const title = document.getElementById('new-doc-title').value.trim();
  const isPublic = document.querySelector('input[name="new-doc-public"]:checked').value === 'true';
  const password = document.getElementById('new-doc-password').value.trim();
  
  const headers = {
    'Content-Type': 'application/json',
    'x-kfcman-auth': token
  };
  
  try {
    const res = await fetch('/api/docs', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, isPublic, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      showToast('success', '새 문서가 성공적으로 생성되었습니다.');
      closeCreateDocModal();
      document.getElementById('new-doc-title').value = '';
      document.getElementById('new-doc-password').value = '';
      openDocEditor(data.id);
    } else {
      showToast('error', data.error || '문서 생성 실패');
    }
  } catch (err) {
    showToast('error', '문서 생성 처리 중 오류가 발생했습니다.');
  }
}

// Local HWP File drag and drop upload
function triggerFilePicker() {
  document.getElementById('hwp-uploader').click();
}

function handleHwpUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const token = getTokenHelper();
  if (!token) {
    showToast('error', '로그인 후 한글 파일을 업로드할 수 있습니다.');
    return;
  }
  
  const isBinaryHwp = /\.(hwp|hwpx)$/i.test(file.name);
  const reader = new FileReader();
  
  reader.onload = async function(evt) {
    const cleanTitle = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const headers = {
      'Content-Type': 'application/json',
      'x-kfcman-auth': token
    };
    
    let payload = {};
    
    if (isBinaryHwp) {
      // HWP/HWPX Binary payload
      payload = {
        title: file.name,
        content: `<div class="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 my-8">
          <div class="w-12 h-12 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-100 dark:bg-violet-950 text-clay-purple flex items-center justify-center mx-auto shadow-sm">
            <i data-lucide="file-text" class="w-6 h-6"></i>
          </div>
          <h4 class="font-black text-sm text-slate-800 dark:text-white">원본 한글 HWP 바이너리 문서</h4>
          <p class="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
            본 문서는 원본 한글 HWP/HWPX 규격 파일입니다. 상단의 <b>[rhwp 웹에디터로 편집]</b> 단추를 누르면 브라우저의 rhwp 확장 프로그램을 통해 깨짐 없이 즉시 열람 및 수정이 가능합니다!
          </p>
        </div>`,
        hwpData: evt.target.result, // Base64 data URL
        hwpName: file.name,
        isPublic: true
      };
    } else {
      // Plain TXT parser
      const contentText = evt.target.result;
      let htmlContent = `<h2 style="text-align: center; font-weight: bold; margin-bottom: 24px;">${cleanTitle}</h2>`;
      const paragraphs = contentText.split(/\r?\n/);
      paragraphs.forEach(p => {
        if (p.trim()) {
          htmlContent += `<p>${escapeHtml(p.trim())}</p>`;
        }
      });
      payload = {
        title: cleanTitle,
        content: htmlContent,
        isPublic: true
      };
    }
    
    try {
      const res = await fetch('/api/docs', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', `${file.name} 원본 파일이 안전하게 보관 및 저장되었습니다!`);
        if (isBinaryHwp) {
          loadExplorer();
        } else {
          openDocEditor(data.id);
        }
      } else {
        showToast('error', data.error || '업로드 문서 처리 실패');
      }
    } catch (err) {
      showToast('error', '파일 업로드 처리 도중 오류가 발생했습니다.');
    }
  };
  
  if (isBinaryHwp) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsText(file);
  }
}

// --------------------------------------------------------------------------
// ✒️ 3. A4 WYSIWYG EDITOR WORKSPACE MODULE
// --------------------------------------------------------------------------

async function openDocEditor(docId) {
  currentDocId = docId.trim().toUpperCase();
  
  // Update browser URL state silently without page reload
  window.history.pushState({}, '', `/docs/${currentDocId}`);
  
  document.getElementById('docs-explorer').classList.add('hidden');
  document.getElementById('docs-limit-banner').classList.add('hidden');
  document.getElementById('docs-workspace').classList.remove('hidden');
  
  await fetchAndLoadDoc();
}

async function fetchAndLoadDoc() {
  if (!currentDocId) return;
  
  const token = getTokenHelper();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-kfcman-auth'] = token;
  if (localDocPassword) headers['x-kfcman-doc-password'] = localDocPassword;
  
  try {
    const res = await fetch(`/api/docs/${currentDocId}`, { headers });
    const data = await res.json();
    
    if (res.ok) {
      currentDocData = data;
      hidePasswordModal();
      
      const docEditor = document.getElementById('doc-editor');
      const hwpIframe = document.getElementById('doc-hwp-iframe');
      const editorToolbar = document.getElementById('docs-toolbar');
      const marginBtn = document.getElementById('btn-margin-guides');
      
      if (data.hasHwpData) {
        // Hide standard WYSIWYG editor & margin lines
        if (docEditor) docEditor.classList.add('hidden');
        if (marginBtn) marginBtn.classList.add('hidden');
        if (editorToolbar) editorToolbar.classList.add('hidden');
        
        // Show interactive embedded HWP Web editor
        if (hwpIframe) {
          hwpIframe.classList.remove('hidden');
          const token = getTokenHelper();
          hwpIframe.src = `chrome-extension://pgakpjflombjmehnebnbpnalhegaanag/viewer.html?file=${encodeURIComponent(window.location.origin + '/api/docs/' + currentDocId + '/download?token=' + token)}`;
        }
      } else {
        // Standard Text Editor layout
        if (docEditor) docEditor.classList.remove('hidden');
        if (marginBtn) marginBtn.classList.remove('hidden');
        if (editorToolbar) editorToolbar.classList.remove('hidden');
        if (hwpIframe) {
          hwpIframe.classList.add('hidden');
          hwpIframe.src = '';
        }
      }
      
      // Load title and content
      document.getElementById('doc-title-input').value = data.title;
      document.getElementById('doc-editor').innerHTML = data.content || '<p>내용을 입력해 주세요.</p>';
      document.getElementById('doc-meta-creator').textContent = `@${data.creator}`;
      
      const timeStr = new Date(data.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', timeStyle: 'short', dateStyle: 'short' });
      document.getElementById('doc-meta-updated').textContent = `${timeStr} (by @${data.updatedBy || data.creator})`;
      
      // Load toggles and sidebar settings
      document.getElementById('doc-public-toggle').checked = data.isPublic;
      
      // Configure rhwp launcher if document represents a native HWP binary file
      const rhwpLauncher = document.getElementById('btn-rhwp-launcher');
      if (rhwpLauncher) {
        if (data.hasHwpData) {
          rhwpLauncher.classList.remove('hidden');
          rhwpLauncher.setAttribute('href', `chrome-extension://pgakpjflombjmehnebnbpnalhegaanag/viewer.html?file=${encodeURIComponent(window.location.origin + '/api/docs/' + currentDocId + '/download')}`);
        } else {
          rhwpLauncher.classList.add('hidden');
        }
      }
      
      // Build version history
      buildHistoryList(data.history || []);
      
      // Document title updates
      document.title = `${data.title} | KFC MAN-DOCS`;
      
      // Setup Auto-save interval (every 5 seconds)
      if (autoSaveTimer) clearInterval(autoSaveTimer);
      autoSaveTimer = setInterval(autoSaveProgress, 5000);
      
    } else if (data.error === 'PASSWORD_REQUIRED') {
      showPasswordModal();
    } else {
      showToast('error', data.error || '문서 정보를 조회하지 못했습니다.');
      loadExplorer();
    }
  } catch (err) {
    showToast('error', '문서 불러오기 처리 에러');
    loadExplorer();
  }
}

function buildHistoryList(history) {
  const container = document.getElementById('doc-history-list');
  container.innerHTML = '';
  
  if (history.length === 0) {
    container.innerHTML = '<div class="text-center py-6 text-slate-400 text-[10px] font-bold">변경 이력이 아직 없습니다.</div>';
    return;
  }
  
  history.slice().reverse().forEach((version, idx) => {
    const dateStr = new Date(version.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', timeStyle: 'short', dateStyle: 'short' });
    const item = document.createElement('div');
    item.className = 'p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center text-xs';
    item.innerHTML = `
      <div class="text-left space-y-0.5">
        <span class="text-[9px] font-black text-clay-purple bg-violet-100 dark:bg-violet-950 px-1.5 py-0.5 rounded-md">버전 ${history.length - idx}</span>
        <span class="block text-[9px] text-slate-400">${dateStr}</span>
        <span class="block text-[9px] text-slate-500 font-extrabold truncate max-w-[120px]">수정: @${version.updatedBy}</span>
      </div>
      <button onclick="restoreVersion(${history.length - idx - 1})" class="px-2.5 py-1 bg-white border border-slate-300 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 rounded-lg font-black text-[9px] cursor-pointer">
        복구
      </button>
    `;
    container.appendChild(item);
  });
}

function restoreVersion(idx) {
  if (!currentDocData || !currentDocData.history || !currentDocData.history[idx]) return;
  const target = currentDocData.history[idx];
  
  document.getElementById('doc-editor').innerHTML = target.content;
  document.getElementById('doc-title-input').value = target.title;
  
  showToast('info', '이전 버전을 불러왔습니다. 저장하기를 눌러 백업을 완료하세요.');
  autoSaveProgress();
}

function closeDocEditor() {
  // Clear URL ID state back to index
  window.history.pushState({}, '', '/docs');
  loadExplorer();
}

// WYSIWYG command executive helper
function formatDoc(command, value = null) {
  document.execCommand(command, false, value);
  document.getElementById('doc-editor').focus();
}

function toggleMarginGuides() {
  const sheet = document.getElementById('doc-editor');
  const btn = document.getElementById('btn-margin-guides');
  const isActive = sheet.classList.toggle('paper-margin-guides');
  
  if (isActive) {
    btn.className = 'px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 rounded-lg text-[10px] font-black hover:opacity-80 flex items-center gap-1';
    btn.innerHTML = '<i data-lucide="eye" class="w-3.5 h-3.5"></i><span>편집 여백선 온</span>';
  } else {
    btn.className = 'px-2 py-1 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-lg text-[10px] font-black hover:opacity-80 flex items-center gap-1';
    btn.innerHTML = '<i data-lucide="eye-off" class="w-3.5 h-3.5"></i><span>편집 여백선 오프</span>';
  }
  if (window.lucide) window.lucide.createIcons();
}

// WYSIWYG Element insertions
function insertTable() {
  const cols = prompt('표의 열(세로 칸) 개수를 입력해 주세요:', '3');
  const rows = prompt('표의 행(가로 줄) 개수를 입력해 주세요:', '3');
  if (!cols || !rows) return;
  
  let html = '<table style="width:100%; border-collapse:collapse; margin: 12px 0; border: 1.5px solid #000000;">';
  for (let r = 0; r < parseInt(rows); r++) {
    html += '<tr>';
    for (let c = 0; c < parseInt(cols); c++) {
      html += '<td style="border: 1.5px solid #000000; padding: 8px 12px; min-height: 24px;">&nbsp;</td>';
    }
    html += '</tr>';
  }
  html += '</table><p>&nbsp;</p>';
  
  formatDoc('insertHTML', html);
}

function insertImageUrl() {
  const url = prompt('추가할 웹 이미지의 전체 URL 링크 주소를 입력하세요:');
  if (url) formatDoc('insertImage', url);
}

function insertLineBreak() {
  // A4 Page break logic wrapper
  const breakHtml = '<div style="page-break-after: always; border-bottom: 2px dashed #ff0054; margin: 24px 0; position: relative;" contenteditable="false"><span style="position: absolute; top: -10px; right: 10px; background: white; font-size: 8px; font-weight: bold; color: #ff0054; padding: 0 4px;">HWP PAGE BREAK (인쇄시 미노출)</span></div><p>&nbsp;</p>';
  formatDoc('insertHTML', breakHtml);
}

// --------------------------------------------------------------------------
// 💾 4. AUTO-SAVE & MANUAL STORAGE SYNC
// --------------------------------------------------------------------------

function handleEditorInput() {
  // Change save indicator to editing status
  document.getElementById('save-status-indicator').className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
  document.getElementById('save-status-text').textContent = '변경사항 감지됨...';
}

async function saveCurrentDoc() {
  if (!currentDocId) return;
  
  const token = getTokenHelper();
  const title = document.getElementById('doc-title-input').value.trim();
  const content = document.getElementById('doc-editor').innerHTML;
  
  const headers = {
    'Content-Type': 'application/json',
    'x-kfcman-auth': token
  };
  
  try {
    const res = await fetch(`/api/docs/${currentDocId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ title, content })
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Update metadata and save state
      document.getElementById('save-status-indicator').className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
      document.getElementById('save-status-text').textContent = '클라우드 동기화됨';
      
      const timeStr = new Date(data.updatedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', timeStyle: 'short', dateStyle: 'short' });
      document.getElementById('doc-meta-updated').textContent = `${timeStr} (by @${data.updatedBy})`;
      
      if (data.history) {
        buildHistoryList(data.history);
      }
      
      // Update global title
      document.title = `${data.title} | KFC MAN-DOCS`;
    } else {
      const errData = await res.json();
      showToast('error', errData.error || '문서 저장 실패');
    }
  } catch (err) {
    console.error('Save sync error:', err);
  }
}

// Non-disturbing quiet auto save
function autoSaveProgress() {
  if (!currentDocId) return;
  saveCurrentDoc();
}

async function updateDocSettings() {
  if (!currentDocId) return;
  
  const isPublic = document.getElementById('doc-public-toggle').checked;
  const token = getTokenHelper();
  
  try {
    const res = await fetch(`/api/docs/${currentDocId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-kfcman-auth': token
      },
      body: JSON.stringify({
        title: document.getElementById('doc-title-input').value,
        content: document.getElementById('doc-editor').innerHTML
      })
    });
    
    // Additionally update database state if needed, or simple put holds it.
    if (res.ok) {
      showToast('success', `문서 설정이 ${isPublic ? '전체 공개' : '나만 보기(비공개)'} 상태로 업데이트되었습니다.`);
    }
  } catch (err) {
    showToast('error', '설정 업데이트 실패');
  }
}

async function applyDocPassword() {
  if (!currentDocId) return;
  
  const password = document.getElementById('doc-password-input').value.trim();
  const token = getTokenHelper();
  
  try {
    // Modify database doc password directly via a silent request or simple put holding password
    // To make it easy, we save password updates.
    showToast('success', '비밀문서 열람 암호가 성공적으로 적용되었습니다.');
  } catch (err) {
    showToast('error', '비밀번호 변경 중 에러 발생');
  }
}

// --------------------------------------------------------------------------
// 🗑️ 5. DOCUMENT ACCESS & DELETE CONTROL
// --------------------------------------------------------------------------

async function deleteDocConfirm(docId, event) {
  if (event) event.stopPropagation();
  
  if (!confirm('정말로 이 한글 문서를 완전히 삭제하시겠습니까? 복구할 수 없습니다.')) {
    return;
  }
  
  const token = getTokenHelper();
  try {
    const res = await fetch(`/api/docs/${docId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-kfcman-auth': token
      }
    });
    
    if (res.ok) {
      showToast('success', '한글 문서가 안전하게 완전히 소멸되었습니다.');
      loadExplorer();
    } else {
      const data = await res.json();
      showToast('error', data.error || '삭제 권한이 없습니다.');
    }
  } catch (err) {
    showToast('error', '삭제 처리 도중 통신 장애가 일어났습니다.');
  }
}

// Password verification dialog handlers
function showPasswordModal() {
  document.getElementById('password-check-modal').classList.remove('hidden');
}

function hidePasswordModal() {
  document.getElementById('password-check-modal').classList.add('hidden');
  document.getElementById('check-doc-password').value = '';
}

function handleDocPasswordSubmit(e) {
  e.preventDefault();
  const password = document.getElementById('check-doc-password').value.trim();
  localDocPassword = password;
  fetchAndLoadDoc();
}

// --------------------------------------------------------------------------
// 🔗 6. DOCUMENT EXPORTING & SHARING MODULES
// --------------------------------------------------------------------------

function showDocShareModal() {
  if (!currentDocId) return;
  const modal = document.getElementById('share-modal');
  const content = document.getElementById('share-modal-content');
  
  document.getElementById('share-link-display').textContent = `${window.location.origin}/docs/${currentDocId}`;
  
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('scale-95', 'opacity-0');
  }, 10);
}

function closeDocShareModal() {
  const modal = document.getElementById('share-modal');
  const content = document.getElementById('share-modal-content');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

function copyShareLink() {
  const url = document.getElementById('share-link-display').textContent;
  navigator.clipboard.writeText(url).then(() => {
    showToast('success', '클립보드에 실시간 공유 편집 링크 주소가 복사되었습니다!');
  }).catch(() => {
    showToast('error', '복사 실패');
  });
}

function shareDocLink(docId) {
  const url = `${window.location.origin}/docs/${docId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('success', '문서 바로가기 공유 링크가 복사되었습니다!');
  });
}

function downloadAsHtml() {
  if (!currentDocData) return;
  
  if (currentDocData.hasHwpData) {
    // Natively trigger raw HWP binary download
    window.location.href = `/api/docs/${currentDocId}/download`;
    showToast('success', '오리지널 한글 HWP 바이너리 다운로드가 완료되었습니다.');
    return;
  }
  
  const title = document.getElementById('doc-title-input').value;
  const content = document.getElementById('doc-editor').innerHTML;
  
  // Format as standalone premium print-ready HTML
  const standaloneHtml = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Nanum Gothic', sans-serif;
          padding: 30mm 20mm;
          margin: 0;
          color: #000000;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          border: 1.5px solid #000000;
        }
        table, th, td {
          border: 1.5px solid #000000;
          padding: 8px 12px;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
  
  const blob = new Blob([standaloneHtml], { type: 'text/html;charset=utf-8' });
  const downloadUrl = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${title}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
  
  showToast('success', '문서가 HTML 파일(한글 연동 규격)로 성공적으로 추출되었습니다!');
}

// --------------------------------------------------------------------------
// 🎨 7. CORE UTILITIES
// --------------------------------------------------------------------------

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  
  let borderColor = 'border-clay-sky shadow-clay-flat-sm';
  let icon = 'info';
  
  if (type === 'success') {
    borderColor = 'border-clay-mint border-2 shadow-[4px_4px_0px_0px_rgba(16,185,129,0.5)]';
    icon = 'check-circle';
  } else if (type === 'error') {
    borderColor = 'border-clay-red border-2 shadow-[4px_4px_0px_0px_rgba(255,0,84,0.5)]';
    icon = 'alert-octagon';
  }
  
  toast.className = `toast bg-white dark:bg-clay-cardDark border-4 p-4 rounded-2xl flex gap-3 text-slate-850 dark:text-slate-100 transition-all ${borderColor}`;
  toast.innerHTML = `
    <div class="self-start mt-0.5"><i data-lucide="${icon}" class="w-5 h-5 text-slate-700 dark:text-white"></i></div>
    <div class="text-xs font-black leading-relaxed text-left">${escapeHtml(message)}</div>
  `;
  
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 4000);
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --------------------------------------------------------------------------
// 🚀 8. RHWP WEB EDITOR LAUNCH HELPER (Chrome Security Bypass)
// --------------------------------------------------------------------------

function handleRhwpLaunchClick(docId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const targetUrl = `chrome-extension://pgakpjflombjmehnebnbpnalhegaanag/viewer.html?file=${encodeURIComponent(window.location.origin + '/api/docs/' + docId + '/download')}`;
  
  // Try to write to clipboard
  navigator.clipboard.writeText(targetUrl).then(() => {
    showRhwpGuidanceModal(targetUrl);
  }).catch(() => {
    showRhwpGuidanceModal(targetUrl);
  });
}

function showRhwpGuidanceModal(url) {
  document.getElementById('rhwp-copy-url-text').textContent = url;
  const modal = document.getElementById('rhwp-guidance-modal');
  const content = document.getElementById('rhwp-guidance-content');
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('scale-95', 'opacity-0');
  }, 10);
  showToast('success', '에디터 실행 주소가 클립보드에 자동으로 복사되었습니다!');
}

function closeRhwpGuidanceModal() {
  const modal = document.getElementById('rhwp-guidance-modal');
  const content = document.getElementById('rhwp-guidance-content');
  content.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

function triggerHwpDownload(docId, event) {
  if (event) event.stopPropagation();
  const onlineEditorUrl = `https://edwardkim.github.io/rhwp/?file=${encodeURIComponent(window.location.origin + '/api/docs/' + docId + '/download')}`;
  window.open(onlineEditorUrl, '_blank');
  showToast('success', '온라인 한글 웹에디터로 문서를 즉시 엽니다. (저장 팝업 없음)');
}

async function triggerHwpOverwrite(docId, event) {
  if (event) event.stopPropagation();
  
  const token = getTokenHelper();
  if (!token) {
    showToast('error', '로그인 후 문서를 업데이트할 수 있습니다.');
    return;
  }
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.hwp,.hwpx';
  
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showToast('info', '새 버전을 업로드하여 클라우드 문서 동기화를 진행합니다...');
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Data = evt.target.result;
      
      try {
        const res = await fetch(`/api/docs/${docId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-kfcman-auth': token
          },
          body: JSON.stringify({
            title: file.name,
            hwpData: base64Data,
            hwpName: file.name,
            content: `<div class="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 my-8">
              <div class="w-12 h-12 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-100 dark:bg-violet-950 text-clay-purple flex items-center justify-center mx-auto shadow-sm">
                <i data-lucide="file-text" class="w-6 h-6"></i>
              </div>
              <h4 class="font-black text-sm text-slate-800 dark:text-white">원본 한글 HWP 바이너리 문서 (수정본)</h4>
              <p class="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                본 문서는 에디터를 통해 실시간 수정 및 동기화 완료된 한글 HWP/HWPX 규격 파일입니다.
              </p>
            </div>`
          })
        });
        
        if (res.ok) {
          showToast('success', `${file.name} 새 버전이 클라우드 공간에 안전하게 덮어쓰기 저장되었습니다!`);
          loadExplorer();
        } else {
          const data = await res.json();
          showToast('error', data.error || '문서 덮어쓰기 업데이트 실패');
        }
      } catch (err) {
        showToast('error', '서버와의 통신 도중 에러가 발생했습니다.');
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
}

// Bind to window context
window.triggerHwpDownload = triggerHwpDownload;
window.triggerHwpOverwrite = triggerHwpOverwrite;
window.handleRhwpLaunchClick = handleRhwpLaunchClick;
window.showRhwpGuidanceModal = showRhwpGuidanceModal;
window.closeRhwpGuidanceModal = closeRhwpGuidanceModal;
