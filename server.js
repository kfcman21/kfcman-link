const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

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
  'me'
]);

// --------------------------------------------------------------------------
// SECURITY MIDDLEWARE: Authenticate User Session Token & Role
// --------------------------------------------------------------------------
function authenticate(req, res, next) {
  const token = req.headers['x-kfcman-auth'];
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 누락되었습니다. 로그인이 필요합니다.' });
  }

  const username = db.getUsernameBySession(token);
  if (!username) {
    return res.status(401).json({ error: '인증 세션이 만료되었습니다. 다시 로그인해 주세요.' });
  }

  const user = db.cache.users[username.toLowerCase()];
  if (!user || user.approved === false) {
    return res.status(401).json({ error: '계정이 승인 대기 중이거나 비활성화되었습니다.' });
  }

  req.username = username;
  req.role = user.role || 'user';
  next();
}

function optionalAuthenticate(req, res, next) {
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

// Endpoint: Register User
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  const cleanUsername = username.trim();
  const usernameRegex = /^[a-zA-Z0-9_-]{3,16}$/;
  if (!usernameRegex.test(cleanUsername)) {
    return res.status(400).json({ 
      error: '아이디는 3~16자 크기여야 하며 영문, 숫자, 하이픈(-), 언더바(_)만 사용 가능합니다.' 
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
    const session = await db.loginUser(username, password);
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
app.get('/:code', async (req, res) => {
  const { code } = req.params;
  
  // Skip static files or reserved routes
  if (BLACKLIST.has(code) || code.includes('.')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 KFCMan.link Server running on port ${PORT}`);
  console.log(`🔗 Local Address: http://localhost:${PORT}`);
  console.log(`=========================================`);
});
