# Jira 및 JQL 실무 활용 가이드

본 문서는 프로젝트 관리 도구인 **Jira**의 도입 목적부터 핵심 기능인 **JQL(Jira Query Language)** 활용법까지 실무에 필요한 내용을 정리한 가이드입니다.

---

## 1. Jira 도입 목적 (Why Jira?)

효율적인 협업과 투명한 프로젝트 관리를 위해 Jira를 사용합니다.

*   **이슈 추적(Issue Tracking):** 할 일(Todo), 진행 상태, 담당자, 마감일 등을 한눈에 파악하고 관리합니다.
*   **애자일(Agile) 문화 정착:** 변화에 유연하게 대응하고 소프트웨어 본연의 가치에 집중할 수 있도록 돕습니다.
*   **DevOps 통합:** 개발(Dev)과 운영(Ops)의 경계를 허물고, 반복적인 작업을 도구로 자동화하여 팀 전체가 공유된 지표를 가집니다. (Silo 현상 방지)
*   **AI 기반 생산성:** **Atlassian Intelligence** 및 **Rovo**(지능형 검색 및 챗봇)를 통해 업무 맥락을 파악하고 반복 업무를 최적화합니다.

### [참고] SCRUM vs KANBAN
| 구분 | SCRUM | KANBAN |
| :--- | :--- | :--- |
| **핵심** | 정해진 주기(Sprint) 내 목표 달성 | 지속적인 작업 흐름(Workflow) 최적화 |
| **역할** | 제품 책임자(PO), 스크럼 마스터, 팀원 등 | 명확한 역할 정의보다 업무 흐름에 집중 |
| **측정 지표** | 속도(Velocity), 번다운 차트 | 리드 타임(Lead Time), 사이클 타임 |

---

## 2. Jira 이슈 계층 및 구성 요소

Jira는 업무의 단위를 **이슈(Issue)**라고 부르며, 이를 계층적으로 관리합니다.

### 이슈 유형 (Issue Types)
1.  **에픽 (Epic):** 여러 스토리가 모인 큰 서사 또는 장기적인 프로젝트 목표.
2.  **스토리 (Story):** 사용자의 관점에서 작성된 요구사항 시나리오.
3.  **작업 (Task) / 버그 (Bug):** 구체적인 할 일 또는 수정해야 할 결함.

### 핵심 속성 (Components & Versions)
*   **컴포넌트 (Component):** 프로젝트 내 논리적 구분 (예: UI/UX, Backend, Security). 컴포넌트 리드를 설정하여 담당 관리자를 지정할 수 있습니다.
*   **수정 버전 (Fix Version):** 릴리즈(Release) 관리 항목. 특정 버전에서 수정되거나 배포될 이슈들을 묶어서 관리합니다.
*   **스토리 포인트 (Story Points):** 업무의 시간(Time)보다는 **상대적인 난이도와 복잡도**를 수치화한 것입니다.

---

## 3. JQL (Jira Query Language) 활용법

JQL은 Jira 내의 방대한 데이터에서 필요한 이슈를 구조적으로 검색하기 위한 전용 언어입니다.

### JQL 구문 구조
`field` `operator` `value` `keyword` `function`
- 예시: `project = "MYPROJ" AND status = "To Do" ORDER BY created DESC`

### 실무 활용 JQL 예시
*   **마감이 임박한 내 업무:** `assignee = currentUser() AND duedate <= 3d AND status != Done`
*   **지난 스프린트에서 이월된 업무:** `sprint in closedSprints() AND status != Done`
*   **특정 컴포넌트의 버그 현황:** `component = "API" AND issuetype = Bug`
*   **설명란에 특정 키워드가 포함된 경우 (AI 비활성 시 유용):** `description ~ "OCR"`

### Atlassian Rovo 활용
*   최신 AI 도구인 **Rovo**를 사용하면 자연어로 질문하여 복잡한 JQL 쿼리를 자동으로 생성하거나 프로젝트 전반의 인사이트를 얻을 수 있습니다.

---

## 4. 현업의 Jira 워크플로우

단순 할 일 관리를 넘어 전체 개발 생명주일(SDLC)을 통합 관리합니다.

1.  **이슈 관리:** 에픽과 스토리 중심의 백로그 관리.
2.  **레포 호스팅:** GitHub, GitLab 등과 연동하여 커밋 내역 추적.
3.  **코드 리뷰:** 이슈 내에서 풀 리퀘스트(PR) 상태 바로 확인.
4.  **빌드 & 디플로이:** CI/CD 파이프라인 연동을 통한 배포 상태 모니터링.
5.  **대시보드(Dashboard):** 가젯(Gadget)을 활용한 팀별 실시간 지표 대시보드 구축.

---

> [!TIP]
> **레이블(Label)**은 정해진 형식이 없어 남발하기 쉽습니다. 팀 내 규칙(Convention)을 먼저 정하고 사용하는 것을 권장합니다.
