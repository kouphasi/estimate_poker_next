This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup

### Google OAuth Configuration

To enable Google login, you need to set up OAuth credentials in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure OAuth consent screen if you haven't already:
   - Select **External** user type
   - Fill in required fields (App name, User support email, Developer contact email)
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth client ID:
   - Application type: **Web application**
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy the **Client ID** and **Client Secret**

### Environment Variables

Create a `.env.local` file in the root directory and add:

```bash
# Database
DATABASE_URL="your_postgres_connection_string"
POSTGRES_URL_NON_POOLING="your_direct_postgres_connection"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"    # Change to your domain in production

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

## Getting Started

First, install dependencies and set up the database:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

This project includes comprehensive testing infrastructure with unit tests and E2E tests.

### Running Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:coverage

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode (interactive)
npx playwright test --ui
```

### Test Structure

- **Unit Tests** (`__tests__/unit/`): Component and utility function tests using Vitest
- **E2E Tests** (`__tests__/e2e/`): End-to-end user flow tests using Playwright
- **Coverage Target**: 60% minimum (lines, functions, branches, statements)

### CI/CD

All tests run automatically on GitHub Actions:
- **Lint & Type Check**: ESLint and TypeScript validation
- **Unit Tests**: Vitest with coverage reporting
- **E2E Tests**: Playwright tests with 4-shard parallel execution

Coverage reports are automatically posted to pull requests.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
