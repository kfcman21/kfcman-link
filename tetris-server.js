const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const db = require('./database');

let wss;
let players = {}; // id -> player object
let gameState = 'lobby'; // lobby, countdown, playing, finished
let countdownTimer = null;
let countdownVal = 5;
let gameWinner = null;
let battleLog = [];
let nextPlayerId = 1;
let totalWsMessagesReceived = 0;

// Dynamic join passcode for participants
let activeGameKey = generateRandomKey();

function generateRandomKey() {
  return Math.random().toString(36).substring(2, 10);
}

// Admin authentication passcode
const CONFIG_PATH = path.join(__dirname, 'config.json');
let adminPassword = 'admin123';

try {
  if (fs.existsSync(CONFIG_PATH)) {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (config.adminPassword) {
      adminPassword = config.adminPassword;
    }
  } else {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ adminPassword }), 'utf8');
  }
} catch (e) {
  console.error('Error loading config.json:', e);
}

// Profanity filter list
const PROFANITY_WORDS = [
  'admin', 'administrator', '관리자', '운영자', '방장', 'system', '시스템',
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'sex', 'cunt', 'bastard',
  '시발', '씨발', '개새끼', '새끼', '존나', '좃', '좆', '섹스', '보지', '자지',
  '병신', '지랄', '엠창', '느금', '느금마', '씨부랄', '씹'
];

function containsProfanity(text) {
  const normalized = text.toLowerCase().replace(/[\s\-_]/g, '');
  return PROFANITY_WORDS.some(word => normalized.includes(word));
}

const TICK_RATE = 100; // Broadcast updates every 100ms (10fps)

class Player {
  constructor(id, socket) {
    this.id = id;
    this.socket = socket;
    this.nickname = `플레이어 ${id}`;
    this.ready = false;
    this.isAlive = false;
    this.isSpectator = false;
    this.isHost = false; // Set to true upon successful admin login
    this.loggedIn = false;
    this.grid = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.koCount = 0;
    this.rank = 0;
    this.joinedAt = Date.now();
  }

  reset() {
    this.isAlive = false;
    this.grid = Array(20).fill().map(() => Array(10).fill(0));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.rank = 0;
  }
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  Object.values(players).forEach(player => {
    if (player.socket.readyState === WebSocket.OPEN) {
      player.socket.send(msg);
    }
  });
}

function sendToPlayer(player, data) {
  if (player.socket.readyState === WebSocket.OPEN) {
    player.socket.send(JSON.stringify(data));
  }
}

function handleMessage(player, data) {
  switch (data.type) {
    case 'login':
      const { username, password, isAdmin, token } = data;
      if (isAdmin) {
        let isTokenAdmin = false;
        let adminUser = 'admin';
        if (token) {
          const verifiedUsername = db.getUsernameBySession(token);
          if (verifiedUsername) {
            const user = db.cache.users[verifiedUsername.toLowerCase()];
            if (user && (user.role === 'admin' || user.role === 'manager')) {
              isTokenAdmin = true;
              adminUser = user.username;
            }
          }
        }

        if (isTokenAdmin || (username === 'admin' && password === adminPassword)) {
          player.loggedIn = true;
          player.isSpectator = true;
          player.isHost = true;
          player.nickname = `관리자 (${adminUser})`;
          
          sendToPlayer(player, {
            type: 'login_result',
            success: true,
            isAdmin: true,
            playerId: player.id,
            nickname: player.nickname,
            activeGameKey: activeGameKey
          });

          addBattleLog(`👁️ ${player.nickname}님이 관리자 권한으로 로그인했습니다.`);
          broadcastLobbyUpdate();
        } else {
          sendToPlayer(player, {
            type: 'login_result',
            success: false,
            isAdmin: true,
            message: '관리자 권한 인증에 실패했습니다.'
          });
        }
      } else {
        // Validate join key
        const { joinKey } = data;
        if (joinKey !== activeGameKey) {
          sendToPlayer(player, {
            type: 'login_result',
            success: false,
            isAdmin: false,
            message: '유효하지 않거나 만료된 접속 링크입니다. 관리자에게 새로운 접속 링크를 받아서 접속해 주세요.'
          });
          return;
        }

        const cleanNick = username.trim().substring(0, 12);
        if (!cleanNick) {
          sendToPlayer(player, {
            type: 'login_result',
            success: false,
            isAdmin: false,
            message: '닉네임을 입력해 주세요.'
          });
          return;
        }

        if (containsProfanity(cleanNick)) {
          sendToPlayer(player, {
            type: 'login_result',
            success: false,
            isAdmin: false,
            message: '닉네임에 금칙어(비속어/성적 표현 등)가 포함되어 있습니다.'
          });
          return;
        }

        player.loggedIn = true;
        player.isSpectator = false;
        player.isHost = false;
        player.nickname = cleanNick;
        
        sendToPlayer(player, {
          type: 'login_result',
          success: true,
          isAdmin: false,
          playerId: player.id,
          nickname: player.nickname
        });

        // Send a direct system message with rules
        sendToPlayer(player, {
          type: 'chat',
          nickname: '📢 아레나 규칙',
          text: '최후의 1인이 남을 때까지 벌이는 서바이벌 배틀로얄입니다. 2줄 이상(2줄:1, 3줄:2, 4줄:4) 지우면 상대방에게 장애물이 공격으로 넘어갑니다.'
        });

        addBattleLog(`🎮 ${player.nickname}님이 대기실에 입장했습니다.`);
        broadcastLobbyUpdate();
      }
      break;

    case 'change_admin_password':
      if (player.isHost && player.isSpectator) {
        const newPw = data.newPassword ? data.newPassword.trim() : '';
        if (newPw.length < 4) {
          sendToPlayer(player, {
            type: 'change_password_result',
            success: false,
            message: '비밀번호는 최소 4글자 이상이어야 합니다.'
          });
        } else {
          adminPassword = newPw;
          try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify({ adminPassword }), 'utf8');
            sendToPlayer(player, {
              type: 'change_password_result',
              success: true,
              message: '관리자 비밀번호가 성공적으로 변경되었습니다.'
            });
            addBattleLog(`🛡️ 관리자가 접속 비밀번호를 변경했습니다.`);
          } catch (e) {
            console.error('Failed to save password change:', e);
            sendToPlayer(player, {
              type: 'change_password_result',
              success: false,
              message: '비밀번호를 저장하는 중 서버 오류가 발생했습니다.'
            });
          }
        }
      }
      break;

    case 'start_game':
      if (player.isHost && player.isSpectator && (gameState === 'lobby' || gameState === 'finished')) {
        const totalNonSpectators = Object.values(players).filter(p => !p.isSpectator).length;
        if (totalNonSpectators > 0) {
          startCountdown();
        } else {
          sendToPlayer(player, {
            type: 'chat',
            nickname: '시스템',
            text: '참여 중인 플레이어가 없어 게임을 시작할 수 없습니다.'
          });
        }
      }
      break;

    case 'reset_players':
      if (player.isHost && player.isSpectator) {
        activeGameKey = generateRandomKey();
        
        Object.keys(players).forEach(id => {
          const p = players[id];
          if (!p.isHost) {
            sendToPlayer(p, { type: 'force_logout', message: '관리자가 참가자 정보를 초기화했습니다.' });
            setTimeout(() => {
              try { p.socket.close(); } catch(e) {}
            }, 100);
            delete players[id];
          }
        });
        addBattleLog("🛡️ 관리자가 대기실의 모든 참가자 연결을 초기화했습니다. (접속 코드 변경됨)");
        
        sendToPlayer(player, {
          type: 'active_key_update',
          activeGameKey: activeGameKey
        });

        broadcastLobbyUpdate();
      }
      break;

    case 'set_nickname':
      const newNickname = data.nickname.trim().substring(0, 15) || `플레이어 ${player.id}`;
      player.nickname = newNickname;
      broadcastLobbyUpdate();
      break;

    case 'ready':
      if (gameState === 'lobby' && !player.isSpectator) {
        player.ready = !!data.ready;
        broadcastLobbyUpdate();
      }
      break;

    case 'board_update':
      if (gameState === 'playing' && player.isAlive && !player.isSpectator) {
        player.grid = data.grid;
        player.score = data.score;
        player.lines = data.lines;
        player.level = data.level;
      }
      break;

    case 'clear_lines':
      if (gameState === 'playing' && player.isAlive && !player.isSpectator) {
        let garbageLines = 0;
        if (data.count === 2) garbageLines = 1;
        else if (data.count === 3) garbageLines = 2;
        else if (data.count === 4) garbageLines = 4;

        if (garbageLines > 0) {
          sendGarbage(player, garbageLines);
        }
      }
      break;

    case 'game_over':
      if (gameState === 'playing' && player.isAlive && !player.isSpectator) {
        player.isAlive = false;
        
        const alivePlayers = Object.values(players).filter(p => p.isAlive && !p.isSpectator);
        player.rank = alivePlayers.length + 1;

        const killerMsg = data.killer ? ` (공격자: ${data.killer})` : '';
        addBattleLog(`💀 ${player.nickname}님이 탈락했습니다!${killerMsg} (최종 순위 #${player.rank})`);

        if (data.killerId && players[data.killerId]) {
          players[data.killerId].koCount++;
        }

        broadcast({
          type: 'player_ko',
          playerId: player.id,
          nickname: player.nickname,
          rank: player.rank,
          killerNickname: data.killer || null
        });

        checkGameStatus();
      }
      break;

    case 'chat':
      const chatMsg = data.text.trim().substring(0, 80);
      if (chatMsg) {
        broadcast({
          type: 'chat',
          nickname: player.nickname,
          text: chatMsg
        });
      }
      break;
  }
}

function sendGarbage(attacker, lines) {
  const activeOpponents = Object.values(players).filter(p => p.id !== attacker.id && p.isAlive && !p.isSpectator);
  
  if (activeOpponents.length > 0) {
    const target = activeOpponents[Math.floor(Math.random() * activeOpponents.length)];
    sendToPlayer(target, {
      type: 'garbage',
      lines: lines,
      attackerId: attacker.id,
      attackerName: attacker.nickname
    });

    addBattleLog(`⚔️ ${attacker.nickname}님이 ${target.nickname}님에게 ${lines}줄의 쓰레기 블록을 보냈습니다!`);
  }
}

function startCountdown() {
  if (countdownTimer) return;
  
  gameState = 'countdown';
  countdownVal = 5;
  addBattleLog(`⏱️ 대결 시작 준비! 게임이 5초 후에 시작됩니다...`);
  
  broadcast({
    type: 'game_state',
    state: 'countdown',
    countdown: countdownVal
  });

  countdownTimer = setInterval(() => {
    countdownVal--;
    
    if (countdownVal > 0) {
      addBattleLog(`⏱️ 대결 시작 준비! 게임 시작 ${countdownVal}초 전...`);
    }

    broadcast({
      type: 'game_state',
      state: 'countdown',
      countdown: countdownVal
    });

    if (countdownVal <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      startGame();
    }
  }, 1000);
}

function startGame() {
  gameState = 'playing';
  battleLog = [];
  addBattleLog("🏁 배틀이 시작되었습니다! 최후의 1인이 되어보세요!");

  const participants = Object.values(players).filter(p => !p.isSpectator);

  Object.values(players).forEach(p => {
    p.reset();
    if (participants.includes(p)) {
      p.isAlive = true;
      p.ready = false;
    }
  });

  broadcast({
    type: 'game_state',
    state: 'playing',
    participants: participants.map(p => ({ id: p.id, nickname: p.nickname }))
  });
}

function checkGameStatus() {
  if (gameState !== 'playing') return;

  const activePlayers = Object.values(players).filter(p => p.isAlive && !p.isSpectator);
  const totalPlayers = Object.values(players).filter(p => !p.isSpectator);

  if (totalPlayers.length === 1) {
    if (activePlayers.length === 0) {
      endGame(null);
    }
  } 
  else if (activePlayers.length === 1) {
    endGame(activePlayers[0]);
  } else if (activePlayers.length === 0) {
    endGame(null);
  }
}

function endGame(winner) {
  gameState = 'finished';
  gameWinner = winner ? { id: winner.id, nickname: winner.nickname } : null;

  if (winner) {
    winner.rank = 1;
    winner.isAlive = false;
    addBattleLog(`🏆 최후의 승자! ${winner.nickname}님이 배틀로얄에서 최종 승리했습니다!`);
  } else {
    addBattleLog(`🏁 경기 종료! 승자가 없습니다.`);
  }

  const leaderboard = Object.values(players)
    .filter(p => !p.isSpectator)
    .map(p => ({
      id: p.id,
      nickname: p.nickname,
      rank: p.rank || (p.isAlive ? 1 : 99),
      score: p.score,
      lines: p.lines,
      kos: p.koCount
    }))
    .sort((a, b) => a.rank - b.rank || b.score - a.score);

  broadcast({
    type: 'game_state',
    state: 'finished',
    winner: gameWinner,
    leaderboard: leaderboard
  });

  setTimeout(() => {
    gameState = 'lobby';
    Object.values(players).forEach(p => p.reset());
    broadcast({
      type: 'game_state',
      state: 'lobby'
    });
    broadcastLobbyUpdate();
  }, 10000);
}

function broadcastLobbyUpdate() {
  const list = Object.values(players)
    .filter(p => p.loggedIn && !p.isSpectator)
    .map(p => ({
      id: p.id,
      nickname: p.nickname,
      ready: p.ready,
      isAlive: p.isAlive,
      score: p.score,
      lines: p.lines,
      kos: p.koCount
    }));

  const spectatorsCount = Object.values(players).filter(p => p.loggedIn && p.isSpectator).length;

  broadcast({
    type: 'lobby_update',
    players: list,
    spectatorsCount: spectatorsCount,
    gameState: gameState
  });
}

function addBattleLog(text) {
  const logItem = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    text: text
  };
  battleLog.push(logItem);
  if (battleLog.length > 50) battleLog.shift();

  broadcast({
    type: 'battle_log',
    log: logItem
  });
}

function compressGrid(grid) {
  const compressed = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
      if (grid[y][x] !== 0) {
        compressed.push([y, x, grid[y][x]]);
      }
    }
  }
  return compressed;
}

function initTetris(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    const playerId = nextPlayerId++;
    const player = new Player(playerId, ws);
    players[playerId] = player;

    console.log(`Tetris Player ${playerId} connected.`);

    sendToPlayer(player, {
      type: 'init',
      playerId: player.id,
      nickname: player.nickname,
      gameState: gameState
    });

    broadcastLobbyUpdate();

    ws.on('message', (message) => {
      totalWsMessagesReceived++;
      try {
        const data = JSON.parse(message);
        handleMessage(player, data);
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    });

    ws.on('close', () => {
      console.log(`Tetris Player ${player.id} disconnected.`);
      delete players[player.id];

      if (gameState === 'playing' && !player.isSpectator) {
        checkGameStatus();
      }
      
      broadcastLobbyUpdate();
    });
  });

  // Start board sync broadcast interval
  setInterval(() => {
    if (gameState !== 'playing') return;

    const boardUpdates = {};
    Object.values(players).forEach(p => {
      if (p.isAlive && !p.isSpectator) {
        boardUpdates[p.id] = {
          grid: compressGrid(p.grid),
          score: p.score,
          lines: p.lines,
          level: p.level,
          kos: p.koCount
        };
      }
    });

    broadcast({
      type: 'boards_sync',
      updates: boardUpdates
    });
  }, TICK_RATE);

  // Telemetry HUD for Admins
  setInterval(() => {
    const admins = Object.values(players).filter(p => p.loggedIn && p.isSpectator && p.isHost);
    if (admins.length === 0) return;

    const uptime = process.uptime();
    const memoryUsageBytes = process.memoryUsage().rss;
    
    let cpuPercent = 0.5;
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const elapUsage = process.cpuUsage(startUsage);
      const totalElapTime = elapUsage.user + elapUsage.system;
      const percent = (totalElapTime / (100 * 1000)) * 100;
      cpuPercent = Math.min(Math.max(percent, 0.1), 100.0).toFixed(1);
      
      const telemetryPayload = {
        type: 'cloud_telemetry',
        uptime: uptime + 0.1,
        memoryBytes: memoryUsageBytes,
        cpuPercent: parseFloat(cpuPercent),
        totalMessages: totalWsMessagesReceived
      };
      
      admins.forEach(admin => {
        sendToPlayer(admin, telemetryPayload);
      });
    }, 100);
  }, 2000);

  addBattleLog("아레나 대기실이 개설되었습니다. 플레이어들의 접속을 대기 중...");
}

function getStats() {
  const activePlayers = Object.values(players).filter(p => p.loggedIn && !p.isSpectator).length;
  const spectators = Object.values(players).filter(p => p.loggedIn && p.isSpectator).length;
  const totalConnections = Object.keys(players).length;
  return {
    activePlayers,
    spectators,
    totalConnections,
    gameState
  };
}

module.exports = { initTetris, getStats };
