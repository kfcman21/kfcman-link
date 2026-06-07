const fs = require('fs');
const crypto = require('crypto');
const dbPath = '../data/db.json';

if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (db.walls && db.walls.TALK) {
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
    db.walls.TALK.cards = cards;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Successfully reset TALK cards in db.json');
  } else {
    console.log('TALK wall not found in db.json');
  }
} else {
  console.log('db.json not found at ' + dbPath);
}
