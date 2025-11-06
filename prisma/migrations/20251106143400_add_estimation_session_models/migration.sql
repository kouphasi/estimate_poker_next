-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'FINALIZED');

-- CreateTable
CREATE TABLE "estimation_sessions" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "finalEstimate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estimation_sessions_shareToken_key" ON "estimation_sessions"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_session_id_nickname_key" ON "estimates"("session_id", "nickname");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "estimation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
