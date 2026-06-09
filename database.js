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
      if (!this.cache.walls) this.cache.walls = {};
      if (!this.cache.walls['TALK']) {
        const initialTopics = [
          {
            title: "교무 행정 자동화 아이디어",
            desc: "AI(바이브 코딩)를 활용해 엑셀 대량 정산이나 문서 취합 등 행정 업무를 자동화하는 아이디어와 경험을 나눕니다.",
            welcome: "엑셀 매크로(VBA)나 파이썬 스크립트 작성을 AI에게 시켜 교무 업무 시간을 획기적으로 줄여본 경험이나 아이디어가 있으신가요?"
          },
          {
            title: "나만의 수업 보조 웹앱 만들기",
            desc: "개발 지식 없이 바이브 코딩으로 수업용 타이머, 영어 단어 카드, 퀴즈 앱 등 교실용 도구를 직접 제작한 후기를 공유합니다.",
            welcome: "학생들과 직접 수업시간에 쓸 수 있는 단어 매칭 게임이나 랜덤 자리 배치 웹을 1시간 만에 뚝딱 빌드해보셨나요? 팁을 공유해 주세요!"
          },
          {
            title: "생활지도 및 상담 기록 관리",
            desc: "학생들의 일일 태도 관찰이나 개별 민감 상담을 간편하게 기록하고 통계낼 수 있는 커스텀 기록 도구 아이디어를 교환합니다.",
            welcome: "구글 스프레드시트와 Apps Script를 바이브 코딩으로 엮어서 학생 맞춤형 상담 일지를 구축해본 노하우나 궁금한 점을 적어주세요."
          },
          {
            title: "행사 일정 및 시간표 자동 매칭",
            desc: "조건이 까다로운 동아리 선점 신청, 방과후 수업 시수 배정, 체육대회 대진표를 AI로 푸는 자동 매칭 알고리즘 도전을 나눕니다.",
            welcome: "해마다 복잡하게 얽히는 동아리 배정이나 다목적 행사 시간표 배치를 코딩 초보자로서 AI와 함께 해결해보려 했던 시도가 있으신가요?"
          },
          {
            title: "초보 교사의 바이브 코딩 궁금증",
            desc: "코딩을 아예 모르는 선생님들이 AI 도구를 활용해 원하는 프로그램을 만들 때 겪는 에러, 한계, 유용한 프롬프트 작성 팁을 묻고 답합니다.",
            welcome: "AI가 준 코드에 에러가 났을 때 대처법이나, 프롬프트를 어떻게 작성해야 내가 원하는 수업용 도구를 정확히 만들어줄지 편하게 질문해 주세요!"
          },
          {
            title: "학생들과 함께하는 AI/SW 프로젝트",
            desc: "학생들에게 복잡한 언어 문법 대신 바이브 코딩 개념을 접목하여 스스로 교내 문제를 해결하는 동아리/자율 프로젝트 운영 팁을 공유합니다.",
            welcome: "학생들이 AI 도구를 활용해 학교 식단 확인기나 학급 건의함 웹페이지를 직접 기획하고 제작하는 프로젝트 사례가 있다면 소개해주세요."
          }
        ];

        const cards = {};
        initialTopics.forEach((topic, idx) => {
          const cardId = crypto.randomUUID();
          cards[cardId] = {
            id: cardId,
            author: '📢 안내 로봇',
            title: topic.title,
            content: topic.desc,
            bgColor: ['bg-pastel-pink', 'bg-pastel-yellow', 'bg-pastel-blue', 'bg-pastel-green', 'bg-pastel-purple'][idx % 5],
            image: '',
            previewUrl: '',
            previewTitle: '',
            previewDesc: '',
            previewImage: '',
            likes: 0,
            comments: [
              {
                id: crypto.randomUUID(),
                author: '📢 안내 로봇',
                text: topic.welcome,
                likes: 3,
                createdAt: new Date(Date.now() - 3600000 * (idx + 1)).toISOString()
              }
            ],
            isNotice: false,
            sectionId: '',
            attachmentName: '',
            attachmentData: '',
            createdAt: new Date(Date.now() - 3600000 * (idx + 2)).toISOString()
          };
        });

        this.cache.walls['TALK'] = {
          id: 'TALK',
          title: '주제별 톡방',
          topic: '모두가 함께 의견을 나누는 주제별 소통 광장입니다.',
          description: '자유롭게 메시지를 보내 공통주제 톡방에 참여해 보세요!',
          creator: 'system',
          maxUsers: 0,
          layout: 'chat',
          sections: [],
          createdAt: new Date().toISOString(),
          cards: cards,
          members: {}
        };
        this.save();
      }
      if (this.cache.walls && this.cache.walls['TALK']) {
        if (this.cache.walls['TALK'].title === '주제별 광장 톡방') {
          this.cache.walls['TALK'].title = '주제별 톡방';
          this.save();
        }
      }
      if (!this.cache.docs) this.cache.docs = {};
      
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
        walls: {},
        docs: {},
        notificationSettings: {
          email: { enabled: false, host: 'smtp.gmail.com', port: 465, secure: true, user: '', pass: '', receiver: '' },
          webhook: { enabled: false, url: '' },
          sms: { enabled: false, apiKey: '', apiSecret: '', sender: '', receiver: '', useKakao: false, pfId: '', templateId: '' }
        }
      };
    }
  }

  // Atomically save cache to db.json with a non-blocking queue
  async save() {
    if (this._saving) {
      this._pendingSave = true;
      return Promise.resolve();
    }
    this._saving = true;
    
    return new Promise((resolve) => {
      // Resolve immediately to keep APIs ultra fast (In-memory is already updated)
      resolve();

      const doSave = () => {
        const dataStr = JSON.stringify(this.cache, null, 2);
        fs.writeFile(TMP_FILE, dataStr, 'utf8', (err) => {
          if (err) {
            console.error('Failed to write temp database file', err);
            this._saving = false;
            return;
          }

          fs.rename(TMP_FILE, DB_FILE, (renameErr) => {
            if (renameErr) {
              console.error('Failed to rename temp file to database file', renameErr);
            }
            this._saving = false;
            
            if (this._pendingSave) {
              this._pendingSave = false;
              this._saving = true;
              // Throttle next save by 100ms to avoid disk thrashing
              setTimeout(doSave, 100);
            }
          });
        });
      };

      doSave();
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

    // Update user activity timestamp
    user.lastUsed = new Date().toISOString();

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
    // Update user activity timestamp
    const cleanOwner = owner.toLowerCase();
    const user = this.cache.users[cleanOwner];
    if (user) {
      user.lastUsed = new Date().toISOString();
    }

    const link = {
      code,
      originalUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
      clicksData: [],
      owner: cleanOwner
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
        lastUsed: u.lastUsed || u.createdAt,
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
      
      // If administrator is activating the user, clear suspension and request flags
      if (user.approved === true) {
        user.suspended = false;
        user.reactivateRequest = false;
        user.lastUsed = new Date().toISOString(); // Reset inactivity threshold timer
      }
      
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

  // --- COLLABORATIVE WALL MODULE (kfcman-wall) ---

  async createWall(title, topic, description, creator, maxUsers, layout) {
    if (!this.cache.walls) {
      this.cache.walls = {};
    }
    // Clean and normalize title for URL ID usage (remove spaces, preserve Korean/alphanumeric)
    const cleanTitle = (title || '').trim().replace(/[\s\t\n]+/g, '').replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-_]/g, '');
    let wallId = cleanTitle;

    if (!wallId) {
      // Fallback to random 6-digit hex if title has no valid characters
      do {
        wallId = crypto.randomBytes(3).toString('hex').toUpperCase();
      } while (this.cache.walls[wallId]);
    } else {
      wallId = wallId.toUpperCase();
      // If same board title already exists, append a short random token to ensure uniqueness
      let attempt = 0;
      const baseId = wallId;
      while (this.cache.walls[wallId]) {
        attempt++;
        const token = crypto.randomBytes(2).toString('hex').toUpperCase(); // e.g. "9F4E"
        wallId = `${baseId}-${token}`;
      }
    }

    const maxUsersVal = typeof maxUsers === 'number' ? maxUsers : parseInt(maxUsers) || 0;
    const sections = [];
    if (layout === 'columns') {
      if (maxUsersVal === 0) {
        sections.push({
          id: crypto.randomUUID(),
          name: '섹션 1',
          createdAt: new Date().toISOString()
        });
      }
    }

    const newWall = {
      id: wallId,
      title: title || '우리들의 실시간 알림 보드',
      topic: topic || '',
      description: description || '자유롭게 생각과 피드백을 나눠주세요!',
      creator: creator ? creator.trim().toLowerCase() : 'system',
      maxUsers: maxUsersVal,
      layout: ['columns', 'rows', 'timeline', 'chat'].includes(layout) ? layout : 'grid',
      sections: sections,
      createdAt: new Date().toISOString(),
      cards: {},
      members: {}
    };

    this.cache.walls[wallId] = newWall;
    await this.save();
    return newWall;
  }

  async getWall(wallId) {
    if (!this.cache.walls) {
      this.cache.walls = {};
    }
    const cleanId = wallId.trim().toUpperCase();
    const wall = this.cache.walls[cleanId] || null;
    if (wall && !wall.members) {
      wall.members = {};
    }
    return wall;
  }

  // --- SECTION CRUD METHODS FOR COLUMNS LAYOUT ---
  async addWallSection(wallId, name) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    if (!wall.sections) {
      wall.sections = [];
    }

    const sectionId = crypto.randomUUID();
    const newSection = {
      id: sectionId,
      name: (name && name.trim()) ? name.trim() : '이름 없는 섹션',
      createdAt: new Date().toISOString()
    };

    wall.sections.push(newSection);
    await this.save();
    return newSection;
  }

  async renameWallSection(wallId, sectionId, newName) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    if (!wall.sections) wall.sections = [];
    const section = wall.sections.find(s => s.id === sectionId);
    if (!section) throw new Error('존재하지 않는 섹션입니다.');

    section.name = (newName && newName.trim()) ? newName.trim() : '이름 없는 섹션';
    await this.save();
    return section;
  }

  async deleteWallSection(wallId, sectionId) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    if (!wall.sections) wall.sections = [];
    
    // Remove the section
    wall.sections = wall.sections.filter(s => s.id !== sectionId);

    // Cascade delete: remove all cards belonging to this section
    if (wall.cards) {
      for (const cardId in wall.cards) {
        if (wall.cards[cardId].sectionId === sectionId) {
          delete wall.cards[cardId];
        }
      }
    }

    await this.save();
    return true;
  }

  async addWallCard(wallId, author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, attachmentData) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    const cardId = crypto.randomUUID();
    const newCard = {
      id: cardId,
      author: (author && author.trim()) ? author.trim() : '익명',
      title: (title && title.trim()) ? title.trim() : '',
      content: (content && content.trim()) ? content.trim() : '',
      bgColor: bgColor || 'bg-pastel-pink', // Default pastel pink
      image: image || '',
      previewUrl: previewUrl || '',
      previewTitle: previewTitle || '',
      previewDesc: previewDesc || '',
      previewImage: previewImage || '',
      likes: 0,
      comments: [],
      isNotice: !!isNotice,
      sectionId: sectionId || '',
      attachmentName: attachmentName || '',
      attachmentData: attachmentData || '',
      createdAt: new Date().toISOString()
    };

    wall.cards[cardId] = newCard;
    await this.save();
    return newCard;
  }

  async likeWallCard(wallId, cardId, clientUuid) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    const card = wall.cards[cardId];
    if (!card) throw new Error('존재하지 않는 카드입니다.');

    if (!card.likedUuids) {
      card.likedUuids = [];
    }

    if (clientUuid) {
      if (card.likedUuids.includes(clientUuid)) {
        throw new Error('이미 이 카드에 좋아요를 누르셨습니다!');
      }
      card.likedUuids.push(clientUuid);
    }

    card.likes = (card.likes || 0) + 1;
    await this.save();
    return card;
  }

  async commentWallCard(wallId, cardId, author, text) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    const card = wall.cards[cardId];
    if (!card) throw new Error('존재하지 않는 카드입니다.');

    if (!card.comments) {
      card.comments = [];
    }

    const comment = {
      id: crypto.randomUUID(),
      author: (author && author.trim()) ? author.trim() : '익명',
      text: (text && text.trim()) ? text.trim() : '',
      likes: 0,
      createdAt: new Date().toISOString()
    };

    card.comments.push(comment);
    await this.save();
    return card;
  }

  async likeWallCardComment(wallId, cardId, commentId) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    const card = wall.cards[cardId];
    if (!card) throw new Error('존재하지 않는 카드입니다.');

    const comment = (card.comments || []).find(c => c.id === commentId);
    if (!comment) throw new Error('존재하지 않는 댓글입니다.');

    comment.likes = (comment.likes || 0) + 1;
    await this.save();
    return card;
  }

  async deleteWallCard(wallId, cardId) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    if (!wall.cards[cardId]) throw new Error('존재하지 않는 카드입니다.');

    delete wall.cards[cardId];
    await this.save();
    return true;
  }

  async editWallCard(wallId, cardId, author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, attachmentData) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    const card = wall.cards[cardId];
    if (!card) throw new Error('존재하지 않는 카드입니다.');

    card.author = (author && author.trim()) ? author.trim() : card.author;
    card.title = title !== undefined ? String(title || '').trim() : card.title;
    card.content = content !== undefined ? String(content || '').trim() : card.content;
    if (bgColor !== undefined) card.bgColor = bgColor;
    if (image !== undefined) card.image = image;
    if (previewUrl !== undefined) card.previewUrl = previewUrl;
    if (previewTitle !== undefined) card.previewTitle = previewTitle;
    if (previewDesc !== undefined) card.previewDesc = previewDesc;
    if (previewImage !== undefined) card.previewImage = previewImage;
    if (isNotice !== undefined) card.isNotice = !!isNotice;
    if (sectionId !== undefined) card.sectionId = sectionId;
    if (attachmentName !== undefined) card.attachmentName = attachmentName;
    if (attachmentData !== undefined) card.attachmentData = attachmentData;
    
    card.updatedAt = new Date().toISOString();

    await this.save();
    return card;
  }

  async clearWall(wallId) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');
    wall.cards = {};
    wall.members = {};
    if (wall.layout === 'columns' && wall.maxUsers > 0) {
      wall.sections = [];
    }
    await this.save();
    return wall;
  }

  async joinWall(wallId, number, name, emoji, clientUuid) {
    const wall = await this.getWall(wallId);
    if (!wall) throw new Error('존재하지 않는 게시판입니다.');

    if (!wall.members) {
      wall.members = {};
    }

    const existing = wall.members[number];
    if (existing && existing.clientUuid !== clientUuid) {
      throw new Error(`이미 다른 사용자가 선택한 번호(${number}번)입니다.`);
    }

    for (const num in wall.members) {
      if (wall.members[num].clientUuid === clientUuid) {
        const oldNumber = parseInt(num, 10);
        if (wall.layout === 'columns' && wall.maxUsers > 0) {
          const sectionName = `${oldNumber}번`;
          if (wall.sections) {
            const targetSection = wall.sections.find(s => s.name === sectionName);
            if (targetSection) {
              const sectionId = targetSection.id;
              wall.sections = wall.sections.filter(s => s.id !== sectionId);
              if (wall.cards) {
                for (const cardId in wall.cards) {
                  if (wall.cards[cardId].sectionId === sectionId) {
                    delete wall.cards[cardId];
                  }
                }
              }
            }
          }
        }
        delete wall.members[num];
      }
    }

    wall.members[number] = {
      name: (name && name.trim()) ? name.trim() : '이름 없음',
      emoji: emoji || '😃',
      clientUuid: clientUuid,
      joinedAt: new Date().toISOString()
    };

    if (wall.layout === 'columns' && wall.maxUsers > 0) {
      const sectionName = `${number}번`;
      if (!wall.sections) wall.sections = [];
      let exists = wall.sections.some(s => s.name === sectionName);
      if (!exists) {
        wall.sections.push({
          id: crypto.randomUUID(),
          name: sectionName,
          createdAt: new Date().toISOString()
        });
        // Sort wall.sections by slot number
        wall.sections.sort((a, b) => {
          const matchA = a.name.match(/^(\d+)번$/);
          const matchB = b.name.match(/^(\d+)번$/);
          const numA = matchA ? parseInt(matchA[1], 10) : 99999;
          const numB = matchB ? parseInt(matchB[1], 10) : 99999;
          return numA - numB;
        });
      }
    }

    await this.save();
    return wall;
  }

  async leaveWall(wallId, number, clientUuid) {
    const wall = await this.getWall(wallId);
    if (!wall) return null;

    if (wall.members && wall.members[number]) {
      if (wall.members[number].clientUuid === clientUuid) {
        delete wall.members[number];
        
        if (wall.layout === 'columns' && wall.maxUsers > 0) {
          const sectionName = `${number}번`;
          if (wall.sections) {
            const targetSection = wall.sections.find(s => s.name === sectionName);
            if (targetSection) {
              const sectionId = targetSection.id;
              wall.sections = wall.sections.filter(s => s.id !== sectionId);
              if (wall.cards) {
                for (const cardId in wall.cards) {
                  if (wall.cards[cardId].sectionId === sectionId) {
                    delete wall.cards[cardId];
                  }
                }
              }
            }
          }
        }
        
        await this.save();
      }
    }
    return wall;
  }

  async deleteWall(wallId, creatorOrAdmin) {
    if (!this.cache.walls) {
      this.cache.walls = {};
    }
    const cleanId = wallId.trim().toUpperCase();
    const wall = this.cache.walls[cleanId];
    if (!wall) return false;

    const cleanUser = String(creatorOrAdmin || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = wall.creator === cleanUser;

    if (isCreator || isAdmin) {
      delete this.cache.walls[cleanId];
      await this.save();
      return true;
    }
    throw new Error('이 게시판을 삭제할 권한이 없습니다.');
  }

  // --- KFC MAN-DOCS MODULE (한글 문서 공유 및 편집) ---

  async createDoc(title, content, creator, password = '', isPublic = true, hwpData = null, hwpName = null) {
    if (!this.cache.docs) {
      this.cache.docs = {};
    }
    const docId = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16-character unique hex id

    const newDoc = {
      id: docId,
      title: (title || '').trim() || '이름 없는 한글 문서',
      content: content || '',
      creator: creator ? creator.trim().toLowerCase() : 'system',
      password: password ? password.trim() : '',
      isPublic: !!isPublic,
      hwpData: hwpData || null, // Base64 raw HWP/HWPX binary data
      hwpName: hwpName || null, // Original uploaded file name
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedBy: creator ? creator.trim().toLowerCase() : 'system',
      history: [] // Simple history array
    };

    this.cache.docs[docId] = newDoc;
    await this.save();
    return newDoc;
  }

  async getDoc(docId) {
    if (!this.cache.docs) {
      this.cache.docs = {};
    }
    const cleanId = docId.trim().toUpperCase();
    return this.cache.docs[cleanId] || null;
  }

  async updateDoc(docId, title, content, updatedBy, hwpData = undefined, hwpName = undefined) {
    const doc = await this.getDoc(docId);
    if (!doc) throw new Error('존재하지 않는 문서입니다.');

    // Save current state to history before update
    if (!doc.history) doc.history = [];
    doc.history.push({
      title: doc.title,
      content: doc.content,
      hwpData: doc.hwpData,
      hwpName: doc.hwpName,
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt
    });

    // Keep history length reasonable
    if (doc.history.length > 20) {
      doc.history.shift();
    }

    doc.title = (title || '').trim() || '이름 없는 한글 문서';
    doc.content = content || '';
    if (hwpData !== undefined) doc.hwpData = hwpData;
    if (hwpName !== undefined) doc.hwpName = hwpName;
    doc.updatedAt = new Date().toISOString();
    doc.updatedBy = updatedBy ? updatedBy.trim().toLowerCase() : 'system';

    await this.save();
    return doc;
  }

  async deleteDoc(docId, username) {
    if (!this.cache.docs) {
      this.cache.docs = {};
    }
    const cleanId = docId.trim().toUpperCase();
    const doc = this.cache.docs[cleanId];
    if (!doc) return false;

    const cleanUser = String(username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = doc.creator === cleanUser;

    if (isCreator || isAdmin) {
      delete this.cache.docs[cleanId];
      await this.save();
      return true;
    }
    throw new Error('이 문서를 삭제할 권한이 없습니다.');
  }

  getUserDocs(username) {
    if (!this.cache.docs) {
      this.cache.docs = {};
    }
    const cleanUser = String(username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const docsList = [];

    for (const docId in this.cache.docs) {
      const doc = this.cache.docs[docId];
      if (isAdmin || doc.creator === cleanUser || doc.isPublic) {
        // Return without password for listing safety
        docsList.push({
          id: doc.id,
          title: doc.title,
          creator: doc.creator,
          isPublic: doc.isPublic,
          hasPassword: !!doc.password,
          hasHwpData: !!doc.hwpData,
          hwpName: doc.hwpName,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          updatedBy: doc.updatedBy
        });
      }
    }

    // Sort by updatedAt descending
    return docsList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }
}

module.exports = new Database();
