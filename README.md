# PMC Task Board

반도체 장비 PMC SW 개발 팀의 개인 태스크 관리용 로컬 웹 앱.
데이터는 브라우저 IndexedDB에 저장되며 백엔드/서버/인증 없이 동작합니다.

---

## 기술 스택

- React 18 + TypeScript + Vite
- Tailwind CSS v3
- Zustand (UI 상태)
- Dexie.js (IndexedDB)
- React Router v6

---

## 주요 기능

- 프로젝트 → 대주제 → 소주제 → 태스크 계층 관리
- 태스크 상태(TODO / 진행중 / 완료), 우선순위, 담당자, 마감일, 진척율, 체크리스트
- 진척율 자동 집계 (태스크 → 소주제 → 대주제 → 프로젝트)
- 변경 이력 자동 기록
- JSON 파일로 전체 데이터 내보내기 / 가져오기 (백업 & 복원)

---

## 실행 방법

### 기본 실행 (npm이 있는 경우)

```bash
git clone https://github.com/SlowlyTom/TO_DO_LIST.git
cd TO_DO_LIST
npm install
npm run dev
```

브라우저에서 **http://localhost:5173** 접속

> `npm install`은 처음 한 번만 실행하면 됩니다.
> 이후부터는 `npm run dev`만 실행하면 됩니다.

### 종료

터미널에서 **Ctrl + C**

---

## npm이 없는 컴퓨터에서 실행하는 방법

### 방법 1: Node.js 설치 (가장 권장)

npm은 Node.js를 설치하면 자동으로 함께 설치됩니다.

1. [https://nodejs.org](https://nodejs.org) 접속
2. **LTS 버전** 다운로드 후 설치
3. 터미널 재시작
4. 위의 기본 실행 방법대로 진행

한 번 설치하면 영구적으로 사용 가능합니다.

---

### 방법 2: 빌드 파일 + Python 서버

**npm이 있는 컴퓨터에서 먼저 빌드:**

```bash
npm run build
```

`dist/` 폴더가 생성됩니다. 이 폴더만 USB/이메일 등으로 다른 PC에 복사합니다.

**다른 PC에서 (Python이 설치되어 있는 경우):**

```bash
cd dist
python -m http.server 8080
```

브라우저에서 **http://localhost:8080** 접속

> Python 버전 확인: `python --version`
> Python 2.x인 경우: `python -m SimpleHTTPServer 8080`

---

### 방법 3: VS Code Live Server

1. `npm run build`로 `dist/` 폴더 생성
2. `dist/` 폴더를 다른 PC로 복사
3. VS Code에서 `dist/index.html` 열기
4. 우하단 **Go Live** 버튼 클릭

---

## 다른 컴퓨터로 이전할 때 챙길 파일

### 개발용으로 실행할 경우

`node_modules/`와 `dist/` 폴더를 **제외**하고 나머지 전부 복사합니다.

```
✅ 복사할 것
├── package.json
├── package-lock.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── index.html
└── src/  (폴더 전체)

❌ 복사 불필요
├── node_modules/   (용량이 크고 npm install로 재생성 가능)
└── dist/           (npm run build로 재생성 가능)
```

ZIP으로 압축할 때 `node_modules` 폴더만 빼고 나머지를 선택해서 압축하면 됩니다.

### npm 없이 실행할 경우

`npm run build` 후 생성되는 **`dist/` 폴더 하나만** 복사하면 됩니다.

---

## 데이터 이전 방법

데이터는 **브라우저의 IndexedDB**에 저장되므로 PC가 달라지면 데이터도 초기화됩니다.
다른 PC로 데이터를 옮기려면 앱의 내보내기/가져오기 기능을 사용하세요.

1. 기존 PC: 사이드바 하단 **내보내기** 버튼 클릭 → JSON 파일 저장
2. 새 PC: 사이드바 하단 **가져오기** 버튼 클릭 → JSON 파일 선택

---

## GitHub 업데이트 방법

코드 수정 후 GitHub에 반영할 때:

```bash
git add .
git commit -m "수정 내용 설명"
git push
```
