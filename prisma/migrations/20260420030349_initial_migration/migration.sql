-- CreateEnum
CREATE TYPE "PoliyType" AS ENUM ('Privacy', 'Terms');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'SELLER', 'CHECKER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "NotificationLevel" AS ENUM ('Critical');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('Email', 'Firebase');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('account_created');

-- CreateTable
CREATE TABLE "site_policies" (
    "id" TEXT NOT NULL,
    "type" "PoliyType" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_policies_id_type_idx" ON "site_policies"("id", "type");
