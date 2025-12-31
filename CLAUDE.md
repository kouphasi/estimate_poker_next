# CLAUDE.md - AI Assistant Guide for Estimate Poker Next

## Project Overview

**Estimate Poker Next** is a web-based planning poker application for collaborative programming effort estimation. It allows teams to estimate development tasks using a card-based interface with real-time updates.

### Key Features
- Planning poker-style effort estimation (1h-3d + custom input)
- Multiple login options: Guest (nickname-only), Email/Password, and Google OAuth
- **Project Management**: Organize estimation sessions under projects (authenticated users only)
- **Named Sessions**: Give sessions descriptive names for better organization
- Real-time session updates via polling (WebSocket planned for future)
- Session owner controls (reveal/hide estimates, finalize results)
- Statistical analysis (average, median, min, max)
- Dynamic OGP metadata for session sharing

### Tech Stack
- **Framework**: Next.js 16.0.7 (App Router)
- **Runtime**: React 19.2.1
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL (via Supabase or Vercel Postgres)
- **ORM**: Prisma 6.19.0
- **Authentication**: NextAuth v4.24.13
- **Styling**: Tailwind CSS v4
- **Password Hashing**: bcryptjs
- **Deployment**: Vercel (inferred)

---

## Directory Structure

```
/home/user/estimate_poker_next/
├── app/                          # Presentation層 (Next.js App Router)
│   ├── page.tsx                  # Landing page (login selection)
│   ├── layout.tsx                # Root layout with SessionProvider
│   ├── globals.css               # Global styles + Tailwind + animations
│   ├── components/               # React components
│   │   ├── auth/                 # LoginForm, RegisterForm
│   │   ├── CardSelector.tsx      # Card selection UI
│   │   ├── PokerCard.tsx         # Individual card with animations
│   │   ├── ParticipantList.tsx   # Session participants
│   │   ├── EstimateResult.tsx    # Statistics display
│   │   ├── LoadingSpinner.tsx    # Loading indicator
│   │   ├── Toast.tsx             # Toast notifications
│   │   └── Providers.tsx         # Context providers wrapper
│   ├── api/                      # API routes (Thin controllers)
│   │   ├── auth/                 # NextAuth + registration
│   │   ├── projects/             # Project CRUD operations
│   │   ├── sessions/             # Session CRUD operations
│   │   └── users/                # User management
│   ├── simple-login/             # Nickname-only login
│   ├── login/                    # Email/password login
│   ├── register/                 # User registration
│   ├── mypage/                   # User dashboard (projects + sessions)
│   ├── projects/                 # Project management pages
│   │   ├── page.tsx              # Project list
│   │   ├── new/                  # Create new project
│   │   └── [projectId]/          # Project detail page
│   ├── sessions/                 # Session management pages
│   │   ├── page.tsx              # Session list
│   │   └── new/                  # Create new session
│   └── estimate/[shareToken]/    # Estimation room
├── src/                          # DDD層構造
│   ├── domain/                   # Domain層 (ビジネスロジック)
│   │   ├── errors/               # Domain errors
│   │   │   └── DomainError.ts    # Base error + specific errors
│   │   ├── user/                 # User domain
│   │   │   ├── User.ts           # User entity
│   │   │   ├── Email.ts          # Email value object
│   │   │   └── UserRepository.ts # User repository interface
│   │   ├── project/              # Project domain
│   │   │   ├── Project.ts        # Project entity
│   │   │   └── ProjectRepository.ts
│   │   └── session/              # Session domain
│   │       ├── EstimationSession.ts
│   │       ├── Estimate.ts
│   │       ├── ShareToken.ts     # Share token value object
│   │       ├── OwnerToken.ts     # Owner token value object
│   │       ├── SessionRepository.ts
│   │       └── EstimateRepository.ts
│   ├── application/              # Application層 (ユースケース)
│   │   ├── auth/                 # Authentication use cases
│   │   │   ├── LoginUseCase.ts
│   │   │   ├── RegisterUseCase.ts
│   │   │   └── CreateGuestUserUseCase.ts
│   │   ├── project/              # Project use cases
│   │   │   ├── CreateProjectUseCase.ts
│   │   │   ├── GetProjectUseCase.ts
│   │   │   ├── UpdateProjectUseCase.ts
│   │   │   ├── DeleteProjectUseCase.ts
│   │   │   ├── ListProjectsUseCase.ts
│   │   │   ├── ListProjectSessionsUseCase.ts
│   │   │   └── CreateProjectSessionUseCase.ts
│   │   ├── session/              # Session use cases
│   │   │   ├── CreateSessionUseCase.ts
│   │   │   ├── GetSessionUseCase.ts
│   │   │   ├── DeleteSessionUseCase.ts
│   │   │   ├── SubmitEstimateUseCase.ts
│   │   │   ├── ToggleRevealUseCase.ts
│   │   │   └── FinalizeSessionUseCase.ts
│   │   └── middleware/           # Application middleware
│   │       └── authMiddleware.ts # Authentication logic
│   └── infrastructure/           # Infrastructure層 (技術的実装)
│       ├── database/             # Database implementations
│       │   ├── prisma.ts         # Prisma client singleton
│       │   ├── prismaErrors.ts   # Prisma error handling
│       │   └── repositories/     # Repository implementations
│       │       ├── PrismaUserRepository.ts
│       │       ├── PrismaProjectRepository.ts
│       │       ├── PrismaSessionRepository.ts
│       │       └── PrismaEstimateRepository.ts
│       └── auth/                 # Authentication infrastructure
│           ├── nextAuthConfig.ts # NextAuth configuration
│           └── authHelpers.ts    # Auth helper functions
├── contexts/                     # React contexts
│   └── UserContext.tsx           # User state management
├── types/                        # TypeScript types
│   ├── next-auth.d.ts            # NextAuth type extensions
│   └── session.ts                # Session types
├── prisma/                       # Database
│   ├── schema.prisma             # Schema definition
│   └── migrations/               # Migration history
├── scripts/                      # Utility scripts
│   └── generate-prisma.sh        # CI-aware Prisma generation
├── docs/                         # Documentation
│   ├── requirements.md           # Full requirements (Japanese)
│   ├── development_plan.md       # Development roadmap
│   └── development/              # Step-by-step guides
├── specs/                        # Feature specifications
│   └── 001-ddd-restructure/      # DDD restructure spec
├── .github/workflows/            # CI/CD
│   ├── ci.yaml                   # Lint + type check
│   └── db-migration.yml          # Database migrations
├── middleware.ts                 # Route protection
├── ARCHITECTURE.md               # DDD architecture documentation
└── CLAUDE.md                     # This file (AI assistant guide)
```

---

## Database Schema

### Core Models

**User** (`users` table)
- `id`: String (cuid) - Primary key
- `email`: String? (unique) - For authenticated users only
- `passwordHash`: String? - bcrypt hashed (10 rounds)
- `nickname`: String - Display name
- `isGuest`: Boolean (default: true) - Guest vs authenticated
- `createdAt`, `updatedAt`: DateTime
- Relations: `accounts`, `nextAuthSessions`, `projects`, `sessions`, `estimates`

**Project** (`projects` table) - NEW in Phase 3
- `id`: String (cuid) - Primary key
- `name`: String - Project name
- `description`: String? - Optional description
- `ownerId`: String (FK to User) - Project owner (authenticated users only)
- `createdAt`, `updatedAt`: DateTime
- Relations: `owner` (User), `sessions[]` (EstimationSession)
- **Purpose**: Organize estimation sessions under projects for better management

**EstimationSession** (`estimation_sessions` table)
- `id`: String (cuid)
- `name`: String? - Optional session name (NEW)
- `shareToken`: String (unique, 16-char base64url) - For sharing
- `ownerToken`: String (unique, 32-char base64url) - For owner auth
- `ownerId`: String? (FK to User) - Session owner
- `projectId`: String? (FK to Project) - Optional project association (NEW)
- `isRevealed`: Boolean - Cards visible to all
- `status`: Enum (ACTIVE | FINALIZED)
- `finalEstimate`: Float? - Confirmed estimate in days
- `createdAt`: DateTime
- Relations: `owner` (User), `project` (Project), `estimates[]`

**Estimate** (`estimates` table)
- `id`: String (cuid)
- `sessionId`: String (FK)
- `userId`: String (FK)
- `nickname`: String - Participant name in session
- `value`: Float - Estimate in days
- `createdAt`, `updatedAt`: DateTime
- Unique constraint: `[sessionId, userId]`

**NextAuth Models** (Account, Session, VerificationToken)
- Standard NextAuth adapter models for OAuth/credentials

### Enums
- `SessionStatus`: ACTIVE, FINALIZED

---

## Authentication System

### Multiple Login Strategy

#### 1. Simple Login (Guest Users)
- **Route**: `/simple-login`
- **Method**: Nickname-only
- **Storage**: localStorage + cookie (`simple_login_user`, 7-day expiry)
- **User Creation**: `POST /api/users` creates guest user (`isGuest: true`)
- **State**: Managed by `UserContext`
- **Limitations**: No persistence, no project ownership

#### 2. Email/Password Login (Authenticated)
- **Route**: `/login`
- **Method**: Email + password via NextAuth CredentialsProvider
- **Strategy**: JWT-based, 30-day session expiry
- **Password**: bcrypt hashed (10 rounds)
- **Registration**: `POST /api/auth/register`
- **Session**: NextAuth `SessionProvider` in root layout

#### 3. Google OAuth Login (Authenticated)
- **Route**: `/login` (same page as email/password)
- **Method**: Google OAuth 2.0 via NextAuth GoogleProvider
- **Strategy**: OAuth flow with PrismaAdapter
- **User Creation**: Automatic via PrismaAdapter with `isGuest: false`
- **Session**: NextAuth `SessionProvider` in root layout
- **Callback URL**: `/api/auth/callback/google`

### Middleware Protection

**File**: `middleware.ts`

**Protected Routes**: `/mypage/*`, `/projects/*`, `/sessions/*` (list views)

**Authentication Check Order**:
1. NextAuth token via `getToken()`
2. Simple login cookie (`simple_login_user`)
3. NextAuth cookie existence (fallback if `getToken()` fails)

**Important Notes**:
- The middleware includes debug logging for troubleshooting auth issues
- Middleware is Edge Runtime compatible (Prisma removed from middleware)
- Guest users can access `/mypage` but cannot access `/projects/*` routes

### NextAuth Configuration

**File**: `lib/auth/auth-options.ts`

- **Providers**:
  - GoogleProvider (OAuth, conditional based on env vars)
  - CredentialsProvider (email + password)
- **Adapter**: PrismaAdapter (conditionally enabled when GoogleProvider is configured)
- **Session**: JWT strategy, 30-day expiry
- **Callbacks**:
  - `signIn`: Sets `isGuest: false` for Google OAuth users
  - `jwt`: Adds `user.id` to JWT token
  - `session`: Attaches user ID to session object
- **Pages**: Custom login (`/login`), register (`/register`)
- **Secret**: `NEXTAUTH_SECRET` env var (required)

**Important Notes**:
- PrismaAdapter is only enabled when `GOOGLE_CLIENT_ID` is set to avoid conflicts with CredentialsProvider
- Google OAuth users are automatically assigned a nickname from their Google profile
- Environment variable validation ensures `GOOGLE_CLIENT_SECRET` is set if `GOOGLE_CLIENT_ID` is configured
- **Nickname Setup Screen**: Google OAuth users are redirected to a nickname setup screen if their profile doesn't include a name
- **Account Linking**: Manual account linking is implemented to handle OAuthAccountNotLinked errors

---

## API Routes

### Authentication
- `POST /api/auth/register` - Create authenticated user
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler (handles all auth routes)
- `GET /api/auth/callback/google` - Google OAuth callback (handled by NextAuth)

### User Management
- `POST /api/users` - Create guest user (simple login)
- `GET /api/users/[userId]/sessions` - Get user's sessions

### Project Management (NEW - Phase 3)
- `GET /api/projects` - Get all projects for authenticated user
- `POST /api/projects` - Create new project (authenticated users only)
- `GET /api/projects/[projectId]` - Get project details
- `PUT /api/projects/[projectId]` - Update project
- `DELETE /api/projects/[projectId]` - Delete project
- `GET /api/projects/[projectId]/sessions` - Get all sessions for a project

### Session Management
- `POST /api/sessions` - Create new session (with optional name and projectId)
- `GET /api/sessions/[shareToken]` - Get session data (polling endpoint)
- `DELETE /api/sessions/[shareToken]` - Delete session (owner only, requires `ownerToken`)
- `POST /api/sessions/[shareToken]/estimates` - Submit/update estimate
- `PATCH /api/sessions/[shareToken]/reveal` - Toggle reveal (owner only, requires `ownerToken`)
- `POST /api/sessions/[shareToken]/finalize` - Finalize estimate (owner only, requires `ownerToken`)

### Authorization Patterns

**Owner Verification**:
```typescript
// Stored in localStorage, sent in request body
const { ownerToken } = await request.json();
if (session.ownerToken !== ownerToken) {
  return new Response("Unauthorized", { status: 403 });
}
```

**User Verification**:
```typescript
// TODO: Currently client-controlled, needs improvement
const { userId } = await request.json();
// Should use NextAuth session or secure cookie instead
```

---

## Key Development Patterns

### 1. DDD Layered Architecture

**See**: `ARCHITECTURE.md` for detailed documentation

**Dependency Flow**:
```
Presentation → Application → Domain ← Infrastructure
```

**Key Principles**:
- Domain layer is independent of all other layers
- Application layer depends only on Domain
- Infrastructure implements Domain interfaces
- Presentation orchestrates Use Cases

### 2. Repository Pattern

**Purpose**: Abstract data access from domain logic

**Interface Definition** (Domain layer):
```typescript
// src/domain/project/ProjectRepository.ts
export interface ProjectRepository {
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  delete(id: string): Promise<void>;
}
```

**Implementation** (Infrastructure layer):
```typescript
// src/infrastructure/database/repositories/PrismaProjectRepository.ts
export class PrismaProjectRepository implements ProjectRepository {
  constructor(private prisma: PrismaClient) {}

  async save(project: Project): Promise<Project> {
    // Convert domain object → Prisma model
    // Persist to database
    // Convert Prisma model → domain object
  }
}
```

### 3. Use Case Pattern

**Purpose**: Orchestrate business processes

**Structure**:
```typescript
// src/application/project/CreateProjectUseCase.ts
export class CreateProjectUseCase {
  constructor(
    private projectRepository: ProjectRepository,  // Dependency injection
    private userRepository: UserRepository
  ) {}

  async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    // 1. Fetch required entities
    // 2. Validate business rules (delegate to domain)
    // 3. Create/modify domain objects
    // 4. Persist via repository
    // 5. Return DTO
  }
}
```

### 4. Value Object Pattern

**Purpose**: Encapsulate validation and immutability

**Implementation**:
```typescript
// src/domain/session/ShareToken.ts
export class ShareToken {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ShareToken {
    if (!ShareToken.isValid(value)) {
      throw new ValidationError("Invalid share token format");
    }
    return new ShareToken(value);
  }

  static async generate(): Promise<ShareToken> {
    const value = randomBytes(12).toString('base64url').substring(0, 16);
    return new ShareToken(value);
  }

  getValue(): string {
    return this.value;
  }
}
```

### 5. Domain Error Hierarchy

**File**: `src/domain/errors/DomainError.ts`

**Structure**:
```typescript
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {}
export class UnauthorizedError extends DomainError {}
export class NotFoundError extends DomainError {}
```

**Usage in API Routes**:
```typescript
try {
  const result = await useCase.execute(input);
  return NextResponse.json({ data: result }, { status: 200 });
} catch (error) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### 6. Prisma Client Singleton

**File**: `src/infrastructure/database/prisma.ts`

**Pattern**: Global singleton to prevent hot reload issues in development

```typescript
const prisma = globalThis.prisma || new PrismaClient({...});
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
```

**Connection Strategy**:
- Prioritizes `POSTGRES_URL_NON_POOLING` (supports prepared statements)
- Falls back to `DATABASE_URL` with `?pgbouncer=true` param
- Includes graceful shutdown handlers (SIGINT, SIGTERM)

### 7. Real-Time Updates

**Current**: Polling every 2 seconds

**Location**: `app/estimate/[shareToken]/page.tsx`

```typescript
useEffect(() => {
  const interval = setInterval(fetchSession, 2000);
  return () => clearInterval(interval);
}, [shareToken]);
```

**Future**: WebSocket migration planned (Step 4 in development plan)

### 8. State Management

- **User State**: `contexts/UserContext.tsx` (guest or authenticated)
- **Toast Notifications**: `contexts/ToastContext.tsx`
- **Session**: NextAuth `SessionProvider`
- **Local Storage**: User data, owner tokens, session-specific nicknames

### 9. Component Patterns

**Reusable UI Components**:
- `LoadingSpinner` - 3 sizes (small, medium, large)
- `Toast` - Auto-dismiss notifications with slide-in animation
- `PokerCard` - Hover animations, selected state
- `CardSelector` - Card grid + custom input

**Form Components**:
- `LoginForm`, `RegisterForm` - NextAuth integration with error handling

### 10. Project Management Patterns

**Project Organization**:
- Projects are only available to authenticated users (not guest users)
- Sessions can be optionally associated with a project via `projectId`
- Projects show session count via `_count` aggregation
- MyPage shows excerpts (first 3 projects, first 5 sessions) with "View All" links

**Access Control**:
- Project CRUD operations require NextAuth session
- API routes check `session?.user?.id` before allowing operations
- Guest users see only sessions on MyPage, not projects section

**UI Patterns**:
- Card-based layout for projects with hover effects
- `line-clamp-1` for project names, `line-clamp-2` for descriptions
- Consistent "New" buttons with different colors (blue for projects, zinc for sessions)

---

## Environment Variables

### Required

```bash
DATABASE_URL                 # PostgreSQL connection (pooled)
POSTGRES_URL_NON_POOLING     # Direct connection (for migrations)
NEXTAUTH_SECRET              # JWT signing secret (generate with: openssl rand -base64 32)
NEXTAUTH_URL                 # Application URL (http://localhost:3000 for dev, production URL for prod)
```

### Optional (Google OAuth)

```bash
GOOGLE_CLIENT_ID             # Google OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET         # Google OAuth 2.0 Client Secret
```

**Note**: If `GOOGLE_CLIENT_ID` is set, `GOOGLE_CLIENT_SECRET` must also be set (validated at startup).

### Optional (Supabase)

```bash
SUPABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_JWT_SECRET
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Note**: See `.example.env` for full list (values are masked).

---

## Development Workflows

### Initial Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .example.env .env.local
# Edit .env.local with your database credentials

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

### Common Commands

```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build (runs prisma generate first)
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Create new migration
npx prisma db push       # Push schema changes (dev only)
```

### Database Migrations

**Creating a Migration**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Run migration
npx prisma migrate dev --name descriptive_name
# 3. Commit both schema.prisma and migration files
```

**Applying Migrations (Production)**:
```bash
npx prisma migrate deploy
```

**Important**: Always use `POSTGRES_URL_NON_POOLING` for migrations (supports prepared statements).

**Recent Issue**: Migration `20251109*` had cascading delete problems. See `MIGRATION_RECOVERY.md` for details.

---

## TypeScript Configuration

**Path Aliases**:
```typescript
import { prisma } from "@/lib/prisma";       // Instead of "../../lib/prisma"
import { UserContext } from "@/contexts/..."; // Instead of "../contexts/..."
```

**Strict Mode**: Enabled

**Target**: ES2017

**Module Resolution**: Bundler (Next.js 13+)

---

## Styling Conventions

### Tailwind CSS v4

**Global Styles**: `app/globals.css`

**Custom Animations**:
```css
@keyframes slide-in {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Component Styling**:
- Use Tailwind utility classes
- Responsive design with `sm:`, `md:`, `lg:` breakpoints
- Dark mode support planned (not yet implemented)

---

## Testing Strategy

### Current State
No test files currently exist in the codebase.

### Recommended Setup (from development plan)

**Unit Tests**:
- Framework: Jest or Vitest
- Target: Utility functions, components, API logic

**E2E Tests**:
- Framework: Playwright
- Target: Critical user flows (login, session creation, estimation)

**API Tests**:
- Framework: Supertest
- Target: API routes, error handling

---

## Git Workflow

### Branch Strategy
- `main` - Production branch
- `develop` - Development branch (staging)
- `claude/*` - AI assistant feature branches

### Commit Conventions

Follow semantic commit messages:
```
feat: Add session finalization API
fix: Resolve unique constraint violation on estimates
refactor: Extract token generation to utils
docs: Update CLAUDE.md with new patterns
```

### CI/CD Pipelines

**GitHub Actions**:

1. **`ci.yaml`** - Lint & Type Check
   - Triggers: Push/PR to main/develop
   - Steps: Install → Prisma generate → Lint → Type check

2. **`db-migration.yml`** - Database Migrations
   - Handles migration failures
   - Auto-resolves rolled-back migrations

---

## Known Issues & Gotchas

### Security Considerations

1. **TODO: Client-Controlled User IDs**
   - Current: `userId` sent in request body (client-controlled)
   - Risk: Users can impersonate others
   - Fix: Use server-side session validation (NextAuth)

2. **Owner Token Storage**
   - Stored in localStorage (vulnerable to XSS)
   - Consider moving to httpOnly cookies for production

### Database

1. **Connection Pooling**
   - Use `DATABASE_URL` for app queries (pooled)
   - Use `POSTGRES_URL_NON_POOLING` for migrations (direct)
   - Mix-up causes "prepared statement does not exist" errors

2. **Migration Recovery**
   - See `MIGRATION_RECOVERY.md` for handling failed migrations
   - Always backup database before major schema changes

### NextAuth

1. **Cookie Issues**
   - Middleware includes fallback to check cookie existence
   - `getToken()` may fail even when cookie exists (see middleware.ts:54-56)

2. **Session Debugging**
   - Enable debug logs: `debug: true` in auth-options.ts
   - Check middleware console logs for auth flow

### Polling Performance

- Current: 2-second interval
- Impact: High traffic can stress database
- Mitigation: Consider WebSocket migration (planned)

### React Patterns

1. **Suspense Boundaries**
   - `useSearchParams()` must be wrapped in Suspense boundary
   - Failure to do so causes hydration errors
   - Pattern: Create separate client component with Suspense wrapper

2. **Edge Runtime Compatibility**
   - Middleware runs on Edge Runtime
   - Cannot import Prisma in middleware.ts
   - Use API routes for database operations instead

---

## Code Quality Standards

### ESLint Configuration

**File**: `eslint.config.mjs`

- Next.js core-web-vitals
- TypeScript recommended rules
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

### TypeScript Standards

- Strict mode enabled
- No implicit any
- Explicit return types for public functions
- Use type aliases over interfaces for simple types

### Component Standards

1. **File Naming**: PascalCase for components (`PokerCard.tsx`)
2. **Props**: Define explicit types, avoid `any`
3. **Exports**: Use default exports for page components, named for utilities
4. **Async Components**: Use `async function` for Server Components

---

## Future Development (Roadmap)

### Phase 1: MVP (Completed)
- ✅ Guest user sessions
- ✅ Card-based estimation UI
- ✅ Polling-based real-time updates
- ✅ Reveal/hide toggle
- ✅ Finalization

### Phase 2: Authentication (Completed)
- ✅ NextAuth integration
- ✅ Email/password registration
- ✅ User dashboard

### Phase 3: Project Management (In Progress)
- ✅ Project model and CRUD
- ✅ Project-session relationships
- ✅ Session naming feature
- ✅ MyPage reorganization (projects + sessions)
- ✅ Project detail pages
- ❌ Task model and CRUD
- ❌ Estimation history

### Phase 4: Advanced Features (Planned)
- ❌ WebSocket real-time updates
- ❌ Re-voting capability
- ❌ Guest-to-authenticated migration
- ❌ CSV export
- ❌ Team management

---

## Quick Reference for AI Assistants

### When Adding New Features

1. **Database Changes**:
   - Update `prisma/schema.prisma`
   - Run `npx prisma migrate dev --name feature_name`
   - Commit schema + migration files
   - For relationships, consider cascade delete behavior

2. **New API Routes**:
   - Create `route.ts` in `app/api/...`
   - Follow Next.js App Router conventions
   - Add proper error handling and validation
   - Use Prisma client from `@/lib/prisma`
   - **For authenticated-only routes**: Use `getServerSession(authOptions)` to check auth
   - Return 401 for unauthorized, 400 for bad requests, 500 for server errors

3. **Authentication Changes**:
   - Modify `lib/auth/auth-options.ts`
   - Update `middleware.ts` if adding protected routes
   - Test both guest and authenticated flows
   - Remember: guest users should not access project management features

4. **UI Components**:
   - Place in `app/components/`
   - Use Tailwind CSS classes
   - Follow existing animation patterns (see `globals.css`)
   - Ensure responsive design
   - Use `line-clamp-*` for text truncation
   - Add hover states with `hover:` prefix

5. **State Management**:
   - Use existing contexts (`UserContext`, `ToastContext`)
   - Create new context if needed in `contexts/`
   - Wrap in `Providers.tsx`

6. **Project-Related Features**:
   - Always check if user is authenticated (not guest)
   - Use `session?.user?.id` for ownership checks
   - Include `_count` for related data counts
   - Sort by `createdAt: "desc"` for consistent ordering

### When Fixing Bugs

1. **Check Recent Commits**: `git log --oneline -20`
2. **Review Related Files**: Use grep to find related code
3. **Test Both User Types**: Guest and authenticated
4. **Check Console Logs**: Especially in middleware and API routes
5. **Verify Database State**: Use `npx prisma studio`

### When Refactoring

1. **Run Type Check**: `npm run type-check` before and after
2. **Run Linter**: `npm run lint`
3. **Test Critical Paths**: Login, session creation, estimation flow
4. **Check for Breaking Changes**: Especially in API routes
5. **Update Documentation**: Keep this file updated

---

## Important File References

### Configuration Files
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint rules
- `postcss.config.mjs` - Tailwind CSS configuration
- `middleware.ts` - Route protection (Edge Runtime)

### Core Application Files
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Landing page
- `app/mypage/page.tsx` - User dashboard (projects + sessions)
- `lib/auth/auth-options.ts` - NextAuth configuration
- `lib/prisma.ts` - Database client
- `prisma/schema.prisma` - Database schema

### Key Page Files (NEW)
- `app/projects/page.tsx` - Project list page
- `app/projects/new/page.tsx` - Create project page
- `app/projects/[projectId]/page.tsx` - Project detail page
- `app/sessions/page.tsx` - Session list page
- `app/sessions/new/page.tsx` - Create session page

### Documentation
- `docs/requirements.md` - Full requirements (Japanese)
- `docs/development_plan.md` - Development roadmap
- `MIGRATION_RECOVERY.md` - Database migration troubleshooting
- `README.md` - Basic setup instructions
- `CLAUDE.md` - This file (AI assistant guide)

---

## Troubleshooting Common Issues

### "Prepared statement does not exist"
**Cause**: Using pooled connection for migrations
**Fix**: Use `POSTGRES_URL_NON_POOLING` for migrations

### "Unauthorized" on owner actions
**Cause**: Missing or incorrect `ownerToken`
**Fix**: Check localStorage for `ownerToken_${shareToken}`

### NextAuth session not persisting
**Cause**: Cookie/JWT configuration issues
**Fix**:
1. Verify `NEXTAUTH_SECRET` is set
2. Check middleware debug logs
3. Ensure cookie domain matches

### Type errors after schema change
**Cause**: Prisma client not regenerated
**Fix**: Run `npx prisma generate`

### Session polling not updating
**Cause**: API route error or network issue
**Fix**: Check browser console and network tab

### Hydration errors with useSearchParams
**Cause**: Missing Suspense boundary
**Fix**: Wrap component using `useSearchParams()` in `<Suspense>` boundary

### Project features not visible for user
**Cause**: User is logged in as guest (not authenticated)
**Fix**: Guest users cannot access project management - must use email/password or Google OAuth login

### "Cannot use Prisma in Edge Runtime"
**Cause**: Importing Prisma in middleware.ts
**Fix**: Middleware is Edge Runtime - move database logic to API routes

---

## Resources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Internal Docs
- Requirements: `docs/requirements.md` (Japanese)
- Development Plan: `docs/development_plan.md`
- Migration Recovery: `MIGRATION_RECOVERY.md`

### Project Context
This is a **planning poker** application for collaborative effort estimation. The core concept follows the planning poker methodology where team members independently estimate task effort, then reveal estimates simultaneously to reduce bias and encourage discussion.

---

## Recent Updates & Improvements

### December 2025 Updates

**Project Management (Phase 3)**:
- ✅ Project model added with full CRUD operations
- ✅ Sessions can be organized under projects
- ✅ Project list and detail pages implemented
- ✅ MyPage reorganized to show both projects and sessions

**Session Naming**:
- ✅ Sessions can now have optional descriptive names
- ✅ UI updated throughout to display session names

**UX Improvements**:
- ✅ Nickname editing on MyPage
- ✅ Back button on auth pages to return to session
- ✅ Auto-populate logged-in user's name in sessions
- ✅ Login/register options during session join flow
- ✅ Unified terminology (部屋 → セッション)

**Google OAuth Enhancements**:
- ✅ Nickname setup screen for Google OAuth users
- ✅ Better session handling and redirects
- ✅ Manual account linking support

**Technical Improvements**:
- ✅ Edge Runtime compatibility (Prisma removed from middleware)
- ✅ Suspense boundaries for useSearchParams
- ✅ Dynamic OGP metadata for session sharing
- ✅ Version updates: Next.js 16.0.7, React 19.2.1

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-21 | 1.1.0 | Major update: Project management, session naming, UX improvements |
| 2025-11-15 | 1.0.0 | Initial CLAUDE.md creation |

---

**Last Updated**: 2025-12-21
**Maintained By**: AI Assistants working on this project
**Contact**: See repository issues for questions

## Active Technologies
- TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, NextAuth.js v4.x, Prisma 6.x (001-project-sharing)
- PostgreSQL (via Prisma ORM) (001-project-sharing)
- TypeScript 5.9.3 (strict mode) (002-test-infrastructure)
- PostgreSQL (テスト専用DB、Prisma経由) (002-test-infrastructure)

## Recent Changes
- 001-project-sharing: Added TypeScript 5.x (strict mode) + Next.js 16.x (App Router), React 19.x, NextAuth.js v4.x, Prisma 6.x
