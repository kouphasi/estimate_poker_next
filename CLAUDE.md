# CLAUDE.md - AI Assistant Guide for Estimate Poker Next

## Project Overview

**Estimate Poker Next** is a web-based planning poker application for collaborative programming effort estimation. It allows teams to estimate development tasks using a card-based interface with real-time updates.

### Key Features
- Planning poker-style effort estimation (1h-3d + custom input)
- Dual user system: Guest (nickname-only) and Authenticated (email/password)
- Real-time session updates via polling (WebSocket planned for future)
- Session owner controls (reveal/hide estimates, finalize results)
- Statistical analysis (average, median, min, max)

### Tech Stack
- **Framework**: Next.js 16.0.1 (App Router)
- **Runtime**: React 19.2.0
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
├── app/                          # Next.js App Router
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
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth + registration
│   │   ├── sessions/             # Session CRUD operations
│   │   └── users/                # User management
│   ├── simple-login/             # Nickname-only login
│   ├── login/                    # Email/password login
│   ├── register/                 # User registration
│   ├── mypage/                   # User dashboard
│   ├── sessions/new/             # Create new session
│   └── estimate/[shareToken]/    # Estimation room
├── lib/                          # Utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── utils.ts                  # Token generation
│   ├── prisma-errors.ts          # Error handling
│   └── auth/                     # NextAuth config & helpers
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
├── .github/workflows/            # CI/CD
│   ├── ci.yaml                   # Lint + type check
│   └── db-migration.yml          # Database migrations
└── middleware.ts                 # Route protection
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
- Relations: `accounts`, `nextAuthSessions`, `sessions`, `estimates`

**EstimationSession** (`estimation_sessions` table)
- `id`: String (cuid)
- `shareToken`: String (unique, 16-char base64url) - For sharing
- `ownerToken`: String (unique, 32-char base64url) - For owner auth
- `ownerId`: String (FK to User)
- `isRevealed`: Boolean - Cards visible to all
- `status`: Enum (ACTIVE | FINALIZED)
- `finalEstimate`: Float? - Confirmed estimate in days
- `createdAt`: DateTime
- Relations: `estimates[]`

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

### Dual Login Strategy

#### 1. Simple Login (Guest Users)
- **Route**: `/simple-login`
- **Method**: Nickname-only
- **Storage**: localStorage + cookie (`simple_login_user`, 7-day expiry)
- **User Creation**: `POST /api/users` creates guest user (`isGuest: true`)
- **State**: Managed by `UserContext`
- **Limitations**: No persistence, no project ownership

#### 2. Authenticated Login
- **Route**: `/login`
- **Method**: Email + password via NextAuth CredentialsProvider
- **Strategy**: JWT-based, 30-day session expiry
- **Password**: bcrypt hashed (10 rounds)
- **Registration**: `POST /api/auth/register`
- **Session**: NextAuth `SessionProvider` in root layout

### Middleware Protection

**File**: `middleware.ts`

**Protected Routes**: `/mypage/*`

**Authentication Check Order**:
1. NextAuth token via `getToken()`
2. Simple login cookie (`simple_login_user`)
3. NextAuth cookie existence (fallback if `getToken()` fails)

**Important**: The middleware includes debug logging for troubleshooting auth issues.

### NextAuth Configuration

**File**: `lib/auth/auth-options.ts`

- **Provider**: CredentialsProvider (email + password)
- **Session**: JWT strategy, 30-day expiry
- **Callbacks**: Adds `user.id` to JWT token and session
- **Pages**: Custom login (`/login`), register (`/register`)
- **Secret**: `NEXTAUTH_SECRET` env var (required)

---

## API Routes

### Authentication
- `POST /api/auth/register` - Create authenticated user
- `POST /api/auth/[...nextauth]` - NextAuth handler

### User Management
- `POST /api/users` - Create guest user (simple login)
- `GET /api/users/[userId]/sessions` - Get user's sessions

### Session Management
- `POST /api/sessions` - Create new session
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

### 1. Prisma Client Singleton

**File**: `lib/prisma.ts`

**Pattern**: Global singleton to prevent hot reload issues in development

```typescript
const prisma = globalThis.prisma || new PrismaClient({...});
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
```

**Connection Strategy**:
- Prioritizes `POSTGRES_URL_NON_POOLING` (supports prepared statements)
- Falls back to `DATABASE_URL` with `?pgbouncer=true` param
- Includes graceful shutdown handlers (SIGINT, SIGTERM)

### 2. Token Generation

**File**: `lib/utils.ts`

```typescript
generateShareToken()  // 16-char base64url for session sharing
generateOwnerToken()  // 32-char base64url for owner auth
```

Both use `crypto.randomBytes()` with retry logic for uniqueness.

### 3. Error Handling

**File**: `lib/prisma-errors.ts`

Type guards for Prisma errors:
- `isPrismaError()`
- `isUniqueConstraintViolation()`
- `isForeignKeyConstraintViolation()`

### 4. Real-Time Updates

**Current**: Polling every 2 seconds

**Location**: `app/estimate/[shareToken]/page.tsx`

```typescript
useEffect(() => {
  const interval = setInterval(fetchSession, 2000);
  return () => clearInterval(interval);
}, [shareToken]);
```

**Future**: WebSocket migration planned (Step 4 in development plan)

### 5. State Management

- **User State**: `contexts/UserContext.tsx` (guest or authenticated)
- **Toast Notifications**: `contexts/ToastContext.tsx`
- **Session**: NextAuth `SessionProvider`
- **Local Storage**: User data, owner tokens, session-specific nicknames

### 6. Component Patterns

**Reusable UI Components**:
- `LoadingSpinner` - 3 sizes (small, medium, large)
- `Toast` - Auto-dismiss notifications with slide-in animation
- `PokerCard` - Hover animations, selected state
- `CardSelector` - Card grid + custom input

**Form Components**:
- `LoginForm`, `RegisterForm` - NextAuth integration with error handling

---

## Environment Variables

### Required

```bash
DATABASE_URL                 # PostgreSQL connection (pooled)
POSTGRES_URL_NON_POOLING     # Direct connection (for migrations)
NEXTAUTH_SECRET              # JWT signing secret (generate with: openssl rand -base64 32)
```

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

### Phase 3: Project Management (Planned)
- ❌ Project model and CRUD
- ❌ Task model and CRUD
- ❌ Session-task relationships
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

2. **New API Routes**:
   - Create `route.ts` in `app/api/...`
   - Follow Next.js App Router conventions
   - Add proper error handling and validation
   - Use Prisma client from `@/lib/prisma`

3. **Authentication Changes**:
   - Modify `lib/auth/auth-options.ts`
   - Update `middleware.ts` if adding protected routes
   - Test both guest and authenticated flows

4. **UI Components**:
   - Place in `app/components/`
   - Use Tailwind CSS classes
   - Follow existing animation patterns (see `globals.css`)
   - Ensure responsive design

5. **State Management**:
   - Use existing contexts (`UserContext`, `ToastContext`)
   - Create new context if needed in `contexts/`
   - Wrap in `Providers.tsx`

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
- `middleware.ts` - Route protection

### Core Application Files
- `app/layout.tsx` - Root layout with providers
- `app/page.tsx` - Landing page
- `lib/auth/auth-options.ts` - NextAuth configuration
- `lib/prisma.ts` - Database client
- `prisma/schema.prisma` - Database schema

### Documentation
- `docs/requirements.md` - Full requirements (Japanese)
- `docs/development_plan.md` - Development roadmap
- `MIGRATION_RECOVERY.md` - Database migration troubleshooting
- `README.md` - Basic setup instructions

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

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-15 | 1.0.0 | Initial CLAUDE.md creation |

---

**Last Updated**: 2025-11-15
**Maintained By**: AI Assistants working on this project
**Contact**: See repository issues for questions
