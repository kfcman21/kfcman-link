const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');
const TMP_FILE = path.join(DB_DIR, 'db.json.tmp');

// Ensure database folder exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Ensure database file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(
    DB_FILE, 
    JSON.stringify({ users: {}, links: {}, sessions: {} }, null, 2), 
    'utf8'
  );
}

class Database {
  constructor() {
    this.cache = { users: {}, links: {}, sessions: {} };
    this.load();
  }

  // Synchronously load data into cache
  load() {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      this.cache = JSON.parse(content);
      if (!this.cache.users) this.cache.users = {};
      if (!this.cache.links) this.cache.links = {};
      if (!this.cache.sessions) this.cache.sessions = {};
      if (!this.cache.polls) this.cache.polls = {};
      if (!this.cache.classrooms) this.cache.classrooms = {};
      
      // Initialize default notification settings if missing
      if (!this.cache.notificationSettings) {
        this.cache.notificationSettings = {
          email: { enabled: false, host: 'smtp.gmail.com', port: 465, secure: true, user: '', pass: '', receiver: '' },
          webhook: { enabled: false, url: '' },
          sms: { enabled: false, apiKey: '', apiSecret: '', sender: '', receiver: '', useKakao: false, pfId: '', templateId: '' }
        };
      } else {
        // Safe check for newly added Alimtalk properties inside sms config
        if (this.cache.notificationSettings.sms && this.cache.notificationSettings.sms.useKakao === undefined) {
          this.cache.notificationSettings.sms.useKakao = false;
          this.cache.notificationSettings.sms.pfId = '';
          this.cache.notificationSettings.sms.templateId = '';
        }
      }
    } catch (err) {
      console.error('Failed to load database. Initializing empty database.', err);
      this.cache = { 
        users: {}, 
        links: {}, 
        sessions: {},
        polls: {},
        classrooms: {},
        notificationSettings: {
          email: { enabled: false, host: 'smtp.gmail.com', port: 465, secure: true, user: '', pass: '', receiver: '' },
          webhook: { enabled: false, url: '' },
          sms: { enabled: false, apiKey: '', apiSecret: '', sender: '', receiver: '', useKakao: false, pfId: '', templateId: '' }
        }
      };
    }
  }

  // Atomically save cache to db.json
  async save() {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(this.cache, null, 2);
      fs.writeFile(TMP_FILE, dataStr, 'utf8', (err) => {
        if (err) {
          console.error('Failed to write temp database file', err);
          return reject(err);
        }

        fs.rename(TMP_FILE, DB_FILE, (renameErr) => {
          if (renameErr) {
            console.error('Failed to rename temp file to database file', renameErr);
            return reject(renameErr);
          }
          resolve();
        });
      });
    });
  }

  // --- USER MODULE ---

  // Register a new user with secure password salt-hashing and approval system
  async registerUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    if (this.cache.users[cleanUsername]) {
      throw new Error('이미 사용 중인 아이디입니다.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Automatically approve administrator (kfcman or admin)
    const isAdmin = cleanUsername === 'kfcman' || cleanUsername === 'admin';

    const user = {
      username: cleanUsername,
      salt,
      hash,
      approved: isAdmin, // Admins are approved by default
      role: isAdmin ? 'admin' : 'user',
      warning: '', // Warning string (empty by default)
      createdAt: new Date().toISOString()
    };

    this.cache.users[cleanUsername] = user;
    await this.save();
    return { username: cleanUsername, approved: user.approved };
  }

  // Login verification, approval check, and session token issuance
  async loginUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.cache.users[cleanUsername];
    if (!user) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== user.hash) {
      throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // Block unapproved accounts
    if (user.approved === false) {
      throw new Error('회원가입 승인 대기 중입니다. 관리자의 승인이 필요합니다.');
    }

    // Generate a secure random session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    this.cache.sessions[sessionToken] = cleanUsername;
    await this.save();

    return { token: sessionToken, username: cleanUsername, role: user.role || 'user' };
  }

  // Check login session token
  getUsernameBySession(token) {
    return this.cache.sessions[token] || null;
  }

  // Logout session clearance
  async logoutUser(token) {
    if (this.cache.sessions[token]) {
      delete this.cache.sessions[token];
      await this.save();
      return true;
    }
    return false;
  }

  // Get all users waiting for administrator approval
  getPendingUsers() {
    const list = [];
    for (const username in this.cache.users) {
      const u = this.cache.users[username];
      if (u.approved === false) {
        list.push({
          username: u.username,
          createdAt: u.createdAt
        });
      }
    }
    return list;
  }

  // Approve a pending user
  async approveUser(username) {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.cache.users[cleanUsername];
    if (user) {
      user.approved = true;
      await this.save();
      return true;
    }
    return false;
  }

  // Reject and delete a pending user signup
  async rejectUser(username) {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.cache.users[cleanUsername];
    if (user && user.approved === false) {
      delete this.cache.users[cleanUsername];
      await this.save();
      return true;
    }
    return false;
  }

  // --- LINKS MODULE ---

  // Check if a code already exists
  exists(code) {
    return !!this.cache.links[code];
  }

  // Get link details by code
  getLink(code) {
    return this.cache.links[code] || null;
  }

  // Create a new shortened link associated with owner
  async createLink(code, originalUrl, owner) {
    const link = {
      code,
      originalUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
      clicksData: [],
      owner: owner.toLowerCase()
    };
    this.cache.links[code] = link;
    await this.save();
    return link;
  }

  // Record a click on a short code
  async recordClick(code, referrer = 'Direct', ip = 'Unknown') {
    const link = this.getLink(code);
    if (!link) return null;

    link.clicks += 1;
    
    const clickEvent = {
      timestamp: new Date().toISOString(),
      referrer: referrer || 'Direct',
      ip: ip || 'Unknown'
    };
    
    if (!link.clicksData) {
      link.clicksData = [];
    }
    
    link.clicksData.push(clickEvent);
    if (link.clicksData.length > 50) {
      link.clicksData.shift(); // Keep database light
    }

    await this.save();
    return link;
  }

  // Retrieve only links owned by the user (replaces localStorage filter)
  getUserLinks(username) {
    const cleanUsername = username.trim().toLowerCase();
    const results = [];
    for (const code in this.cache.links) {
      const link = this.cache.links[code];
      if (link.owner === cleanUsername) {
        results.push(link);
      }
    }
    return results;
  }

  // Retrieve bulk statistics for verification
  getBulkStats(codes) {
    const results = [];
    for (const code of codes) {
      const link = this.getLink(code);
      if (link) {
        results.push(link);
      }
    }
    return results;
  }

  // Delete a specific link owned by a user
  async deleteLink(code, username) {
    const cleanUsername = username.trim().toLowerCase();
    const link = this.getLink(code);
    if (!link) return false;
    
    if (link.owner === cleanUsername) {
      delete this.cache.links[code];
      await this.save();
      return true;
    }
    return false;
  }

  // Clear all links owned by a user
  async clearUserLinks(username) {
    const cleanUsername = username.trim().toLowerCase();
    let updated = false;
    for (const code in this.cache.links) {
      if (this.cache.links[code].owner === cleanUsername) {
        delete this.cache.links[code];
        updated = true;
      }
    }
    if (updated) {
      await this.save();
    }
    return updated;
  }

  // --- NOTIFICATION CONFIG MODULE ---
  getNotificationSettings() {
    if (!this.cache.notificationSettings) {
      this.cache.notificationSettings = {
        email: { enabled: false, host: 'smtp.gmail.com', port: 465, secure: true, user: '', pass: '', receiver: '' },
        webhook: { enabled: false, url: '' },
        sms: { enabled: false, apiKey: '', apiSecret: '', sender: '', receiver: '', useKakao: false, pfId: '', templateId: '' }
      };
    }
    return this.cache.notificationSettings;
  }

  async updateNotificationSettings(settings) {
    this.cache.notificationSettings = {
      email: {
        enabled: !!settings.email?.enabled,
        host: String(settings.email?.host || 'smtp.gmail.com').trim(),
        port: parseInt(settings.email?.port) || 465,
        secure: settings.email?.secure !== false,
        user: String(settings.email?.user || '').trim(),
        pass: String(settings.email?.pass || '').trim(),
        receiver: String(settings.email?.receiver || '').trim()
      },
      webhook: {
        enabled: !!settings.webhook?.enabled,
        url: String(settings.webhook?.url || '').trim()
      },
      sms: {
        enabled: !!settings.sms?.enabled,
        apiKey: String(settings.sms?.apiKey || '').trim(),
        apiSecret: String(settings.sms?.apiSecret || '').trim(),
        sender: String(settings.sms?.sender || '').trim(),
        receiver: String(settings.sms?.receiver || '').trim(),
        useKakao: !!settings.sms?.useKakao,
        pfId: String(settings.sms?.pfId || '').trim(),
        templateId: String(settings.sms?.templateId || '').trim()
      }
    };
    await this.save();
    return this.cache.notificationSettings;
  }

  // --- ADMIN USER MANAGEMENT & STATS ---

  // Get all users and their usage statistics
  getAllUsersStats() {
    const results = [];
    for (const username in this.cache.users) {
      const u = this.cache.users[username];
      
      // Calculate link stats for this user
      const userLinks = this.getUserLinks(u.username);
      const totalLinks = userLinks.length;
      const totalClicks = userLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
      
      results.push({
        username: u.username,
        role: u.role || 'user',
        approved: u.approved !== false,
        warning: u.warning || '',
        createdAt: u.createdAt,
        totalLinks,
        totalClicks
      });
    }
    return results;
  }

  // Toggle user block/approval status
  async toggleUserBlock(username) {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.cache.users[cleanUsername];
    if (user) {
      // Do not block primary administrators
      if (cleanUsername === 'kfcman' || cleanUsername === 'admin') {
        throw new Error('기본 관리자 계정은 비활성화할 수 없습니다.');
      }
      user.approved = !user.approved;
      await this.save();
      return user;
    }
    return null;
  }

  // Delete a user and all their links
  async deleteUserWithLinks(username) {
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername === 'kfcman' || cleanUsername === 'admin') {
      throw new Error('기본 관리자 계정은 삭제할 수 없습니다.');
    }
    
    const user = this.cache.users[cleanUsername];
    if (user) {
      // Delete all links owned by this user
      await this.clearUserLinks(cleanUsername);
      
      // Delete user account
      delete this.cache.users[cleanUsername];
      await this.save();
      return true;
    }
    return false;
  }

  // Set or clear warning message for a user
  async setUserWarning(username, message) {
    const cleanUsername = username.trim().toLowerCase();
    const user = this.cache.users[cleanUsername];
    if (user) {
      user.warning = String(message || '').trim();
      await this.save();
      return user;
    }
    return null;
  }

  // --- REAL-TIME POLLS/SURVEYS MODULE ---

  // Create a new preference poll
  async createPoll(title, options, durationMinutes, allowMultiple, owner, dupMode, boardType, quizCorrectIndex, quizDuration) {
    const pollId = crypto.randomBytes(8).toString('hex');
    const createdAt = new Date().toISOString();
    const durationMs = parseInt(durationMinutes || 10) * 60000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    const formattedOptions = options.map((opt, index) => ({
      index,
      text: String(opt || '').trim(),
      votes: 0,
      totalScore: 0 // For 'scale' type satisfaction evaluation
    }));

    const poll = {
      id: pollId,
      title: String(title || '').trim(),
      options: formattedOptions,
      allowMultiple: !!allowMultiple,
      dupMode: String(dupMode || 'once').toLowerCase(), // 'once' or 'hourly'
      boardType: String(boardType || 'bar').toLowerCase(), // 'bar', 'donut', 'cloud', 'open', 'scale', 'quiz'
      quizCorrectIndex: quizCorrectIndex !== undefined && quizCorrectIndex !== null ? parseInt(quizCorrectIndex) : null,
      quizDuration: quizDuration !== undefined && quizDuration !== null ? parseInt(quizDuration) : 30, // Default 30s
      owner: String(owner || 'guest').toLowerCase(),
      createdAt,
      expiresAt,
      subjectiveAnswers: [], // For 'open' type: { username, guestId, ip, text, nickname, timestamp }
      voters: [] // list of voters: { username: "...", ip: "...", timestamp: "...", nickname: "...", score: 100, selectedIndexes: [...] }
    };

    if (!this.cache.polls) {
      this.cache.polls = {};
    }
    this.cache.polls[pollId] = poll;
    await this.save();
    return poll;
  }

  // Get all polls
  getAllPolls() {
    if (!this.cache.polls) return [];
    return Object.values(this.cache.polls);
  }

  // Get specific poll
  getPoll(pollId) {
    if (!this.cache.polls) return null;
    return this.cache.polls[pollId] || null;
  }

  // Vote on a poll
  async votePoll(pollId, selectedIndexes, username, ip, guestId, extraPayload = {}) {
    const poll = this.getPoll(pollId);
    if (!poll) throw new Error('존재하지 않는 선호도 조사입니다.');

    // Check expiration
    if (new Date() > new Date(poll.expiresAt)) {
      throw new Error('이미 투표 기간이 마감되었습니다.');
    }

    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanGuestId = String(guestId || '').trim();
    const cleanIp = String(ip || 'Unknown').trim();
    const nickname = String(extraPayload.nickname || '익명 게스트').trim();

    // Check existing voter to allow re-voting (재참여)
    const prevVoteIndex = poll.voters.findIndex(v => {
      if (cleanUsername && v.username && v.username === cleanUsername) return true;
      if (!cleanUsername && cleanGuestId && v.guestId && v.guestId === cleanGuestId) return true;
      if (!cleanUsername && !cleanGuestId && cleanIp && v.ip && v.ip === cleanIp) return true;
      return false;
    });

    // 1. Handlers for Open Ended Type ('open')
    if (poll.boardType === 'open') {
      const subjectiveText = String(extraPayload.subjectiveText || '').trim();
      if (!subjectiveText) {
        throw new Error('의견을 작성해 주세요.');
      }
      
      // Remove previous answer if re-submitting
      if (prevVoteIndex !== -1) {
        poll.voters.splice(prevVoteIndex, 1);
        if (poll.subjectiveAnswers) {
          const prevAnsIdx = poll.subjectiveAnswers.findIndex(a => {
            if (cleanUsername && a.username === cleanUsername) return true;
            if (!cleanUsername && cleanGuestId && a.guestId === cleanGuestId) return true;
            if (!cleanUsername && !cleanGuestId && a.ip === cleanIp) return true;
            return false;
          });
          if (prevAnsIdx !== -1) poll.subjectiveAnswers.splice(prevAnsIdx, 1);
        }
      }

      if (!poll.subjectiveAnswers) poll.subjectiveAnswers = [];
      
      const newAnswer = {
        username: cleanUsername,
        guestId: cleanGuestId,
        ip: cleanIp,
        text: subjectiveText,
        nickname: nickname,
        timestamp: new Date().toISOString()
      };
      poll.subjectiveAnswers.push(newAnswer);

      poll.voters.push({
        username: cleanUsername,
        guestId: cleanGuestId,
        ip: cleanIp,
        nickname: nickname,
        timestamp: new Date().toISOString(),
        selectedIndexes: []
      });

      await this.save();
      return poll;
    }

    // 2. Handlers for Scale Evaluation Type ('scale')
    if (poll.boardType === 'scale') {
      const scores = extraPayload.scores || {}; // Expects { "0": 5, "1": 4 }
      
      // Subtract previous score and count if they already rated
      if (prevVoteIndex !== -1) {
        const prevVote = poll.voters[prevVoteIndex];
        const prevScores = prevVote.scores || {};
        Object.keys(prevScores).forEach(idxStr => {
          const idx = parseInt(idxStr);
          const option = poll.options.find(o => o.index === idx);
          if (option) {
            option.votes = Math.max(0, option.votes - 1);
            option.totalScore = Math.max(0, option.totalScore - (prevScores[idxStr] || 0));
          }
        });
        poll.voters.splice(prevVoteIndex, 1);
      }

      // Record and accumulate new scale ratings
      Object.keys(scores).forEach(idxStr => {
        const idx = parseInt(idxStr);
        const scoreVal = parseFloat(scores[idxStr]) || 0;
        const option = poll.options.find(o => o.index === idx);
        if (option) {
          option.votes += 1;
          if (!option.totalScore) option.totalScore = 0;
          option.totalScore += scoreVal;
        }
      });

      poll.voters.push({
        username: cleanUsername,
        guestId: cleanGuestId,
        ip: cleanIp,
        nickname: nickname,
        timestamp: new Date().toISOString(),
        scores: scores,
        selectedIndexes: Object.keys(scores).map(x => parseInt(x))
      });

      await this.save();
      return poll;
    }

    // 3. Handlers for Word Cloud Type ('cloud')
    if (poll.boardType === 'cloud') {
      const words = Array.isArray(extraPayload.words) ? extraPayload.words.map(w => String(w || '').trim()).filter(Boolean) : [];
      if (words.length === 0) {
        throw new Error('워드클라우드에 제출할 단어를 최소 하나 이상 입력해 주세요.');
      }

      // Subtract previous words if re-voting
      if (prevVoteIndex !== -1) {
        const prevVote = poll.voters[prevVoteIndex];
        const prevIndexes = prevVote.selectedIndexes || [];
        prevIndexes.forEach(idx => {
          const option = poll.options.find(o => o.index === idx);
          if (option && option.votes > 0) {
            option.votes -= 1;
          }
        });
        poll.voters.splice(prevVoteIndex, 1);
      }

      const selectedIndexes = [];
      words.forEach(word => {
        const cleanWord = word.substring(0, 20);
        let option = poll.options.find(o => o.text.toLowerCase() === cleanWord.toLowerCase());
        if (option) {
          option.votes += 1;
        } else {
          option = {
            index: poll.options.length,
            text: cleanWord,
            votes: 1
          };
          poll.options.push(option);
        }
        selectedIndexes.push(option.index);
      });

      poll.voters.push({
        username: cleanUsername,
        guestId: cleanGuestId,
        ip: cleanIp,
        nickname: nickname,
        timestamp: new Date().toISOString(),
        selectedIndexes: selectedIndexes,
        words: words
      });

      await this.save();
      return poll;
    }

    // 4. Handlers for Quiz Type ('quiz')
    if (poll.boardType === 'quiz') {
      const chosenIdx = parseInt(selectedIndexes !== undefined ? (Array.isArray(selectedIndexes) ? selectedIndexes[0] : selectedIndexes) : -1);
      if (isNaN(chosenIdx) || chosenIdx === -1) {
        throw new Error('퀴즈 정답 선택 문항이 올바르지 않습니다.');
      }

      // Quiz has strictly 1 submission limit per session for absolute fairness
      if (prevVoteIndex !== -1) {
        throw new Error('이 서바이벌 퀴즈는 이미 참여하셨습니다! 재참여가 제한됩니다.');
      }

      const isCorrect = chosenIdx === poll.quizCorrectIndex;
      let pointsEarned = 0;
      
      if (isCorrect) {
        const timeElapsedMs = parseInt(extraPayload.timeElapsedMs) || 0;
        const durationMs = (poll.quizDuration || 30) * 1000;
        const timeFactor = Math.max(0, 1 - (timeElapsedMs / durationMs));
        pointsEarned = Math.round(500 + 500 * timeFactor); // Speed bonus: faster is up to 1000 points!
      }

      const option = poll.options.find(o => o.index === chosenIdx);
      if (option) {
        option.votes += 1;
      }

      poll.voters.push({
        username: cleanUsername,
        guestId: cleanGuestId,
        ip: cleanIp,
        nickname: nickname,
        timestamp: new Date().toISOString(),
        selectedIndexes: [chosenIdx],
        isCorrect: isCorrect,
        pointsEarned: pointsEarned
      });

      await this.save();
      return poll;
    }

    // 4. Default handler for Multiple Choice / Word Cloud ('bar', 'donut', 'cloud')
    if (prevVoteIndex !== -1) {
      const prevVote = poll.voters[prevVoteIndex];
      const prevIndexes = prevVote.selectedIndexes || [];
      prevIndexes.forEach(idx => {
        const option = poll.options.find(o => o.index === idx);
        if (option && option.votes > 0) {
          option.votes -= 1;
        }
      });
      poll.voters.splice(prevVoteIndex, 1);
    }

    const indexesToVote = Array.isArray(selectedIndexes) ? selectedIndexes.map(x => parseInt(x)) : [parseInt(selectedIndexes)];
    if (indexesToVote.length === 0 || indexesToVote.some(isNaN)) {
      throw new Error('투표할 문항을 최소 하나 이상 선택해 주세요.');
    }

    if (!poll.allowMultiple && indexesToVote.length > 1) {
      throw new Error('이 선호도 조사는 중복 선택이 허용되지 않습니다. 단 하나의 문항만 선택 가능합니다.');
    }

    indexesToVote.forEach(idx => {
      const option = poll.options.find(o => o.index === idx);
      if (option) {
        option.votes += 1;
      }
    });

    poll.voters.push({
      username: cleanUsername,
      guestId: cleanGuestId,
      ip: cleanIp,
      nickname: nickname,
      timestamp: new Date().toISOString(),
      selectedIndexes: indexesToVote
    });

    await this.save();
    return poll;
  }

  // Delete poll
  async deletePoll(pollId, ownerOrAdmin) {
    const poll = this.getPoll(pollId);
    if (!poll) return false;

    const cleanUser = String(ownerOrAdmin || '').toLowerCase();
    
    // Allow if owner or if role is admin
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isOwner = poll.owner === cleanUser;

    if (isOwner || isAdmin) {
      delete this.cache.polls[pollId];
      await this.save();
      return true;
    }
    throw new Error('이 선호도 조사를 삭제할 권한이 없습니다.');
  }

  // --- CLASSROOM GAMIFICATION MODULE ---

  getClassroom(username) {
    const cleanUser = username.trim().toLowerCase();
    if (!this.cache.classrooms) {
      this.cache.classrooms = {};
    }
    
    let raw = this.cache.classrooms[cleanUser];

    // If no classroom exists, initialize with default empty/initialized state
    if (!raw) {
      const students = [];
      raw = {
        activeClassId: "class_default",
        classes: {
          "class_default": {
            id: "class_default",
            name: "우리 학급 (예시)",
            students,
            goals: [
              { id: 'goal_1', temp: 60.0, activity: '써바이벌 피구' },
              { id: 'goal_2', temp: 80.0, activity: '과자, 영화' },
              { id: 'goal_3', temp: 100.0, activity: '써바이벌 피구' }
            ],
            rules: {
              namePrivacy: false,
              rawToAchievementRatio: 50,
              thermometerRatio: 200
            }
          }
        }
      };
      this.cache.classrooms[cleanUser] = raw;
      this.save();
    }

    // Migration logic for old format
    if (raw && !raw.classes) {
      const migratedClass = {
        id: "class_default",
        name: raw.className || "우리 학급",
        students: raw.students || [],
        goals: raw.goals || [],
        rules: raw.rules || { namePrivacy: false, rawToAchievementRatio: 50, thermometerRatio: 200 }
      };
      raw = {
        activeClassId: "class_default",
        classes: {
          "class_default": migratedClass
        }
      };
      this.cache.classrooms[cleanUser] = raw;
      this.save();
    }

    return this.cache.classrooms[cleanUser];
  }

  async saveClassroom(username, data) {
    const cleanUser = username.trim().toLowerCase();
    if (!this.cache.classrooms) {
      this.cache.classrooms = {};
    }
    this.cache.classrooms[cleanUser] = data;
    await this.save();
    return data;
  }
}

module.exports = new Database();
