# 배포 준비 가이드 — Firebase + 구글 로그인

현재 상태: 코드는 아직 localStorage 기반 그대로입니다. 아래 **1단계(Firebase 프로젝트 만들기)**를 사용자님이 직접 해주셔야, 그다음부터는 제가 로그인·Firestore 연동 코드를 작성해서 로컬에서 동작을 확인합니다. **실제로 외부에서 접속 가능한 주소로 배포(GitHub + Cloudflare Pages)하는 건 그 다음, 별도 확인 후에 진행합니다.**

Firebase CLI가 이 작업 환경에 없어서, 1단계는 제가 대신 할 수 없습니다.

---

## 1단계 · Firebase 프로젝트 만들기 (사용자님이 직접, 약 5분)

1. 브라우저에서 **https://console.firebase.google.com** 접속 → **edu.jkjin 계정**으로 로그인.
2. **"프로젝트 추가"(Add project)** 클릭.
3. 프로젝트 이름 입력 — 예: `classswap`. (Firebase가 뒤에 임의 번호를 붙여 프로젝트 ID를 자동 생성합니다. 그대로 두면 됩니다.)
4. Google Analytics 설정 화면이 나오면 **끄셔도 됩니다**(이 도구엔 필요 없음) — "이 프로젝트에서 Google Analytics 사용 안함" 선택 후 계속.
5. 프로젝트가 생성될 때까지 잠시 대기 → "계속" 클릭.

### 1-1. 구글 로그인 켜기
6. 왼쪽 메뉴에서 **빌드(Build) → Authentication** 클릭 → **"시작하기"(Get started)**.
7. **"Sign-in method"(로그인 방법)** 탭 → 제공업체 목록에서 **Google** 선택.
8. **사용 설정(Enable)** 토글 켜기 → "프로젝트 지원 이메일"에 **edu.jkjin 본인 메일** 선택 → **저장**.
9. (참고) **"설정" 탭 → "승인된 도메인"**에 `localhost`가 기본으로 들어가 있어서, 로컬에서 테스트하는 동안은 따로 손댈 게 없습니다. 나중에 실제 배포하면 그때 배포 주소를 여기에 추가해야 합니다 — 그건 2단계에서 제가 안내드리겠습니다.

### 1-2. 데이터 저장소(Firestore) 만들기
10. 왼쪽 메뉴에서 **빌드 → Firestore Database** 클릭 → **"데이터베이스 만들기"(Create database)**.
11. 위치(Location)는 **asia-northeast3 (Seoul)** 추천 — **한 번 정하면 나중에 못 바꾸니** 신중하게 선택하세요.
12. 보안 규칙 시작 모드는 **"프로덕션 모드"(잠금 모드)**로 시작하세요 — 보안 규칙(누가 읽고 쓸 수 있는지)은 제가 직접 작성해서 전체 내용을 드릴 예정입니다(테스트 모드로 하면 처음엔 아무나 접근 가능해서 위험합니다).

### 1-3. 웹 앱 등록하고 설정값 받기
13. 프로젝트 개요 옆 **톱니바퀴 아이콘 → "프로젝트 설정"(Project settings)**.
14. 아래로 스크롤 → **"내 앱"(Your apps)** 섹션 → **`</>`(웹 앱 추가) 아이콘** 클릭.
15. 앱 닉네임 입력 — 예: `ClassSwap`. **"이 앱에 대한 Firebase 호스팅도 설정합니다"는 체크하지 마세요**(Cloudflare Pages를 쓸 거라서 필요 없음).
16. **"앱 등록"** 클릭하면 화면에 아래와 비슷한 코드 블록이 나옵니다:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "classswap-xxxxx.firebaseapp.com",
  projectId: "classswap-xxxxx",
  storageBucket: "classswap-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

17. **이 `firebaseConfig` 객체 전체를 그대로 복사해서 저에게 붙여넣어 주세요.** (여기엔 비밀 키가 아니라 "이 앱이 어느 Firebase 프로젝트를 쓰는지" 식별하는 공개 설정값만 들어있어서, 코드에 그대로 넣어도 안전합니다 — 실제 보안은 Firestore 규칙으로 걸립니다.)

---

## 2단계 · 승인된 이메일 목록 정하기

구글 로그인은 **아무 구글 계정이나** 로그인은 되지만, **승인된 이메일만** 실제 데이터를 보고 수정할 수 있도록 Firestore 보안 규칙으로 막을 예정입니다(앞서 정하신 방향).

**다음 중 하나로 승인 목록을 알려주세요:**
- 지금 바로 쓸 선생님들 이메일 목록 (예: `teacher1@school.kr`, `teacher2@school.kr`, ...)
- 또는 "일단 edu.jkjin 본인만 먼저 넣고, 나중에 로그인 화면에서 직접 추가/관리할 수 있게 해달라" — 이 경우 Firestore 안에 승인 이메일 목록을 저장해두고, admin이 화면에서 추가/삭제할 수 있는 기능까지 만들어드릴 수 있습니다.

---

## 3단계 (제가 진행) · 로그인·Firestore 연동 코드 작성

1~2단계가 끝나면 제가:
- Firebase SDK 연결 (Google 로그인 버튼, 로그인 상태 확인)
- 승인 안 된 이메일이면 "접근 권한이 없습니다" 화면 표시
- `state`(교사/시간표/출장 데이터)를 localStorage 대신 Firestore에 저장/불러오기로 교체 (기존 기능은 그대로 유지)
- Firestore 보안 규칙 전체 내용을 작성해서 드림 (Firebase 콘솔에 그대로 붙여넣으시면 됨)

이 단계까지 끝나면 **로컬 `index.html`을 그냥 열어서** 구글 로그인이 실제로 되는지, 여러 교사 계정으로 데이터가 잘 공유되는지 확인합니다.

---

## 4단계 (나중, 별도 확인 후) · 실제 공개 주소로 배포

로컬 확인까지 끝나고 사용자님이 "이제 배포해줘"라고 하시면:
1. GitHub에 새 저장소 생성 (`classswap` 등)
2. 코드 푸시
3. Cloudflare Pages와 그 저장소 연결 → 자동 빌드/배포 → `https://classswap-xxxx.pages.dev` 같은 주소 생성
4. 그 주소를 Firebase Authentication의 "승인된 도메인"에 추가

이 단계는 **외부에 공개되는 작업**이라, 진행 직전에 다시 한번 확인 말씀드리겠습니다.
