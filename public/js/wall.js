function initWall() {
  // Generate client UUID for slot mapping
  let clientUuid = localStorage.getItem('kfcman_wall_client_uuid');
  if (!clientUuid) {
    clientUuid = 'uuid-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    localStorage.setItem('kfcman_wall_client_uuid', clientUuid);
  }

  // 1. Core State and Route Parsing
  const pathSegments = window.location.pathname.split('/');
  let boardId = '';
  if (window.location.pathname === '/chat') {
    boardId = 'TALK';
    // Dynamically adjust sidebar active styling for chat menu route
    setTimeout(() => {
      const chatSide = document.getElementById('nav-item-chat-side');
      const wallSide = document.getElementById('nav-item-wall-side');
      if (chatSide) chatSide.classList.add('active');
      if (wallSide) wallSide.classList.remove('active');
    }, 50);
  } else if (pathSegments.length > 2 && pathSegments[1] === 'wall') {
    try {
      boardId = decodeURIComponent(pathSegments[2]).trim().toUpperCase();
    } catch (e) {
      boardId = pathSegments[2].trim().toUpperCase();
    }
  }

  let currentUser = null;
  let currentWall = null;
  let activeCardSectionId = '';
  window.editingCardId = null;
  let activeChatRoomCardId = null;

  function isBoardAdmin() {
    if (!currentUser || !currentWall) return false;
    const cleanUser = currentUser.username.toLowerCase();
    const boardCreator = (currentWall.creator || '').toLowerCase();
    return boardCreator === cleanUser || cleanUser === 'kfcman' || cleanUser === 'admin';
  }

  function getMyJoinedMember(wall) {
    if (!wall || !wall.members) return null;
    for (const number in wall.members) {
      if (wall.members[number].clientUuid === clientUuid) {
        return { number: parseInt(number), ...wall.members[number] };
      }
    }
    return null;
  }

  function updateSidebarProfile(username, role) {
    const sidebarProfileGroup = document.getElementById('sidebar-profile-group');
    const sidebarGuestGroup = document.getElementById('sidebar-guest-group');
    const sidebarProfileName = document.getElementById('sidebar-profile-name');
    const sidebarProfileCircle = document.getElementById('sidebar-profile-circle');
    
    if (username) {
      if (sidebarProfileGroup) sidebarProfileGroup.classList.remove('hidden');
      if (sidebarGuestGroup) sidebarGuestGroup.classList.add('hidden');
      if (sidebarProfileName) {
        sidebarProfileName.textContent = username;
      }
      if (sidebarProfileCircle) {
        sidebarProfileCircle.textContent = username.substring(0, 1).toUpperCase();
      }
    } else {
      if (sidebarProfileGroup) sidebarProfileGroup.classList.add('hidden');
      if (sidebarGuestGroup) sidebarGuestGroup.classList.remove('hidden');
    }
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

        // Check if user is VIP or admin
        const userRole = data.role || 'user';
        const isVipOrAbove = userRole === 'admin' || userRole === 'manager' || userRole === 'vip';
        if (!isVipOrAbove) {
          const isChat = window.location.pathname.includes('/chat');
          window.location.href = isChat ? '/?blocked=chat' : '/?blocked=wall';
          return;
        }

        if (currentWall) {
          renderBoard(currentWall);
        }
        updateSidebarProfile(data.username, data.role);
        
        const isUserAdmin = (data.role === 'admin');
        const navItemDocsSide = document.getElementById('nav-item-docs-side');
        const navItemTetrisSide = document.getElementById('nav-item-tetris-side');
        const navItemClassroomSide = document.getElementById('nav-item-classroom-side');
        if (navItemDocsSide) navItemDocsSide.style.display = isUserAdmin ? 'flex' : 'none';
        if (navItemTetrisSide) navItemTetrisSide.style.display = isUserAdmin ? 'flex' : 'none';
        if (navItemClassroomSide) navItemClassroomSide.style.display = isUserAdmin ? 'flex' : 'none';

        const navItemWallSide = document.getElementById('nav-item-wall-side');
        const navItemChatSide = document.getElementById('nav-item-chat-side');
        if (navItemWallSide) navItemWallSide.style.display = 'flex';
        if (navItemChatSide) navItemChatSide.style.display = 'flex';
      } else {
        const isChat = window.location.pathname.includes('/chat');
        window.location.href = isChat ? '/?blocked=chat' : '/?blocked=wall';
      }
    })
    .catch(err => {
      console.error('Failed to load user context:', err);
      const isChat = window.location.pathname.includes('/chat');
      window.location.href = isChat ? '/?blocked=chat' : '/?blocked=wall';
    });
  } else {
    const isChat = window.location.pathname.includes('/chat');
    window.location.href = isChat ? '/?blocked=chat' : '/?blocked=wall';
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
  // 세션 단위로 비밀번호 저장 (비공개 게시판 접근 시)
  let walletStoredPassword = sessionStorage.getItem('wall_pw_' + boardId) || '';

  function showLockScreen(errorType, title, desc) {
    const lockScreen = document.getElementById('wall-lock-screen');
    const lockTitle = document.getElementById('lock-screen-title');
    const lockDesc = document.getElementById('lock-screen-desc');
    const lockPasswordForm = document.getElementById('lock-password-form');
    const lockPrivateOnly = document.getElementById('lock-private-only');
    if (!lockScreen) return;

    landingScreen.classList.add('hidden');
    boardScreen.classList.add('hidden');
    btnFloatingAdd.classList.add('hidden');
    lockScreen.classList.remove('hidden');

    if (lockTitle) lockTitle.textContent = title || '비공개 게시판';
    if (lockDesc) lockDesc.textContent = desc || '';

    if (errorType === 'PASSWORD_REQUIRED') {
      if (lockPasswordForm) lockPasswordForm.classList.remove('hidden');
      if (lockPrivateOnly) lockPrivateOnly.classList.add('hidden');
    } else {
      if (lockPasswordForm) lockPasswordForm.classList.add('hidden');
      if (lockPrivateOnly) lockPrivateOnly.classList.remove('hidden');
    }
    updateIcons();
  }

  function loadBoard(password) {
    const token = localStorage.getItem('kfcman_auth_token');
    const headers = {};
    if (token) headers['X-KFCMan-Auth'] = token;
    if (password) headers['X-Wall-Password'] = password;

    fetch('/api/wall/' + boardId, { headers })
      .then(function(res) {
        if (res.status === 403) {
          return res.json().then(function(data) {
            showLockScreen(data.error, data.title, data.description);
            throw new Error('locked');
          });
        }
        if (!res.ok) {
          throw new Error('존재하지 않는 게시판 고유 코드입니다. 로비로 이동합니다.');
        }
        return res.json();
      })
      .then(function(wall) {
        if (!wall) return;
        const lockScreen = document.getElementById('wall-lock-screen');
        if (lockScreen) lockScreen.classList.add('hidden');
        landingScreen.classList.add('hidden');
        boardScreen.classList.remove('hidden');
        btnFloatingAdd.classList.remove('hidden');

        if (password) sessionStorage.setItem('wall_pw_' + boardId, password);
        walletStoredPassword = password || '';

        saveBoardToHistory(wall);
        renderBoard(wall);
        connectToStream(boardId);
      })
      .catch(function(err) {
        if (err.message === 'locked') return;
        alert(err.message);
        window.location.href = '/wall';
      });
  }

  // 비밀번호 잠금 화면 제출 버튼
  const btnLockSubmit = document.getElementById('btn-lock-submit');
  const lockPasswordInput = document.getElementById('lock-password-input');
  const lockPasswordError = document.getElementById('lock-password-error');
  if (btnLockSubmit && lockPasswordInput) {
    btnLockSubmit.addEventListener('click', function() {
      const pw = lockPasswordInput.value.trim();
      if (!pw) return;
      if (lockPasswordError) lockPasswordError.classList.add('hidden');

      const token = localStorage.getItem('kfcman_auth_token');
      const hdrs = { 'X-Wall-Password': pw };
      if (token) hdrs['X-KFCMan-Auth'] = token;

      fetch('/api/wall/' + boardId, { headers: hdrs })
        .then(function(res) {
          if (res.status === 403) {
            if (lockPasswordError) lockPasswordError.classList.remove('hidden');
            lockPasswordInput.value = '';
            return null;
          }
          if (!res.ok) throw new Error('오류가 발생했습니다.');
          return res.json();
        })
        .then(function(wall) {
          if (!wall) return;
          sessionStorage.setItem('wall_pw_' + boardId, pw);
          walletStoredPassword = pw;
          const lockScreen = document.getElementById('wall-lock-screen');
          if (lockScreen) lockScreen.classList.add('hidden');
          landingScreen.classList.add('hidden');
          boardScreen.classList.remove('hidden');
          btnFloatingAdd.classList.remove('hidden');
          saveBoardToHistory(wall);
          renderBoard(wall);
          connectToStream(boardId);
          updateIcons();
        })
        .catch(function(err) { alert(err.message); });
    });
    lockPasswordInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') btnLockSubmit.click();
    });
  }

  // 공개/비공개 전환 버튼 (관리자/개설자 전용, renderBoard에서 show)
  const btnTogglePrivacy = document.getElementById('btn-toggle-privacy');
  if (btnTogglePrivacy) {
    btnTogglePrivacy.addEventListener('click', async function() {
      if (!currentWall) return;
      const isCurrentlyPrivate = !!currentWall.isPrivate;
      const newIsPrivate = !isCurrentlyPrivate;

      let newPassword = '';
      if (newIsPrivate) {
        const pw = prompt('비밀번호를 설정하세요.\n(비워두면 개설자만 접근 가능)', currentWall.password || '');
        if (pw === null) return;
        newPassword = pw;
      }

      const token = localStorage.getItem('kfcman_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-KFCMan-Auth'] = token;
      if (walletStoredPassword) headers['X-Wall-Password'] = walletStoredPassword;

      try {
        const res = await fetch('/api/wall/' + boardId + '/privacy', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isPrivate: newIsPrivate, password: newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '설정 변경 실패');
        const msg = newIsPrivate
          ? (newPassword ? '\uD83D\uDD12 비공개(비밀번호: ' + newPassword + ')로 변경되었습니다.' : '\uD83D\uDD12 비공개(개설자 전용)로 변경되었습니다.')
          : '\uD83C\uDF10 공개 게시판으로 변경되었습니다.';
        alert(msg);
      } catch(err) {
        alert(err.message);
      }
    });
  }

  if (boardId) {
    loadBoard(walletStoredPassword);
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
      landingScreen.className = "max-w-3xl mx-auto space-y-6 mt-12";
      return;
    }

    container.classList.remove('hidden');
    landingScreen.className = "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-12 space-y-0";

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
      const topicEl = document.getElementById('wall-topic-input');
      const topic = topicEl ? topicEl.value.trim() : '';
      const description = document.getElementById('wall-desc-input').value.trim();
      const maxUsersInput = document.getElementById('wall-max-users-input');
      const maxUsers = maxUsersInput ? parseInt(maxUsersInput.value) || 0 : 0;
      const layoutEl = document.querySelector('input[name="wall-layout-picker"]:checked');
      const layout = layoutEl ? layoutEl.value : 'grid';
      const privacyEl = document.querySelector('input[name="wall-privacy-picker"]:checked');
      const isPrivate = privacyEl ? privacyEl.value === 'private' : false;
      const passwordInput = document.getElementById('wall-password-input');
      const password = (isPrivate && passwordInput) ? passwordInput.value.trim() : '';

      const token = localStorage.getItem('kfcman_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['X-KFCMan-Auth'] = token;
      }

      try {
        const res = await fetch('/api/wall', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ title, topic, description, maxUsers, layout, isPrivate, password })
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
    
    // Check if slot selection is required
    const myJoined = getMyJoinedMember(wall);
    const needSlotSelect = wall.maxUsers > 0 && !isBoardAdmin() && !myJoined;

    const numberSelectScreen = document.getElementById('number-select-screen');
    if (needSlotSelect) {
      // Hide board screen, show number select screen
      boardScreen.classList.add('hidden');
      btnFloatingAdd.classList.add('hidden');
      if (numberSelectScreen) {
        numberSelectScreen.classList.remove('hidden');
        renderNumberSelectGrid(wall);
      }
      return; // Block card rendering
    } else {
      // Show board screen, hide number select screen
      boardScreen.classList.remove('hidden');
      if (numberSelectScreen) {
        numberSelectScreen.classList.add('hidden');
      }
    }
    
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

    // Privacy badge + toggle button (관리자/개설자만 표시)
    const btnTogglePrivacyBadge = document.getElementById('btn-toggle-privacy');
    const privacyBadgeIcon = document.getElementById('privacy-badge-icon');
    const privacyBadgeText = document.getElementById('privacy-badge-text');
    if (btnTogglePrivacyBadge) {
      const amAdmin = isBoardAdmin();
      if (amAdmin) {
        btnTogglePrivacyBadge.classList.remove('hidden');
        if (wall.isPrivate) {
          btnTogglePrivacyBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-black transition-all cursor-pointer hover:scale-105';
          if (privacyBadgeIcon) privacyBadgeIcon.setAttribute('data-lucide', wall.password ? 'lock' : 'eye-off');
          if (privacyBadgeText) privacyBadgeText.textContent = wall.password ? '비공개 (비밀번호)' : '비공개 (개설자 전용)';
        } else {
          btnTogglePrivacyBadge.className = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-black transition-all cursor-pointer hover:scale-105';
          if (privacyBadgeIcon) privacyBadgeIcon.setAttribute('data-lucide', 'globe');
          if (privacyBadgeText) privacyBadgeText.textContent = '공개';
        }
        if (window.lucide) window.lucide.createIcons();
      } else {
        btnTogglePrivacyBadge.classList.add('hidden');
      }
    }
    const boardTopicEl = document.getElementById('board-topic');
    const btnEditBoardTopic = document.getElementById('btn-edit-board-topic');
    if (boardTopicEl) {
      boardTopicEl.textContent = wall.topic || (isBoardAdmin() ? '전체 주제 없음 (클릭하여 설정)' : '');
      if (wall.topic || isBoardAdmin()) {
        boardTopicEl.classList.remove('hidden');
      } else {
        boardTopicEl.classList.add('hidden');
      }
    }
    if (btnEditBoardTopic) {
      if (isBoardAdmin()) {
        btnEditBoardTopic.classList.remove('hidden');
        const triggerEdit = async () => {
          const newTopic = prompt('이 게시판의 전체 주제를 입력해주세요:', wall.topic || '');
          if (newTopic === null) return;
          
          const token = localStorage.getItem('kfcman_auth_token');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['X-KFCMan-Auth'] = token;
          
          try {
            const res = await fetch(`/api/wall/${wall.id}/topic`, {
              method: 'PUT',
              headers,
              body: JSON.stringify({ topic: newTopic })
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || '주제 수정 실패');
            }
          } catch (err) {
            alert(err.message);
          }
        };
        btnEditBoardTopic.onclick = triggerEdit;
        if (boardTopicEl) {
          boardTopicEl.style.cursor = 'pointer';
          boardTopicEl.onclick = triggerEdit;
        }
      } else {
        btnEditBoardTopic.classList.add('hidden');
        if (boardTopicEl) {
          boardTopicEl.style.cursor = 'default';
          boardTopicEl.onclick = null;
        }
      }
    }
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

    // Handle board limit setting (인원 제한 설정)
    const changeMaxUsersBtn = document.getElementById('btn-change-max-users');
    if (changeMaxUsersBtn) {
      if (isBoardAdmin()) {
        changeMaxUsersBtn.classList.remove('hidden');
        changeMaxUsersBtn.onclick = async () => {
          const currentLimit = wall.maxUsers || 0;
          const userInput = prompt(`접속 허용 인원(생성할 번호 버튼 개수)을 설정하세요.\n(0을 입력하면 인원 제한이 해제되어 번호선택 없이 자유롭게 입력할 수 있습니다.)\n현재 설정: ${currentLimit === 0 ? '제한 없음' : currentLimit + '명'}`, currentLimit);
          if (userInput === null) return;
          const count = parseInt(userInput.trim(), 10);
          if (isNaN(count) || count < 0) {
            alert('올바른 숫자(0 이상의 정수)를 입력해 주세요.');
            return;
          }

          const headers = { 'Content-Type': 'application/json' };
          const token = localStorage.getItem('kfcman_auth_token');
          if (token) {
            headers['X-KFCMan-Auth'] = token;
          }

          try {
            const res = await fetch(`/api/wall/${wall.id}/max-users`, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({ maxUsers: count })
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || '설정 변경 실패');
            }
            alert('인원 제한 설정이 성공적으로 변경되었습니다. 🎉');
          } catch (err) {
            alert(err.message);
          }
        };
      } else {
        changeMaxUsersBtn.classList.add('hidden');
      }
    }

    const chatLayoutContainer = document.getElementById('chat-layout-container');

    // Toggle FAB visibility and update cardsGrid wrapper classes based on layout
    if (btnFloatingAdd) {
      if (wall.layout === 'columns' || wall.layout === 'chat') {
        btnFloatingAdd.classList.add('hidden');
      } else {
        btnFloatingAdd.classList.remove('hidden');
      }
    }

    if (wall.layout === 'chat') {
      if (chatLayoutContainer) chatLayoutContainer.classList.remove('hidden');
      cardsGrid.classList.add('hidden');
      emptyCardsState.classList.add('hidden');
      renderChatLayout(wall);
      updateIcons();
      return; // Block traditional card rendering
    } else {
      if (chatLayoutContainer) chatLayoutContainer.classList.add('hidden');
      cardsGrid.classList.remove('hidden');
    }

    if (wall.layout === 'columns') {
      cardsGrid.className = "flex gap-6 overflow-x-auto pb-6 custom-scrollbar items-start w-full min-h-[75vh] px-2";
    } else if (wall.layout === 'rows') {
      cardsGrid.className = "max-w-3xl mx-auto flex flex-col gap-6 w-full";
    } else if (wall.layout === 'timeline') {
      cardsGrid.className = "relative pt-16 pb-8 flex gap-12 overflow-x-auto w-full custom-scrollbar items-start min-h-[55vh] px-10";
    } else {
      cardsGrid.className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 w-full max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar";
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
      const sections = [{ id: 'notice-section', name: '📢 공지사항' }].concat(wall.sections || []);
      
      sections.forEach(sec => {
        const secCards = cards.filter(c => c.sectionId === sec.id);

        const colDiv = document.createElement('div');
        colDiv.className = "flex-shrink-0 w-72 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/20 dark:border-slate-800/80 rounded-3xl p-4 flex flex-col max-h-[80vh] shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-300 hover:bg-white/60 dark:hover:bg-slate-900/60";

        // Admin section edit controls
        let adminHeaderControls = '';
        if (isBoardAdmin() && sec.id !== 'notice-section') {
          adminHeaderControls = `
            <div class="flex items-center gap-0.5">
              <button onclick="renameSection(event, '${sec.id}', '${escapeHTML(sec.name)}')" class="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-850 dark:hover:text-white transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="섹션명 변경">
                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="deleteSection(event, '${sec.id}')" class="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-rose-500 dark:hover:text-rose-450 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="섹션 삭제">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `;
        }

        // Extract slot number from section name to show number and name together
        const match = sec.name.match(/^(\d+)번$/);
        let displayName = sec.name;
        if (match && wall.members) {
          const slotNum = parseInt(match[1], 10);
          const member = wall.members[slotNum];
          if (member) {
            displayName = `${member.emoji} ${sec.name} ${member.name}`;
          }
        }

        // Section write permission
        const isRestrictedBoard = wall.maxUsers > 0;
        const isMySection = myJoined && sec.name === `${myJoined.number}번`;
        const canWrite = sec.id === 'notice-section' ? isBoardAdmin() : (!isRestrictedBoard || isMySection || isBoardAdmin());

        // Make the header title look like a premium badge / header
        let headerTitleHTML = '';
        if (sec.id === 'notice-section') {
          headerTitleHTML = `
            <div class="flex items-center gap-2 min-w-0">
              <span class="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 class="text-xs font-black text-slate-850 dark:text-slate-100 truncate" title="${escapeHTML(displayName)}">
                📌 ${escapeHTML(displayName)}
              </h3>
            </div>
          `;
        } else {
          headerTitleHTML = `
            <div class="flex items-center gap-2 min-w-0">
              <span class="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-clay-purple"></span>
              <h3 class="text-xs font-black text-slate-850 dark:text-slate-100 truncate" title="${escapeHTML(displayName)}">
                ${escapeHTML(displayName)}
              </h3>
            </div>
          `;
        }

        const headerHTML = `
          <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-200/50 dark:border-slate-800/80 flex-shrink-0">
            <div class="flex items-center gap-1.5 min-w-0">
              ${headerTitleHTML}
              <span class="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/85 text-[9px] font-black text-slate-500 dark:text-slate-400 select-none">${secCards.length}</span>
            </div>
            <div class="flex items-center gap-0.5">
              ${canWrite ? `
              <button onclick="openCardModalForSection('${sec.id}')" class="w-7 h-7 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-clay-purple transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800" title="카드 추가">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
              ` : ''}
              ${adminHeaderControls}
            </div>
          </div>
        `;

        // Section add card button or restricted warning
        let addCardBtnHTML = '';
        if (canWrite) {
          addCardBtnHTML = `
            <button onclick="openCardModalForSection('${sec.id}')" class="w-full py-3 mb-4 bg-white/40 dark:bg-slate-900/30 border border-dashed border-slate-350 dark:border-slate-750 hover:border-clay-purple hover:bg-clay-purple/[0.04] rounded-2xl text-[11px] font-black text-slate-500 dark:text-slate-400 hover:text-clay-purple dark:hover:text-clay-purple transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0 shadow-sm hover:scale-[1.01]">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>카드 추가</span>
            </button>
          `;
        } else {
          const lockText = sec.id === 'notice-section' ? '교사(관리자) 작성 전용' : `${escapeHTML(sec.name)} 전용 컬럼`;
          addCardBtnHTML = `
            <div class="w-full py-3 mb-4 bg-slate-150/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5 cursor-not-allowed flex-shrink-0 select-none" title="${escapeHTML(sec.name)} 전용 컬럼입니다.">
              <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-600"></i>
              <span>🔒 ${lockText}</span>
            </div>
          `;
        }

        const cardsContainer = document.createElement('div');
        cardsContainer.className = "space-y-4 overflow-y-auto pr-1 flex-grow custom-scrollbar";

        if (secCards.length === 0) {
          cardsContainer.innerHTML = `
            <div class="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 transition-all duration-300">
              <div class="w-10 h-10 rounded-full bg-slate-100/60 dark:bg-slate-900/60 flex items-center justify-center mx-auto mb-2.5 text-slate-400 dark:text-slate-600">
                <i data-lucide="sticky-note" class="w-5 h-5 text-slate-400/85 dark:text-slate-600"></i>
              </div>
              <p class="text-[11px] font-extrabold text-slate-550 dark:text-slate-400">작성된 카드가 없습니다.</p>
              <p class="text-[9px] font-bold text-slate-400/70 dark:text-slate-500/70 mt-1">새로운 아이디어를 채워보세요!</p>
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
        addColDiv.className = "flex-shrink-0 w-72 bg-white/45 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";
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

  // --- SLOT SELECTION SCREEN RENDERING & REGISTRATION ---
  function renderNumberSelectGrid(wall) {
    const lobbyTitleEl = document.getElementById('lobby-board-title');
    const lobbyTopicEl = document.getElementById('lobby-board-topic');
    if (lobbyTitleEl) {
      lobbyTitleEl.textContent = wall.title;
    }
    if (lobbyTopicEl) {
      lobbyTopicEl.textContent = wall.topic || '';
      if (wall.topic) {
        lobbyTopicEl.classList.remove('hidden');
      } else {
        lobbyTopicEl.classList.add('hidden');
      }
    }

    const grid = document.getElementById('number-buttons-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const maxUsers = wall.maxUsers || 0;
    for (let i = 1; i <= maxUsers; i++) {
      const member = wall.members[i];
      const btn = document.createElement('button');
      
      if (member) {
        // Occupied slot
        btn.className = "flex flex-col items-center justify-center p-2 rounded-2xl border-4 border-slate-200 dark:border-slate-800 bg-slate-150 dark:bg-slate-900 opacity-60 cursor-not-allowed select-none transition-all shadow-sm aspect-square overflow-hidden";
        btn.disabled = true;
        btn.innerHTML = `
          <span class="text-[9px] font-black text-slate-400 dark:text-slate-500">${i}번</span>
          <span class="text-xl my-0.5 select-none">${member.emoji}</span>
          <span class="text-[9px] font-black text-slate-500 dark:text-slate-400 truncate max-w-full" title="${escapeHTML(member.name)}">${escapeHTML(member.name)}</span>
        `;
      } else {
        // Free slot
        btn.className = "flex flex-col items-center justify-center p-2 rounded-2xl border-4 border-violet-200 dark:border-slate-800 bg-white dark:bg-clay-cardDark hover:border-clay-purple hover:scale-105 active:scale-95 cursor-pointer transition-all shadow-clay-flat-sm aspect-square overflow-hidden";
        btn.innerHTML = `
          <span class="text-[9px] font-black text-slate-550 dark:text-slate-400">${i}번</span>
          <span class="text-xl my-0.5 text-slate-350 dark:text-slate-650 select-none">❓</span>
          <span class="text-[8px] font-bold text-slate-400 dark:text-slate-550 truncate max-w-full">선택 가능</span>
        `;
        btn.onclick = () => {
          openRegisterModal(i);
        };
      }
      grid.appendChild(btn);
    }
  }

  let selectedRegisterNumber = null;
  const registerModal = document.getElementById('register-modal');
  const registerModalContent = document.getElementById('register-modal-content');
  const btnCloseRegisterModal = document.getElementById('btn-close-register-modal');
  const registerSlotForm = document.getElementById('register-slot-form');
  const registerNameInput = document.getElementById('register-name-input');
  const registerModalTitleText = document.getElementById('register-modal-title-text');

  function openRegisterModal(number) {
    selectedRegisterNumber = number;
    if (registerModalTitleText) {
      registerModalTitleText.textContent = `${number}번 등록하기`;
    }
    if (registerNameInput) {
      registerNameInput.value = '';
    }
    const firstEmoji = document.querySelector('input[name="register-emoji"]');
    if (firstEmoji) firstEmoji.checked = true;

    if (registerModal) {
      registerModal.classList.remove('hidden');
      setTimeout(() => {
        if (registerModalContent) {
          registerModalContent.classList.remove('scale-95', 'opacity-0');
          registerModalContent.classList.add('scale-100', 'opacity-100');
        }
      }, 50);
    }
  }

  function closeRegisterModal() {
    if (registerModalContent) {
      registerModalContent.classList.remove('scale-100', 'opacity-100');
      registerModalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => {
      if (registerModal) registerModal.classList.add('hidden');
      selectedRegisterNumber = null;
    }, 200);
  }

  if (btnCloseRegisterModal) {
    btnCloseRegisterModal.onclick = closeRegisterModal;
  }
  if (registerModal) {
    registerModal.addEventListener('click', (e) => {
      if (e.target === registerModal) {
        closeRegisterModal();
      }
    });
  }

  if (registerSlotForm) {
    registerSlotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = registerNameInput.value.trim();
      const emojiEl = document.querySelector('input[name="register-emoji"]:checked');
      const emoji = emojiEl ? emojiEl.value : '😃';

      if (!name) return;
      if (!selectedRegisterNumber) return;

      if (containsProfanity(name)) {
        alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
        return;
      }

      try {
        const res = await fetch(`/api/wall/${boardId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: selectedRegisterNumber,
            name,
            emoji,
            clientUuid
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '등록에 실패했습니다.');

        closeRegisterModal();
        renderBoard(data.wall);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Helper: Extract YouTube video ID
  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = String(url || '').match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  // Create individual card elements
  function createCardDOM(card, isTopPreference) {
    const myJoined = getMyJoinedMember(currentWall);
    let commentAuthorElHTML = '';
    if (myJoined) {
      const commentAuthorVal = `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name}`;
      commentAuthorElHTML = `<input type="text" id="comment-author-${card.id}" value="${commentAuthorVal}" readonly class="w-24 bg-slate-100 dark:bg-slate-900/40 cursor-not-allowed border border-slate-950/10 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black opacity-70">`;
    } else {
      commentAuthorElHTML = `<input type="text" id="comment-author-${card.id}" placeholder="이름" class="w-16 bg-white/50 dark:bg-black/20 border border-slate-950/10 dark:border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-black focus:outline-none placeholder-slate-400">`;
    }

    const cardDiv = document.createElement('div');
    const isNotice = !!card.isNotice;
    let extraClasses = '';
    if (isTopPreference) {
      extraClasses += ' popular-card-highlight';
    }
    if (isNotice) {
      extraClasses += ' !border-slate-800 dark:!border-slate-200 border-4 shadow-lg scale-[1.01]';
    }

    const isColumns = currentWall && currentWall.layout === 'columns';
    const isDefaultGrid = !currentWall || !currentWall.layout || currentWall.layout === 'grid';
    
    let cardPadding = '';
    let cardLayoutClass = '';
    
    if (isDefaultGrid) {
      cardPadding = 'p-3.5 rounded-2xl aspect-square overflow-hidden min-h-0 w-full';
      cardLayoutClass = `clay-card border-4 shadow-clay-flat transition-all ${card.bgColor || 'bg-pastel-pink'}`;
    } else if (isColumns) {
      cardPadding = 'p-4 rounded-2xl w-full mb-3';
      
      // Override background colors to be modern & clean
      if (card.bgColor && card.bgColor !== 'bg-pastel-pink') {
        cardLayoutClass = `transition-all duration-300 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${card.bgColor}`;
      } else {
        cardLayoutClass = `transition-all duration-300 border border-slate-200/60 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 bg-white dark:bg-slate-900/90`;
      }
    } else {
      cardPadding = 'p-5 rounded-3xl';
      cardLayoutClass = `clay-card border-4 shadow-clay-flat transition-all ${card.bgColor || 'bg-pastel-pink'}`;
    }

    cardDiv.className = `flex flex-col justify-between text-left cursor-pointer relative ${cardLayoutClass}${extraClasses} ${cardPadding}`;

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
        const imgHeight = isDefaultGrid ? 'h-14' : 'h-32';
        const imgMargin = isDefaultGrid ? 'mb-1.5' : 'mb-3';
        imgHTML = `<img src="${escapeHTML(card.image)}" alt="card-img" class="w-full ${imgHeight} object-cover rounded-xl border-2 border-slate-950/20 ${imgMargin} shadow-sm hover:opacity-90 transition-opacity cursor-zoom-in" onclick="event.stopPropagation(); openLightbox('${card.image}')" onerror="this.remove()">`;
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

    let attachmentHTML = '';
    if (card.attachmentData && card.attachmentName) {
      attachmentHTML = `
        <div class="mt-3 border-2 border-slate-900/10 dark:border-white/10 rounded-2xl p-3.5 bg-white/40 dark:bg-black/25 flex justify-between items-center hover:bg-white/60 dark:hover:bg-black/40 transition-colors duration-150" onclick="event.stopPropagation()">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-500 flex-shrink-0">
              <i data-lucide="file-text" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0">
              <h4 class="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate" title="${escapeHTML(card.attachmentName)}">${escapeHTML(card.attachmentName)}</h4>
              <p class="text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-none mt-0.5">한글 뷰어 연동 지원</p>
            </div>
          </div>
          <a href="${card.attachmentData}" download="${escapeHTML(card.attachmentName)}" class="px-2.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[9px] font-black shadow-sm flex items-center gap-1 transition-all cursor-pointer flex-shrink-0" title="클릭 시 다운로드 및 한글 웹 뷰어 자동 실행">
            <i data-lucide="download" class="w-3 h-3"></i>
            <span>열기/받기</span>
          </a>
        </div>
      `;
    }

    let crownHTML = '';
    if (isTopPreference) {
      crownHTML = `
        <div class="absolute -top-4 -right-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-rose-500 dark:border-rose-400 px-3 py-1.5 rounded-full text-xs font-title font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-bounce z-10 select-none">
          <span class="text-rose-500">🔥</span> 인기 글
        </div>
      `;
    }

    const likedCards = JSON.parse(localStorage.getItem(`liked_cards_${boardId}`) || '[]');
    const hasLiked = likedCards.includes(card.id);
    const heartIconFill = hasLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-800 dark:text-slate-100';
    const heartBgClass = hasLiked ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800' : 'bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/35';

    const btnPadding = isDefaultGrid ? 'px-1.5 py-1 text-[9px]' : 'px-2.5 py-1.5 text-xs';
    const iconSize = isDefaultGrid ? 'w-3 h-3' : 'w-3.5 h-3.5';
    const btnSize = isDefaultGrid ? 'w-6 h-6' : 'w-8 h-8';
    const actionIconSize = isDefaultGrid ? 'w-3.5 h-3.5' : 'w-4 h-4';

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
        ${isColumns ? `
        <div class="flex items-center gap-2 mb-2.5">
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-clay-purple to-clay-sky text-white flex items-center justify-center font-black text-[10px] shadow-sm select-none flex-shrink-0">
            ${escapeHTML((card.author || '익').substring(0, 1).toUpperCase())}
          </div>
          <div class="flex flex-col leading-tight min-w-0">
            <span class="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate">${escapeHTML(card.author)}</span>
            <span class="text-[8px] text-slate-400 dark:text-slate-500 font-bold">${formatDate(card.createdAt)}</span>
          </div>
        </div>
        ` : `
        <div class="flex justify-between items-center ${isDefaultGrid ? 'text-[8px] mb-1' : 'text-[10px] mb-2'} font-black opacity-60">
          <span>👑 ${escapeHTML(card.author)}</span>
          <span>${formatDate(card.createdAt)}</span>
        </div>
        `}
        <!-- Card Title -->
        ${card.title ? `<h3 class="${isDefaultGrid ? 'text-[11px] mb-1' : 'text-sm mb-2'} font-black tracking-tight break-words">${escapeHTML(card.title)}</h3>` : ''}
        <!-- Card Content -->
        <p class="${isDefaultGrid ? 'text-[9px] line-clamp-3 mb-2' : 'text-xs mb-4'} font-bold leading-relaxed whitespace-pre-wrap break-words">${renderContentWithLinks(card.content)}</p>
        ${previewHTML}
        ${attachmentHTML}
      </div>
      
      <!-- Footer actions (Like, Comment Toggle, Delete) -->
      <div class="border-t border-slate-900/10 dark:border-white/15 ${isDefaultGrid ? 'pt-2 mt-1' : 'pt-3.5 mt-2'} flex-shrink-0">
        <div class="flex justify-between items-center">
          <div class="flex gap-1">
            <!-- Heart button -->
            <button onclick="likeCard('${card.id}')" class="${btnPadding} rounded-lg ${heartBgClass} font-black border border-slate-950/15 flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95">
              <i data-lucide="heart" class="${iconSize} ${heartIconFill}"></i>
              <span>${card.likes || 0}</span>
            </button>
            <!-- Comments Toggle button -->
            <button onclick="toggleComments('${card.id}')" class="${btnPadding} rounded-lg bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/35 font-black border border-slate-950/15 flex items-center gap-1 cursor-pointer transition-all">
              <i data-lucide="message-square" class="${iconSize}"></i>
              <span>${(card.comments || []).length}</span>
            </button>
          </div>
          <!-- Delete & Pin buttons -->
          <div class="flex items-center gap-0.5">
            ${isBoardAdmin() ? `
            <button onclick="toggleNoticePin(event, '${card.id}')" class="${btnSize} rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-colors" title="${isNotice ? '공지 해제' : '공지 고정'}">
              <i data-lucide="pin" class="${actionIconSize} ${isNotice ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}"></i>
            </button>
            ` : ''}
            <button onclick="editCard(event, '${card.id}')" class="${btnSize} rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-colors" title="카드 수정">
              <i data-lucide="edit-2" class="${actionIconSize} text-slate-500"></i>
            </button>
            <button onclick="deleteCard('${card.id}')" class="${btnSize} rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-colors" title="카드 삭제">
              <i data-lucide="trash-2" class="${actionIconSize} text-red-500"></i>
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
            ${commentAuthorElHTML}
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
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUuid })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '좋아요 실패');
      }
      
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
        body: JSON.stringify({ author, text, clientUuid })
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
    let likedComments = JSON.parse(localStorage.getItem(`liked_comments_${boardId}`) || '[]');
    if (likedComments.includes(commentId)) {
      alert('이미 이 댓글에 공감하셨습니다!');
      return;
    }
    try {
      const res = await fetch(`/api/wall/${boardId}/cards/${cardId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUuid })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '댓글 좋아요 실패');
      }
      likedComments.push(commentId);
      localStorage.setItem(`liked_comments_${boardId}`, JSON.stringify(likedComments));
      
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
      alert(err.message);
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

  // Editing a card
  window.editCard = (event, cardId) => {
    if (event) event.stopPropagation(); // Prevent opening detail modal
    if (!currentWall || !currentWall.cards) return;
    const card = currentWall.cards[cardId];
    if (!card) return;

    window.editingCardId = cardId;
    activeCardSectionId = card.sectionId || '';

    // Change modal title and submit button text
    const titleEl = document.getElementById('card-modal-title-text');
    if (titleEl) titleEl.textContent = '카드 수정하기';
    const btnTextEl = document.getElementById('card-submit-btn-text');
    if (btnTextEl) btnTextEl.textContent = '카드 수정 완료';

    // Populate values
    const authorEl = document.getElementById('card-author');
    if (authorEl) authorEl.value = card.author || '';
    const titleInput = document.getElementById('card-title');
    if (titleInput) titleInput.value = card.title || '';
    const contentEl = document.getElementById('card-content');
    if (contentEl) contentEl.value = card.content || '';

    // Restore background color selection
    if (card.bgColor) {
      const colorRadio = document.querySelector(`input[name="color-picker"][value="${card.bgColor}"]`);
      if (colorRadio) colorRadio.checked = true;
    }

    // Restore image preview
    const imageEl = document.getElementById('card-image-url');
    if (imageEl) imageEl.value = card.image || '';
    if (card.image) {
      const ytId = getYouTubeId(card.image);
      if (!ytId) {
        if (modalImgPreview && modalImgPreviewContainer) {
          modalImgPreview.src = card.image;
          modalImgPreviewContainer.classList.remove('hidden');
        }
      } else {
        if (modalImgPreviewContainer) {
          modalImgPreviewContainer.classList.add('hidden');
          modalImgPreview.src = '';
        }
      }
    } else {
      if (modalImgPreviewContainer) {
        modalImgPreviewContainer.classList.add('hidden');
        modalImgPreview.src = '';
      }
    }

    // Restore link preview
    if (card.previewUrl) {
      activePreview = {
        previewUrl: card.previewUrl,
        previewTitle: card.previewTitle || '',
        previewDesc: card.previewDesc || '',
        previewImage: card.previewImage || ''
      };
      
      if (linkPreviewTitle) linkPreviewTitle.textContent = card.previewTitle || '링크 연결됨';
      if (linkPreviewDesc) linkPreviewDesc.textContent = card.previewDesc || card.previewUrl;
      if (linkPreviewUrl) linkPreviewUrl.textContent = card.previewUrl;

      if (card.previewImage && linkPreviewImg && linkPreviewImageContainer) {
        linkPreviewImg.src = card.previewImage;
        linkPreviewImageContainer.classList.remove('hidden');
      } else if (linkPreviewImageContainer) {
        linkPreviewImageContainer.classList.add('hidden');
      }

      if (linkPreviewBox) {
        linkPreviewBox.classList.remove('hidden');
      }
    } else {
      activePreview = null;
      if (linkPreviewBox) {
        linkPreviewBox.classList.add('hidden');
      }
    }

    // Restore attachment
    if (card.attachmentName && card.attachmentData) {
      if (cardAttachmentNameInput) cardAttachmentNameInput.value = card.attachmentName;
      if (cardAttachmentDataInput) cardAttachmentDataInput.value = card.attachmentData;
      
      if (attachmentStatusEl) {
        attachmentStatusEl.textContent = card.attachmentName;
        attachmentStatusEl.className = "text-xs font-black text-rose-500 self-center truncate max-w-[200px]";
      }
      if (btnRemoveAttachmentEl) btnRemoveAttachmentEl.classList.remove('hidden');
    } else {
      if (typeof removeAttachmentFile === 'function') {
        removeAttachmentFile();
      }
    }

    // Restore notice pin
    const isNoticeEl = document.getElementById('card-is-notice');
    if (isNoticeEl) {
      isNoticeEl.checked = !!card.isNotice;
    }

    // Open Modal
    cardModal.classList.remove('hidden');
    setTimeout(() => {
      cardModalContent.classList.remove('scale-95', 'opacity-0');
      cardModalContent.classList.add('scale-100', 'opacity-100');
    }, 50);
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

      // Reset edit mode states
      window.editingCardId = null;
      const titleEl = document.getElementById('card-modal-title-text');
      if (titleEl) titleEl.textContent = '카드 작성하기';
      const btnTextEl = document.getElementById('card-submit-btn-text');
      if (btnTextEl) btnTextEl.textContent = '포스트 보드에 부착하기';

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
      // Reset document attachments when closing modal
      if (typeof removeAttachmentFile === 'function') {
        removeAttachmentFile();
      }
      // Reset form input values
      if (cardCreationForm) {
        cardCreationForm.reset();
        if (typeof updateNumberLoginUI === 'function') {
          updateNumberLoginUI();
        }
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
            body: JSON.stringify({ author, text, clientUuid })
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
    
    const myJoined = getMyJoinedMember(currentWall);
    if (detailCommentAuthor) {
      if (myJoined) {
        detailCommentAuthor.value = `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name}`;
        detailCommentAuthor.readOnly = true;
        detailCommentAuthor.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
      } else {
        detailCommentAuthor.value = '';
        detailCommentAuthor.readOnly = false;
        detailCommentAuthor.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
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

  // Document File Selector Upload Event (Support HWP, PDF, Docx, etc.)
  const cardAttachmentFileInput = document.getElementById('card-attachment-file');
  const attachmentStatusEl = document.getElementById('attachment-status');
  const btnRemoveAttachmentEl = document.getElementById('btn-remove-attachment');
  const cardAttachmentNameInput = document.getElementById('card-attachment-name');
  const cardAttachmentDataInput = document.getElementById('card-attachment-data');

  if (cardAttachmentFileInput) {
    cardAttachmentFileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // File Size limit check (max 3MB for database light footprint)
      const maxSize = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSize) {
        alert('📂 학습지 등 문서 파일의 용량은 최대 3MB 이하로만 업로드하실 수 있습니다. 🌸');
        cardAttachmentFileInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(event) {
        if (cardAttachmentNameInput) cardAttachmentNameInput.value = file.name;
        if (cardAttachmentDataInput) cardAttachmentDataInput.value = event.target.result;
        
        if (attachmentStatusEl) {
          attachmentStatusEl.textContent = file.name;
          attachmentStatusEl.className = "text-xs font-black text-rose-500 self-center truncate max-w-[200px]";
        }
        if (btnRemoveAttachmentEl) btnRemoveAttachmentEl.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    };
  }

  window.removeAttachmentFile = () => {
    if (cardAttachmentFileInput) cardAttachmentFileInput.value = '';
    if (cardAttachmentNameInput) cardAttachmentNameInput.value = '';
    if (cardAttachmentDataInput) cardAttachmentDataInput.value = '';
    if (attachmentStatusEl) {
      attachmentStatusEl.textContent = '선택된 파일 없음';
      attachmentStatusEl.className = "text-xs font-bold text-slate-400 self-center truncate max-w-[200px]";
    }
    if (btnRemoveAttachmentEl) btnRemoveAttachmentEl.classList.add('hidden');
  };
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

      const attachmentName = document.getElementById('card-attachment-name').value;
      const attachmentData = document.getElementById('card-attachment-data').value;

      // Optimistic Close: Close modal instantly so the UX feels 100% immediate
      const isEditMode = !!window.editingCardId;
      const targetCardId = window.editingCardId;
      closeModal();

      const payload = { author, title, content, bgColor, image, isNotice, sectionId: activeCardSectionId, attachmentName, attachmentData, clientUuid };
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

      const url = isEditMode ? `/api/wall/${boardId}/cards/${targetCardId}` : `/api/wall/${boardId}/cards`;
      const method = isEditMode ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: headers,
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || (isEditMode ? '카드 수정에 실패했습니다.' : '카드 작성에 실패했습니다.'));
        }

        // Success - clear form
        cardCreationForm.reset();
        updateNumberLoginUI();
        if (isNoticeEl) isNoticeEl.checked = false;
        // Immediate local refresh
        fetch(`/api/wall/${boardId}`).then(r => r.json()).then(w => renderBoard(w));
      } catch (err) {
        alert(err.message);
        // Reopen modal to let user try again if request fails
        cardModal.classList.remove('hidden');
        
        // Restore editing state if it was edit mode
        if (isEditMode) {
          window.editingCardId = targetCardId;
          const titleEl = document.getElementById('card-modal-title-text');
          if (titleEl) titleEl.textContent = '카드 수정하기';
          const btnTextEl = document.getElementById('card-submit-btn-text');
          if (btnTextEl) btnTextEl.textContent = '카드 수정 완료';
        }

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
    trigger.className = "flex-shrink-0 w-48 bg-slate-50 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col shadow-sm h-32 justify-between transition-all";
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
    trigger.className = "flex-shrink-0 w-48 bg-white/40 dark:bg-slate-950/5 border-4 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-center items-center shadow-sm h-32 hover:border-clay-purple hover:bg-white/60 transition-all duration-150";
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
  window.toggleNumberLogin = async () => {
    if (currentWall && currentWall.maxUsers > 0) {
      const myJoined = getMyJoinedMember(currentWall);
      if (myJoined) {
        if (confirm(`현재 선택한 번호(${myJoined.number}번)를 반납하고 로그아웃 하시겠습니까?`)) {
          try {
            await fetch(`/api/wall/${boardId}/leave`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ number: myJoined.number, clientUuid })
            });
            // Fetch updated state
            const r = await fetch(`/api/wall/${boardId}`);
            const w = await r.json();
            renderBoard(w);
          } catch (err) {
            console.error('Failed to leave slot:', err);
          }
        }
      }
      return;
    }

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

    if (currentWall && currentWall.maxUsers > 0) {
      // Slot selection entry mode
      const myJoined = getMyJoinedMember(currentWall);
      if (myJoined) {
        textEl.textContent = `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name} (반납)`;
        btn.className = "btn px-4 py-3 text-xs font-black border-2 border-rose-200 dark:border-rose-950 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white shadow-clay-flat hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer";
        
        if (authorInput) {
          authorInput.value = `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name}`;
          authorInput.readOnly = true;
          authorInput.classList.add('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
        }
      } else {
        textEl.textContent = "번호 선택 대기";
        btn.className = "btn px-4 py-3 text-xs font-black border-2 border-amber-200 dark:border-slate-700 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-amber-400 shadow-clay-flat hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer";
        
        if (authorInput) {
          authorInput.value = "";
          authorInput.readOnly = false;
          authorInput.classList.remove('bg-slate-100', 'cursor-not-allowed', 'opacity-70');
        }
      }
      return;
    }
    
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

  // --- Collapsible Sidebar Event Listeners & State Restoration ---
  const leftSidebar = document.getElementById('left-sidebar');
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  
  function setSidebarCollapsed(collapsed) {
    const mainContent = document.getElementById('main-content');
    const toggleIcon = document.getElementById('sidebar-toggle-icon');
    
    if (leftSidebar) {
      if (collapsed) {
        leftSidebar.classList.add('collapsed');
        if (mainContent) {
          mainContent.classList.remove('max-w-7xl', 'mx-auto');
          mainContent.classList.add('max-w-none', 'px-6', 'md:px-10');
        }
        if (toggleIcon) {
          toggleIcon.classList.remove('lucide-chevron-left');
          toggleIcon.classList.add('lucide-chevron-right');
          toggleIcon.setAttribute('data-lucide', 'chevron-right');
        }
      } else {
        leftSidebar.classList.remove('collapsed');
        if (mainContent) {
          mainContent.classList.add('max-w-7xl', 'mx-auto');
          mainContent.classList.remove('max-w-none', 'px-6', 'md:px-10');
        }
        if (toggleIcon) {
          toggleIcon.classList.remove('lucide-chevron-right');
          toggleIcon.classList.add('lucide-chevron-left');
          toggleIcon.setAttribute('data-lucide', 'chevron-left');
        }
      }
      localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  // Restore state from localStorage
  const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  setSidebarCollapsed(isSidebarCollapsed);

  if (btnSidebarToggle) {
    btnSidebarToggle.addEventListener('click', () => {
      const currentlyCollapsed = leftSidebar && leftSidebar.classList.contains('collapsed');
      setSidebarCollapsed(!currentlyCollapsed);
    });
  }

  // Theme check / toggle from sidebar
  const themeToggleSidebar = document.getElementById('theme-toggle-btn-sidebar');
  if (themeToggleSidebar) {
    themeToggleSidebar.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', document.documentElement.classList.contains('dark') ? 'enabled' : 'disabled');
    });
  }

  // Login / logout sidebar event listeners
  const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
  if (btnLogoutSidebar) {
    btnLogoutSidebar.addEventListener('click', () => {
      localStorage.removeItem('kfcman_auth_token');
      localStorage.removeItem('kfcman_user_role');
      window.location.href = '/';
    });
  }

  const btnLoginSidebar = document.getElementById('btn-login-sidebar');
  if (btnLoginSidebar) {
    btnLoginSidebar.addEventListener('click', () => {
      window.location.href = '/?login=true';
    });
  }

  // --- CHAT LAYOUT LOGIC AND EVENT LISTENERS ---
  function getUserChatNickname() {
    if (currentWall && currentWall.maxUsers > 0) {
      const myJoined = getMyJoinedMember(currentWall);
      if (myJoined) {
        return `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name}`;
      }
    }
    const currentNumber = localStorage.getItem('kfcman_wall_member_number');
    if (currentNumber) {
      return `${currentNumber}번 회원`;
    }
    const chatNicknameInput = document.getElementById('chat-nickname-input');
    if (chatNicknameInput && chatNicknameInput.value.trim()) {
      return chatNicknameInput.value.trim();
    }
    const authorInput = document.getElementById('card-author');
    if (authorInput && authorInput.value.trim()) {
      return authorInput.value.trim();
    }
    return '익명';
  }

  function initChatNicknameField(wall) {
    const chatNicknameInput = document.getElementById('chat-nickname-input');
    if (!chatNicknameInput) return;
    
    let loggedInName = '';
    let isDisabled = false;
    
    if (wall && wall.maxUsers > 0) {
      const myJoined = getMyJoinedMember(wall);
      if (myJoined) {
        loggedInName = `${myJoined.emoji} ${myJoined.number}번 ${myJoined.name}`;
        isDisabled = true;
      }
    }
    
    if (!loggedInName) {
      const currentNumber = localStorage.getItem('kfcman_wall_member_number');
      if (currentNumber) {
        loggedInName = `${currentNumber}번 회원`;
        isDisabled = true;
      }
    }
    
    if (isDisabled) {
      chatNicknameInput.value = loggedInName;
      chatNicknameInput.readOnly = true;
      chatNicknameInput.classList.add('bg-slate-150', 'dark:bg-slate-900/60', 'cursor-not-allowed', 'opacity-70');
    } else {
      chatNicknameInput.readOnly = false;
      chatNicknameInput.classList.remove('bg-slate-150', 'dark:bg-slate-900/60', 'cursor-not-allowed', 'opacity-70');
      
      if (document.activeElement !== chatNicknameInput) {
        chatNicknameInput.value = localStorage.getItem('kfcman_chat_nickname') || '';
      }
    }
    
    if (!chatNicknameInput.dataset.listenerBound) {
      chatNicknameInput.addEventListener('input', (e) => {
        localStorage.setItem('kfcman_chat_nickname', e.target.value.trim());
      });
      chatNicknameInput.dataset.listenerBound = 'true';
    }
  }

  function extractTopic(text) {
    if (!text) return '잡담';
    
    // 1. Look for hashtags
    const hashMatch = text.match(/#([a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-_]+)/);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1].trim();
    }
    
    // 2. Look for predefined common keywords
    const keywords = [
      '코딩', '파이썬', '공부', '맛집', '점심', '저녁', '식사', '치킨', '피자', '돈까스', 
      '게임', '롤', '잡담', '일상', '운동', '헬스', '축구', '음악', '노래', '질문', '고민', 
      '영화', '드라마', '여행', '날씨'
    ];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return kw;
      }
    }
    
    // 3. Fallback to the first word (cleansed)
    const words = text.trim().split(/\s+/).map(w => w.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-_]/g, '')).filter(Boolean);
    if (words.length > 0 && words[0].length <= 10) {
      return words[0];
    }
    
    return '일상';
  }

  const renderSidebarArchivesList = async () => {
    const listContainer = document.getElementById('chat-saved-archives-list');
    if (!listContainer) return;
    
    const targetParentId = boardId.startsWith('TALK') ? 'TALK' : boardId;
    try {
      const res = await fetch(`/api/wall/${targetParentId}/archives`);
      if (!res.ok) throw new Error('목록 조회 실패');
      const data = await res.json();
      
      if (data.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-[10px] text-slate-400 py-6">저장된 기록이 없습니다.</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      const token = localStorage.getItem('kfcman_auth_token');
      const isAdmin = isBoardAdmin();
      
      data.forEach(arc => {
        const dateStr = new Date(arc.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-800/80 gap-2";
        div.innerHTML = `
          <div class="min-w-0 flex-grow text-left cursor-pointer" onclick="window.location.href = '/wall/${arc.id}'">
            <h4 class="text-[11px] font-black text-slate-700 dark:text-slate-300 truncate" title="${arc.title}">${arc.title}</h4>
            <p class="text-[8px] text-slate-400 mt-0.5 font-bold">${dateStr}</p>
          </div>
          <div class="flex items-center gap-1 flex-shrink-0">
            <button class="btn-go px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-[9px] font-black cursor-pointer shadow-sm transition-all" data-id="${arc.id}">이동</button>
            ${isAdmin ? `<button class="btn-del px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[9px] font-black cursor-pointer shadow-sm transition-all" data-id="${arc.id}">삭제</button>` : ''}
          </div>
        `;
        
        div.querySelector('.btn-go').onclick = (e) => {
          e.stopPropagation();
          window.location.href = `/wall/${arc.id}`;
        };
        
        const delBtn = div.querySelector('.btn-del');
        if (delBtn) {
          delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm(`'${arc.title}' 기록을 정말 삭제하시겠습니까?`)) return;
            try {
              const headers = {};
              if (token) headers['X-KFCMan-Auth'] = token;
              const delRes = await fetch(`/api/wall/${arc.id}`, {
                method: 'DELETE',
                headers
              });
              if (!delRes.ok) throw new Error('삭제 실패');
              renderSidebarArchivesList();
              if (typeof renderArchivesList === 'function') renderArchivesList();
            } catch (err) {
              alert(err.message);
            }
          };
        }
        
        listContainer.appendChild(div);
      });
    } catch (err) {
      listContainer.innerHTML = `<div class="text-center text-[10px] text-rose-500 py-4">${err.message}</div>`;
    }
  };

  function renderChatLayout(wall) {
    const chatRoomsList = document.getElementById('chat-rooms-list');
    const chatRoomsCount = document.getElementById('chat-rooms-count');
    const btnChatCreateRoom = document.getElementById('btn-chat-create-room');
    const btnChatAiRooms = document.getElementById('btn-chat-ai-rooms');
    
    const isAdmin = isBoardAdmin();
    if (btnChatCreateRoom) {
      if (isAdmin) {
        btnChatCreateRoom.classList.remove('hidden');
      } else {
        btnChatCreateRoom.classList.add('hidden');
      }
    }
    const btnChatSaveArchive = document.getElementById('btn-chat-save-archive');
    const userRole = (currentUser && currentUser.role) || '';
    const isVipOrAbove = userRole === 'admin' || userRole === 'manager' || userRole === 'vip' || isAdmin;
    if (btnChatAiRooms) {
      if (isVipOrAbove) {
        btnChatAiRooms.classList.remove('hidden');
      } else {
        btnChatAiRooms.classList.add('hidden');
      }
    }
    if (btnChatSaveArchive) {
      if (isVipOrAbove) {
        btnChatSaveArchive.classList.remove('hidden');
      } else {
        btnChatSaveArchive.classList.add('hidden');
      }
    }
    
    if (!chatRoomsList || !chatRoomsCount) return;
    
    initChatNicknameField(wall);
    
    const rooms = Object.values(wall.cards || {});
    
    // Sort rooms by:
    // 1. notices first
    // 2. popularity score (likes + comment count) descending
    // 3. latest comment/creation date descending
    rooms.sort((a, b) => {
      const aNotice = !!a.isNotice;
      const bNotice = !!b.isNotice;
      if (aNotice && !bNotice) return -1;
      if (!aNotice && bNotice) return 1;
      
      const aScore = (a.likes || 0) + (a.comments || []).length;
      const bScore = (b.likes || 0) + (b.comments || []).length;
      if (bScore !== aScore) {
        return bScore - aScore;
      }
      
      const aLastTime = a.comments && a.comments.length > 0 
        ? new Date(a.comments[a.comments.length - 1].createdAt).getTime()
        : new Date(a.createdAt).getTime();
      const bLastTime = b.comments && b.comments.length > 0
        ? new Date(b.comments[b.comments.length - 1].createdAt).getTime()
        : new Date(b.createdAt).getTime();
        
      return bLastTime - aLastTime;
    });

    chatRoomsCount.textContent = rooms.length;
    chatRoomsList.innerHTML = '';
    
    if (rooms.length === 0) {
      chatRoomsList.innerHTML = `
        <div class="py-12 text-center text-slate-400 dark:text-slate-500 select-none">
          <i data-lucide="message-square" class="w-8 h-8 mx-auto mb-2 text-slate-350 dark:text-slate-650"></i>
          <p class="text-[10px] font-bold">생성된 대화방이 없습니다.</p>
          <p class="text-[8px] text-slate-400/80 dark:text-slate-550/80 mt-0.5">아래 입력창에 첫 이야기를 적어보세요!</p>
        </div>
      `;
    } else {
      rooms.forEach(room => {
        const isActive = activeChatRoomCardId === room.id;
        const msgCount = (room.comments || []).length;
        const latestMsg = msgCount > 0 ? room.comments[msgCount - 1] : null;
        
        let lastMsgText = '대화가 아직 없습니다.';
        let lastMsgTime = '';
        if (latestMsg) {
          lastMsgText = latestMsg.text;
          lastMsgTime = formatDateChat(latestMsg.createdAt);
        } else {
          lastMsgTime = formatDateChat(room.createdAt);
        }
        
        const roomDiv = document.createElement('div');
        roomDiv.className = `p-3 rounded-2xl border-2 transition-all cursor-pointer flex gap-3 shadow-sm select-none ${
          isActive 
            ? 'bg-yellow-50/70 border-yellow-400 dark:bg-yellow-950/20 dark:border-yellow-600' 
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
        }`;
        
        roomDiv.innerHTML = `
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-900 font-black flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
            #
          </div>
          <!-- Details -->
          <div class="flex-grow min-w-0 flex flex-col justify-between py-0.5 text-left">
            <div class="flex justify-between items-center">
              <span class="text-xs font-black text-slate-800 dark:text-slate-100 truncate pr-1">#${escapeHTML(room.title)}</span>
              <span class="text-[8px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">${lastMsgTime}</span>
            </div>
            <p class="text-[10px] font-bold text-slate-500 dark:text-slate-450 truncate mt-0.5 leading-tight">${escapeHTML(lastMsgText)}</p>
            <div class="flex gap-2 items-center mt-1">
              <span class="inline-flex items-center text-[8px] font-black text-slate-400 dark:text-slate-500 gap-0.5">
                <i data-lucide="message-square" class="w-2.5 h-2.5"></i> ${msgCount}
              </span>
              <span class="inline-flex items-center text-[8px] font-black text-rose-400 dark:text-rose-500 gap-0.5">
                <i data-lucide="heart" class="w-2.5 h-2.5 fill-rose-400"></i> ${room.likes || 0}
              </span>
            </div>
          </div>
        `;
        
        roomDiv.onclick = () => {
          try {
            activeChatRoomCardId = room.id;
            const container = document.getElementById('chat-layout-container');
            if (container) {
              container.classList.add('show-chat-room');
            }
            renderChatLayout(wall);
          } catch (err) {
            alert("대화방 클릭 오류: " + err.message + "\n" + err.stack);
          }
        };
        
        chatRoomsList.appendChild(roomDiv);
      });
    }

    // Render active conversation
    const activeRoom = activeChatRoomCardId ? wall.cards[activeChatRoomCardId] : null;
    
    const chatActiveRoomTitle = document.getElementById('chat-active-room-title');
    const chatActiveRoomTag = document.getElementById('chat-active-room-tag');
    const chatActiveRoomDesc = document.getElementById('chat-active-room-desc');
    const chatActiveRoomLikeBtn = document.getElementById('chat-active-room-like-btn');
    const chatActiveRoomLikes = document.getElementById('chat-active-room-likes');
    const chatActiveRoomEditBtn = document.getElementById('chat-active-room-edit-btn');
    const chatActiveRoomDeleteBtn = document.getElementById('chat-active-room-delete-btn');
    const chatConversationEmpty = document.getElementById('chat-conversation-empty');
    const chatMessagesArea = document.getElementById('chat-messages-area');
    const chatMessageInputContainer = document.getElementById('chat-message-input-container');
    
    if (!activeRoom) {
      if (chatConversationEmpty) chatConversationEmpty.classList.remove('hidden');
      if (chatMessagesArea) chatMessagesArea.classList.add('hidden');
      if (chatMessageInputContainer) chatMessageInputContainer.classList.add('hidden');
      if (chatActiveRoomTag) chatActiveRoomTag.classList.add('hidden');
      if (chatActiveRoomLikeBtn) chatActiveRoomLikeBtn.classList.add('hidden');
      if (chatActiveRoomEditBtn) chatActiveRoomEditBtn.classList.add('hidden');
      if (chatActiveRoomDeleteBtn) chatActiveRoomDeleteBtn.classList.add('hidden');
      if (chatActiveRoomTitle) chatActiveRoomTitle.textContent = "톡방을 선택하거나 메시지를 남겨보세요";
      if (chatActiveRoomDesc) chatActiveRoomDesc.textContent = "주제 톡방을 클릭하면 대화에 참여할 수 있습니다.";
    } else {
      if (chatConversationEmpty) chatConversationEmpty.classList.add('hidden');
      if (chatMessagesArea) chatMessagesArea.classList.remove('hidden');
      if (chatMessageInputContainer) chatMessageInputContainer.classList.remove('hidden');
      if (chatActiveRoomTag) {
        chatActiveRoomTag.classList.remove('hidden');
        chatActiveRoomTag.textContent = `#${activeRoom.title}`;
      }
      if (chatActiveRoomLikeBtn) {
        chatActiveRoomLikeBtn.classList.remove('hidden');
        chatActiveRoomLikes.textContent = activeRoom.likes || 0;
        
        chatActiveRoomLikeBtn.onclick = async () => {
          try {
            const res = await fetch(`/api/wall/${wall.id}/cards/${activeRoom.id}/like`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientUuid })
            });
            if (!res.ok) {
              const data = await res.json();
              throw new Error(data.error || '좋아요 반영 실패');
            }
            const updatedCard = await res.json();
            chatActiveRoomLikes.textContent = updatedCard.likes || 0;
          } catch (err) {
            alert(err.message);
          }
        };
      }
      if (chatActiveRoomEditBtn) {
        if (isAdmin) {
          chatActiveRoomEditBtn.classList.remove('hidden');
          chatActiveRoomEditBtn.onclick = async () => {
            const newTitle = prompt('새로운 주제(제목)를 입력해주세요:', activeRoom.title);
            if (newTitle === null) return;
            const trimmedTitle = newTitle.trim();
            if (!trimmedTitle) {
              alert('주제 제목을 입력해 주세요.');
              return;
            }
            const newDesc = prompt('새로운 주제 설명을 입력해주세요:', activeRoom.content || '');
            if (newDesc === null) return;
            const trimmedDesc = newDesc.trim();

            const token = localStorage.getItem('kfcman_auth_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['X-KFCMan-Auth'] = token;

            try {
              const res = await fetch(`/api/wall/${wall.id}/cards/${activeRoom.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                  title: trimmedTitle,
                  content: trimmedDesc
                })
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '수정 실패');
              }
            } catch (err) {
              alert(err.message);
            }
          };
        } else {
          chatActiveRoomEditBtn.classList.add('hidden');
        }
      }
      if (chatActiveRoomDeleteBtn) {
        if (isAdmin) {
          chatActiveRoomDeleteBtn.classList.remove('hidden');
          chatActiveRoomDeleteBtn.onclick = async () => {
            if (!confirm(`'${activeRoom.title}' 주제 톡방을 정말 삭제하시겠습니까?\n이 방의 모든 대화 내용이 함께 삭제됩니다.`)) return;

            const token = localStorage.getItem('kfcman_auth_token');
            const headers = {};
            if (token) headers['X-KFCMan-Auth'] = token;

            try {
              const res = await fetch(`/api/wall/${wall.id}/cards/${activeRoom.id}`, {
                method: 'DELETE',
                headers
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '삭제 실패');
              }
              activeChatRoomCardId = null;
            } catch (err) {
              alert(err.message);
            }
          };
        } else {
          chatActiveRoomDeleteBtn.classList.add('hidden');
        }
      }
      if (chatActiveRoomTitle) chatActiveRoomTitle.textContent = `#${activeRoom.title} 주제 톡방`;
      if (chatActiveRoomDesc) chatActiveRoomDesc.textContent = activeRoom.content || `${activeRoom.title}에 대해 자유롭게 이야기 나누는 공간입니다.`;
      
      // Render messages
      if (chatMessagesArea) {
        chatMessagesArea.innerHTML = '';

        // 1. Generate and Render 4-Cut Webtoon at the top
        const cleanTitle = activeRoom.title.replace(/[#\p{Emoji}]/gu, '').trim();
        function hashString(str) {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return hash;
        }

        const cachedWebtoon = localStorage.getItem(`webtoon_room_${activeRoom.id}`);
        let panels = [];
        if (cachedWebtoon) {
          try {
            panels = JSON.parse(cachedWebtoon);
          } catch(e) {
            panels = [];
          }
        }

        if (!panels || panels.length === 0) {
          let keywords = ['school', 'education'];
          const titleLower = cleanTitle.toLowerCase();
          if (titleLower.includes('수업') || titleLower.includes('공부') || titleLower.includes('교육')) {
            keywords = ['classroom', 'learning', 'students'];
          } else if (titleLower.includes('피드백') || titleLower.includes('평가') || titleLower.includes('검토') || titleLower.includes('전략')) {
            keywords = ['feedback', 'writing', 'board'];
          } else if (titleLower.includes('동기') || titleLower.includes('참여') || titleLower.includes('유도') || titleLower.includes('비법')) {
            keywords = ['happy', 'students', 'raising-hand'];
          } else if (titleLower.includes('창의') || titleLower.includes('아이디어') || titleLower.includes('공유')) {
            keywords = ['ideas', 'creative', 'design'];
          } else if (titleLower.includes('활동') || titleLower.includes('놀이') || titleLower.includes('게임')) {
            keywords = ['activity', 'classroom-game', 'children'];
          }

          const modifiers = ['start', 'process', 'climax', 'end'];
          panels = [
            { title: "🎬 1. 준비 및 계획", url: `https://loremflickr.com/640/480/school,${keywords[0]},${modifiers[0]}?lock=${Math.abs(hashString(cleanTitle) + 1) % 1000}` },
            { title: "⚡ 2. 활동 진행", url: `https://loremflickr.com/640/480/classroom,${keywords.length > 1 ? keywords[1] : 'learning'},${modifiers[1]}?lock=${Math.abs(hashString(cleanTitle) + 2) % 1000}` },
            { title: "🔥 3. 심화 학습", url: `https://loremflickr.com/640/480/education,${keywords.length > 2 ? keywords[2] : 'students'},${modifiers[2]}?lock=${Math.abs(hashString(cleanTitle) + 3) % 1000}` },
            { title: "💖 4. 나눔과 성찰", url: `https://loremflickr.com/640/480/happy,classroom,${modifiers[3]}?lock=${Math.abs(hashString(cleanTitle) + 4) % 1000}` }
          ];
          localStorage.setItem(`webtoon_room_${activeRoom.id}`, JSON.stringify(panels));
        }

        const webtoonDiv = document.createElement('div');
        webtoonDiv.className = 'mb-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 shadow-sm';
        webtoonDiv.innerHTML = `
          <div class="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-850 pb-2">
            <span class="text-xs font-black text-amber-500 flex items-center gap-1">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
              📖 주제 매칭 4컷 웹툰
            </span>
            <span class="text-[9px] font-bold text-slate-400">주제: ${escapeHTML(activeRoom.title)}</span>
          </div>
          <div class="grid grid-cols-4 gap-3">
            ${panels.map(p => `
              <div class="flex flex-col bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm hover:scale-[1.02] hover:shadow-md transition-all duration-250">
                <div class="aspect-square bg-cover bg-center cursor-zoom-in" style="background-image: url('${p.url}')" onclick="window.open('${p.url}', '_blank')"></div>
                <div class="p-1.5 text-center text-[8px] font-black bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 truncate">${p.title}</div>
              </div>
            `).join('')}
          </div>
        `;
        chatMessagesArea.appendChild(webtoonDiv);

        // 2. Render comments
        const comments = (activeRoom.comments || []).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const myName = getUserChatNickname();

        if (comments.length === 0) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'py-12 text-center text-slate-500/80 dark:text-slate-400 select-none';
          emptyDiv.innerHTML = `
            <p class="text-xs font-black">이 방의 대화가 비어 있습니다.</p>
            <p class="text-[10px] mt-0.5">첫 마디를 나누며 대화를 시작해 보세요!</p>
          `;
          chatMessagesArea.appendChild(emptyDiv);
        } else {
          comments.forEach(comment => {
            const isSelf = comment.author === myName;
            
            const msgRow = document.createElement('div');
            msgRow.className = `flex gap-2.5 mb-3.5 ${isSelf ? 'justify-end' : 'justify-start'}`;
            
            let avatarContent = escapeHTML(comment.author.substring(0, 1).toUpperCase());
            const emojiMatch = comment.author.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF])/);
            if (emojiMatch) {
              avatarContent = emojiMatch[1];
            }
            
            const formattedTime = formatTimeChat(comment.createdAt);
            
            if (isSelf) {
              msgRow.innerHTML = `
                <div class="flex flex-col items-end max-w-[70%] text-right">
                  <span class="text-[9px] font-black text-slate-650 dark:text-slate-400 mb-0.5 select-none">${escapeHTML(comment.author)}</span>
                  <div class="flex items-end gap-1.5">
                    <button onclick="likeComment('${activeRoom.id}', '${comment.id}')" class="text-[9px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-250 dark:border-rose-900 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer shadow-sm active:scale-90">
                      <i data-lucide="heart" class="w-2.5 h-2.5 fill-rose-500"></i>
                      <span>${comment.likes || 0}</span>
                    </button>
                    <span class="text-[8px] font-bold text-slate-500/60 dark:text-slate-500/40 whitespace-nowrap select-none">${formattedTime}</span>
                    <div class="bg-[#fef01b] dark:bg-yellow-400 text-slate-900 px-3 py-2 rounded-2xl rounded-tr-none text-xs font-bold leading-relaxed break-all shadow-sm">
                      ${renderContentWithLinks(escapeHTML(comment.text))}
                    </div>
                  </div>
                </div>
                <div class="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 flex items-center justify-center text-sm font-black text-slate-700 dark:text-yellow-300 shadow-sm flex-shrink-0 select-none">
                  ${avatarContent}
                </div>
              `;
            } else {
              msgRow.innerHTML = `
                <div class="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-300 shadow-sm flex-shrink-0 select-none">
                  ${avatarContent}
                </div>
                <div class="flex flex-col items-start max-w-[70%] text-left">
                  <span class="text-[9px] font-black text-slate-600 dark:text-slate-400 mb-0.5 select-none">${escapeHTML(comment.author)}</span>
                  <div class="flex items-end gap-1.5">
                    <div class="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-2xl rounded-tl-none text-xs font-bold leading-relaxed break-all shadow-sm border border-slate-200/50 dark:border-slate-800/80">
                      ${renderContentWithLinks(escapeHTML(comment.text))}
                    </div>
                    <span class="text-[8px] font-bold text-slate-500/60 dark:text-slate-500/40 whitespace-nowrap select-none">${formattedTime}</span>
                    <button onclick="likeComment('${activeRoom.id}', '${comment.id}')" class="text-[9px] font-black text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-250 dark:border-rose-900 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 cursor-pointer shadow-sm active:scale-90">
                      <i data-lucide="heart" class="w-2.5 h-2.5 fill-rose-500"></i>
                      <span>${comment.likes || 0}</span>
                    </button>
                  </div>
                </div>
              `;
            }
            
            chatMessagesArea.appendChild(msgRow);
          });
        }
        
        setTimeout(() => {
          chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        }, 50);
      }
    }
    
    // Render Saved Archives List in Sidebar
    renderSidebarArchivesList();
    
    updateIcons();
  }

  window.likeComment = async function(cardId, commentId) {
    if (!currentWall) return;
    let likedComments = JSON.parse(localStorage.getItem(`liked_comments_${currentWall.id}`) || '[]');
    if (likedComments.includes(commentId)) {
      alert('이미 이 대화에 공감하셨습니다!');
      return;
    }
    try {
      const res = await fetch(`/api/wall/${currentWall.id}/cards/${cardId}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientUuid })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '댓글 공감 실패');
      }
      likedComments.push(commentId);
      localStorage.setItem(`liked_comments_${currentWall.id}`, JSON.stringify(likedComments));
    } catch (err) {
      alert(err.message);
    }
  };

  function formatDateChat(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  function formatTimeChat(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const btnChatCreateRoom = document.getElementById('btn-chat-create-room');
  if (btnChatCreateRoom) {
    btnChatCreateRoom.addEventListener('click', () => {
      // Clear modal fields first
      const titleInput = document.getElementById('card-title');
      const contentInput = document.getElementById('card-content');
      const imageUrlInput = document.getElementById('card-image-url');
      const modalTitle = document.getElementById('card-modal-title-text');
      const submitBtn = document.getElementById('card-submit-btn-text');
      
      if (titleInput) titleInput.value = '';
      if (contentInput) contentInput.value = '';
      if (imageUrlInput) imageUrlInput.value = '';
      if (modalTitle) modalTitle.textContent = '새 주제 톡방 개설하기';
      if (submitBtn) submitBtn.textContent = '주제 톡방 개설하기';
      activeCardSectionId = ''; // Reset section
      
      // Open card creation modal
      if (cardModal) {
        cardModal.classList.remove('hidden');
        setTimeout(() => {
          if (cardModalContent) {
            cardModalContent.classList.remove('translate-y-4', 'opacity-0');
            cardModalContent.classList.add('translate-y-0', 'opacity-100');
          }
        }, 50);
      }
    });
  }

  const chatGlobalInputForm = document.getElementById('chat-global-input-form');
  const chatGlobalInput = document.getElementById('chat-global-input');
  const chatRoomInputForm = document.getElementById('chat-room-input-form');
  const chatRoomInput = document.getElementById('chat-room-input');
  
  if (chatGlobalInputForm) {
    chatGlobalInputForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatGlobalInput.value.trim();
      if (!text) return;
      
      const author = getUserChatNickname();
      if (author === '익명' || !author.trim()) {
        alert('📢 톡방 개설 및 메시지 전송을 위해 대화명(별명)을 지정해 주세요! 상단의 대화명 입력란을 채우시면 됩니다. 🌸');
        const nickInput = document.getElementById('chat-nickname-input');
        if (nickInput) nickInput.focus();
        return;
      }

      if (containsProfanity(text) || containsProfanity(author)) {
        alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 메시지를 보낼 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
        return;
      }

      const topic = extractTopic(text);

      // Prevent duplicate consecutive comments locally
      if (currentWall && currentWall.cards) {
        const rooms = Object.values(currentWall.cards || {});
        const targetRoom = rooms.find(r => r.title.toLowerCase() === topic.toLowerCase());
        if (targetRoom) {
          const comments = targetRoom.comments || [];
          if (comments.length > 0) {
            const lastComment = comments[comments.length - 1];
            if (lastComment.author === author && lastComment.text.trim() === text) {
              alert('📢 동일한 내용의 메시지를 연속해서 전송할 수 없습니다.');
              return;
            }
          }
        }
      }

      const submitBtn = chatGlobalInputForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = '전송 중...';
      }
      chatGlobalInput.disabled = true;
      
      try {
        const rooms = Object.values(currentWall.cards || {});
        let targetRoom = rooms.find(r => r.title.toLowerCase() === topic.toLowerCase());
        
        if (!targetRoom) {
          if (!isBoardAdmin()) {
            alert('📢 새로운 주제 톡방은 관리자(교사)만 개설할 수 있습니다. 이미 개설되어 있는 주제 톡방을 이용해 주세요! 🌸');
            return;
          }
          const desc = `${topic}에 대해 함께 이야기를 나누는 주제 톡방입니다.`;
          const createRes = await fetch(`/api/wall/${currentWall.id}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: author,
              title: topic,
              content: desc,
              bgColor: 'bg-pastel-pink',
              clientUuid: clientUuid
            })
          });
          if (!createRes.ok) {
            const errData = await createRes.json();
            throw new Error(errData.error || '주제 톡방 개설 실패');
          }
          targetRoom = await createRes.json();
        }
        
        const commentRes = await fetch(`/api/wall/${currentWall.id}/cards/${targetRoom.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: author,
            text: text,
            clientUuid: clientUuid
          })
        });
        if (!commentRes.ok) {
          const errData = await commentRes.json();
          throw new Error(errData.error || '메시지 전송 실패');
        }
        
        activeChatRoomCardId = targetRoom.id;
        chatGlobalInput.value = '';
      } catch (err) {
        alert(err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || '전송';
        }
        chatGlobalInput.disabled = false;
      }
    });
  }
  
  if (chatRoomInputForm) {
    chatRoomInputForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatRoomInput.value.trim();
      if (!text || !activeChatRoomCardId) return;

      const author = getUserChatNickname();
      if (!author.trim()) {
        alert('📢 메시지 전송을 위해 대화명을 입력해 주세요! 🌸');
        return;
      }
      
      if (containsProfanity(text) || containsProfanity(author)) {
        alert('부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 메시지를 보낼 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸');
        return;
      }

      // Prevent duplicate consecutive comments locally
      if (currentWall && currentWall.cards && currentWall.cards[activeChatRoomCardId]) {
        const activeRoom = currentWall.cards[activeChatRoomCardId];
        const comments = activeRoom.comments || [];
        if (comments.length > 0) {
          const lastComment = comments[comments.length - 1];
          if (lastComment.author === author && lastComment.text.trim() === text) {
            alert('📢 동일한 내용의 메시지를 연속해서 전송할 수 없습니다.');
            return;
          }
        }
      }

      const submitBtn = chatRoomInputForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = '전송 중...';
      }
      chatRoomInput.disabled = true;
      
      try {
        const commentRes = await fetch(`/api/wall/${currentWall.id}/cards/${activeChatRoomCardId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: author,
            text: text,
            clientUuid: clientUuid
          })
        });
        if (!commentRes.ok) {
          const errData = await commentRes.json();
          throw new Error(errData.error || '메시지 전송 실패');
        }
        chatRoomInput.value = '';
      } catch (err) {
        alert(err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || '전송';
        }
        chatRoomInput.disabled = false;
      }
    });
  }

  // --- AI Sparkle Modal handlers ---
  const btnChatAiRooms = document.getElementById('btn-chat-ai-rooms');
  const aiModal = document.getElementById('ai-modal');
  const aiModalContent = document.getElementById('ai-modal-content');
  const btnCloseAiModal = document.getElementById('btn-close-ai-modal');
  const aiGenerateForm = document.getElementById('ai-generate-form');
  const aiApiKeyInput = document.getElementById('ai-api-key-input');
  const btnSaveApiKey = document.getElementById('btn-save-api-key');
  const btnTestApiKey = document.getElementById('btn-test-api-key');
  const aiPromptInput = document.getElementById('ai-prompt-input');
  const btnAiGenerateSubmit = document.getElementById('btn-ai-generate-submit');

  if (btnTestApiKey && aiApiKeyInput) {
    btnTestApiKey.addEventListener('click', async () => {
      const apiKey = aiApiKeyInput.value.trim();
      
      const originalText = btnTestApiKey.textContent;
      btnTestApiKey.disabled = true;
      btnTestApiKey.textContent = '테스트 중...';

      try {
        const token = localStorage.getItem('kfcman_auth_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-KFCMan-Auth'] = token;

        const res = await fetch('/api/admin/config/gemini/test', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ apiKey })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || '연결 실패');
        }
        alert(data.message || '연결 성공! Gemini API 키가 유효합니다.');
      } catch (e) {
        alert(e.message);
      } finally {
        btnTestApiKey.disabled = false;
        btnTestApiKey.textContent = originalText;
      }
    });
  }

  const closeAiModal = () => {
    if (aiModal) {
      if (aiModalContent) {
        aiModalContent.classList.add('scale-95', 'opacity-0');
        aiModalContent.classList.remove('scale-100', 'opacity-100');
      }
      setTimeout(() => {
        aiModal.classList.add('hidden');
      }, 150);
    }
  };

  if (btnChatAiRooms && aiModal) {
    btnChatAiRooms.addEventListener('click', async () => {
      // Open AI Modal
      aiModal.classList.remove('hidden');
      setTimeout(() => {
        if (aiModalContent) {
          aiModalContent.classList.remove('scale-95', 'opacity-0');
          aiModalContent.classList.add('scale-100', 'opacity-100');
        }
      }, 50);

      // Check key configuration status on server
      try {
        const token = localStorage.getItem('kfcman_auth_token');
        const headers = {};
        if (token) headers['X-KFCMan-Auth'] = token;
        
        const res = await fetch('/api/admin/config/gemini', { headers });
        if (res.ok) {
          const status = await res.json();
          if (status.hasKey) {
            aiApiKeyInput.placeholder = '🔑 API Key가 이미 등록되어 있습니다.';
            aiApiKeyInput.value = '';
          } else {
            aiApiKeyInput.placeholder = 'Google Gemini API Key 입력';
          }
        }
      } catch (e) {
        console.error('Failed to fetch Gemini API status', e);
      }
    });
  }

  if (btnCloseAiModal) {
    btnCloseAiModal.addEventListener('click', closeAiModal);
  }

  if (btnSaveApiKey && aiApiKeyInput) {
    btnSaveApiKey.addEventListener('click', async () => {
      const apiKey = aiApiKeyInput.value.trim();
      if (!apiKey) {
        alert('API Key를 입력해 주세요.');
        return;
      }

      try {
        const token = localStorage.getItem('kfcman_auth_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-KFCMan-Auth'] = token;

        const res = await fetch('/api/admin/config/gemini', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ apiKey })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'API Key 저장 실패');
        }

        alert('Gemini API Key가 성공적으로 저장되었습니다!');
        aiApiKeyInput.value = '';
        aiApiKeyInput.placeholder = '🔑 API Key가 이미 등록되어 있습니다.';
      } catch (e) {
        alert(e.message);
      }
    });
  }

  if (aiGenerateForm) {
    aiGenerateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const prompt = aiPromptInput.value.trim();
      if (!prompt) return;

      const originalBtnHtml = btnAiGenerateSubmit.innerHTML;
      btnAiGenerateSubmit.disabled = true;
      btnAiGenerateSubmit.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> <span>주제 분석 및 톡방 생성 중...</span>`;
      if (window.lucide) window.lucide.createIcons();

      try {
        const token = localStorage.getItem('kfcman_auth_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['X-KFCMan-Auth'] = token;

        const res = await fetch('/api/admin/generate-topics', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            wallId: boardId,
            prompt: prompt
          })
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || '주제 생성 실패');
        }

        const data = await res.json();
        alert(data.message || 'AI 주제 톡방이 생성되었습니다.');
        closeAiModal();
        aiPromptInput.value = '';
      } catch (err) {
        alert(err.message);
      } finally {
        btnAiGenerateSubmit.disabled = false;
        btnAiGenerateSubmit.innerHTML = originalBtnHtml;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
  // --- ARCHIVE SAVE & LISTING EVENT LISTENERS ---
  const btnChatSaveArchive = document.getElementById('btn-chat-save-archive');
  const btnChatShowArchives = document.getElementById('btn-chat-show-archives');
  const archiveListModal = document.getElementById('archive-list-modal');
  const archiveListModalContent = document.getElementById('archive-list-modal-content');
  const btnCloseArchiveModal = document.getElementById('btn-close-archive-modal');
  const archiveModalList = document.getElementById('archive-modal-list');

  const closeArchiveModal = () => {
    if (archiveListModalContent) {
      archiveListModalContent.classList.remove('scale-100', 'opacity-100');
      archiveListModalContent.classList.add('scale-95', 'opacity-0');
      setTimeout(() => {
        archiveListModal.classList.add('hidden');
      }, 150);
    }
  };

  if (btnCloseArchiveModal) {
    btnCloseArchiveModal.addEventListener('click', closeArchiveModal);
  }

  // Mobile Back Button click handler
  const chatMobileBackBtn = document.getElementById('chat-mobile-back-btn');
  if (chatMobileBackBtn) {
    chatMobileBackBtn.addEventListener('click', () => {
      const layoutContainer = document.getElementById('chat-layout-container');
      if (layoutContainer) {
        layoutContainer.classList.remove('show-chat-room');
      }
      activeChatRoomCardId = null;
      renderChatLayout(currentWall);
    });
  }

  if (btnChatSaveArchive) {
    btnChatSaveArchive.addEventListener('click', async () => {
      const defaultName = (currentWall && currentWall.topic) ? currentWall.topic : '저장된 톡방';
      const archiveName = prompt('현재 톡방 상태를 저장할 이름을 입력해주세요:', defaultName);
      if (archiveName === null) return;

      const token = localStorage.getItem('kfcman_auth_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-KFCMan-Auth'] = token;

      try {
        const res = await fetch(`/api/wall/${boardId}/save-archive`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ archiveName })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '저장 실패');
        }
        alert('현재 톡방이 성공적으로 저장되었습니다!');
        renderSidebarArchivesList();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const renderArchivesList = async () => {
    if (!archiveModalList) return;
    archiveModalList.innerHTML = '<div class="text-center text-xs text-slate-400 py-4">불러오는 중...</div>';
    
    const targetParentId = boardId.startsWith('TALK') ? 'TALK' : boardId;
    try {
      const res = await fetch(`/api/wall/${targetParentId}/archives`);
      if (!res.ok) throw new Error('목록 조회 실패');
      const data = await res.json();
      
      if (data.length === 0) {
        archiveModalList.innerHTML = '<div class="text-center text-xs text-slate-400 py-6">저장된 기록이 없습니다.</div>';
        return;
      }
      
      archiveModalList.innerHTML = '';
      const token = localStorage.getItem('kfcman_auth_token');
      const isAdmin = isBoardAdmin();
      
      data.forEach(arc => {
        const dateStr = new Date(arc.createdAt).toLocaleString('ko-KR');
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800/80 gap-3";
        div.innerHTML = `
          <div class="min-w-0 flex-grow text-left">
            <h4 class="text-xs font-black text-slate-800 dark:text-slate-200 truncate" title="${arc.title}">${arc.title}</h4>
            <p class="text-[9px] text-slate-450 mt-1 font-bold">${dateStr}</p>
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button class="btn-go px-2.5 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm transition-all" data-id="${arc.id}">이동</button>
            ${isAdmin ? `<button class="btn-del px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm transition-all" data-id="${arc.id}">삭제</button>` : ''}
          </div>
        `;
        
        div.querySelector('.btn-go').onclick = () => {
          window.location.href = `/wall/${arc.id}`;
        };
        
        const delBtn = div.querySelector('.btn-del');
        if (delBtn) {
          delBtn.onclick = async () => {
            if (!confirm(`'${arc.title}' 기록을 정말 삭제하시겠습니까?`)) return;
            try {
              const headers = {};
              if (token) headers['X-KFCMan-Auth'] = token;
              const delRes = await fetch(`/api/wall/${arc.id}`, {
                method: 'DELETE',
                headers
              });
              if (!delRes.ok) throw new Error('삭제 실패');
              renderArchivesList();
            } catch (err) {
              alert(err.message);
            }
          };
        }
        
        archiveModalList.appendChild(div);
      });
    } catch (err) {
      archiveModalList.innerHTML = `<div class="text-center text-xs text-rose-500 py-4">${err.message}</div>`;
    }
  };

  if (btnChatShowArchives && archiveListModal) {
    btnChatShowArchives.addEventListener('click', () => {
      archiveListModal.classList.remove('hidden');
      setTimeout(() => {
        if (archiveListModalContent) {
          archiveListModalContent.classList.remove('scale-95', 'opacity-0');
          archiveListModalContent.classList.add('scale-100', 'opacity-100');
        }
      }, 50);
      renderArchivesList();
    });
  }
  
  if (window.lucide) window.lucide.createIcons();
}

// Robust, race-condition-free initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWall);
} else {
  initWall();
}
