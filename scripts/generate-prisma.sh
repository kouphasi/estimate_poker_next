#!/bin/bash
# Script to generate Prisma client with environment variables for CI/CD

if [ -n "$CI" ] || [ -n "$VERCEL" ] || [ -n "$GITHUB_ACTIONS" ]; then
  # In CI environment, run normally
  npx prisma generate
else
  # In local environment, try with fallback
  PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate 2>/dev/null || echo "Skipping Prisma generation in local environment"
fi
