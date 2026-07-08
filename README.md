# 🛡️ SafeCatch (스마트 교통 정보 알리미)

실시간 대중교통 API를 연동하여 출퇴근/통학 경로를 등록하고, 사용자의 도보 속도를 보정(Calibration)하여 버스 및 지하철 도착 시간 전에 정확히 푸시 알림을 제공하는 스마트 교통 도우미 풀스택 애플리케이션입니다.

본 프로젝트는 **소프트웨어공학** 전공 과목의 설계 명세 및 엔지니어링 표준(SDLC)을 철저히 준수하여 개발되었습니다.

---

## 📂 프로젝트 구조

* **[backend](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/backend)**: FastAPI 기반 백엔드 API 서버
  * **[app/main.py](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/backend/app/main.py)**: 진입점 및 API 라우팅 컨트롤러
  * **[app/transit.py](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/backend/app/transit.py)**: TMap API 연동 및 대중교통 경로 최적화 모듈
  * **[app/auth.py](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/backend/app/auth.py)**: JWT 기반 로그인 및 회원가입 인증 핸들러
  * **[app/models.py](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/backend/app/models.py)**: SQLAlchemy ORM 데이터베이스 스키마 정의
* **[frontend](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/frontend)**: React + Vite 기반의 고성능 싱글 페이지 애플리케이션(SPA)
  * **[src/pages/Dashboard.jsx](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/frontend/src/pages/Dashboard.jsx)**: 실시간 대중교통 현황 및 요약 위젯 대시보드
  * **[src/pages/TripAlarms.jsx](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/frontend/src/pages/TripAlarms.jsx)**: 맞춤형 출근/통학 경로 스케줄링 및 알림 트리거 설정
  * **[src/pages/Calibrator.jsx](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/frontend/src/pages/Calibrator.jsx)**: 사용자 도보 속도 측정 및 알림 오프셋 보정기
  * **[src/pages/Settings.jsx](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/frontend/src/pages/Settings.jsx)**: 자주 가는 정류장, 홈/회사 위치 및 API 연동 설정

---

## ✨ 핵심 기능

1. **실시간 대중교통 알람 스케줄링 (TripAlarms)**
   * 출퇴근/통학 경로의 특정 버스/지하철 노선을 타겟팅하여 알람 설정.
   * 실시간 도착 정보(ETA)를 기준으로 탑승 전 특정 타임라인(예: 5분 전, 10분 전)에 도달하면 알람 발생.
2. **도보 속도 보정 기술 (Calibrator)**
   * 스마트폰의 GPS 센서나 수동 타이머 측정을 통해 사용자의 평균 도보 페이스(m/s) 계산.
   * 버스 정류장/지하철역까지의 거리와 보정된 속도를 계산하여, 사용자가 **실제 승강장에 도착해야 하는 타이밍**에 맞추어 알림 시점 유동적 조절.
3. **통합 트래픽 대시보드 (Dashboard)**
   * 사용자의 선호 경로, 최근 타임라인 기록, 실시간 대기 정보를 한눈에 볼 수 있는 UI 카드 제공.
4. **JWT 보안 인증 및 설정 관리**
   * SQLite 기반 데이터 암호화 및 유저 세션 보안 보장.

---

## 🛠️ 기술 스택

* **Frontend**: `React (v18)`, `Vite`, `TailwindCSS`, `Lucide React Icons`, `React Router`
* **Backend**: `FastAPI`, `Uvicorn`, `SQLAlchemy`, `SQLite3`, `Jose JWT`
* **External Integrations**: `SKT TMap Transit API` (대중교통 최적 경로 탐색 및 실시간 시간 데이터 수집)

---

## 🚀 시작하기 (How to Run)

프로젝트 루트에 있는 통합 실행 스크립트를 사용하여 백엔드와 프론트엔드를 동시에 구동할 수 있습니다.

### 1. 사전 준비 (Prerequisites)
* **Python** 3.8 이상 설치
* **Node.js** 16 이상 및 **npm** 설치

### 2. 패키지 설치
* **백엔드 라이브러리 설치**:
  ```bash
  cd backend
  pip install -r requirements.txt
  ```
* **프론트엔드 의존성 설치**:
  ```bash
  cd ../frontend
  npm install
  ```

### 3. 일괄 실행
프로젝트 루트에서 다음 스크립트를 실행합니다.
* **[start.bat](file:///C:/Users/5174k/OneDrive/바탕 화면/26_1/소프트웨어공학/소웨공 과제/safecatch/start.bat)** (Windows 환경 전용 더블 클릭 지원)

실행 후 각각 아래 로컬 호스트 주소로 자동 포워딩됩니다:
* **Frontend**: `http://localhost:5173`
* **Backend Docs (Swagger)**: `http://localhost:8000/docs`
