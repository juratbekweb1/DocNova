> -- CreateSchema
  CREATE SCHEMA IF NOT EXISTS "public";
  
> -- CreateEnum
  CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
  
> -- CreateEnum
  CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
  
> -- CreateEnum
  CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'CV', 'COVER_LETTER', 'CONTRACT', 'CERTIFICATE', 'APPLICATION', 'REPORT');
  
> -- CreateEnum
  CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  
> -- CreateTable
  CREATE TABLE "Organization" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "deletedAt" TIMESTAMP(3),
  
      CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "User" (
      "id" TEXT NOT NULL,
      "name" TEXT,
      "email" TEXT,
      "emailVerified" TIMESTAMP(3),
      "image" TEXT,
      "phone" TEXT,
      "passwordHash" TEXT,
      "role" "UserRole" NOT NULL DEFAULT 'USER',
      "planId" TEXT,
      "aiUsageCount" INTEGER NOT NULL DEFAULT 0,
      "lastResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "deletedAt" TIMESTAMP(3),
      "lockedUntil" TIMESTAMP(3),
      "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
      "username" TEXT,
      "displayName" TEXT,
      "bio" TEXT,
      "country" TEXT,
      "language" TEXT,
      "theme" TEXT,
      "timezone" TEXT,
      "avatar" TEXT,
      "lastLoginAt" TIMESTAMP(3),
      "lastSeenAt" TIMESTAMP(3),
      "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
      "twoFactorSecret" TEXT,
      "sessionVersion" INTEGER NOT NULL DEFAULT 0,
      "telegramId" TEXT,
      "telegramUsername" TEXT,
      "telegramChatId" TEXT,
      "isTelegramLinked" BOOLEAN NOT NULL DEFAULT false,
      "telegramLinkToken" TEXT,
  
      CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "BackupRecoveryCode" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "BackupRecoveryCode_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "OrganizationUser" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" "Role" NOT NULL DEFAULT 'MEMBER',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "OrganizationUser_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Account" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
  
      CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Session" (
      "id" TEXT NOT NULL,
      "sessionToken" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      "deviceInfo" TEXT,
  
      CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL
  );
  
> -- CreateTable
  CREATE TABLE "PasswordReset" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "EmailVerification" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL,
      "verifiedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "AuditLog" (
      "id" TEXT NOT NULL,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "metadata" JSONB,
      "ipAddress" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "SecurityEvent" (
      "id" TEXT NOT NULL,
      "userId" TEXT,
      "type" TEXT NOT NULL,
      "ipAddress" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Folder" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "parentId" TEXT,
      "userId" TEXT NOT NULL,
      "organizationId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Document" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "organizationId" TEXT,
      "folderId" TEXT,
      "type" "DocumentType" NOT NULL,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
      "templateId" TEXT,
      "tags" TEXT[],
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "deletedAt" TIMESTAMP(3),
  
      CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "DocumentMetadata" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "value" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "DocumentMetadata_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "DocumentSection" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT,
      "content" JSONB NOT NULL,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "DocumentSection_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "DocumentVersion" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "snapshot" JSONB NOT NULL,
      "changeLog" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdBy" TEXT,
  
      CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "DocumentAsset" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "DocumentAsset_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Share" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "permissions" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Activity" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "AIConversation" (
      "id" TEXT NOT NULL,
      "documentId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "systemPrompt" TEXT,
      "messages" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Template" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "thumbnailUrl" TEXT,
      "isPremium" BOOLEAN NOT NULL DEFAULT false,
      "premiumOnly" BOOLEAN NOT NULL DEFAULT false,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Plan" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "stripePriceIdMonthly" TEXT,
      "stripePriceIdYearly" TEXT,
      "priceMonthly" DOUBLE PRECISION,
      "priceYearly" DOUBLE PRECISION,
      "aiDailyLimit" INTEGER NOT NULL DEFAULT 0,
      "features" JSONB NOT NULL,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
  
      CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Transaction" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "provider" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "PromoCode" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "discountType" TEXT NOT NULL,
      "discountValue" DOUBLE PRECISION NOT NULL,
      "validUntil" TIMESTAMP(3),
      "usageLimit" INTEGER,
      "timesUsed" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "Subscription" (
      "id" TEXT NOT NULL,
      "organizationId" TEXT NOT NULL,
      "planId" TEXT NOT NULL,
      "stripeCustomerId" TEXT,
      "stripeSubscriptionId" TEXT,
      "status" TEXT NOT NULL,
      "currentPeriodEnd" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "JobApplication" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "documentId" TEXT,
      "company" TEXT NOT NULL,
      "position" TEXT NOT NULL,
      "location" TEXT,
      "jobUrl" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Saved',
      "appliedAt" TIMESTAMP(3),
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "DocumentScore" (
      "id" TEXT NOT NULL,
      "versionId" TEXT NOT NULL,
      "overallScore" INTEGER NOT NULL,
      "atsScore" INTEGER NOT NULL,
      "contentScore" INTEGER NOT NULL,
      "keywordScore" INTEGER NOT NULL,
      "formattingScore" INTEGER NOT NULL,
      "readabilityScore" INTEGER NOT NULL,
      "matchedKeywords" TEXT[],
      "missingKeywords" TEXT[],
      "recommendations" JSONB,
      "analysisContext" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "DocumentScore_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "UserFavoriteTool" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "toolId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "UserFavoriteTool_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "UserRecentTool" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "toolId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "subTitle" TEXT,
      "route" TEXT NOT NULL,
      "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "UserRecentTool_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "UserApiLimit" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "count" INTEGER NOT NULL DEFAULT 0,
      "pdfCount" INTEGER NOT NULL DEFAULT 0,
      "cvCount" INTEGER NOT NULL DEFAULT 0,
      "ieltsCount" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
  
      CONSTRAINT "UserApiLimit_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "AtsAnalysis" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "documentId" TEXT,
      "resumeText" TEXT,
      "jobDescription" TEXT,
      "overallScore" INTEGER NOT NULL,
      "keywordScore" INTEGER NOT NULL,
      "formatScore" INTEGER NOT NULL,
      "completenessScore" INTEGER NOT NULL,
      "feedback" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "AtsAnalysis_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateTable
  CREATE TABLE "SecurityLog" (
      "id" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "path" TEXT,
      "details" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
      CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
  );
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
  
> -- CreateIndex
  CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "User_telegramLinkToken_key" ON "User"("telegramLinkToken");
  
> -- CreateIndex
  CREATE INDEX "User_email_idx" ON "User"("email");
  
> -- CreateIndex
  CREATE INDEX "User_role_idx" ON "User"("role");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "BackupRecoveryCode_code_key" ON "BackupRecoveryCode"("code");
  
> -- CreateIndex
  CREATE INDEX "BackupRecoveryCode_userId_idx" ON "BackupRecoveryCode"("userId");
  
> -- CreateIndex
  CREATE INDEX "OrganizationUser_userId_idx" ON "OrganizationUser"("userId");
  
> -- CreateIndex
  CREATE INDEX "OrganizationUser_organizationId_idx" ON "OrganizationUser"("organizationId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "OrganizationUser_organizationId_userId_key" ON "OrganizationUser"("organizationId", "userId");
  
> -- CreateIndex
  CREATE INDEX "Account_userId_idx" ON "Account"("userId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
  
> -- CreateIndex
  CREATE INDEX "Session_userId_idx" ON "Session"("userId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");
  
> -- CreateIndex
  CREATE INDEX "PasswordReset_email_idx" ON "PasswordReset"("email");
  
> -- CreateIndex
  CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "EmailVerification_tokenHash_key" ON "EmailVerification"("tokenHash");
  
> -- CreateIndex
  CREATE INDEX "EmailVerification_userId_idx" ON "EmailVerification"("userId");
  
> -- CreateIndex
  CREATE INDEX "EmailVerification_tokenHash_idx" ON "EmailVerification"("tokenHash");
  
> -- CreateIndex
  CREATE INDEX "EmailVerification_expires_idx" ON "EmailVerification"("expires");
  
> -- CreateIndex
  CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
  
> -- CreateIndex
  CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
  
> -- CreateIndex
  CREATE INDEX "SecurityEvent_userId_idx" ON "SecurityEvent"("userId");
  
> -- CreateIndex
  CREATE INDEX "SecurityEvent_ipAddress_idx" ON "SecurityEvent"("ipAddress");
  
> -- CreateIndex
  CREATE INDEX "Folder_userId_idx" ON "Folder"("userId");
  
> -- CreateIndex
  CREATE INDEX "Folder_organizationId_idx" ON "Folder"("organizationId");
  
> -- CreateIndex
  CREATE INDEX "Folder_parentId_idx" ON "Folder"("parentId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Document_slug_key" ON "Document"("slug");
  
> -- CreateIndex
  CREATE INDEX "Document_userId_idx" ON "Document"("userId");
  
> -- CreateIndex
  CREATE INDEX "Document_organizationId_idx" ON "Document"("organizationId");
  
> -- CreateIndex
  CREATE INDEX "Document_folderId_idx" ON "Document"("folderId");
  
> -- CreateIndex
  CREATE INDEX "Document_type_idx" ON "Document"("type");
  
> -- CreateIndex
  CREATE INDEX "Document_status_idx" ON "Document"("status");
  
> -- CreateIndex
  CREATE INDEX "DocumentMetadata_documentId_idx" ON "DocumentMetadata"("documentId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "DocumentMetadata_documentId_key_key" ON "DocumentMetadata"("documentId", "key");
  
> -- CreateIndex
  CREATE INDEX "DocumentSection_documentId_idx" ON "DocumentSection"("documentId");
  
> -- CreateIndex
  CREATE INDEX "DocumentSection_sortOrder_idx" ON "DocumentSection"("sortOrder");
  
> -- CreateIndex
  CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");
  
> -- CreateIndex
  CREATE INDEX "DocumentAsset_documentId_idx" ON "DocumentAsset"("documentId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Share_token_key" ON "Share"("token");
  
> -- CreateIndex
  CREATE INDEX "Share_documentId_idx" ON "Share"("documentId");
  
> -- CreateIndex
  CREATE INDEX "Share_token_idx" ON "Share"("token");
  
> -- CreateIndex
  CREATE INDEX "Activity_documentId_idx" ON "Activity"("documentId");
  
> -- CreateIndex
  CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
  
> -- CreateIndex
  CREATE INDEX "AIConversation_documentId_idx" ON "AIConversation"("documentId");
  
> -- CreateIndex
  CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");
  
> -- CreateIndex
  CREATE INDEX "Template_slug_idx" ON "Template"("slug");
  
> -- CreateIndex
  CREATE INDEX "Template_category_idx" ON "Template"("category");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");
  
> -- CreateIndex
  CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
  
> -- CreateIndex
  CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
  
> -- CreateIndex
  CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
  
> -- CreateIndex
  CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");
  
> -- CreateIndex
  CREATE INDEX "JobApplication_userId_idx" ON "JobApplication"("userId");
  
> -- CreateIndex
  CREATE INDEX "JobApplication_documentId_idx" ON "JobApplication"("documentId");
  
> -- CreateIndex
  CREATE INDEX "JobApplication_status_idx" ON "JobApplication"("status");
  
> -- CreateIndex
  CREATE INDEX "JobApplication_appliedAt_idx" ON "JobApplication"("appliedAt");
  
> -- CreateIndex
  CREATE INDEX "DocumentScore_versionId_idx" ON "DocumentScore"("versionId");
  
> -- CreateIndex
  CREATE INDEX "UserFavoriteTool_userId_idx" ON "UserFavoriteTool"("userId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "UserFavoriteTool_userId_toolId_key" ON "UserFavoriteTool"("userId", "toolId");
  
> -- CreateIndex
  CREATE INDEX "UserRecentTool_userId_idx" ON "UserRecentTool"("userId");
  
> -- CreateIndex
  CREATE INDEX "UserRecentTool_lastUsedAt_idx" ON "UserRecentTool"("lastUsedAt");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "UserRecentTool_userId_toolId_key" ON "UserRecentTool"("userId", "toolId");
  
> -- CreateIndex
  CREATE UNIQUE INDEX "UserApiLimit_userId_key" ON "UserApiLimit"("userId");
  
> -- CreateIndex
  CREATE INDEX "AtsAnalysis_userId_idx" ON "AtsAnalysis"("userId");
  
> -- CreateIndex
  CREATE INDEX "AtsAnalysis_documentId_idx" ON "AtsAnalysis"("documentId");
  
> -- CreateIndex
  CREATE INDEX "SecurityLog_eventType_idx" ON "SecurityLog"("eventType");
  
> -- CreateIndex
  CREATE INDEX "SecurityLog_ipAddress_idx" ON "SecurityLog"("ipAddress");
  
> -- CreateIndex
  CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");
  
> -- AddForeignKey
  ALTER TABLE "BackupRecoveryCode" ADD CONSTRAINT "BackupRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Folder" ADD CONSTRAINT "Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Folder" ADD CONSTRAINT "Folder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Document" ADD CONSTRAINT "Document_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Document" ADD CONSTRAINT "Document_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "DocumentMetadata" ADD CONSTRAINT "DocumentMetadata_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "DocumentSection" ADD CONSTRAINT "DocumentSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "DocumentAsset" ADD CONSTRAINT "DocumentAsset_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Share" ADD CONSTRAINT "Share_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Activity" ADD CONSTRAINT "Activity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "DocumentScore" ADD CONSTRAINT "DocumentScore_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "UserFavoriteTool" ADD CONSTRAINT "UserFavoriteTool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "UserRecentTool" ADD CONSTRAINT "UserRecentTool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "UserApiLimit" ADD CONSTRAINT "UserApiLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "AtsAnalysis" ADD CONSTRAINT "AtsAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
> -- AddForeignKey
  ALTER TABLE "AtsAnalysis" ADD CONSTRAINT "AtsAnalysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  
