const { fork } = require('child_process');
const path = require('path');
const http = require('http');
const db = require('../database');

// 1. Direct setup in Database
async function setupDb() {
  console.log('Setting up database...');
  const wallId = 'TESTSLOTS';
  
  // Make sure we have a clean wall object
  db.cache.walls[wallId] = {
    id: wallId,
    title: 'Test Slots Wall',
    description: 'Testing slots revamp',
    creator: 'admin',
    maxUsers: 12,
    layout: 'columns',
    sections: [],
    createdAt: new Date().toISOString(),
    cards: {},
    members: {}
  };
  
  await db.save();
  console.log('Database saved successfully with wall ID:', wallId);
  return wallId;
}

// 2. HTTP request helper
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(postData);
    req.end();
  });
}

// 3. Main runner
async function main() {
  const wallId = await setupDb();

  console.log('Starting local server child process...');
  const serverPath = path.join(__dirname, '..', 'server.js');
  const serverProc = fork(serverPath, [], { silent: true });

  // Wait for server to start
  await new Promise((resolve) => {
    serverProc.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Server LOG]:', output.trim());
      if (output.includes('Server running')) {
        resolve();
      }
    });
    serverProc.stderr.on('data', (data) => {
      console.error('[Server ERR]:', data.toString().trim());
    });
  });

  console.log('Server is running. Running API assertions...');
  try {
    // Assert 1: Join slot 3
    console.log('Test 1: Joining slot 3...');
    const clientUuid1 = 'client-1';
    const join1 = await request('POST', `/api/wall/${wallId}/join`, {
      number: 3,
      name: '홍길동',
      emoji: '😎',
      clientUuid: clientUuid1
    });
    console.log('Join 1 Status:', join1.statusCode);
    if (join1.statusCode !== 200 || join1.body.wall.members['3'].name !== '홍길동') {
      throw new Error('Join 1 failed');
    }
    const sec3 = join1.body.wall.sections.find(s => s.name === '3번');
    if (!sec3) {
      throw new Error('Section "3번" was not dynamically created!');
    }
    console.log('SUCCESS: Section "3번" dynamically created');

    // Assert 1a: Post card to own slot (3번)
    console.log('Test 1a: Posting a card to Section "3번" with client-1...');
    const postCard1 = await request('POST', `/api/wall/${wallId}/cards`, {
      author: '홍길동',
      title: '안녕하세요',
      content: '테스트 카드입니다.',
      sectionId: sec3.id,
      clientUuid: clientUuid1
    });
    console.log('Post Card 1 Status:', postCard1.statusCode);
    if (postCard1.statusCode !== 201) {
      throw new Error('Failed to post card to matching section');
    }
    console.log('SUCCESS: Card posted to own column');

    // Assert 1b: Post card to unauthorized section
    console.log('Test 1b: Posting a card to Section "3번" with unauthorized client-2...');
    const postCard2 = await request('POST', `/api/wall/${wallId}/cards`, {
      author: '임꺽정',
      title: '해킹 시도',
      content: '남의 열에 글을 씁니다.',
      sectionId: sec3.id,
      clientUuid: 'client-2'
    });
    console.log('Post Card 2 Status (should be 403):', postCard2.statusCode);
    if (postCard2.statusCode !== 403) {
      throw new Error('Allowed posting card to unauthorized section!');
    }
    console.log('SUCCESS: Blocked card post to unauthorized column');

    // Assert 2: Join taken slot
    console.log('Test 2: Joining already taken slot 3 with different client...');
    const clientUuid2 = 'client-2';
    const join2 = await request('POST', `/api/wall/${wallId}/join`, {
      number: 3,
      name: '임꺽정',
      emoji: '😃',
      clientUuid: clientUuid2
    });
    console.log('Join 2 Status:', join2.statusCode, join2.body);
    if (join2.statusCode === 200) {
      throw new Error('Allowed joining a taken slot!');
    }
    console.log('SUCCESS: Prevented join on taken slot:', join2.body.error);

    // Assert 3: Same client change slot
    console.log('Test 3: Same client joining slot 5...');
    const joinDuplicate = await request('POST', `/api/wall/${wallId}/join`, {
      number: 5,
      name: '홍길동2',
      emoji: '🥳',
      clientUuid: clientUuid1
    });
    console.log('Join Duplicate Status:', joinDuplicate.statusCode);
    if (joinDuplicate.statusCode !== 200) {
      throw new Error('Same client failed to change slot');
    }
    const updatedWall = joinDuplicate.body.wall;
    if (updatedWall.members['3'] || updatedWall.members['5'].name !== '홍길동2') {
      throw new Error('Slot 3 was not released or slot 5 was not set correctly');
    }
    const hasSec3 = updatedWall.sections.some(s => s.name === '3번');
    const hasSec5 = updatedWall.sections.some(s => s.name === '5번');
    if (hasSec3 || !hasSec5) {
      throw new Error('Section 3 was not deleted or Section 5 was not created');
    }
    if (Object.keys(updatedWall.cards).length > 0) {
      throw new Error('Cards in Section 3 were not cascade-deleted');
    }
    console.log('SUCCESS: Old slot released, section & cards cascade deleted, and new slot/section set');

    // Assert 4: Profanity block
    console.log('Test 4: Joining slot 4 with profanity name...');
    const joinProfane = await request('POST', `/api/wall/${wallId}/join`, {
      number: 4,
      name: '개새끼',
      emoji: '😡',
      clientUuid: clientUuid2
    });
    console.log('Join Profane Status:', joinProfane.statusCode, joinProfane.body);
    if (joinProfane.statusCode === 200) {
      throw new Error('Allowed profanity name!');
    }
    console.log('SUCCESS: Blocked profanity name:', joinProfane.body.error);

    // Assert 5: Leave slot
    console.log('Test 5: Leaving slot 5...');
    const leaveRes = await request('POST', `/api/wall/${wallId}/leave`, {
      number: 5,
      clientUuid: clientUuid1
    });
    console.log('Leave Status:', leaveRes.statusCode);
    if (leaveRes.statusCode !== 200) {
      throw new Error('Leave failed');
    }

    // Verify slot is now free
    const getWallRes = await request('GET', `/api/wall/${wallId}`);
    console.log('Wall members after leave:', getWallRes.body.members);
    if (getWallRes.body.members['5']) {
      throw new Error('Slot was not cleared');
    }
    // Verify section "5번" is also deleted
    const hasSec5AfterLeave = getWallRes.body.sections.some(s => s.name === '5번');
    if (hasSec5AfterLeave) {
      throw new Error('Section 5 was not deleted after leaving!');
    }
    console.log('SUCCESS: Slot and dynamically created section cleared successfully!');

    console.log('ALL TESTS PASSED!');
  } catch (err) {
    console.error('TEST FAIL:', err.message);
    serverProc.kill();
    process.exit(1);
  }

  // Clean up
  console.log('Cleaning up server...');
  serverProc.kill();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
