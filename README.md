# 회의록 관리 (팀 공유)

Firebase 기반 실시간 팀 회의록 관리 웹 애플리케이션입니다.

## 주요 기능

- Google 로그인 인증
- 회의록 생성/편집/삭제
- 마크다운 지원 (실시간 미리보기)
- 카테고리 분류 및 필터링
- 검색 기능
- 템플릿 관리
- 실시간 동기화 (Firebase Realtime Database)
- 파일 업로드/내보내기 (.md)

## 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Google)
- **Markdown**: marked.js + highlight.js

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성하고 Firebase 설정을 입력합니다.

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Realtime Database 활성화
3. Authentication에서 Google 로그인 활성화

### 2. 보안 규칙 설정

Firebase Console > Realtime Database > Rules에서 다음 규칙을 적용합니다:

```json
{
  "rules": {
    "meetings": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

이 규칙은 인증된 사용자만 회의록을 읽고 쓸 수 있도록 제한합니다.

### 3. 도메인 허용

Firebase Console > Authentication > Settings > Authorized domains에서 배포 도메인을 추가합니다.

## 프로젝트 구조

```
meeting/
├── index.html              # 메인 HTML
├── package.json            # 패키지 설정
├── vite.config.js          # Vite 설정
├── .env                    # 환경 변수 (gitignore)
├── .env.example            # 환경 변수 예시
├── .gitignore              # Git 무시 파일
├── src/
│   ├── main.js             # 앱 진입점
│   ├── styles/
│   │   └── main.css        # 스타일
│   ├── lib/
│   │   ├── firebase.js     # Firebase 초기화
│   │   └── marked-config.js # Marked 설정
│   ├── services/
│   │   ├── auth-service.js     # 인증 서비스
│   │   ├── meeting-service.js  # 회의록 서비스
│   │   ├── category-service.js # 카테고리 서비스
│   │   └── template-service.js # 템플릿 서비스
│   ├── ui/
│   │   ├── auth-ui.js      # 인증 UI
│   │   ├── meeting-list.js # 회의록 목록
│   │   ├── editor.js       # 에디터
│   │   └── modals.js       # 모달
│   └── utils/
│       └── helpers.js      # 유틸리티
├── firebase/
│   └── database.rules.json # 보안 규칙
└── README.md
```

## 단축키

- `Ctrl/Cmd + S`: 회의록 저장

## 라이선스

MIT License
