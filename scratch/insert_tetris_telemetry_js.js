const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('public/js/app.js');
let content = fs.readFileSync(targetPath, 'utf8');

const targetText = `    // 2. Fetch pending approvals list`;

const replacementText = `    // Fetch Tetris server statistics
    try {
      const tetrisResponse = await secureFetch('/api/tetris/stats');
      if (tetrisResponse.ok) {
        const tetrisData = await tetrisResponse.json();
        const playersEl = document.getElementById('monitor-tetris-players');
        const spectatorsEl = document.getElementById('monitor-tetris-spectators');
        const socketsEl = document.getElementById('monitor-tetris-sockets');
        const stateEl = document.getElementById('monitor-tetris-state');
        
        if (playersEl) playersEl.textContent = (tetrisData.activePlayers || 0) + '명';
        if (spectatorsEl) spectatorsEl.textContent = (tetrisData.spectators || 0) + '명';
        if (socketsEl) socketsEl.textContent = (tetrisData.totalConnections || 0) + '개';
        if (stateEl) {
          let stateText = '대기실 (lobby)';
          if (tetrisData.gameState === 'countdown') stateText = '카운트다운 (countdown)';
          else if (tetrisData.gameState === 'playing') stateText = '대결 중 (playing)';
          else if (tetrisData.gameState === 'finished') stateText = '종료 (finished)';
          stateEl.textContent = stateText;
        }
      }
    } catch (err) {
      console.error('Failed to load Tetris stats:', err);
    }

    // 2. Fetch pending approvals list`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = targetText.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const newContent = normalizedContent.replace(normalizedTarget, replacementText.replace(/\r\n/g, '\n'));
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log('Successfully inserted Tetris telemetry fetch code into app.js');
} else {
  console.error('Target text not found in app.js');
}
