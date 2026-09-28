# Signect

웹 기반 게임형 수어 학습 플랫폼. Sign(수어) + Connect(연결) — 웹캠으로 수어 동작을 실시간 인식해 학습을 검증하고, 퍼즐 게임으로 복습을 유도한다.

## 기술 스택

- **Frontend**: React + TypeScript (Vite), styled-components, react-router-dom
- **Vision AI**: `@mediapipe/tasks-vision` — 손/안면 랜드마크 실시간 추적
- **Backend**: Firebase Auth (로그인), Firebase Firestore (학습 기록, 스트릭, 게임 점수)
- **배포**: Vercel

## 시작하기

```bash
npm install
cp .env.example .env.local   # Firebase 프로젝트 값 채우기
npm run dev
```

## 폴더 구조

```
src/
  pages/            페이지 단위 컴포넌트 (Home, Learn, MyPage, games/*, dev/CaptureReference)
  components/
    layout/          헤더, 레이아웃 셸
    ui/              공통 Button, Card 등
  hooks/             useWebcam, useHandTracking, useSignMatch, useSignReferences
  lib/               firebase.ts, handVector.ts(코사인 유사도), signMatcher.ts, handLandmarker.ts
  data/              signReferences.ts (로컬에서 /dev/capture로 녹화한 레퍼런스)
  styles/            theme.ts, GlobalStyle.ts
scripts/
  build-word-references.mjs   AIHub 수어 데이터셋 → public/data/signReferences.word.json + 애니메이션 변환
  classify_word_topics.py     단어 레퍼런스에 주제(topic) 태그 부여
public/data/
  signReferences.word.json    변환된 단어 레퍼런스 벡터 + 주제 태그 (런타임에 fetch)
  animations/                 단어별 스켈레톤 재생용 프레임 시퀀스 (Learn에서 선택한 단어만 개별 fetch)
```

## 수어 레퍼런스 데이터

`public/data/signReferences.word.json`은 AIHub "한국수어 영상" WORD 데이터셋(정면 카메라, OpenPose 손 keypoint + 형태소 라벨)에서
`scripts/build-word-references.mjs`로 추출한 980개 단어의 기준 벡터입니다. 원본 데이터셋(영상·전체 keypoint)은 용량이 커서 리포지토리에
포함하지 않고, 손목 기준 상대좌표로 정규화한 42차원 벡터(+좌우 반전 버전)만 커밋했습니다. 데이터셋에 실제 영상 파일은 없어서(keypoint만
제공), 같은 스크립트가 프레임별 상체+양손 좌표도 `public/data/animations/`에 단어별 JSON으로 저장하고, Learn 페이지가 이를 스켈레톤
애니메이션으로 재생해 시범 동작 대신 보여줍니다. 원본 데이터셋 자체의 재배포 여부는 AIHub 라이선스를 확인하세요. 데이터셋 경로를 바꿔
다시 생성하려면:

```bash
node scripts/build-word-references.mjs "<데이터셋 WORD 폴더 경로>" public/data/signReferences.word.json public/data/animations
python3 scripts/classify_word_topics.py   # 위 파일에 주제(topic) 태그 추가
```

### 단어 주제 분류

데이터셋에는 주제 메타데이터가 없어서, `classify_word_topics.py`가 단어 라벨 텍스트를 키워드 규칙으로 분류합니다(기관·장소 / 가족·관계 /
사람·직업 / 음식 / 동물·자연 / 색깔·외형 / 감정·상태 / 시간·날짜 / 학교·교육 / 사회·법률·행정 / 사물·생활 / 동작·묘사 / 기타).
언어적으로 검증된 분류가 아니라 Learn 페이지의 주제 필터용 UX 보조 수단이며, 약 32%는 애매한 추상어·행정 전문용어라 `기타`로 남습니다.
규칙은 `scripts/classify_word_topics.py` 상단의 `RULES`에서 조정할 수 있습니다.

## 진행 상태

- [x] 프로젝트 뼈대 (라우팅, 레이아웃, 페이지 스텁, 디자인 토큰)
- [x] MediaPipe 손 랜드마크 추적 연동
- [x] 코사인 유사도 기반 정답 매칭 엔진 (`useSignMatch`, `signMatcher.ts`)
- [x] AIHub 수어 데이터셋 → 980개 단어 레퍼런스 벡터 변환 및 Learn 페이지 연동
- [x] 단어별 스켈레톤 시범 동작 애니메이션 (영상 파일 대신)
- [x] 학습하기 지숫자/지문자/단어 3분류 + 단어 주제(음식·가족 등) 필터
- [ ] 지숫자(0~9) 손 모양 레퍼런스 — AIHub 데이터셋에서 자동 추출을 시도했으나 검증 결과 신뢰할 수 없어 폐기(`scripts/mine_letter_references.mjs`
      상단 주석 참고). 실제 카메라 앞에서 `/dev/capture`로 직접 녹화해야 함(국립국어원 한국수어사전 등을 참고해 정확한 손 모양으로) —
      코드로 대신할 수 없는 유일한 항목
- [x] 지숫자 스도쿠 — 실제 퍼즐 생성/검증 + 손 모양으로 숫자 입력(레퍼런스 있을 때)
- [x] 수어 꼬들 — 실제 워들식 단어 추리 게임 (AIHub 2음절 단어 501개 풀에서 출제)
- [x] 동작(움직이는 수어) DTW 매칭 + 좌우 손 반전 불변 매칭
- [x] 맞춤형 단어 퀴즈 게임 (`/games/word-quiz`) — 내 단어장 우선 출제, DTW 채점 5라운드
- [x] 로컬 진행도 트래커 (`progressStore.ts`, localStorage 기반) — 연속 학습일, 마스터한 단어,
      학습 시간, 개인 단어장, 게임 승리 횟수, 퀴즈 정답률을 실제로 기록·집계
- [x] 마이페이지 · 게임 홈 실제 데이터 연동 (더미 수치 제거, 실제 기록 기반 업적/배지 시스템)
- [x] 학습하기 단어 탭 ↔ 개인 단어장 연동 ("☆ 내 단어장에 추가"), 단어 퀴즈가 이 목록을 우선 사용
- [ ] Firebase Auth 로그인/세션 — **이번 작업 범위에서 제외** (홈 화면 로그인/회원가입은 "준비 중" 안내만 표시, 비회원 입장만 동작)
- [ ] Firestore 학습 기록 · 스트릭 · 게임 점수 동기화 — **이번 작업 범위에서 제외** (현재는 브라우저 localStorage에만 저장되어
      기기/브라우저를 바꾸면 기록이 유지되지 않음)
- [ ] Vercel 배포 — **이번 작업 범위에서 제외**

## 게임

- **지숫자 스도쿠** (`/games/sign-sudoku`): 매번 새로 생성되는 실제 9x9 스도쿠(난이도 3단계). 팔레트 클릭으로 입력하며 정답 여부를
  즉시 초록/빨강으로 표시. `/dev/capture`로 `number-0`~`number-9` 손 모양을 녹화해두면 카메라로 숫자를 인식해 선택한 칸에 입력할 수도
  있습니다(레퍼런스 없으면 클릭 입력만 동작).
- **수어 꼬들** (`/games/sign-kkoddle`): 워들(Wordle)의 지문자 버전. 자음+모음을 합쳐 정확히 6개 지문자가 되는 단어(AIHub
  데이터셋 261개 풀)를 날짜 시드로 골라, 6번 안에 맞히는 게임. 음절이 아니라 [hangul.ts](src/lib/hangul.ts)로 분해한 **지문자
  낱개**가 한 칸씩 채점 대상입니다(예: "간편" → ㄱ,ㅏ,ㄴ,ㅍ,ㅕ,ㄴ) — 정확한 위치는 초록, 다른 칸에 있으면 주황, 없으면 회색.
  입력은 타이핑이 아니라 **카메라로 지문자를 한 칸씩 인식**해서 채웁니다(스도쿠와 동일한 `useSignRecognition` 방식) — `/dev/capture`로
  `consonant-ㄱ`~`vowel-ㅣ` 24개를 녹화해둘수록 더 많은 지문자를 인식할 수 있습니다.

## 정지 동작 vs 움직이는 동작

지문자·지숫자는 손 모양을 유지하는 정지 신호라 `/dev/capture`에서 30프레임을 평균해 벡터 하나로 저장하고, 코사인 유사도로 비교합니다
(`matchAgainstReference`, `useSignMatch`/`useSignRecognition`). 하지만 대부분의 단어 수어는 손이 실제로 이동하는 궤적 자체가
의미라서, 평균 벡터 하나로는 그 정보가 사라집니다. 그래서 두 가지 매칭 방식을 둘 다 씁니다:

- **정지 매칭** (지문자/지숫자, 그리고 폴백으로 단어에도 적용): 단일 벡터 코사인 유사도.
- **동작 매칭** (단어): [dtw.ts](src/lib/dtw.ts)의 DTW(Dynamic Time Warping)로 두 시퀀스를 정렬해 비교. Learn 페이지 단어 탭에서
  "동작 녹화 시작" → 실제로 동작 수행 → 다시 눌러 채점하는 흐름이며, 비교 대상은 `public/data/animations/`에 이미 있는 실제 AIHub
  동작 데이터입니다. `/dev/capture`에도 같은 방식의 "움직이는 동작" 모드가 있어 커스텀 항목을 직접 녹화할 수 있습니다.

두 매칭 방식 모두 **좌우 반전 불변**입니다 — 라이브 벡터/시퀀스를 레퍼런스와 그 좌우 반전본 둘 다에 비교해 더 잘 맞는 쪽 점수를
사용하므로, 오른손으로 녹화된 레퍼런스를 왼손으로 따라 해도(혹은 그 반대도) 동일하게 인식됩니다.
