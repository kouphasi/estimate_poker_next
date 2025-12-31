# Tasks: プロジェクト共有機能

**Input**: Design documents from `/specs/001-project-sharing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: テストは手動テストで実施（将来的にPlaywright E2Eテスト追加予定）

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/` for pages and API routes
- **Prisma**: `prisma/schema.prisma` for database models
- **Types**: `types/` for TypeScript type definitions
- **Utilities**: `lib/` for shared utilities

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared type definitions

- [X] T001 Add project-sharing types in types/project-sharing.ts
- [X] T002 [P] Add InviteToken value object in src/domain/project/InviteToken.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and models that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add JoinRequestStatus and MemberRole enums in prisma/schema.prisma
- [X] T004 Add ProjectInvite model in prisma/schema.prisma
- [X] T005 [P] Add JoinRequest model in prisma/schema.prisma
- [X] T006 [P] Add ProjectMember model in prisma/schema.prisma
- [X] T007 Add relations to Project model (invite, joinRequests, members) in prisma/schema.prisma
- [X] T008 Add relations to User model (joinRequests, projectMemberships) in prisma/schema.prisma
- [X] T009 Run Prisma db push (schema sync)
- [X] T010 Create data migration script for existing projects (add owner as ProjectMember) in prisma/migrations/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 招待URL発行 (Priority: P1) 🎯 MVP

**Goal**: プロジェクトオーナーが招待URLを発行し、画面に表示・コピーできる

**Independent Test**: プロジェクト詳細画面から「招待URLを発行」ボタンをクリックし、一意の招待URLが生成されることを確認

### Implementation for User Story 1

- [X] T011 [US1] Create POST /api/projects/[projectId]/invite/route.ts (招待URL発行API)
- [X] T012 [US1] Add invite URL display section to app/projects/[projectId]/page.tsx
- [X] T013 [US1] Add "Copy to clipboard" button with feedback in app/projects/[projectId]/page.tsx
- [X] T014 [US1] Add invite URL regeneration confirmation dialog in app/projects/[projectId]/page.tsx
- [X] T015 [US1] Handle error cases (not owner, project not found) with proper error messages

**Checkpoint**: User Story 1 complete - オーナーが招待URLを発行・コピーできる

---

## Phase 4: User Story 2 - 参加申請 (Priority: P2)

**Goal**: ログインユーザーが招待URLから参加申請を送信できる

**Independent Test**: 招待URLにアクセスし、参加申請ボタンをクリックして申請が送信されることを確認

### Implementation for User Story 2

- [X] T016 [US2] Create GET /api/invite/[token]/route.ts (招待トークン検証・プロジェクト情報取得API)
- [X] T017 [US2] Create POST /api/projects/[projectId]/join-requests/route.ts (参加申請API)
- [X] T018 [US2] Create app/invite/[inviteToken]/page.tsx (参加申請ページ)
- [X] T019 [US2] Add authentication check and redirect to login in app/invite/[inviteToken]/page.tsx
- [X] T020 [US2] Add callbackUrl parameter to login redirect for post-login return
- [X] T021 [US2] Display project info and "申請する" button in app/invite/[inviteToken]/page.tsx
- [X] T022 [US2] Handle status display (pending, already member, owner) in app/invite/[inviteToken]/page.tsx
- [X] T023 [US2] Handle error cases (invalid token, already applied) with proper error messages

**Checkpoint**: User Story 2 complete - ユーザーが招待URLから参加申請できる

---

## Phase 5: User Story 3 - 参加リクエスト管理 (Priority: P3)

**Goal**: プロジェクトオーナーが参加リクエストを承認/拒否できる

**Independent Test**: プロジェクト詳細画面から参加リクエスト一覧を確認し、承認・拒否操作を行える

### Implementation for User Story 3

- [ ] T024 [US3] Add GET method to /api/projects/[projectId]/join-requests/route.ts (リクエスト一覧取得)
- [ ] T025 [US3] Create PATCH /api/projects/[projectId]/join-requests/[requestId]/route.ts (承認/拒否API)
- [ ] T026 [US3] Add join request count badge to app/projects/[projectId]/page.tsx
- [ ] T027 [US3] Create JoinRequestList component in app/components/JoinRequestList.tsx
- [ ] T028 [US3] Add approve/reject buttons with confirmation to JoinRequestList component
- [ ] T029 [US3] Create ProjectMember record on approval in join-requests/[requestId]/route.ts
- [ ] T030 [US3] Delete JoinRequest record on rejection in join-requests/[requestId]/route.ts

**Checkpoint**: User Story 3 complete - オーナーが参加リクエストを承認/拒否できる

---

## Phase 6: User Story 4 - 共有プロジェクトの表示 (Priority: P4)

**Goal**: メンバーがマイページで参加中のプロジェクトを確認できる

**Independent Test**: メンバーとして参加したプロジェクトがマイページのプロジェクト一覧に表示される

### Implementation for User Story 4

- [ ] T031 [US4] Create GET /api/users/me/projects/route.ts (参加中プロジェクト一覧API)
- [ ] T032 [US4] Add "参加中のプロジェクト" section to app/mypage/page.tsx
- [ ] T033 [US4] Create MemberProjectCard component in app/components/MemberProjectCard.tsx
- [ ] T034 [US4] Display owner info and role badge in MemberProjectCard component
- [ ] T035 [US4] Update existing projects API to include member count in app/api/projects/route.ts

**Checkpoint**: User Story 4 complete - メンバーが参加中プロジェクトを確認できる

---

## Phase 7: User Story 5 - メンバー管理 (Priority: P5)

**Goal**: プロジェクトオーナーがメンバー一覧を確認し、削除できる

**Independent Test**: メンバー一覧を表示し、特定メンバーの削除操作を行える

### Implementation for User Story 5

- [ ] T036 [US5] Create GET /api/projects/[projectId]/members/route.ts (メンバー一覧API)
- [ ] T037 [US5] Create DELETE /api/projects/[projectId]/members/[memberId]/route.ts (メンバー削除API)
- [ ] T038 [US5] Create app/projects/[projectId]/members/page.tsx (メンバー管理ページ)
- [ ] T039 [US5] Create MemberList component in app/components/MemberList.tsx
- [ ] T040 [US5] Add delete button with confirmation dialog (owner only) in MemberList component
- [ ] T041 [US5] Prevent owner self-deletion in members/[memberId]/route.ts
- [ ] T042 [US5] Add "メンバー" tab/link to app/projects/[projectId]/page.tsx

**Checkpoint**: User Story 5 complete - オーナーがメンバーを管理できる

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T043 Run npm run lint and fix any linting errors
- [ ] T044 Run npm run type-check and fix any type errors
- [ ] T045 Run npm run build and verify successful build
- [ ] T046 [P] Validate quickstart.md checklist items manually
- [ ] T047 Update CLAUDE.md with new API routes and models documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - Some parallel work possible within each story
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on US1 (needs invite token to exist)
- **User Story 3 (P3)**: Depends on US2 (needs join requests to exist)
- **User Story 4 (P4)**: Depends on US3 (needs approved members to exist)
- **User Story 5 (P5)**: Depends on US3 (needs members to exist)

### Within Each User Story

- API routes before frontend pages
- Backend validation before frontend display
- Core functionality before error handling polish

### Parallel Opportunities

- Phase 2: T004, T005, T006 can run in parallel (different Prisma models)
- Each user story phase: API and page tasks can often run in parallel after initial API is ready

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch model additions in parallel:
Task: "Add ProjectInvite model in prisma/schema.prisma"
Task: "Add JoinRequest model in prisma/schema.prisma"
Task: "Add ProjectMember model in prisma/schema.prisma"

# Then run migration after all models added:
Task: "Run Prisma migration"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T010)
3. Complete Phase 3: User Story 1 (T011-T015)
4. **STOP and VALIDATE**: Test invite URL generation independently
5. Demo: オーナーが招待URLを発行・コピーできる

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test → 招待URL発行が動作
3. Add User Story 2 → Test → 参加申請が動作
4. Add User Story 3 → Test → 承認/拒否が動作
5. Add User Story 4 → Test → マイページに参加中プロジェクト表示
6. Add User Story 5 → Test → メンバー管理が動作
7. Complete Polish → Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable (after dependencies met)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All API routes require NextAuth session validation
- Use existing patterns from CLAUDE.md for consistency
