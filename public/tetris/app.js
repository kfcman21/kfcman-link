// --- AUDIO SYNTHESIZER ---
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, volume = 0.1) {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed:", e);
    }
  }

  move() {
    this.playTone(300, 'triangle', 0.05, 0.05);
  }

  rotate() {
    this.playTone(450, 'triangle', 0.08, 0.05);
  }

  clear(lines) {
    this.init();
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    const baseDur = 0.1;
    for (let i = 0; i < Math.min(lines, 4); i++) {
      setTimeout(() => {
        this.playTone(freqs[i], 'square', 0.15, 0.05);
      }, i * 70);
    }
  }

  garbage() {
    this.init();
    this.playTone(120, 'sawtooth', 0.3, 0.15);
    setTimeout(() => this.playTone(90, 'sawtooth', 0.2, 0.15), 100);
  }

  ko() {
    this.init();
    this.playTone(600, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(300, 'sawtooth', 0.3, 0.1), 100);
  }

  gameOver() {
    this.init();
    const notes = [392.00, 349.23, 311.13, 261.63];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.3, 0.1);
      }, idx * 150);
    });
  }

  victory() {
    this.init();
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    notes.forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.2, 0.1);
      }, idx * 100);
    });
  }
}

const synth = new SoundSynth();

// --- SHAPES & COLORS ---
const SHAPES = {
  'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
  'O': [[2,2], [2,2]],
  'T': [[0,3,0], [3,3,3], [0,0,0]],
  'S': [[0,4,4], [4,4,0], [0,0,0]],
  'Z': [[5,5,0], [0,5,5], [0,0,0]],
  'J': [[6,0,0], [6,6,6], [0,0,0]],
  'L': [[0,0,7], [7,7,7], [0,0,0]]
};

const COLORS = [
  '#0b0c15',          // Empty
  '#00f2fe',          // I: Cyan
  '#fffb00',          // O: Yellow
  '#9d00ff',          // T: Purple
  '#39ff14',          // S: Green
  '#ff007f',          // Z: Magenta
  '#005efc',          // J: Blue
  '#ff8c00'           // L: Orange
];

// --- CLIENT STATES ---
let socket = null;
let myPlayerId = null;
let currentGameState = 'lobby';
let isReady = false;
let isSpectator = false;
let opponents = {}; // cached database of players
let localGame = null;
let activeGameKey = '';

// ROOT VIEW CONTROLLERS
const participantView = document.getElementById('participant-view');
const adminView = document.getElementById('admin-view');

// PARTICIPANT MODE ELEMENTS
const onlineCountEl = document.getElementById('online-count');
const spectatorsCountEl = document.getElementById('spectators-count');
const statusBadge = document.getElementById('status-badge');
const readyBtn = document.getElementById('ready-btn');
const loginScreen = document.getElementById('login-screen');
const tabParticipant = document.getElementById('tab-participant');
const tabAdmin = document.getElementById('tab-admin');
const participantLoginForm = document.getElementById('participant-login-form');
const adminLoginForm = document.getElementById('admin-login-form');
const nicknameInputLogin = document.getElementById('nickname-input-login');
const adminUsernameLogin = document.getElementById('admin-username-login');
const adminPasswordLogin = document.getElementById('admin-password-login');
const togglePwBtn = document.getElementById('toggle-pw-btn');
const toggleNewPwBtn = document.getElementById('toggle-new-pw-btn');
const adminNewPwInput = document.getElementById('admin-new-pw-input');
const adminChangePwBtn = document.getElementById('admin-change-pw-btn');
const myNicknameDisplay = document.getElementById('my-nickname-display');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const battleLogEl = document.getElementById('battle-log');
const opponentsGrid = document.getElementById('opponents-grid');
const opponentsActiveCount = document.getElementById('opponents-active-count');
const leaderboardList = document.getElementById('leaderboard-list');

const scoreVal = document.getElementById('score-val');
const linesVal = document.getElementById('lines-val');
const levelVal = document.getElementById('level-val');
const kosVal = document.getElementById('kos-val');
const garbageGauge = document.getElementById('garbage-gauge');
const mainCanvas = document.getElementById('tetris-canvas');
const mainCtx = mainCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');

const gameOverlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const overlayStats = document.getElementById('overlay-stats');
const soundBtn = document.getElementById('sound-btn');

// ADMINISTRATOR TELEMETRY HUD ELEMENTS
const adminStateBadge = document.getElementById('admin-state-badge');
const adminPlayersCount = document.getElementById('admin-players-count');
const adminSpectatorsCount = document.getElementById('admin-spectators-count');
const adminStartGameBtn = document.getElementById('admin-start-game-btn');
const adminCopyUrlBtn = document.getElementById('admin-copy-url-btn');
const adminPoolGrid = document.getElementById('admin-pool-grid');
const adminLeaderboardList = document.getElementById('admin-leaderboard-list');
const adminChatMessages = document.getElementById('admin-chat-messages');
const adminBattleLog = document.getElementById('admin-battle-log');
const adminChatForm = document.getElementById('admin-chat-form');
const adminChatInput = document.getElementById('admin-chat-input');

// Establish WebSocket Connection
function connect() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("배틀 서버에 연결되었습니다.");
    // Auto admin login check
    const token = localStorage.getItem('kfcman_auth_token');
    if (token) {
      fetch('/api/me', {
        headers: { 'X-KFCMan-Auth': token }
      })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(data => {
        if (data && (data.role === 'admin' || data.role === 'manager')) {
          send({ type: 'login', token: token, isAdmin: true });
        }
      })
      .catch(err => {
        console.warn('Auto admin login check failed:', err);
      });
    }
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  };

  socket.onclose = () => {
    console.log("서버와 연결이 끊어졌습니다. 재접속 시도 중...");
    addLogMessage("시스템", "연결이 끊어졌습니다. 재접속 시도 중...", "system-msg");
    setTimeout(connect, 3000);
  };
}

function send(msgObj) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msgObj));
  }
}

// Sound Control
soundBtn.addEventListener('click', () => {
  synth.init();
  synth.muted = !synth.muted;
  if (synth.muted) {
    soundBtn.textContent = '🔇 음소거';
    soundBtn.classList.remove('active');
  } else {
    soundBtn.textContent = '🔊 소리 켬';
    soundBtn.classList.add('active');
    synth.playTone(440, 'sine', 0.1, 0.05);
  }
});

// Tab switching
tabParticipant.addEventListener('click', () => {
  tabParticipant.classList.add('active');
  tabAdmin.classList.remove('active');
  participantLoginForm.classList.remove('hidden');
  adminLoginForm.classList.add('hidden');
});

tabAdmin.addEventListener('click', () => {
  tabAdmin.classList.add('active');
  tabParticipant.classList.remove('active');
  adminLoginForm.classList.remove('hidden');
  participantLoginForm.classList.add('hidden');
});

// Form submissions
participantLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = nicknameInputLogin.value.trim();
  if (username) {
    const urlParams = new URLSearchParams(window.location.search);
    const joinKey = urlParams.get('key') || '';
    send({ type: 'login', username: username, isAdmin: false, joinKey: joinKey });
  }
});

adminLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = adminUsernameLogin.value.trim();
  const password = adminPasswordLogin.value.trim();
  if (username && password) {
    send({ type: 'login', username: username, password: password, isAdmin: true });
  }
});

// Toggle password visibility
togglePwBtn.addEventListener('click', () => {
  const isPw = adminPasswordLogin.type === 'password';
  adminPasswordLogin.type = isPw ? 'text' : 'password';
  togglePwBtn.textContent = isPw ? '🙈' : '👁️';
});

toggleNewPwBtn.addEventListener('click', () => {
  const isPw = adminNewPwInput.type === 'password';
  adminNewPwInput.type = isPw ? 'text' : 'password';
  toggleNewPwBtn.textContent = isPw ? '🙈' : '👁️';
});

// Admin change password click
adminChangePwBtn.addEventListener('click', () => {
  const newPw = adminNewPwInput.value.trim();
  if (newPw) {
    if (confirm("관리자 비밀번호를 변경하시겠습니까?")) {
      send({ type: 'change_admin_password', newPassword: newPw });
    }
  } else {
    alert("새 비밀번호를 입력해 주세요.");
  }
});

readyBtn.addEventListener('click', () => {
  if (isSpectator) return;
  synth.init();
  isReady = !isReady;
  send({ type: 'ready', ready: isReady });
  if (isReady) {
    readyBtn.textContent = '준비 완료!';
    readyBtn.classList.add('is-ready');
  } else {
    readyBtn.textContent = '게임 준비';
    readyBtn.classList.remove('is-ready');
  }
});

// Copy Invite URL (Admin only now)
if (adminCopyUrlBtn) {
  adminCopyUrlBtn.addEventListener('click', () => {
    const inviteLink = `${window.location.origin}/tetris/?key=${activeGameKey}`;
    navigator.clipboard.writeText(inviteLink)
      .then(() => {
        addLogMessage("시스템", "초대 주소가 클립보드에 복사되었습니다! 주소를 지인들에게 공유해보세요.");
        const origText = adminCopyUrlBtn.textContent;
        adminCopyUrlBtn.textContent = "복사 완료!";
        adminCopyUrlBtn.style.background = "var(--admin-green)";
        adminCopyUrlBtn.style.color = "#000";
        setTimeout(() => {
          adminCopyUrlBtn.textContent = origText;
          adminCopyUrlBtn.style.background = "";
          adminCopyUrlBtn.style.color = "";
        }, 1500);
      })
      .catch(err => {
        console.error("클립보드 복사 실패: ", err);
      });
  });
}

// Admin manual starts game
adminStartGameBtn.addEventListener('click', () => {
  send({ type: 'start_game' });
});

// Admin resets players
const adminResetPlayersBtn = document.getElementById('admin-reset-players-btn');
if (adminResetPlayersBtn) {
  adminResetPlayersBtn.addEventListener('click', () => {
    if (confirm("대기실의 모든 참가자 로그인 상태를 초기화하시겠습니까?")) {
      send({ type: 'reset_players' });
    }
  });
}

// Participant chat form submit
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (text) {
    send({ type: 'chat', text: text });
    chatInput.value = '';
  }
});

// Admin chat form submit
adminChatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = adminChatInput.value.trim();
  if (text) {
    send({ type: 'chat', text: `[공지] ${text}` });
    adminChatInput.value = '';
  }
});

// Appends logs to active layout elements
function addLogMessage(name, text, className = '') {
  const containers = [chatMessages, adminChatMessages];
  containers.forEach(container => {
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${className}`;
    if (name !== "시스템") {
      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = name + ':';
      msgDiv.appendChild(nameSpan);
    }
    const textNode = document.createTextNode(text);
    msgDiv.appendChild(textNode);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  });
}

function addBattleEvent(time, text) {
  const containers = [battleLogEl, adminBattleLog];
  containers.forEach(container => {
    if (!container) return;
    const logDiv = document.createElement('div');
    logDiv.className = 'log-message';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = `[${time}] `;
    timeSpan.style.color = 'var(--text-muted)';
    
    logDiv.appendChild(timeSpan);
    logDiv.appendChild(document.createTextNode(text));

    container.appendChild(logDiv);
    container.scrollTop = container.scrollHeight;
  });
}

// Handle Server Messages
function handleServerMessage(data) {
  switch (data.type) {
    case 'init':
      myPlayerId = data.playerId;
      updateStateBadge(data.gameState);
      break;
 
    case 'login_result':
      if (data.success) {
        loginScreen.classList.add('hidden');
        
        if (data.isAdmin) {
          isSpectator = true;
          isReady = false;
          if (data.activeGameKey) {
            activeGameKey = data.activeGameKey;
          }
          
          participantView.classList.add('hidden');
          adminView.classList.remove('hidden');
          adminStartGameBtn.classList.remove('hidden');
          addLogMessage("시스템", "관리자 로그인 성공! 관제 콘솔창으로 전환되었습니다.");
        } else {
          isSpectator = false;
          isReady = false;
          
          participantView.classList.remove('hidden');
          adminView.classList.add('hidden');
          myNicknameDisplay.textContent = data.nickname;
          addLogMessage("시스템", `대기실 입장 완료: ${data.nickname}`);
        }
      } else {
        alert(data.message || "로그인 실패.");
      }
      break;

    case 'active_key_update':
      if (data.activeGameKey) {
        activeGameKey = data.activeGameKey;
      }
      break;

    case 'change_password_result':
      alert(data.message);
      if (data.success) {
        adminNewPwInput.value = '';
      }
      break;

    case 'lobby_update':
      onlineCountEl.textContent = data.players.length;
      adminPlayersCount.textContent = data.players.length;
      spectatorsCountEl.textContent = data.spectatorsCount || 0;
      adminSpectatorsCount.textContent = data.spectatorsCount || 0;
      
      // If we are verified admin, make sure start game is visible
      if (isSpectator) {
        adminStartGameBtn.classList.remove('hidden');
      }

      updateOpponentsList(data.players);
      break;

    case 'game_state':
      updateStateBadge(data.state);
      if (data.state === 'countdown') {
        showOverlay("대결 시작 준비", `잠시 후 대결이 시작됩니다! 시작 ${data.countdown}초 전...`);
        synth.playTone(300, 'sine', 0.1, 0.1);
        adminStartGameBtn.classList.add('hidden');
      } 
      else if (data.state === 'playing') {
        hideOverlay();
        adminStartGameBtn.classList.add('hidden');
        if (!isSpectator) {
          startLocalGame();
        }
      } 
      else if (data.state === 'finished') {
        if (localGame) {
          localGame.stop();
        }
        
        let winnerText = "우승자가 없습니다.";
        if (data.winner) {
          winnerText = `🏆 최종 우승: ${data.winner.nickname}`;
          if (data.winner.id === myPlayerId) {
            synth.victory();
          } else {
            synth.gameOver();
          }
        }
        
        showOverlay("경기 종료", winnerText);
        renderOverlayLeaderboard(data.leaderboard);
        
        send({ type: 'lobby_update' });
      } 
      else if (data.state === 'lobby') {
        hideOverlay();
        if (localGame) {
          localGame.stop();
          localGame = null;
        }
        if (!isSpectator) {
          isReady = false;
          readyBtn.textContent = '게임 준비';
          readyBtn.classList.remove('is-ready');
        }
        clearBoards();
      }
      break;

    case 'force_logout':
      alert(data.message || "로그아웃 되었습니다.");
      location.reload();
      break;

    case 'cloud_telemetry':
      updateCloudTelemetry(data);
      break;

    case 'chat':
      addLogMessage(data.nickname, data.text);
      break;

    case 'battle_log':
      addBattleEvent(data.log.time, data.log.text);
      break;

    case 'boards_sync':
      if (isSpectator) {
        syncSpectatorShowcase(data.updates);
      } else {
        syncOpponentBoards(data.updates);
      }
      break;

    case 'garbage':
      if (localGame && localGame.active) {
        localGame.queueGarbage(data.lines, data.attackerName);
      }
      break;

    case 'player_ko':
      if (data.playerId === myPlayerId) {
        synth.ko();
      } else {
        synth.playTone(180, 'square', 0.15, 0.08);
      }
      break;
  }
}

function updateStateBadge(state) {
  currentGameState = state;
  const badges = {
    'lobby': '대기실',
    'countdown': '시작 대기',
    'playing': '게임 중',
    'finished': '게임 완료'
  };
  const koreanText = badges[state] || state.toUpperCase();
  
  statusBadge.textContent = koreanText;
  statusBadge.className = `status-badge ${state}`;
  
  adminStateBadge.textContent = koreanText;
  adminStateBadge.className = `metric-val ${state}`;
}

function showOverlay(title, subtitle) {
  overlayTitle.textContent = title;
  overlaySubtitle.textContent = subtitle;
  overlayStats.innerHTML = '';
  gameOverlay.classList.remove('hidden');
}

function hideOverlay() {
  gameOverlay.classList.add('hidden');
}

function renderOverlayLeaderboard(leaderboard) {
  overlayStats.innerHTML = '';
  leaderboard.slice(0, 5).forEach((p, index) => {
    const row = document.createElement('div');
    row.className = 'stat-row-overlay';
    row.innerHTML = `
      <span>#${index + 1} ${p.nickname} ${p.kos > 0 ? `🔥${p.kos}` : ''}</span>
      <span>${p.score.toLocaleString()}점 (${p.lines}줄 제거)</span>
    `;
    overlayStats.appendChild(row);
  });
}

function clearBoards() {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  garbageGauge.style.height = '0%';
  opponentsGrid.innerHTML = '';
  adminPoolGrid.innerHTML = '';
  opponents = {};
}

function updateOpponentsList(playerList) {
  const otherPlayers = playerList.filter(p => p.id !== myPlayerId);
  opponentsActiveCount.textContent = otherPlayers.filter(p => p.isAlive).length;

  const lists = [leaderboardList, adminLeaderboardList];
  lists.forEach(list => {
    if (!list) return;
    list.innerHTML = '';
    const ranked = playerList.sort((a,b) => b.score - a.score || b.kos - a.kos);
    
    if (ranked.length === 0) {
      list.innerHTML = '<div class="empty-state">대기실에 플레이어가 없습니다.</div>';
      return;
    }

    ranked.slice(0, 10).forEach((p, idx) => {
      const div = document.createElement('div');
      div.className = `leaderboard-item rank-${idx+1}`;
      div.innerHTML = `
        <div class="lead-left">
          <span class="lead-rank">#${idx+1}</span>
          <span class="lead-name">${p.nickname}</span>
        </div>
        <div>
          <span class="lead-score">${p.score.toLocaleString()}</span>
          ${p.kos > 0 ? `<span class="lead-kos">💀${p.kos}</span>` : ''}
        </div>
      `;
      list.appendChild(div);
    });
  });

  // Re-build opponents nickname registry
  otherPlayers.forEach(p => {
    if (!opponents[p.id]) {
      opponents[p.id] = { nickname: p.nickname, isAlive: p.isAlive, kos: p.kos };
    } else {
      opponents[p.id].nickname = p.nickname;
      opponents[p.id].isAlive = p.isAlive;
      opponents[p.id].kos = p.kos;
    }
  });

  // If in Participant mode, render mini side cards
  if (!isSpectator) {
    opponentsGrid.innerHTML = '';
    otherPlayers.slice(0, 12).forEach(p => {
      createOpponentCard(p.id, p.nickname);
      updateOpponentCardVisual(p.id);
    });
  }
}

function createOpponentCard(id, nickname) {
  const card = document.createElement('div');
  card.className = 'mini-board-card';
  card.id = `opp-card-${id}`;
  
  const header = document.createElement('div');
  header.className = 'mini-board-header';
  header.textContent = nickname;

  const canvas = document.createElement('canvas');
  canvas.width = 50;
  canvas.height = 100;

  card.appendChild(header);
  card.appendChild(canvas);
  opponentsGrid.appendChild(card);

  opponents[id] = opponents[id] || {};
  opponents[id].canvas = canvas;
  opponents[id].ctx = canvas.getContext('2d');
  opponents[id].grid = opponents[id].grid || [];
}

function updateOpponentCardVisual(id) {
  const card = opponents[id];
  const cardEl = document.getElementById(`opp-card-${id}`);
  if (!card || !cardEl) return;

  const header = cardEl.querySelector('.mini-board-header');
  header.textContent = card.nickname;

  let koOverlay = cardEl.querySelector('.ko-overlay');
  if (!card.isAlive) {
    cardEl.classList.add('ko');
    if (!koOverlay) {
      koOverlay = document.createElement('div');
      koOverlay.className = 'ko-overlay';
      koOverlay.innerHTML = '💀 K.O. <span>탈락</span>';
      cardEl.appendChild(koOverlay);
    }
  } else {
    cardEl.classList.remove('ko');
    if (koOverlay) koOverlay.remove();
  }

  let kosTag = cardEl.querySelector('.mini-board-kos');
  if (card.kos > 0) {
    if (!kosTag) {
      kosTag = document.createElement('div');
      kosTag.className = 'mini-board-kos';
      cardEl.appendChild(kosTag);
    }
    kosTag.textContent = `💀${card.kos}`;
  } else if (kosTag) {
    kosTag.remove();
  }
}

function syncOpponentBoards(updates) {
  Object.keys(updates).forEach(id => {
    const oppId = parseInt(id);
    if (oppId === myPlayerId) return;
    
    const u = updates[id];
    const opp = opponents[oppId];
    if (opp && opp.isAlive && opp.canvas) {
      const mockGrid = Array(20).fill().map(() => Array(10).fill(0));
      u.grid.forEach(cell => {
        const [y, x, colorIdx] = cell;
        if (y >= 0 && y < 20 && x >= 0 && x < 10) {
          mockGrid[y][x] = colorIdx;
        }
      });
      
      opp.grid = mockGrid;
      drawOpponentMiniBoard(opp);
    }
  });
}

function drawOpponentMiniBoard(opp) {
  const ctx = opp.ctx;
  const cw = opp.canvas.width;
  const ch = opp.canvas.height;
  const blockW = cw / 10;
  const blockH = ch / 20;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cw, ch);

  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
      const cell = opp.grid[y] ? opp.grid[y][x] : 0;
      if (cell !== 0) {
        ctx.fillStyle = COLORS[cell];
        ctx.fillRect(x * blockW, y * blockH, blockW - 0.5, blockH - 0.5);
      }
    }
  }
}

// --- SPECTATOR 50-BOARD REAL-TIME TELEMETRY DRAW LOOP ---
function syncSpectatorShowcase(updates) {
  adminPoolGrid.innerHTML = '';

  const activePlayers = Object.keys(updates).map(id => {
    const u = updates[id];
    return {
      id: parseInt(id),
      score: u.score,
      lines: u.lines,
      level: u.level,
      kos: u.kos,
      grid: u.grid
    };
  }).sort((a, b) => b.score - a.score);

  if (activePlayers.length === 0) {
    adminPoolGrid.innerHTML = '<div class="empty-state">대기실에 참여한 플레이어가 없습니다.</div>';
    return;
  }

  activePlayers.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'mini-board-card';
    card.id = `spectator-pool-${p.id}`;
    card.style.position = 'relative';
    card.style.aspectRatio = '10 / 24';

    const nickname = (opponents[p.id] && opponents[p.id].nickname) || `플레이어 ${p.id}`;

    const header = document.createElement('div');
    header.className = 'mini-board-header';
    header.style.background = 'rgba(0, 255, 102, 0.1)';
    header.style.color = 'var(--admin-green)';
    header.style.fontWeight = '700';
    header.textContent = `#${idx + 1} ${nickname}`;

    const canvas = document.createElement('canvas');
    canvas.width = 90;
    canvas.height = 180;
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';

    const statsOverlay = document.createElement('div');
    statsOverlay.style.fontSize = '0.55rem';
    statsOverlay.style.padding = '4px';
    statsOverlay.style.textAlign = 'center';
    statsOverlay.style.background = 'rgba(10, 12, 24, 0.8)';
    statsOverlay.style.borderTop = '1px solid rgba(0, 255, 102, 0.1)';
    statsOverlay.innerHTML = `점수: ${p.score.toLocaleString()} | 줄: ${p.lines}`;

    card.appendChild(header);
    card.appendChild(canvas);
    card.appendChild(statsOverlay);
    
    if (p.kos > 0) {
      const kosTag = document.createElement('div');
      kosTag.className = 'mini-board-kos';
      kosTag.style.background = 'rgba(255, 157, 0, 0.8)';
      kosTag.textContent = `💀${p.kos}`;
      card.appendChild(kosTag);
    }

    adminPoolGrid.appendChild(card);

    const ctx = canvas.getContext('2d');
    drawShowcaseGrid(ctx, 90, 180, p.grid);
  });
}

function drawShowcaseGrid(ctx, cw, ch, compressedCells) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cw, ch);

  const blockW = cw / 10;
  const blockH = ch / 20;

  compressedCells.forEach(cell => {
    const [y, x, colorIdx] = cell;
    if (y >= 0 && y < 20 && x >= 0 && x < 10) {
      ctx.fillStyle = COLORS[colorIdx];
      ctx.fillRect(x * blockW, y * blockH, blockW - 0.5, blockH - 0.5);
    }
  });
}

// --- LOCAL GAME ENGINE ---
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 3;
    this.alpha = 1;
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.02;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2 + Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class TetrisGame {
  constructor() {
    this.grid = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.kos = 0;
    this.active = false;
    
    this.bag = [];
    this.nextQueue = [];
    this.holdPiece = null;
    this.hasHeldThisTurn = false;
    
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentRot = 0;

    this.pendingGarbage = 0;
    this.killerName = null;
    this.killerId = null;

    this.lastFall = Date.now();
    this.fallInterval = 1000;
    this.lockDelay = 500;
    this.lockTimer = null;
    this.onGround = false;

    this.particles = [];
    this.shakeFrames = 0;

    this.setupPieces();
  }

  setupPieces() {
    this.refillBag();
    this.nextQueue = [this.drawPiece(), this.drawPiece(), this.drawPiece()];
    this.spawnNext();
  }

  refillBag() {
    const keys = Object.keys(SHAPES);
    this.bag = [...keys].sort(() => Math.random() - 0.5);
  }

  drawPiece() {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop();
  }

  spawnNext() {
    const nextType = this.nextQueue.shift();
    this.nextQueue.push(this.drawPiece());

    this.currentPiece = {
      type: nextType,
      matrix: SHAPES[nextType],
      colorIdx: Object.keys(SHAPES).indexOf(nextType) + 1
    };

    this.currentX = Math.floor((10 - this.currentPiece.matrix[0].length) / 2);
    this.currentY = this.currentPiece.type === 'I' ? -1 : 0;
    this.hasHeldThisTurn = false;

    if (this.checkCollision(this.currentPiece.matrix, this.currentX, this.currentY)) {
      this.gameOver();
    }

    this.drawHoldNext();
  }

  checkCollision(matrix, px, py) {
    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x] !== 0) {
          const targetX = px + x;
          const targetY = py + y;

          if (targetX < 0 || targetX >= 10 || targetY >= 20) {
            return true;
          }
          if (targetY >= 0 && this.grid[targetY][targetX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  move(dx) {
    if (!this.active) return;
    if (!this.checkCollision(this.currentPiece.matrix, this.currentX + dx, this.currentY)) {
      this.currentX += dx;
      synth.move();
      this.resetLockTimer();
      return true;
    }
    return false;
  }

  rotate(dir) {
    if (!this.active) return;
    const matrix = this.currentPiece.matrix;
    const n = matrix.length;
    const rotated = Array(n).fill().map(() => Array(n).fill(0));

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (dir > 0) {
          rotated[c][n - 1 - r] = matrix[r][c];
        } else {
          rotated[n - 1 - c][r] = matrix[r][c];
        }
      }
    }

    const kicks = [0, -1, 1, -2, 2];
    for (let kick of kicks) {
      if (!this.checkCollision(rotated, this.currentX + kick, this.currentY)) {
        this.currentPiece.matrix = rotated;
        this.currentX += kick;
        synth.rotate();
        this.resetLockTimer();
        break;
      }
    }
  }

  softDrop() {
    if (!this.active) return;
    if (!this.checkCollision(this.currentPiece.matrix, this.currentX, this.currentY + 1)) {
      this.currentY++;
      this.score += 1;
      this.lastFall = Date.now();
      updateLocalScoreUI();
      return true;
    }
    return false;
  }

  hardDrop() {
    if (!this.active) return;
    let drops = 0;
    while (!this.checkCollision(this.currentPiece.matrix, this.currentX, this.currentY + 1)) {
      this.currentY++;
      drops++;
    }
    this.score += drops * 2;
    this.lockPiece();
    this.shakeFrames = 8;
    synth.move();
  }

  hold() {
    if (!this.active || this.hasHeldThisTurn) return;
    
    const oldHold = this.holdPiece;
    this.holdPiece = this.currentPiece.type;
    
    if (oldHold) {
      this.nextQueue.unshift(oldHold);
    }
    
    this.spawnNext();
    this.hasHeldThisTurn = true;
    synth.rotate();
    this.drawHoldNext();
  }

  resetLockTimer() {
    if (this.onGround) {
      this.lastFall = Date.now();
    }
  }

  update() {
    if (!this.active) return;

    const touchingGround = this.checkCollision(this.currentPiece.matrix, this.currentX, this.currentY + 1);
    
    if (touchingGround) {
      if (!this.onGround) {
        this.onGround = true;
        this.lockTimer = Date.now();
      }
      
      if (Date.now() - this.lockTimer >= this.lockDelay) {
        this.lockPiece();
      }
    } else {
      this.onGround = false;
      if (Date.now() - this.lastFall >= this.fallInterval) {
        this.currentY++;
        this.lastFall = Date.now();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  lockPiece() {
    const matrix = this.currentPiece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const targetY = this.currentY + r;
          const targetX = this.currentX + c;
          if (targetY >= 0 && targetY < 20) {
            this.grid[targetY][targetX] = this.currentPiece.colorIdx;
          }
        }
      }
    }

    this.checkLines();
    this.spawnGarbageLines();
    this.spawnNext();
    this.onGround = false;
    
    send({
      type: 'board_update',
      grid: this.grid,
      score: this.score,
      lines: this.lines,
      level: this.level
    });
  }

  checkLines() {
    let cleared = 0;
    for (let y = 20 - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== 0)) {
        const canvasBlockW = mainCanvas.width / 10;
        const canvasBlockH = mainCanvas.height / 20;
        for (let x = 0; x < 10; x++) {
          const pColor = COLORS[this.grid[y][x]];
          for (let pIdx = 0; pIdx < 4; pIdx++) {
            this.particles.push(new Particle(
              x * canvasBlockW + canvasBlockW/2,
              y * canvasBlockH + canvasBlockH/2,
              pColor
            ));
          }
        }

        this.grid.splice(y, 1);
        this.grid.unshift(Array(10).fill(0));
        cleared++;
        y++;
      }
    }

    if (cleared > 0) {
      this.lines += cleared;
      const basePoints = [0, 100, 300, 500, 800];
      this.score += basePoints[cleared] * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.fallInterval = Math.max(100, 1000 - (this.level - 1) * 80);

      updateLocalScoreUI();
      synth.clear(cleared);
      this.shakeFrames = cleared * 5;

      if (cleared >= 2) {
        send({ type: 'clear_lines', count: cleared });
      }
    }
  }

  queueGarbage(lines, attackerName) {
    this.pendingGarbage += lines;
    this.killerName = attackerName;
    updateGarbageGauge(this.pendingGarbage);
    synth.garbage();
    this.shakeFrames = 6;
  }

  spawnGarbageLines() {
    if (this.pendingGarbage <= 0) return;

    for (let i = 0; i < this.pendingGarbage; i++) {
      if (this.grid[0].some(cell => cell !== 0)) {
        this.gameOver();
        break;
      }

      this.grid.shift();
      const garbageRow = Array(10).fill(8);
      const hole = Math.floor(Math.random() * 10);
      garbageRow[hole] = 0;

      this.grid.push(garbageRow);
    }

    this.pendingGarbage = 0;
    updateGarbageGauge(0);
  }

  getGhostY() {
    let ghostY = this.currentY;
    while (!this.checkCollision(this.currentPiece.matrix, this.currentX, ghostY + 1)) {
      ghostY++;
    }
    return ghostY;
  }

  draw() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    if (this.shakeFrames > 0) {
      mainCtx.save();
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      mainCtx.translate(dx, dy);
      this.shakeFrames--;
    }

    const blockW = mainCanvas.width / 10;
    const blockH = mainCanvas.height / 20;

    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 10; x++) {
        const cell = this.grid[y][x];
        if (cell !== 0) {
          drawBlock(mainCtx, x * blockW, y * blockH, blockW, blockH, cell === 8 ? '#475569' : COLORS[cell]);
        }
      }
    }

    if (this.currentPiece && this.active) {
      const ghostY = this.getGhostY();
      const mat = this.currentPiece.matrix;
      
      mainCtx.save();
      mainCtx.globalAlpha = 0.25;
      for (let r = 0; r < mat.length; r++) {
        for (let c = 0; c < mat[r].length; c++) {
          if (mat[r][c] !== 0) {
            drawBlock(mainCtx, (this.currentX + c) * blockW, (ghostY + r) * blockH, blockW, blockH, COLORS[this.currentPiece.colorIdx], true);
          }
        }
      }
      mainCtx.restore();

      for (let r = 0; r < mat.length; r++) {
        for (let c = 0; c < mat[r].length; c++) {
          if (mat[r][c] !== 0) {
            drawBlock(mainCtx, (this.currentX + c) * blockW, (this.currentY + r) * blockH, blockW, blockH, COLORS[this.currentPiece.colorIdx]);
          }
        }
      }
    }

    this.particles.forEach(p => p.draw(mainCtx));

    if (this.shakeFrames > 0) {
      mainCtx.restore();
    }
  }

  drawHoldNext() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (this.holdPiece) {
      const matrix = SHAPES[this.holdPiece];
      const color = COLORS[Object.keys(SHAPES).indexOf(this.holdPiece) + 1];
      drawCenteredMatrix(holdCtx, matrix, color, holdCanvas.width, holdCanvas.height);
    }

    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    this.nextQueue.slice(0, 3).forEach((type, idx) => {
      const matrix = SHAPES[type];
      const color = COLORS[Object.keys(SHAPES).indexOf(type) + 1];
      drawCenteredMatrix(nextCtx, matrix, color, nextCanvas.width, 80, idx * 80);
    });
  }

  gameOver() {
    this.active = false;
    send({ 
      type: 'game_over' 
    });
    
    const subtitleText = '다음 라운드가 시작될 때까지 기다려 주세요...';
    showOverlay("게임 오버", subtitleText);
    synth.gameOver();
  }

  stop() {
    this.active = false;
  }
}

function drawBlock(ctx, x, y, w, h, color, isGhost = false) {
  ctx.fillStyle = color;
  if (isGhost) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  } else {
    ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(x + 2, y + 2, w - 4, 3);
  }
}

function drawCenteredMatrix(ctx, matrix, color, canvasW, canvasH, offsetY = 0) {
  const n = matrix.length;
  const blockW = 15;
  const blockH = 15;
  const startX = (canvasW - (n * blockW)) / 2;
  const startY = offsetY + (canvasH - (n * blockH)) / 2;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (matrix[r][c] !== 0) {
        drawBlock(ctx, startX + c * blockW, startY + r * blockH, blockW, blockH, color);
      }
    }
  }
}

function updateLocalScoreUI() {
  if (localGame) {
    scoreVal.textContent = localGame.score.toLocaleString();
    linesVal.textContent = localGame.lines;
    levelVal.textContent = localGame.level;
  }
}

function updateGarbageGauge(lines) {
  const percent = Math.min(100, (lines / 12) * 100);
  garbageGauge.style.height = `${percent}%`;
}

function startLocalGame() {
  localGame = new TetrisGame();
  localGame.active = true;
  updateLocalScoreUI();
  updateGarbageGauge(0);
  
  function loop() {
    if (localGame && localGame.active) {
      localGame.update();
      localGame.draw();
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (!localGame || !localGame.active || isSpectator) return;
  
  switch(e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      localGame.move(-1);
      e.preventDefault();
      break;
    case 'ArrowRight':
    case 'KeyD':
      localGame.move(1);
      e.preventDefault();
      break;
    case 'ArrowUp':
    case 'KeyX':
      localGame.rotate(1);
      e.preventDefault();
      break;
    case 'KeyZ':
      localGame.rotate(-1);
      e.preventDefault();
      break;
    case 'ArrowDown':
    case 'KeyS':
      localGame.softDrop();
      e.preventDefault();
      break;
    case 'Space':
      localGame.hardDrop();
      e.preventDefault();
      break;
    case 'KeyC':
    case 'ShiftLeft':
    case 'ShiftRight':
      localGame.hold();
      e.preventDefault();
      break;
  }
});

function updateCloudTelemetry(data) {
  const uptimeEl = document.getElementById('cloud-uptime');
  const cpuEl = document.getElementById('cloud-cpu');
  const cpuBar = document.getElementById('cloud-cpu-bar');
  const memoryEl = document.getElementById('cloud-memory');
  const memoryBar = document.getElementById('cloud-memory-bar');
  const messagesEl = document.getElementById('cloud-messages');
  
  const totalCostEl = document.getElementById('cloud-total-cost');
  const costCpuEl = document.getElementById('cloud-cost-cpu');
  const costMemoryEl = document.getElementById('cloud-cost-memory');
  const costRequestsEl = document.getElementById('cloud-cost-requests');

  if (!uptimeEl) return;

  // 1. Set values
  const uptimeSeconds = data.uptime;
  uptimeEl.textContent = formatUptime(uptimeSeconds);
  
  cpuEl.textContent = `${data.cpuPercent}%`;
  cpuBar.style.width = `${data.cpuPercent}%`;
  
  const memoryMB = data.memoryBytes / 1024 / 1024;
  memoryEl.textContent = `${memoryMB.toFixed(1)} MB`;
  const memoryPercent = Math.min((memoryMB / 512) * 100, 100);
  memoryBar.style.width = `${memoryPercent}%`;

  messagesEl.textContent = `${data.totalMessages.toLocaleString()}건`;

  // 2. Billing estimations scaled to 30 days
  const scaleFactor = (30 * 24 * 3600) / Math.max(uptimeSeconds, 1);
  const projectedRequests = data.totalMessages * scaleFactor;
  // Node process CPU load * time
  const projectedCpuSeconds = (data.cpuPercent / 100) * 30 * 24 * 3600;
  // Node process Memory * time
  const memoryGiB = data.memoryBytes / 1024 / 1024 / 1024;
  const projectedGiBSeconds = memoryGiB * 30 * 24 * 3600;

  // Cloud Run Free tier
  const FREE_REQUESTS = 2000000;
  const FREE_CPU_SECS = 180000;
  const FREE_GIB_SECS = 360000;

  // Unit pricing (KRW estimation)
  const CPU_PRICE = 30; // ₩30 per vCPU-sec
  const MEM_PRICE = 3;  // ₩3 per GiB-sec
  const REQ_PRICE = 0.00055; // ₩0.00055 per request (₩550 per Million)

  const cpuCost = Math.max(0, projectedCpuSeconds - FREE_CPU_SECS) * CPU_PRICE;
  const memCost = Math.max(0, projectedGiBSeconds - FREE_GIB_SECS) * MEM_PRICE;
  const reqCost = Math.max(0, projectedRequests - FREE_REQUESTS) * REQ_PRICE;
  const totalCost = cpuCost + memCost + reqCost;

  costCpuEl.textContent = `₩${Math.round(cpuCost).toLocaleString()}`;
  costMemoryEl.textContent = `₩${Math.round(memCost).toLocaleString()}`;
  costRequestsEl.textContent = `₩${Math.round(reqCost).toLocaleString()}`;

  if (totalCost === 0) {
    totalCostEl.textContent = "₩0 (무료 제공량 충족)";
    totalCostEl.style.color = "var(--admin-green)";
  } else {
    totalCostEl.textContent = `₩${Math.round(totalCost).toLocaleString()} (예상 월간 요금)`;
    totalCostEl.style.color = "var(--admin-amber)";
  }
}

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0')
  ].join(':');
}

function initTouchControls() {
  const bindings = [
    { id: 'btn-touch-left', action: () => localGame.move(-1) },
    { id: 'btn-touch-right', action: () => localGame.move(1) },
    { id: 'btn-touch-cw', action: () => localGame.rotate(1) },
    { id: 'btn-touch-ccw', action: () => localGame.rotate(-1) },
    { id: 'btn-touch-harddrop', action: () => localGame.hardDrop() },
    { id: 'btn-touch-hold', action: () => localGame.hold() }
  ];

  bindings.forEach(binding => {
    const el = document.getElementById(binding.id);
    if (el) {
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!localGame || !localGame.active || isSpectator) return;
        binding.action();
      }, { passive: false });
    }
  });

  // Soft drop supports hold for continuous dropping
  const softDropEl = document.getElementById('btn-touch-softdrop');
  if (softDropEl) {
    let softDropInterval = null;
    softDropEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!localGame || !localGame.active || isSpectator) return;
      localGame.softDrop();
      if (softDropInterval) clearInterval(softDropInterval);
      softDropInterval = setInterval(() => {
        if (localGame && localGame.active && !isSpectator) {
          localGame.softDrop();
        } else {
          clearInterval(softDropInterval);
        }
      }, 80);
    }, { passive: false });

    const stopSoftDrop = (e) => {
      e.preventDefault();
      if (softDropInterval) {
        clearInterval(softDropInterval);
        softDropInterval = null;
      }
    };

    softDropEl.addEventListener('touchend', stopSoftDrop, { passive: false });
    softDropEl.addEventListener('touchcancel', stopSoftDrop, { passive: false });
  }
}

// --- THEME MANAGEMENT ---
function initTheme() {
  const isDark = localStorage.getItem('darkMode') !== 'disabled';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeButtons();
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  updateThemeButtons();
}

function updateThemeButtons() {
  const isDark = document.documentElement.classList.contains('dark');
  const buttons = document.querySelectorAll('.theme-toggle-btn');
  buttons.forEach(btn => {
    btn.textContent = isDark ? '☀️' : '🌙';
  });
}

// Bind theme events
document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
  btn.addEventListener('click', toggleTheme);
});

// Initialize theme on load
initTheme();

initTouchControls();
connect();

