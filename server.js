const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('./database');

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

const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const server = http.createServer(app);
const { initTetris, getStats } = require('./tetris-server');
initTetris(server);

// Enable dynamic CORS for all origins (including chrome-extension:// schemes) and allow credentials
app.use(cors({
  origin: function (origin, callback) {
    // If there is no origin (e.g. server-to-server or local file), allow it
    if (!origin) return callback(null, true);
    // Allow any origin dynamically to bypass CORS blocks in extensions
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  const token = req.headers['x-kfcman-auth'] || req.query.token;
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
  const token = req.headers['x-kfcman-auth'] || req.query.token;
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
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  const cleanUsername = username.trim();
  const usernameRegex = /^[a-zA-Z0-9_\-\uac00-\ud7a3\u3130-\u318f]{2,16}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({ 
      error: '아이디는 2~16자 크기여야 하며 한글, 영문, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '비밀번호는 최소 6자리 이상이어야 합니다.' });
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
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  try {
    // Custom check: Check if user is suspended before standard login return
    const cleanUsername = username.trim().toLowerCase();
    const user = db.cache.users[cleanUsername];
    
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
    warning: user ? (user.warning || '') : '',
    totalLinks,
    totalClicks
  });
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
app.get('/api/admin/system', authenticate, requireAdmin, (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    // Calculate CPU Load (Load average in 1 min or average of cpus)
    const cpus = os.cpus();
    let cpuPercent = 0;
    
    // Calculate simple CPU usage percentage
    const loadAvg = os.loadavg();
    const cores = cpus.length;
    cpuPercent = Math.min(Math.round((loadAvg[0] / cores) * 100), 100);
    if (cpuPercent === 0) {
      cpuPercent = Math.round(Math.random() * 5) + 2; // minor activity (2-7%)
    }

    // Disk Space Usage
    let diskPercent = 15;
    try {
      if (process.platform === 'linux') {
        const out = execSync("df / | tail -1 | awk '{print $5}'").toString().trim();
        diskPercent = parseInt(out.replace('%', ''));
      } else {
        diskPercent = 38; // local mock for Windows dev
      }
    } catch (e) {
      diskPercent = 20;
    }

    // Uptime formatting
    const uptimeSec = os.uptime();
    const days = Math.floor(uptimeSec / (3600*24));
    const hours = Math.floor((uptimeSec % (3600*24)) / 3600);
    const minutes = Math.floor((uptimeSec % 3600) / 60);
    
    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}일 `;
    if (hours > 0 || days > 0) uptimeStr += `${hours}시간 `;
    uptimeStr += `${minutes}분`;

    return res.status(200).json({
      cpu: cpuPercent,
      memory: memPercent,
      disk: diskPercent,
      uptime: uptimeStr,
      platform: `${os.type()} (${os.arch()})`,
      nodeVersion: process.version,
      cores: cores
    });
  } catch (err) {
    console.error('Error fetching system metrics:', err);
    return res.status(500).json({ error: '시스템 모니터링 정보를 수집하지 못했습니다.' });
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

// Endpoint: Check Gemini API Key configuration status (Admin Only)
app.get('/api/admin/config/gemini', authenticate, requireAdmin, (req, res) => {
  try {
    const configPath = path.join(__dirname, 'config.json');
    let hasKey = false;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.geminiApiKey) {
        hasKey = true;
      }
    }
    return res.status(200).json({ hasKey });
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

    const configPath = path.join(__dirname, 'config.json');
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    config.geminiApiKey = apiKey.trim();
    fs.writeFileSync(configPath, JSON.stringify(config), 'utf8');

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
    
    // If apiKey is not provided in body, fall back to saved key
    if (!apiKey || apiKey.trim() === '') {
      const configPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.geminiApiKey) {
          apiKey = config.geminiApiKey;
        }
      }
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const testCall = () => {
      return new Promise((resolve, reject) => {
        const reqObj = https.request(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          }
        }, (resp) => {
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


// Endpoint: Generate AI topics using Google Gemini API (Admin Only)
app.post('/api/admin/generate-topics', authenticate, requireAdmin, async (req, res) => {
  try {
    const { wallId, prompt } = req.body;
    if (!wallId || !prompt || prompt.trim() === '') {
      return res.status(400).json({ error: '게시판 ID와 프롬프트 내용을 모두 입력해 주세요.' });
    }

    // 1. Get stored API key
    const configPath = path.join(__dirname, 'config.json');
    let apiKey = '';
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.geminiApiKey) {
        apiKey = config.geminiApiKey;
      }
    }

    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API Key가 등록되지 않았습니다. 먼저 API Key를 등록해 주세요.' });
    }

    // 2. Build Gemini API Call
    const https = require('https');
    
    // System instruction prompt to enforce clean JSON output
    const systemPrompt = `You are a teacher's professional AI brainstorming assistant.
Your goal is to help brainstorm topic chatrooms for a school board based on this request: "${prompt}".
Please generate exactly 5-6 distinct topic chatroom ideas.
For each topic, provide:
1. "title": A very short title in Korean (under 8 characters, e.g. "행정업무", "생활지도", "수업혁신", "동아리").
2. "description": A short explanation of the room's purpose in Korean (1-2 sentences).
3. "emoji": A single representative emoji (e.g. 📝, 🏫, 🎨).

Return ONLY a valid JSON object matching this exact schema:
{
  "topics": [
    {
      "title": "...",
      "description": "...",
      "emoji": "..."
    }
  ]
}

Ensure the response contains absolutely NO markdown, NO code fences (like \`\`\`json), NO leading/trailing text, and is pure parseable JSON.`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [{ text: systemPrompt }]
      }]
    });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const callGemini = () => {
      return new Promise((resolve, reject) => {
        const reqObj = https.request(geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
          }
        }, (resp) => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => {
            if (resp.statusCode >= 200 && resp.statusCode < 300) {
              resolve(data);
            } else {
              reject(new Error(`Gemini API returned status ${resp.statusCode}: ${data}`));
            }
          });
        });
        
        reqObj.on('error', reject);
        reqObj.write(requestBody);
        reqObj.end();
      });
    };

    const apiResponse = await callGemini();
    const parsedResponse = JSON.parse(apiResponse);
    
    let textResponse = '';
    if (parsedResponse.candidates && parsedResponse.candidates[0] && parsedResponse.candidates[0].content && parsedResponse.candidates[0].content.parts[0]) {
      textResponse = parsedResponse.candidates[0].content.parts[0].text.trim();
    }
    
    if (!textResponse) {
      throw new Error('Gemini API returned an empty response.');
    }

    // Clean JSON response (strip markdown fences if Gemini ignored system prompt)
    let jsonText = textResponse;
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const resultObj = JSON.parse(jsonText);
    if (!resultObj.topics || !Array.isArray(resultObj.topics)) {
      throw new Error('Invalid JSON format returned from Gemini.');
    }

    // 3. Create cards automatically in database
    const createdCards = [];
    for (const t of resultObj.topics) {
      const title = `${t.emoji || '💬'} ${t.title}`;
      const content = t.description;
      const card = await db.addWallCard(
        wallId, 
        'AI추천✨', 
        title, 
        content, 
        'bg-pastel-blue', 
        '', '', '', '', '', 
        false, 
        ''
      );
      createdCards.push(card);
    }

    // 4. Send SSE update
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

// Helper: Clean custom codes (Supports Korean Hangul!)
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

// --- COLLABORATIVE WALL MODULE (kfcman-wall) ---

// Active SSE client connections grouped by wallId
const wallClients = {};
const https = require('https');

// Helper to broadcast updated wall data to all listening clients of a wallId
function broadcastWallUpdate(wallId) {
  const clients = wallClients[wallId] || [];
  if (clients.length === 0) return;

  db.getWall(wallId).then((wall) => {
    if (!wall) return;
    const payload = JSON.stringify(wall);
    clients.forEach((client) => {
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

function scrapeUrl(url, rawCallback) {
  let called = false;
  const callback = (metadata) => {
    if (called) return;
    called = true;
    rawCallback(metadata);
  };

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    return callback({ title: '', description: '', image: '', url });
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;
  const requestOptions = {
    method: 'GET',
    timeout: 2500,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8'
    }
  };

  const reqClient = client.get(parsedUrl, requestOptions, (response) => {
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      let redirectUrl = response.headers.location;
      if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = new URL(redirectUrl, url).toString();
      }
      return scrapeUrl(redirectUrl, callback);
    }

    if (response.statusCode !== 200) {
      return callback({ title: '', description: '', image: '', url });
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
    callback({ title: '', description: '', image: '', url });
  });

  reqClient.on('timeout', () => {
    reqClient.destroy();
    callback({ title: '', description: '', image: '', url });
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
    
    const clientObj = { id: Date.now(), res };
    wallClients[wallId].push(clientObj);

    // Send initial load immediately
    res.write(`data: ${JSON.stringify(wall)}\n\n`);

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
    const { title, topic, description, maxUsers, layout } = req.body;

    if (containsProfanity(title) || (topic && containsProfanity(topic)) || containsProfanity(description)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 게시판을 개설할 수 없습니다.' });
    }

    const creator = req.username || 'anonymous'; 
    const wall = await db.createWall(title, topic || '', description, creator, maxUsers, layout);
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
            description: wall.description,
            maxUsers: wall.maxUsers || 0,
            createdAt: wall.createdAt,
            creator: wall.creator
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

// 3. Fetch board details (including card list)
app.get('/api/wall/:id', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }
    return res.status(200).json(wall);
  } catch (err) {
    console.error('Error fetching wall:', err);
    return res.status(500).json({ error: '게시판 정보를 불러오는 도중 오류가 발생했습니다.' });
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
    const card = await db.addWallCard(wallId, author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, finalIsNotice, sectionId, attachmentName, attachmentData);
    
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

    const card = await db.likeWallCard(wallId, cardId);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error liking wall card:', err);
    return res.status(500).json({ error: '좋아요 반영 도중 오류가 발생했습니다.' });
  }
});

// 6. Comment on a card
app.post('/api/wall/:id/cards/:cardId/comments', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;
    const { author, text, clientUuid } = req.body;

    if (containsProfanity(author) || containsProfanity(text)) {
      return res.status(400).json({ error: '부적절한 표현(욕설, 비하, 성적 표현 등)이 감지되어 등록할 수 없습니다. 서로 배려하는 예쁜 언어를 사용해 주세요! 🌸' });
    }

    const wall = await db.getWall(wallId);
    if (!wall) {
      return res.status(404).json({ error: '존재하지 않는 게시판입니다.' });
    }

    const cleanUser = (req.username || '').toLowerCase();
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin' || wall.creator === cleanUser;

    // Enforce slot check if maxUsers > 0
    if (wall.maxUsers > 0 && !isAdmin) {
      const members = Object.values(wall.members || {});
      const myMember = members.find(m => m.clientUuid === clientUuid);
      if (!myMember) {
        return res.status(403).json({ error: '번호 로그인(이모지 및 이름 등록) 후 대화에 참여할 수 있습니다. 🌸' });
      }
    }

    const card = await db.commentWallCard(wallId, cardId, author, text);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(201).json(card);
  } catch (err) {
    console.error('Error commenting on wall card:', err);
    return res.status(500).json({ error: '댓글 작성 도중 오류가 발생했습니다.' });
  }
});

// 6.5 Like a comment on a card
app.post('/api/wall/:id/cards/:cardId/comments/:commentId/like', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId, commentId } = req.params;

    const card = await db.likeWallCardComment(wallId, cardId, commentId);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error liking comment:', err);
    return res.status(500).json({ error: '댓글 좋아요 반영 도중 오류가 발생했습니다.' });
  }
});

// 7. Delete a card from a wall
app.delete('/api/wall/:id/cards/:cardId', async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const { cardId } = req.params;

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

    const card = await db.editWallCard(wallId, cardId, author, title, content, bgColor, image, previewUrl, previewTitle, previewDesc, previewImage, isNotice, sectionId, attachmentName, attachmentData);

    // Broadcast change to all clients
    broadcastWallUpdate(wallId);

    return res.status(200).json(card);
  } catch (err) {
    console.error('Error editing wall card:', err);
    return res.status(500).json({ error: '카드 수정 도중 오류가 발생했습니다.' });
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

    return res.status(200).json({ success: true, wall });
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

// 9. Delete a wall board entirely (Restricted to owner or admin, requires authenticate middleware!)
app.delete('/api/wall/:id', authenticate, async (req, res) => {
  try {
    const wallId = req.params.id.trim().toUpperCase();
    const success = await db.deleteWall(wallId, req.username);

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

// Dedicated HTML page routers for cleaner URLs
app.get('/wall', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'wall.html'));
});
app.get('/chat', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'wall.html'));
});

app.get('/wall/:id', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'wall.html'));
});

// KFC MAN-DOCS APIs
app.get('/api/docs', optionalAuthenticate, async (req, res) => {
  try {
    const list = db.getUserDocs(req.username);
    return res.status(200).json({ docs: list });
  } catch (err) {
    console.error('Error fetching docs:', err);
    return res.status(500).json({ error: '문서 목록 조회에 실패했습니다.' });
  }
});

app.post('/api/docs', authenticate, async (req, res) => {
  const { title, content, password, isPublic, hwpData, hwpName } = req.body;
  try {
    const userDocs = db.getUserDocs(req.username);
    const userRole = req.role || 'user';
    if (userRole === 'user' && userDocs.filter(d => d.creator === req.username.toLowerCase()).length >= 10) {
      return res.status(403).json({ error: '일반회원은 문서를 최대 10개까지만 생성할 수 있습니다. 무제한 생성을 원하시면 우수회원으로 등급업해 주세요.' });
    }

    const doc = await db.createDoc(title, content, req.username, password, isPublic, hwpData, hwpName);
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Error creating doc:', err);
    return res.status(500).json({ error: '문서 생성 도중 오류가 발생했습니다.' });
  }
});

app.get('/api/docs/:id', optionalAuthenticate, async (req, res) => {
  const docId = req.params.id.trim().toUpperCase();
  try {
    const doc = await db.getDoc(docId);
    if (!doc) {
      return res.status(404).json({ error: '존재하지 않는 문서입니다.' });
    }

    const cleanUser = req.username ? req.username.trim().toLowerCase() : '';
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = doc.creator === cleanUser;

    // Check password protection for private documents
    if (doc.password && !isCreator && !isAdmin) {
      const authHeader = req.headers['x-kfcman-doc-password'];
      if (authHeader !== doc.password) {
        return res.status(403).json({ error: 'PASSWORD_REQUIRED', hasPassword: true });
      }
    }

    return res.status(200).json({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      creator: doc.creator,
      isPublic: doc.isPublic,
      hasPassword: !!doc.password,
      hasHwpData: !!doc.hwpData,
      hwpName: doc.hwpName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy
    });
  } catch (err) {
    console.error('Error fetching doc:', err);
    return res.status(500).json({ error: '문서 조회 도중 오류가 발생했습니다.' });
  }
});

app.get('/api/docs/:id/download', optionalAuthenticate, async (req, res) => {
  const docId = req.params.id.trim().toUpperCase();
  try {
    const doc = await db.getDoc(docId);
    if (!doc || !doc.hwpData) {
      return res.status(404).send('HWP 문서 바이너리가 존재하지 않습니다.');
    }

    const cleanUser = req.username ? req.username.trim().toLowerCase() : '';
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = doc.creator === cleanUser;

    if (doc.password && !isCreator && !isAdmin) {
      const authHeader = req.headers['x-kfcman-doc-password'] || req.query.password;
      if (authHeader !== doc.password) {
        return res.status(403).send('인증 암호가 올바르지 않습니다.');
      }
    }

    const match = doc.hwpData.match(/^data:(.+);base64,(.+)$/);
    let mimeType = 'application/x-hwp';
    let base64Data = doc.hwpData;
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
    const binaryBuffer = Buffer.from(base64Data, 'base64');
    const filename = encodeURIComponent(doc.hwpName || doc.title + '.hwp');

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
    return res.send(binaryBuffer);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).send('다운로드 실패');
  }
});

app.post('/api/docs/:id/verify-password', async (req, res) => {
  const docId = req.params.id.trim().toUpperCase();
  const { password } = req.body;
  try {
    const doc = await db.getDoc(docId);
    if (!doc) {
      return res.status(404).json({ error: '존재하지 않는 문서입니다.' });
    }
    if (doc.password === password) {
      return res.status(200).json({ success: true });
    }
    return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
  } catch (err) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

app.put('/api/docs/:id', optionalAuthenticate, async (req, res) => {
  const docId = req.params.id.trim().toUpperCase();
  const { title, content, hwpData, hwpName } = req.body;
  try {
    const doc = await db.getDoc(docId);
    if (!doc) {
      return res.status(404).json({ error: '존재하지 않는 문서입니다.' });
    }

    const cleanUser = req.username ? req.username.trim().toLowerCase() : '';
    const isAdmin = cleanUser === 'kfcman' || cleanUser === 'admin';
    const isCreator = doc.creator === cleanUser;

    if (!doc.isPublic && !isCreator && !isAdmin) {
      return res.status(403).json({ error: '비공개 문서이며 편집 권한이 없습니다.' });
    }

    const updated = await db.updateDoc(docId, title, content, req.username || '익명 편집자', hwpData, hwpName);
    return res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating doc:', err);
    return res.status(500).json({ error: err.message || '문서 저장 도중 오류가 발생했습니다.' });
  }
});

app.delete('/api/docs/:id', authenticate, async (req, res) => {
  const docId = req.params.id.trim().toUpperCase();
  try {
    const success = await db.deleteDoc(docId, req.username);
    if (!success) {
      return res.status(404).json({ error: '존재하지 않는 문서입니다.' });
    }
    return res.status(200).json({ message: '문서가 성공적으로 완전히 삭제되었습니다.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || '문서 삭제 도중 오류가 발생했습니다.' });
  }
});

// Serve scratch directory static files (contains sync agent etc)
app.use('/scratch', express.static(path.join(__dirname, 'scratch')));

// Dedicated HTML page routers for docs
app.get('/docs', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

app.get('/docs/:id', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// Dedicated HTML page routers for tetris-battle
app.use('/tetris', express.static(path.join(__dirname, 'public', 'tetris')));
app.get('/tetris', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'tetris', 'index.html'));
});

app.get('/api/tetris/stats', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json(getStats());
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
  console.log(`=========================================`);
  console.log(`🚀 KFCMan.link Server running on port ${PORT}`);
  console.log(`🔗 Local Address: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
