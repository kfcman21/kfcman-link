function initWall() {
  // 1. Core State and Route Parsing
  const pathSegments = window.location.pathname.split('/');
  let boardId = '';
  if (pathSegments.length > 2 && pathSegments[1] === 'wall') {
    try {
      boardId = decodeURIComponent(pathSegments[2]).trim().toUpperCase();
    } catch (e) {
      boardId = pathSegments[2].trim().toUpperCase();
    }
  }

  let currentUser = null;
  let currentWall = null;
  let activeCardSectionId = '';

  function isBoardAdmin() {
    if (!currentUser || !currentWall) return false;
    const cleanUser = currentUser.username.toLowerCase();
    const boardCreator = (currentWall.creator || '').toLowerCase();
    return boardCreator === cleanUser;
  }

  // Load logged-in user profile if auth token is present
  const token = localStorage.getItem('kfcman_auth_token');
  if (token) {
    fetch('/api/me', {
      headers: { 'X-KFCMan-Auth': token }
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data) {
        currentUser = data;
        if (currentWall) {
          renderBoard(currentWall);
        }
      }
    })
    .catch(err => console.error('Failed to load user context:', err));
  }

  // DOM Elements
  const landingScreen = document.getElementById('landing-screen');

  // Swear Word & Profanity Filtering Engine
  const PROFANITY_WORDS = [
    '시발', '씨발', '개새끼', '병신', '좆', '씹', '창녀', '새끼', '존나', '좃', '미친년', '미친놈', '미친', 
    '개새', '썅', '지랄', '엠창', '느금', '호로', '창남', '보지', '자지', '섹스', '포르노', '딸딸이', '야동',
    '빠구리', '애자', '느금마', 'ㅅㅂ', 'ㅂㅅ', 'ㅈㄴ', 'ㄷㅊ', '닥쳐',
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'fucker', 'fucking', 'slut', 
    'whore', 'motherfucker', 'fag', 'faggot', 'nigger', 'cock'
  ];

  function containsProfanity(text) {
    if (!text) return false;
    const cleanText = String(text).replace(/[\s!@#$%^&*()_\-+={[\]|\\:;"'<,>.?/~`ㄱ-ㅎㅏ-ㅣ]+/g, '').toLowerCase();
    if (PROFANITY_WORDS.some(word => cleanText.includes(word))) {
      return true;
    }
    const originalClean = String(text).replace(/\s+/g, '').toLowerCase();
    const acronyms = ['ㅅㅂ', 'ㅂㅅ', 'ㅈㄴ', 'ㄷㅊ', 'ㅁㅊ', 'ㄹㄷ'];
    return acronyms.some(acr => originalClean.includes(acr));
  }
  const boardScreen = document.getElementById('board-screen');
  const btnFloatingAdd = document.getElementById('btn-floating-add');
  const emptyCardsState = document.getElementById('empty-cards-state');
  const cardsGrid = document.getElementById('cards-grid');

  const createWallForm = document.getElementById('create-wall-form');
  const joinWallForm = document.getElementById('join-wall-form');
  const cardCreationForm = document.getElementById('card-creation-form');
  
  const cardModal = document.getElementById('card-modal');
  const cardModalContent = document.getElementById('card-modal-content');
  const btnCloseModal = document.getElementById('btn-close-modal');

  // Card Detail Modal
  const cardDetailModal = document.getElementById('card-detail-modal');
  const cardDetailModalContent = document.getElementById('card-detail-modal-content');
  const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
  const btnCloseDetailModalBottom = document.getElementById('btn-close-detail-modal-bottom');
  const detailAuthorBadge = document.getElementById('detail-author-badge');
  const detailDate = document.getElementById('detail-date');
  const detailImageContainer = document.getElementById('detail-image-container');
  const detailTitle = document.getElementById('detail-title');
  const detailContent = document.getElementById('detail-content');
  const detailLikesCount = document.getElementById('detail-likes-count');
  const detailLikeBtn = document.getElementById('detail-like-btn');
  const detailCommentsCount = document.getElementById('detail-comments-count');
  const detailCommentsList = document.getElementById('detail-comments-list');
  const detailCommentAuthor = document.getElementById('detail-comment-author');
  const detailCommentText = document.getElementById('detail-comment-text');
  const detailCommentSubmitBtn = document.getElementById('detail-comment-submit-btn');

  // Image Lightbox Modal
  const imageLightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const btnCloseLightbox = document.getElementById('btn-close-lightbox');

  // Load Dark Mode Preference
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.documentElement.classList.add('dark');
  }

  // Re-trigger Lucide icons on any state changes
  function updateIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- ROUTING FLOW AND BOARD VALIDATION ---
  if (boardId) {
    // Verify if this board actually exists in the database
    fetch(`/api/wall/${boardId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('존재하지 않는 게시판 고유 코드입니다. 로비로 이동합니다.');
        }
        return res.json();
      })
      .then(wall => {
        // Board exists! Hide landing, show board elements
        landingScreen.classList.add('hidden');
        boardScreen.classList.remove('hidden');
        btnFloatingAdd.classList.remove('hidden');
        
        // Save to my board list
        saveBoardToHistory(wall);

        // Render initial data and connect to real-time SSE stream
        renderBoard(wall);
        connectToStream(boardId);
      })
      .catch(err => {
        alert(err.message);
        window.location.href = '/wall'; // Redirect to the wall creation lobby
      });
  } else {
    // Show landing
    landingScreen.classList.remove('hidden');
    boardScreen.classList.add('hidden');
    btnFloatingAdd.classList.add('hidden');
    renderMyBoardsList();
    updateIcons();
  }

  function saveBoardToHistory(wall) {
    let list = JSON.parse(localStorage.getItem('kfcman_my_walls') || '[]');
    list = list.filter(w => w.id !== wall.id);
    list.unshift({
      id: wall.id,
      title: wall.title,
      description: wall.description || '',
      createdAt: wall.createdAt || new Date().toISOString()
    });
    if (list.length > 15) {
      list = list.slice(0, 15);
    }
    localStorage.setItem('kfcman_my_walls', JSON.stringify(list));
  }

  async function renderMyBoardsList() {
    const container = document.getElementById('my-walls-container');
    const createdSection = document.getElementById('created-walls-section');
    const visitedSection = document.getElementById('visited-walls-section');
    const createdListEl = document.getElementById('created-walls-list');
    const visitedListEl = document.getElementById('visited-walls-list');
    if (!container) return;

    let createdWalls = [];
    const token = localStorage.getItem('kfcman_auth_token');
    if (token) {
      try {
        const res = await fetch('/api/my-walls', {
          headers: { 'X-KFCMan-Auth': token }
        });
        if (res.ok) {
          createdWalls = await res.ok ? await res.json() : [];
        }
      } catch (err) {
        console.error('Failed to load created walls:', err);
      }
    }

    const visitedWalls = JSON.parse(localStorage.getItem('kfcman_my_walls') || '[]');

    // Hide or Show sections based on availability
    if (createdWalls.length === 0 && visitedWalls.length === 0) {
      container.classList.add('hidden');
      createdSection.classList.add('hidden');
      visitedSection.classList.add('hidden');
      landingScreen.className = "max-w-md mx-auto space-y-6 mt-12";
      return;
    }

    container.classList.remove('hidden');
    landingScreen.className = "max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start mt-12 space-y-0";

    // 1. Render Created Walls
    if (createdWalls.length > 0) {
      createdSection.classList.remove('hidden');
      createdListEl.innerHTML = createdWalls.map(w => `
        <div class="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 hover:border-clay-purple dark:hover:border-clay-purple hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all shadow-sm">
          <a href="/wall/${w.id}" class="flex-grow text-left cursor-pointer pr-4">
            <span class="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-clay-purple transition-colors block mb-0.5">
              ${escapeHTML(w.title)}
            </span>
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 block truncate max-w-[280px]">
              ${escapeHTML(w.description || '안내글 없음')}
            </span>
          </a>
          <div class="flex items-center gap-2">
            <span class="bg-violet-100 dark:bg-violet-950/40 text-clay-purple border border-violet-200 dark:border-violet-850 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase select-none">${w.id}</span>
            <button onclick="deleteWallBoard(event, '${w.id}')" class="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900" title="게시판 완전 삭제">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `).join('');
    } else {
      createdSection.classList.add('hidden');
    }

    // 2. Render Visited Walls
    if (visitedWalls.length > 0) {
      visitedSection.classList.remove('hidden');
      visitedListEl.innerHTML = visitedWalls.map(w => `
        <div class="group flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 hover:border-clay-sky dark:hover:border-clay-sky hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-all shadow-sm">
          <a href="/wall/${w.id}" class="flex-grow text-left cursor-pointer pr-4">
            <span class="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-clay-sky transition-colors block mb-0.5">
              ${escapeHTML(w.title)}
            </span>
            <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 block truncate max-w-[280px]">
              ${escapeHTML(w.description || '안내글 없음')}
            </span>
          </a>
          <div class="flex items-center gap-2">
            <span class="bg-cyan-100 dark:bg-cyan-950/40 text-clay-sky border border-cyan-200 dark:border-cyan-850 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase select-none">${w.id}</span>
            <button onclick="removeBoardFromHistory(event, '${w.id}')" class="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer border border-transparent hover:border-rose-100 dark:hover:border-rose-900" title="기록에서 삭제">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `).join('');
    } else {
      visitedSection.classList.add('hidden');
    }

    updateIcons();
  }

  window.removeBoardFromHistory = function(e, wallId) {
    if (e) e.stopPropagation();
    let list = JSON.parse(localStorage.getItem('kfcman_my_walls') || '[]');
    list = list.filter(w => w.id !== wallId);
    localStorage.setItem('kfcman_my_walls', JSON.stringify(list));
    renderMyBoardsList();
  };

  window.deleteWallBoard = async function(e, wallId) {
    if (e) e.stopPropagation();
    if (!confirm('⚠️ 정말로 이 게시판을 서버에서 완전히 삭제하시겠습니까?\n작성된 모든 카드와 댓글 데이터가 영구적으로 날아가며 복구할 수 없습니다.')) {
      return;
    }

    const token = localStorage.getItem('kfcman_auth_token');
    const headers = {};
    if (token) {
      headers['X-KFCMan-Auth'] = token;
    }

    try {
      const res = await fetch(`/api/wall/${wallId}`, {
        method: 'DELETE',
        headers: headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '게시판 삭제 실패');

      alert('게시판이 완전히 삭제되었습니다. ✨');
      
      // Remove from history
      let list = JSON.parse(localStorage.getItem('kfcman_my_walls') || '[]');
      list = list.filter(w => w.id !== wallId);
      localStorage.setItem('kfcman_my_walls', JSON.stringify(list));

      renderMyBoardsList();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CREATE BOARD HANDLER ---
  if (createWallForm) {
    createWallForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('wall-title-input').value.trim();
      const description = document.getElementById('wall-desc-input').value.trim();
      const maxUsersInput = document.getElementById('wall-max-users-input');
      const maxUsers = maxUsersInput ? parseInt(maxUsersInput.value) || 0 : 0;
      const layoutEl = document.querySelector('input[name="wall-layout-picker"]:checked');
      const layout = layoutEl ? layoutEl.value : 'grid';

      const token = localStorage.getItem('kfcman_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['X-KFCMan-Auth'] = token;
      }

      try {
        const res = await fetch('/api/wall', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ title, description, maxUsers, layout })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '게시판 생성에 실패했습니다.');
        
        // Redirect to the new wall
        window.location.href = `/wall/${data.id}`;
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // --- JOIN BOARD HANDLER ---
  if (joinWallForm) {
    joinWallForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('join-code-input').value.trim().toUpperCase();
      if (code) {
        window.location.href = `/wall/${code}`;
      }
    });
  }

  // --- SSE REAL-TIME SYNC ENGINE ---
  let eventSource = null;
  function connectToStream(id) {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource(`/api/wall/${id}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const wall = JSON.parse(event.data);
        renderBoard(wall);
      } catch (err) {
        console.error('Failed to parse wall update:', err);
      }
    };

    eventSource.addEventListener('activeCount', (event) => {
      try {
        const count = parseInt(event.data) || 1;
        const currentViewerCountEl = document.getElementById('current-viewer-count');
        if (currentViewerCountEl) {
          currentViewerCountEl.textContent = count;
        }
      } catch (err) {
        console.error('Failed to parse active count:', err);
      }
    });

    eventSource.addEventListener('wallDeleted', (event) => {
      alert('🚨 해당 게시판이 개설자 또는 관리자에 의해 완전히 삭제되었습니다. 로비로 이동합니다.');
      window.location.href = '/wall';
    });

    eventSource.onerror = (err) => {
      console.warn('Real-time connection interrupted. Automatically re-establishing stream in background...', err);
    };
  }

  // --- RENDER BOARD AND CARDS ---
  function renderBoard(wall) {
    currentWall = wall;
    
    // Refresh number login display states
    if (typeof updateNumberLoginUI === 'function') {
      updateNumberLoginUI();
    }

    // Show/hide notice creation checkbox
    const noticeContainer = document.getElementById('admin-notice-checkbox-container');
    if (noticeContainer) {
      if (isBoardAdmin()) {
        noticeContainer.classList.remove('hidden');
      } else {
        noticeContainer.classList.add('hidden');
      }
    }

    document.getElementById('board-title').textContent = wall.title;
    document.getElementById('board-desc').textContent = wall.description;
    
    const boardCodeBadge = document.getElementById('board-code-badge');
    if (boardCodeBadge) {
      boardCodeBadge.textContent = wall.id;
    }

    const maxViewerCountEl = document.getElementById('max-viewer-count');
    if (maxViewerCountEl) {
      maxViewerCountEl.textContent = wall.maxUsers > 0 ? wall.maxUsers : '무제한';
    }

    // Handle copying link
    const copyBtn = document.getElementById('btn-copy-wall-link');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const link = window.location.origin + `/wall/${wall.id}`;
        navigator.clipboard.writeText(link).then(() => {
          const origText = copyBtn.querySelector('span').textContent;
          copyBtn.querySelector('span').textContent = '복사 완료! ✔';
          setTimeout(() => {
            copyBtn.querySelector('span').textContent = origText;
          }, 2000);
        });
      };
    }

    // Handle board resetting/reuse (전체 초기화)
    const resetBtn = document.getElementById('btn-reset-wall');
    if (resetBtn) {
      if (isBoardAdmin()) {
        resetBtn.classList.remove('hidden');
        resetBtn.onclick = async () => {
          if (confirm('⚠️ 경고: 이 게시판의 모든 카드(포스트잇) 및 댓글 내역을 초기화하고 다시 시작하시겠습니까?\n이 작업은 복구할 수 없으며, 모든 사용자 화면에서도 실시간으로 카드가 즉각 비워집니다.')) {
            try {
              const res = await fetch(`/api/wall/${wall.id}/reset`, { method: 'POST' });
              if (!res.ok) throw new Error('서버 초기화 요청이 실패했습니다.');
              
              // Success indicator
              const origText = resetBtn.querySelector('span').textContent;
              resetBtn.querySelector('span').textContent = '초기화 성공! ✨';
              resetBtn.classList.remove('bg-rose-500', 'hover:bg-rose-600');
              resetBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
              setTimeout(() => {
                resetBtn.querySelector('span').textContent = origText;
                resetBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                resetBtn.classList.add('bg-rose-500', 'hover:bg-rose-600');
              }, 2000);
            } catch (err) {
              alert(err.message);
            }
          }
        };
      } else {
        resetBtn.classList.add('hidden');
      }
    }

    // Toggle FAB visibility and update cardsGrid wrapper classes based on layout
    const btnFloatingAdd = document.getElementById('btn-floating-add');
    if (btnFloatingAdd) {
      if (wall.layout === 'columns') {
        btnFloatingAdd.classList.add('hidden');
      } else {
        btnFloatingAdd.classList.remove('hidden');
      }
    }

    if (wall.layout === 'columns') {
      cardsGrid.className = "flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start w-full min-h-[50vh]";
    } else if (wall.layout === 'rows') {
      cardsGrid.className = "max-w-3xl mx-auto flex flex-col gap-6 w-full";
    } else if (wall.layout === 'timeline') {
      cardsGrid.className = "relative pt-16 pb-8 flex gap-12 overflow-x-auto w-full custom-scrollbar items-start min-h-[55vh] px-10";
    } else {
      cardsGrid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full";
    }

    // Render Cards
    cardsGrid.innerHTML = '';
    const cards = Object.values(wall.cards || {}).sort((a, b) => {
      // Pin notices to the top!
      const aNotice = !!a.isNotice;
      const bNotice = !!b.isNotice;
      if (aNotice && !bNotice) return -1;
      if (!aNotice && bNotice) return 1;
      // If both are notice or both are normal, sort by date descending
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    let maxScore = 0;
    cards.forEach(c => {
      const score = (c.likes || 0) + (c.comments || []).length;
      if (score > maxScore) {
        maxScore = score;
      }
    });

    // ---------------- COLUMNS LAYOUT RENDERING ----------------
    if (wall.layout === 'columns') {
      const sections = wall.sections || [];
      
      sections.forEach(sec => {
        const secCards = cards.filter(c => c.sectionId === sec.id);

        const colDiv = document.createElement('div');
        colDiv.className = "flex-shrink-0 w-80 bg-slate-100/70 dark:bg-slate-900/40 border-4 border-white dark:border-slate-800 rounded-3xl p-4 flex flex-col max-h-[75vh] shadow-sm";

        // Admin section edit controls
        let adminHeaderControls = '';
        if (isBoardAdmin()) {
          adminHeaderControls = `
            <div class="flex items-center gap-0.5">
              <button onclick="renameSection(event, '${sec.id}', '${escapeHTML(sec.name)}')" class="w-6.5 h-6.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="섹션명 변경">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteSection(event, '${sec.id}')" class="w-6.5 h-6.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-rose-500 dark:hover:text-rose-450 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="섹션 삭제">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        }

        const headerHTML = `
          <div class="flex justify-between items-center mb-3 pb-2 border-b-2 border-slate-900/5 dark:border-white/5 flex-shrink-0">
            <h3 class="text-xs font-black text-slate-800 dark:text-slate-200 truncate pr-2 max-w-[200px]" title="${escapeHTML(sec.name)}">
              ${escapeHTML(sec.name)}
            </h3>
            ${adminHeaderControls}
          </div>
        `;

        // Section add card button
        const addCardBtnHTML = `
          <button onclick="openCardModalForSection('${sec.id}')" class="w-full py-2.5 mb-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-clay-purple hover:bg-white/50 dark:hover:bg-black/20 rounded-2xl text-[10px] font-black text-slate-400 hover:text-clay-purple transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer flex-shrink-0">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>카드 추가</span>
          </button>
        `;

        const cardsContainer = document.createElement('div');
        cardsContainer.className = "space-y-4 overflow-y-auto pr-1 flex-grow custom-scrollbar";

        if (secCards.length === 0) {
          cardsContainer.innerHTML = `
            <div class="py-12 text-center border-2 border-dashed border-slate-900/5 dark:border-white/5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
              <i data-lucide="sticky-note" class="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2"></i>
              <p class="text-[9px] font-bold text-slate-400 dark:text-slate-500">카드가 비어 있습니다.</p>
            </div>
          `;
        } else {
          secCards.forEach(card => {
            const cardScore = (card.likes || 0) + (card.comments || []).length;
            const isTopPreference = maxScore > 0 && cardScore === maxScore;
            const cardEl = createCardDOM(card, isTopPreference);
            cardsContainer.appendChild(cardEl);
          });
        }

        colDiv.innerHTML = headerHTML + addCardBtnHTML;
        colDiv.appendChild(cardsContainer);
        cardsGrid.appendChild(colDiv);
      });

      // Render "Add Section" Column if Admin
      if (isBoardAdmin()) {
        const addColDiv = document.createElement('div');
        addColDiv.className = "flex-shrink-0 w-80 bg-white/40 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";
        addColDiv.id = "add-section-col-trigger";
        addColDiv.innerHTML = `
          <button onclick="showAddSectionForm()" class="flex flex-col items-center gap-1.5 text-slate-400 hover:text-clay-purple font-black text-xs transition-colors cursor-pointer w-full h-full justify-center">
            <i data-lucide="plus-circle" class="w-8 h-8"></i>
            <span>새 섹션 추가</span>
          </button>
        `;
        cardsGrid.appendChild(addColDiv);
      }

      emptyCardsState.classList.add('hidden');
      cardsGrid.classList.remove('hidden');
      updateIcons();
      return;
    }

    // ---------------- DEFAULT GRID LAYOUT RENDERING ----------------
    if (cards.length === 0) {
      emptyCardsState.classList.remove('hidden');
      cardsGrid.classList.add('hidden');
    } else {
      emptyCardsState.classList.add('hidden');
      cardsGrid.classList.remove('hidden');

      // Add timeline horizontal track if in timeline layout
      if (wall.layout === 'timeline') {
        const lineEl = document.createElement('div');
        lineEl.className = "absolute left-0 top-[56px] h-1 border-t-4 border-dashed border-amber-300 dark:border-amber-950/70 z-0 pointer-events-none";
        setTimeout(() => {
          lineEl.style.width = Math.max(cardsGrid.scrollWidth, window.innerWidth * 2) + 'px';
        }, 50);
        cardsGrid.appendChild(lineEl);
      }

      cards.forEach(card => {
        const cardScore = (card.likes || 0) + (card.comments || []).length;
        const isTopPreference = maxScore > 0 && cardScore === maxScore;
        const cardEl = createCardDOM(card, isTopPreference);
        
        // Add timeline bullet dot if in timeline layout
        if (wall.layout === 'timeline') {
          cardEl.classList.add('w-80', 'flex-shrink-0');
          const dot = document.createElement('div');
          dot.className = "absolute left-1/2 -translate-x-1/2 -top-[20px] w-6 h-6 rounded-full bg-amber-400 dark:bg-amber-600 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center text-white z-10 flex-shrink-0";
          dot.innerHTML = `<i data-lucide="clock" class="w-2.5 h-2.5"></i>`;
          cardEl.appendChild(dot);
        }

        cardsGrid.appendChild(cardEl);
      });
    }

    updateIcons();
  }

  // Helper: Extract YouTube video ID
  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = String(url || '').match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Create individual card elements
  function createCardDOM(card, isTopPreference) {
    const cardDiv = document.createElement('div');
    const isNotice = !!card.isNotice;
    let extraClasses = isTopPreference 
      ? ' !border-rose-400 dark:!border-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.45)] ring-4 ring-rose-400/30 scale-[1.01]' 
      : '';
    if (isNotice) {
      extraClasses += ' !border-slate-800 dark:!border-slate-200 border-4 shadow-lg scale-[1.01]';
    }
    cardDiv.className = `clay-card border-4 rounded-3xl p-5 shadow-clay-flat transition-all flex flex-col justify-between text-left cursor-pointer relative ${card.bgColor || 'bg-pastel-pink'}${extraClasses}`;

    cardDiv.addEventListener('click', (e) => {
      // If clicking inside a button, input, textarea, or a child of these, do not trigger detail view
      if (e.target.closest('button, input, textarea, a, iframe')) {
        return;
      }
      openDetailModal(card);
    });

    // Optional Card Image / YouTube Player Embed
    let imgHTML = '';
    if (card.image) {
      const ytId = getYouTubeId(card.image);
      if (ytId) {
        imgHTML = `
          <div class="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-slate-950/10 mb-3 shadow-sm bg-black">
            <iframe src="https://www.youtube.com/embed/${ytId}" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else {
        imgHTML = `<img src="${escapeHTML(card.image)}" alt="card-img" class="w-full h-32 object-cover rounded-xl border-2 border-slate-950/20 mb-3 shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in" onclick="event.stopPropagation(); openLightbox('${card.image}')" onerror="this.remove()">`;
      }
    }

    // Comments list mapping
    const commentsList = (card.comments || []).map(comment => `
      <div class="bg-black/5 dark:bg-white/5 border border-slate-950/10 dark:border-white/10 rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm flex justify-between items-start gap-2">
        <div class="flex-grow">
          <div class="flex justify-between items-center font-black mb-1 opacity-70">
            <span>${escapeHTML(comment.author)}</span>
            <span class="text-[9px] font-medium">${formatDate(comment.createdAt)}</span>
          </div>
          <p class="font-bold whitespace-pre-wrap break-words">${escapeHTML(comment.text)}</p>
        </div>
        <!-- Comment Like button -->
        <button onclick="likeComment(event, '${card.id}', '${comment.id}')" class="px-1.5 py-0.5 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-[9px] font-black border border-slate-950/10 dark:border-white/10 flex items-center gap-0.5 cursor-pointer flex-shrink-0">
          <i data-lucide="heart" class="w-2.5 h-2.5 text-rose-500 fill-rose-500"></i>
          <span>${comment.likes || 0}</span>
        </button>
      </div>
    `).join('');

    let previewHTML = '';
    if (card.previewUrl) {
      const previewImgEl = card.previewImage 
        ? `<div class="w-12 h-12 rounded-lg bg-cover bg-center flex-shrink-0 border border-slate-900/10 dark:border-white/10" style="background-image: url('${escapeHTML(card.previewImage)}')"></div>`
        : '';
      previewHTML = `
        <a href="${escapeHTML(card.previewUrl)}" target="_blank" rel="noopener noreferrer" class="mt-3 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl p-2.5 bg-white/40 dark:bg-black/25 flex gap-2.5 items-center hover:bg-white/60 dark:hover:bg-black/40 transition-colors duration-150 min-w-0" onclick="event.stopPropagation()">
          ${previewImgEl}
          <div class="min-w-0 flex-grow">
            <h4 class="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate">${escapeHTML(card.previewTitle || '링크 바로가기')}</h4>
            <p class="text-[9px] text-slate-500 dark:text-slate-400 truncate mt-0.5">${escapeHTML(card.previewDesc || card.previewUrl)}</p>
          </div>
          <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"></i>
        </a>
      `;
    }

    let crownHTML = '';
    if (isTopPreference) {
      crownHTML = `
        <div class="absolute -top-4 -right-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-rose-500 dark:border-rose-400 px-3 py-1.5 rounded-full text-xs font-title font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-bounce z-10 select-none">
          <span class="text-rose-500">❤️</span> 공감 1위
        </div>
      `;
    }

    const likedCards = JSON.parse(localStorage.getItem(`liked_cards_${boardId}`) || '[]');
    const hasLiked = likedCards.includes(card.id);
    const heartIconFill = hasLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-800 dark:text-slate-100';
    const heartBgClass = hasLiked ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/35';

    cardDiv.innerHTML = `
      ${crownHTML}
      <div>
        ${isNotice ? `
        <div class="inline-flex items-center gap-1 bg-amber-500 text-white font-black text-[9px] px-2.5 py-1 rounded-lg w-fit mb-3 shadow-sm select-none uppercase tracking-wider">
          <i data-lucide="pin" class="w-3 h-3 fill-white"></i> 공지사항
        </div>
        ` : ''}
        ${imgHTML}
        <!-- Author / Time -->
        <div class="flex justify-between items-center text-[10px] font-black opacity-60 mb-2">
          <span>👑 ${escapeHTML(card.author)}</span>
          <span>${formatDate(card.createdAt)}</span>
        </div>
        <!-- Card Title -->
        ${card.title ? `<h3 class="text-sm font-black tracking-tight mb-2 break-words">${escapeHTML(card.title)}</h3>` : ''}
        <!-- Card Content -->
        <p class="text-xs font-bold leading-relaxed whitespace-pre-wrap break-words mb-4">${renderContentWithLinks(card.content)}</p>
        ${previewHTML}
      </div>
      
      <!-- Footer actions (Like, Comment Toggle, Delete) -->
      <div class="border-t-2 border-slate-900/10 dark:border-white/15 pt-3.5 mt-2 space-y-3 flex-shrink-0">
        <div class="flex justify-between items-center">
          <div class="flex gap-2">
            <!-- Heart button -->
            <button onclick="likeCard('${card.id}')" class="px-2.5 py-1.5 rounded-lg ${heartBgClass} text-xs font-black border border-slate-950/15 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <i data-lucide="heart" class="w-3.5 h-3.5 ${heartIconFill}"></i>
              <span>${card.likes || 0}</span>
            </button>
            <!-- Comments Toggle button -->
            <button onclick="toggleComments('${card.id}')" class="px-2.5 py-1.5 rounded-lg bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/35 text-xs font-black border border-slate-950/15 flex items-center gap-1 cursor-pointer transition-all">
              <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
              <span>${(card.comments || []).length}</span>
            </button>
          </div>
          <!-- Delete & Pin buttons -->
          <div class="flex items-center gap-1">
            ${isBoardAdmin() ? `
            <button onclick="toggleNoticePin(event, '${card.id}')" class="w-8 h-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-colors" title="${isNotice ? '공지 해제' : '공지 고정'}">
              <i data-lucide="pin" class="w-4 h-4 ${isNotice ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}"></i>
            </button>
            ` : ''}
            <button onclick="deleteCard('${card.id}')" class="w-8 h-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-colors" title="카드 삭제">
              <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
            </button>
          </div>
        </div>

        <!-- Comments Area (Hidden by default) -->
        <div id="comments-container-${card.id}" class="hidden space-y-2 mt-2">
          <div class="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            ${commentsList || '<p class="text-[10px] font-bold text-slate-400/80 text-center py-1">첫 댓글을 작성해 보세요!</p>'}
          </div>
          
          <!-- Add Comment Form -->
          <div class="flex gap-1.5 mt-2">
            <input type="text" id="comment-author-${card.id}" placeholder="이름" class="w-16 bg-white/50 dark:bg-black/20 border border-slate-950/10 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black focus:outline-none placeholder-slate-400">
            <input type="text" id="comment-text-${card.id}" placeholder="댓글 입력..." class="w-full bg-white/50 dark:bg-black/20 border border-slate-950/10 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-bold focus:outline-none placeholder-slate-400">
            <button onclick="submitComment('${card.id}')" class="px-2 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-black hover:opacity-85 cursor-pointer">등록</button>
          </div>
        </div>
      </div>
    `;

    return cardDiv;
  }

  // --- INTERACTION HELPER API CALLS ---

  // Liking a card
  window.likeCard = async (cardId) => {
    let likedCards = JSON.parse(localStorage.getItem(`liked_cards_${boardId}`) || '[]');
    if (likedCards.includes(cardId)) {
      alert('이미 이 카드에 좋아요를 누르셨습니다!');
      return;
    }

    try {
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('좋아요 실패');
      
      likedCards.push(cardId);
      localStorage.setItem(`liked_cards_${boardId}`, JSON.stringify(likedCards));

      // Immediate local refresh
      const wallRes = await fetch(`/api/wall/${boardId}`);
      const updatedWall = await wallRes.json();
      renderBoard(updatedWall);
      
      // Update open detail modal if active
      const detailModal = document.getElementById('card-detail-modal');
      if (detailModal && !detailModal.classList.contains('hidden')) {
        const updatedCard = updatedWall.cards[cardId];
        if (updatedCard) {
          openDetailModal(updatedCard);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle comments collapsing
  window.toggleComments = (cardId) => {
    const container = document.getElementById(`comments-container-${cardId}`);
    if (container) {
      container.classList.toggle('hidden');
    }
  };

  // Submitting a comment
  window.submitComment = async (cardId) => {
    const authorInput = document.getElementById(`comment-author-${cardId}`);
    const textInput = document.getElementById(`comment-text-${cardId}`);
    
    const author = authorInput.value.trim() || '익명';
    const text = textInput.value.trim();

    if (!text) return;

    if (containsProfanity(author) || containsProfanity(text)) {
      alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
      return;
    }

    try {
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text })
      });
      if (!res.ok) throw new Error('댓글 작성 실패');
      
      // Reset inputs
      authorInput.value = '';
      textInput.value = '';
      // Immediate local refresh
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  // Liking a comment
  window.likeComment = async (event, cardId, commentId, isDetailModal) => {
    if (event) event.stopPropagation(); // Prevent card body click when liking a comment
    try {
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/comments/${commentId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('댓글 좋아요 실패');
      
      const wRes = await fetch(`/api/wall/${boardId}`);
      const updatedWall = await wRes.json();
      renderBoard(updatedWall);
      if (isDetailModal) {
        const updatedCard = updatedWall.cards[cardId];
        if (updatedCard) {
          openDetailModal(updatedCard);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Deleting a card
  window.deleteCard = async (cardId) => {
    if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('카드 삭제 실패');
      // Immediate local refresh
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- FLOATING ACTIONS / MODAL HANDLERS ---
  if (btnFloatingAdd) {
    btnFloatingAdd.onclick = () => {
      cardModal.classList.remove('hidden');
      setTimeout(() => {
        cardModalContent.classList.remove('scale-95', 'opacity-0');
        cardModalContent.classList.add('scale-100', 'opacity-100');
      }, 50);
    };
  }

  // Image Preview DOM Elements
  const modalImgPreviewContainer = document.getElementById('modal-image-preview-container');
  const modalImgPreview = document.getElementById('modal-image-preview');
  const btnRemovePreviewImg = document.getElementById('btn-remove-preview-img');
  const cardImageUrlInput = document.getElementById('card-image-url');

  // URL Link Preview Elements & State
  let activePreview = null;
  let lastScrapedUrl = '';
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const cardContent = document.getElementById('card-content');
  const linkPreviewBox = document.getElementById('link-preview-box');
  const linkPreviewImg = document.getElementById('link-preview-img');
  const linkPreviewImageContainer = document.getElementById('link-preview-image-container');
  const linkPreviewTitle = document.getElementById('link-preview-title');
  const linkPreviewDesc = document.getElementById('link-preview-desc');
  const linkPreviewUrl = document.getElementById('link-preview-url');
  const btnRemoveLinkPreview = document.getElementById('btn-remove-link-preview');

  if (cardContent) {
    const checkUrlAndScrape = async () => {
      const text = cardContent.value;
      const match = text.match(urlRegex);
      if (match) {
        const url = match[0];
        if (url === lastScrapedUrl) return;
        lastScrapedUrl = url;

        try {
          const res = await fetch(`/api/scrape-metadata?url=${encodeURIComponent(url)}`);
          if (res.ok) {
            const data = await res.json();
            activePreview = {
              previewUrl: data.url || url,
              previewTitle: data.title || '',
              previewDesc: data.description || '',
              previewImage: data.image || ''
            };

            // Render preview in modal
            if (linkPreviewTitle) linkPreviewTitle.textContent = activePreview.previewTitle || '링크 연결됨';
            if (linkPreviewDesc) linkPreviewDesc.textContent = activePreview.previewDesc || activePreview.previewUrl;
            if (linkPreviewUrl) linkPreviewUrl.textContent = activePreview.previewUrl;

            if (activePreview.previewImage && linkPreviewImg && linkPreviewImageContainer) {
              linkPreviewImg.src = activePreview.previewImage;
              linkPreviewImageContainer.classList.remove('hidden');
            } else if (linkPreviewImageContainer) {
              linkPreviewImageContainer.classList.add('hidden');
            }

            if (linkPreviewBox) {
              linkPreviewBox.classList.remove('hidden');
            }
          }
        } catch (err) {
          console.error('Error scraping url metadata:', err);
        }
      }
    };

    cardContent.addEventListener('input', checkUrlAndScrape);
    cardContent.addEventListener('paste', () => setTimeout(checkUrlAndScrape, 50));
  }

  if (btnRemoveLinkPreview) {
    btnRemoveLinkPreview.onclick = () => {
      activePreview = null;
      if (linkPreviewBox) {
        linkPreviewBox.classList.add('hidden');
      }
    };
  }

  if (btnRemovePreviewImg) {
    btnRemovePreviewImg.onclick = () => {
      cardImageUrlInput.value = '';
      modalImgPreview.src = '';
      modalImgPreviewContainer.classList.add('hidden');
    };
  }

  function closeModal() {
    cardModalContent.classList.remove('scale-100', 'opacity-100');
    cardModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      cardModal.classList.add('hidden');
      // Reset image preview when closing modal
      if (modalImgPreviewContainer) {
        modalImgPreviewContainer.classList.add('hidden');
        modalImgPreview.src = '';
      }
      // Reset link preview when closing modal
      activePreview = null;
      lastScrapedUrl = '';
      activeCardSectionId = '';
      if (linkPreviewBox) {
        linkPreviewBox.classList.add('hidden');
      }
    }, 200);
  }

  if (btnCloseModal) {
    btnCloseModal.onclick = closeModal;
  }

  // Close modal on click outside
  cardModal.addEventListener('click', (e) => {
    if (e.target === cardModal) {
      closeModal();
    }
  });

  // Card Detail Modal Functions
  function openDetailModal(card) {
    if (!cardDetailModal) return;
    
    // Set Author and Date
    if (detailAuthorBadge) detailAuthorBadge.textContent = `👑 ${escapeHTML(card.author)}`;
    if (detailDate) detailDate.textContent = formatDate(card.createdAt);
    
    // Set Title
    if (detailTitle) {
      if (card.title) {
        detailTitle.textContent = card.title;
        detailTitle.classList.remove('hidden');
      } else {
        detailTitle.classList.add('hidden');
      }
    }
    
    // Set Content
    if (detailContent) detailContent.textContent = card.content || "";
    
    let detailPreview = document.getElementById('detail-link-preview');
    if (detailPreview) {
      detailPreview.remove();
    }
    if (card.previewUrl && detailContent) {
      detailPreview = document.createElement('div');
      detailPreview.id = 'detail-link-preview';
      const detailPreviewImgHTML = card.previewImage
        ? `<div class="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0 border border-slate-950/10 dark:border-white/10" style="background-image: url('${escapeHTML(card.previewImage)}')"></div>`
        : '';
      detailPreview.className = "mt-4";
      detailPreview.innerHTML = `
        <a href="${escapeHTML(card.previewUrl)}" target="_blank" rel="noopener noreferrer" class="border-2 border-slate-900/10 dark:border-white/10 rounded-2xl p-3.5 bg-slate-50 dark:bg-slate-950/40 flex gap-3.5 items-center hover:bg-slate-100 dark:hover:bg-slate-900/30 transition-colors duration-150 min-w-0" onclick="event.stopPropagation()">
          ${detailPreviewImgHTML}
          <div class="min-w-0 flex-grow">
            <h4 class="text-sm font-black text-slate-800 dark:text-slate-100 truncate">${escapeHTML(card.previewTitle || '링크 바로가기')}</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 break-all line-clamp-2 leading-relaxed">${escapeHTML(card.previewDesc || card.previewUrl)}</p>
            <span class="text-[10px] text-clay-sky truncate block mt-1.5">${escapeHTML(card.previewUrl)}</span>
          </div>
          <i data-lucide="external-link" class="w-5 h-5 text-slate-400 flex-shrink-0"></i>
        </a>
      `;
      detailContent.parentNode.insertBefore(detailPreview, detailContent.nextSibling);
    }
    
    // Set Likes count and action
    const likedCards = JSON.parse(localStorage.getItem(`liked_cards_${boardId}`) || '[]');
    const hasLiked = likedCards.includes(card.id);
    const detailHeartBgClass = hasLiked ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800';

    if (detailLikesCount) detailLikesCount.textContent = card.likes || 0;
    if (detailLikeBtn) {
      detailLikeBtn.className = `px-3 py-2 rounded-xl ${detailHeartBgClass} text-xs font-black border border-slate-950/10 dark:border-white/10 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95`;
      const heartIcon = detailLikeBtn.querySelector('i');
      if (heartIcon) {
        if (hasLiked) {
          heartIcon.classList.add('fill-rose-500', 'text-rose-500', 'animate-pulse');
        } else {
          heartIcon.classList.remove('fill-rose-500', 'text-rose-500', 'animate-pulse');
        }
      }
      
      detailLikeBtn.onclick = () => {
        likeCard(card.id);
      };
    }
    
    // Populate and Render Comments Section inside modal
    if (detailCommentsCount) detailCommentsCount.textContent = (card.comments || []).length;
    if (detailCommentsList) {
      const detailCommentsHTML = (card.comments || []).map(comment => `
        <div class="bg-black/5 dark:bg-white/5 border border-slate-950/10 dark:border-white/10 rounded-xl p-2.5 text-[11px] leading-relaxed shadow-sm flex justify-between items-start gap-2">
          <div class="flex-grow">
            <div class="flex justify-between items-center font-black mb-1 opacity-70">
              <span class="text-clay-purple">👑 ${escapeHTML(comment.author)}</span>
              <span class="text-[9px] font-medium">${formatDate(comment.createdAt)}</span>
            </div>
            <p class="font-bold whitespace-pre-wrap break-words text-slate-700 dark:text-slate-350">${escapeHTML(comment.text)}</p>
          </div>
          <!-- Detail Comment Like button -->
          <button onclick="likeComment(event, '${card.id}', '${comment.id}', true)" class="px-2 py-1 rounded bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-[10px] font-black border border-slate-950/10 dark:border-white/10 flex items-center gap-0.5 cursor-pointer flex-shrink-0">
            <i data-lucide="heart" class="w-3.5 h-3.5 text-rose-500 fill-rose-500"></i>
            <span>${comment.likes || 0}</span>
          </button>
        </div>
      `).join('');
      detailCommentsList.innerHTML = detailCommentsHTML || '<p class="text-[10px] font-bold text-slate-400/80 text-center py-2">첫 토론 의견을 남겨주세요!</p>';
    }

    if (detailCommentSubmitBtn) {
      detailCommentSubmitBtn.onclick = async () => {
        const author = detailCommentAuthor.value.trim() || '익명';
        const text = detailCommentText.value.trim();
        if (!text) return;
        
        if (containsProfanity(author) || containsProfanity(text)) {
          alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
          return;
        }
        
        try {
          const res = await fetch(`/api/wall/${boardId}/cards/${card.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, text })
          });
          if (!res.ok) throw new Error('댓글 작성 실패');
          
          detailCommentText.value = '';
          detailCommentAuthor.value = '';
          
          // Refetch to sync state
          const wRes = await fetch(`/api/wall/${boardId}`);
          const updatedWall = await wRes.json();
          renderBoard(updatedWall);
          const updatedCard = updatedWall.cards[card.id];
          if (updatedCard) {
            openDetailModal(updatedCard);
          }
        } catch (err) {
          alert(err.message);
        }
      };
    }
    
    // Render Image or Video Player
    if (detailImageContainer) {
      detailImageContainer.innerHTML = '';
      if (card.image) {
        detailImageContainer.classList.remove('hidden');
        const ytId = getYouTubeId(card.image);
        if (ytId) {
          detailImageContainer.innerHTML = `
            <div class="relative w-full aspect-video bg-black">
              <iframe src="https://www.youtube.com/embed/${ytId}" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
          `;
        } else {
          detailImageContainer.innerHTML = `
            <img src="${escapeHTML(card.image)}" alt="card-img" class="w-full max-h-[450px] object-contain mx-auto cursor-zoom-in" onclick="openLightbox('${card.image}')" onerror="this.remove(); document.getElementById('detail-image-container').classList.add('hidden')">
          `;
        }
      } else {
        detailImageContainer.classList.add('hidden');
      }
    }
    
    // Open Modal
    cardDetailModal.classList.remove('hidden');
    setTimeout(() => {
      if (cardDetailModalContent) {
        cardDetailModalContent.classList.remove('scale-95', 'opacity-0');
        cardDetailModalContent.classList.add('scale-100', 'opacity-100');
      }
    }, 50);
  }

  function closeDetailModal() {
    if (!cardDetailModalContent) return;
    cardDetailModalContent.classList.remove('scale-100', 'opacity-100');
    cardDetailModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      if (cardDetailModal) cardDetailModal.classList.add('hidden');
      if (detailImageContainer) detailImageContainer.innerHTML = '';
    }, 200);
  }

  if (btnCloseDetailModal) btnCloseDetailModal.onclick = closeDetailModal;
  if (btnCloseDetailModalBottom) btnCloseDetailModalBottom.onclick = closeDetailModal;
  if (cardDetailModal) {
    cardDetailModal.addEventListener('click', (e) => {
      if (e.target === cardDetailModal) {
        closeDetailModal();
      }
    });
  }

  // Image Lightbox Functions
  function openLightbox(src) {
    if (!imageLightbox || !lightboxImg) return;
    lightboxImg.src = src;
    imageLightbox.classList.remove('hidden');
    setTimeout(() => {
      lightboxImg.classList.remove('scale-95', 'opacity-0');
      lightboxImg.classList.add('scale-100', 'opacity-100');
    }, 50);
  }

  function closeLightbox() {
    if (!lightboxImg) return;
    lightboxImg.classList.remove('scale-100', 'opacity-100');
    lightboxImg.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      if (imageLightbox) imageLightbox.classList.add('hidden');
      lightboxImg.src = '';
    }, 200);
  }

  if (btnCloseLightbox) btnCloseLightbox.onclick = closeLightbox;
  if (imageLightbox) {
    imageLightbox.onclick = (e) => {
      if (e.target !== btnCloseLightbox) {
        closeLightbox();
      }
    };
  }

  // Bind to window for global inline onclick support
  window.openLightbox = openLightbox;

  // Windows Clipboard Paste Event (Ctrl + V)
  window.addEventListener('paste', (e) => {
    if (cardModal.classList.contains('hidden')) return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = function(event) {
          const img = new Image();
          img.onload = function() {
            // Hidden canvas downscale compression (caps at 1200px width/height for high-res crispness, keeps payload optimized)
            const canvas = document.createElement('canvas');
            const maxDim = 1200;
            let w = img.width;
            let h = img.height;
            if (w > h && w > maxDim) {
              h = Math.round(h * (maxDim / w));
              w = maxDim;
            } else if (h > maxDim) {
              w = Math.round(w * (maxDim / h));
              h = maxDim;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

            // Set preview and populate the input field with base64 payload
            modalImgPreview.src = compressedBase64;
            modalImgPreviewContainer.classList.remove('hidden');
            cardImageUrlInput.value = compressedBase64;
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  });

  // Direct Photo Selector Upload Event
  const cardImageFileInput = document.getElementById('card-image-file');
  if (cardImageFileInput) {
    cardImageFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
          // Hidden canvas downscale compression (caps at 1200px, JPEG 0.85 quality for crispness)
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round(h * (maxDim / w));
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round(w * (maxDim / h));
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          // Set preview and populate the input field with base64 payload
          modalImgPreview.src = compressedBase64;
          modalImgPreviewContainer.classList.remove('hidden');
          cardImageUrlInput.value = compressedBase64;
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    };
  }
  if (cardCreationForm) {
    cardCreationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const author = document.getElementById('card-author').value.trim() || '익명';
      const title = document.getElementById('card-title').value.trim();
      const content = document.getElementById('card-content').value.trim();
      const image = document.getElementById('card-image-url').value.trim();
      
      const isNoticeEl = document.getElementById('card-is-notice');
      const isNotice = isNoticeEl ? isNoticeEl.checked : false;
      
      if (containsProfanity(author) || containsProfanity(title) || containsProfanity(content)) {
        alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
        return;
      }
      
      // Read pastel bg selection
      const bgColor = document.querySelector('input[name="color-picker"]:checked').value;

      // Optimistic Close: Close modal instantly so the UX feels 100% immediate
      closeModal();

      const payload = { author, title, content, bgColor, image, isNotice, sectionId: activeCardSectionId };
      if (activePreview) {
        payload.previewUrl = activePreview.previewUrl;
        payload.previewTitle = activePreview.previewTitle;
        payload.previewDesc = activePreview.previewDesc;
        payload.previewImage = activePreview.previewImage;
      }

      // Add auth headers if available
      const headers = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('kfcman_auth_token');
      if (token) {
        headers['X-KFCMan-Auth'] = token;
      }

      try {
        const res = await fetch(`/api/wall/${boardId}/cards`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || '카드 작성에 실패했습니다.');
        }

        // Success - clear form
        cardCreationForm.reset();
        if (isNoticeEl) isNoticeEl.checked = false;
        // Immediate local refresh
        fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
      } catch (err) {
        alert(err.message);
        // Reopen modal to let user try again if request fails
        cardModal.classList.remove('hidden');
        setTimeout(() => {
          cardModalContent.classList.remove('scale-95', 'opacity-0');
          cardModalContent.classList.add('scale-100', 'opacity-100');
        }, 50);
      }
    });
  }

  // Pin/Unpin notice toggle action (Admin only)
  window.toggleNoticePin = async (event, cardId) => {
    if (event) event.stopPropagation(); // Prevent opening detail modal
    try {
      const headers = {};
      const token = localStorage.getItem('kfcman_auth_token');
      if (token) {
        headers['X-KFCMan-Auth'] = token;
      }
      
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/toggle-notice`, {
        method: 'POST',
        headers: headers
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '공지 고정 상태 변경 실패');
      }
      
      // Immediate local refresh
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  // Section column-specific card modal opening
  window.openCardModalForSection = (sectionId) => {
    activeCardSectionId = sectionId;
    cardModal.classList.remove('hidden');
    setTimeout(() => {
      cardModalContent.classList.remove('scale-95', 'opacity-0');
      cardModalContent.classList.add('scale-100', 'opacity-100');
    }, 50);
  };

  // Column Section CRUD Handlers (Admin Only)
  window.showAddSectionForm = () => {
    const trigger = document.getElementById('add-section-col-trigger');
    if (!trigger) return;
    trigger.className = "flex-shrink-0 w-80 bg-slate-50 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col shadow-sm h-32 justify-between transition-all";
    trigger.innerHTML = `
      <div class="space-y-1.5 flex-grow">
        <label class="text-[10px] font-black text-slate-500 dark:text-slate-400">섹션 제목</label>
        <input type="text" id="new-section-name-input" placeholder="예: 1조 모둠방" class="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none placeholder-slate-400">
      </div>
      <div class="flex gap-1.5 mt-2 justify-end">
        <button onclick="cancelAddSection()" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-lg text-[9px] font-black cursor-pointer">취소</button>
        <button onclick="submitAddSection()" class="px-2.5 py-1.5 bg-clay-purple hover:bg-violet-600 text-white rounded-lg text-[9px] font-black cursor-pointer shadow-sm">추가</button>
      </div>
    `;
    document.getElementById('new-section-name-input').focus();
    updateIcons();
  };

  window.cancelAddSection = () => {
    const trigger = document.getElementById('add-section-col-trigger');
    if (!trigger) return;
    trigger.className = "flex-shrink-0 w-80 bg-white/40 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";
    trigger.innerHTML = `
      <button onclick="showAddSectionForm()" class="flex flex-col items-center gap-1.5 text-slate-400 hover:text-clay-purple font-black text-xs transition-colors cursor-pointer w-full h-full justify-center">
        <i data-lucide="plus-circle" class="w-8 h-8"></i>
        <span>새 섹션 추가</span>
      </button>
    `;
    updateIcons();
  };

  window.submitAddSection = async () => {
    const input = document.getElementById('new-section-name-input');
    const name = input ? input.value.trim() : '';
    if (!name) return;

    if (containsProfanity(name)) {
      alert('부적절한 표현(욕설, 비하 등)이 감지되어 섹션을 생성할 수 없습니다. 🌸');
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('kfcman_auth_token');
    if (token) {
      headers['X-KFCMan-Auth'] = token;
    }

    try {
      const res = await fetch(`/api/wall/${boardId}/sections`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ name })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '섹션 추가 실패');
      }
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  window.renameSection = async (event, sectionId, oldName) => {
    if (event) event.stopPropagation();
    const newName = prompt('수정할 섹션 이름을 입력해 주세요:', oldName);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    if (containsProfanity(trimmed)) {
      alert('부적절한 표현(욕설 등)이 감지되었습니다. 🌸');
      return;
    }

    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('kfcman_auth_token');
    if (token) {
      headers['X-KFCMan-Auth'] = token;
    }

    try {
      const res = await fetch(`/api/wall/${boardId}/sections/${sectionId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ name: trimmed })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '섹션 수정 실패');
      }
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  window.deleteSection = async (event, sectionId) => {
    if (event) event.stopPropagation();
    if (!confirm('⚠️ 경고: 이 섹션을 완전히 삭제하시겠습니까?\n섹션이 삭제되면 해당 열 안에 속해 있는 모든 포스트잇 카드도 함께 영구 삭제됩니다. 이 작업은 복구할 수 없습니다.')) {
      return;
    }

    const headers = {};
    const token = localStorage.getItem('kfcman_auth_token');
    if (token) {
      headers['X-KFCMan-Auth'] = token;
    }

    try {
      const res = await fetch(`/api/wall/${boardId}/sections/${sectionId}`, {
        method: 'DELETE',
        headers: headers
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '섹션 삭제 실패');
      }
      fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
    } catch (err) {
      alert(err.message);
    }
  };

  // --- NUMBER MEMBER LOGIN MODULE ---
  window.toggleNumberLogin = () => {
    const currentNumber = localStorage.getItem('kfcman_wall_member_number');
    if (currentNumber) {
      if (confirm('현재 번호 회원 로그아웃 하시겠습니까?')) {
        localStorage.removeItem('kfcman_wall_member_number');
        updateNumberLoginUI();
      }
    } else {
      const num = prompt('회원 로그인용 번호(예: 학급 번호 1~30)를 입력해 주세요:');
      if (num === null) return;
      const trimmed = num.trim();
      if (!trimmed) return;
      if (isNaN(trimmed)) {
        alert('숫자 번호만 입력하실 수 있습니다.');
        return;
      }
      localStorage.setItem('kfcman_wall_member_number', trimmed);
      updateNumberLoginUI();
      alert(`${trimmed}번 회원으로 성공적으로 로그인되었습니다! 🎉\n글 작성 시 이름이 '${trimmed}번 회원'으로 고정됩니다.`);
    }
  };

  window.updateNumberLoginUI = () => {
    const btn = document.getElementById('btn-number-login');
    const textEl = document.getElementById('number-login-text');
    const authorInput = document.getElementById('card-author');
    
    if (!btn || !textEl) return;
    
    const currentNumber = localStorage.getItem('kfcman_wall_member_number');
    if (currentNumber) {
      // Logged In
      textEl.textContent = `${currentNumber}번 회원 (로그아웃)`;
      btn.className = "btn px-4 py-3 text-xs font-black border-2 border-rose-200 dark:border-rose-950 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-clay-flat hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer";
      
      // Auto-populate and disable author field
      if (authorInput) {
        authorInput.value = `${currentNumber}번 회원`;
        authorInput.readOnly = true;
        authorInput.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
      }
    } else {
      // Logged Out
      textEl.textContent = "번호 회원 로그인";
      btn.className = "btn px-4 py-3 text-xs font-black border-2 border-amber-200 dark:border-slate-700 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 shadow-clay-flat hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer";
      
      if (authorInput) {
        authorInput.value = "";
        authorInput.readOnly = false;
        authorInput.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
      }
    }
  };

  // --- UTILITY HELPER FUNCTIONS ---
  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderContentWithLinks(str) {
    if (!str) return '';
    const escaped = escapeHTML(str);
    const regex = /(https?:\/\/[^\s<]+)/g;
    return escaped.replace(regex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 dark:text-sky-400 dark:hover:text-sky-300 underline font-black" onclick="event.stopPropagation()">$1</a>');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

// Robust, race-condition-free initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWall);
} else {
  initWall();
}
