# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # 개발 서버 시작 → http://localhost:5173
npm run build     # 타입 체크 후 프로덕션 빌드 (dist/)
npm run preview   # 빌드 결과물 로컬 미리보기
npx tsc --noEmit  # 타입 체크만 (빌드 없이)
```

## Architecture

### 데이터 계층 구조
```
Project → Category(대주제) → SubCategory(소주제) → Task
```
모든 데이터는 브라우저 IndexedDB에 저장 (Dexie.js). 백엔드 없음.

### 상태 관리 분리 원칙
- **서버 상태(DB 데이터)**: `src/hooks/` — `useLiveQuery`로 IndexedDB 실시간 구독. 컴포넌트가 DB를 직접 건드리지 않고 훅을 통해서만 접근.
- **UI 상태**: `src/stores/uiStore.ts` (Zustand) — 모달 열림/닫힘, 태스크 슬라이드오버, 사이드바 접힘 상태만 관리.

### 핵심 파일
- `src/db/database.ts` — Dexie 스키마 정의 + 앱 첫 실행 시 seed 데이터 삽입 (`seedDatabase()`)
- `src/types/index.ts` — 전체 타입 정의 (Task, Category, SubCategory, Project, TaskHistory 등)
- `src/App.tsx` — React Router 라우팅 + DB 초기화 트리거

### 라우팅
| 경로 | 페이지 |
|------|--------|
| `/` | DashboardPage |
| `/projects` | ProjectsPage |
| `/projects/:id` | ProjectDetailPage |
| `/my-tasks` | MyTasksPage |

### 태스크 상세 패턴
태스크 클릭 시 슬라이드오버 패널(`TaskSlideover`)이 오버레이로 표시됨.
`useUiStore().openTaskSlideover(taskId)` 호출 → Zustand 상태 변경 → `TaskSlideover`가 해당 taskId로 DB에서 데이터 조회.

### 변경 이력 자동 기록
`useTaskMutations().updateTask()` 내부에서 변경된 필드를 감지해 `taskHistory` 테이블에 자동 저장. 외부에서 별도 처리 불필요.

### Export/Import
- `src/hooks/useDataTransfer.ts` — 전체 DB 스냅샷을 JSON으로 내보내기 / JSON 파일을 덮어쓰기 또는 병합으로 가져오기
- Import는 `ImportModal`에서 처리, 사이드바 하단 버튼으로 파일 선택 트리거

## TypeScript 주의사항

`useLiveQuery` 조건부 쿼리에서 fallback을 `Promise.resolve([])`로 쓰면 `never[]`로 추론됨.
반드시 타입을 명시해야 함:
```ts
// ❌ 잘못된 예
Promise.resolve([])
// ✅ 올바른 예
Promise.resolve([] as Task[])
```
