-- Extend existing enums used by the mobile workflows.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'order_updated';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'message_received';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'promotion_updated';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'seller_verification_updated';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'support_updated';
ALTER TYPE "SellerDocumentType" RENAME VALUE 'Business_License' TO 'BUSINESS_LICENSE';
ALTER TYPE "SellerDocumentType" ADD VALUE IF NOT EXISTS 'TAX_CERTIFICATE';
ALTER TYPE "SellerDocumentType" ADD VALUE IF NOT EXISTS 'OWNER_ID';

CREATE TYPE "VerificationPurpose" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');
CREATE TYPE "BusinessVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DocumentVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PromotionPlan" AS ENUM ('STARTER', 'PREMIUM', 'PRO');
CREATE TYPE "PromotionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentPurpose" AS ENUM ('ORDER', 'PROMOTION');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

ALTER TABLE "users"
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deletedAt" TIMESTAMP(3);

ALTER TABLE "products"
  ADD COLUMN "verification_document_url" TEXT,
  ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "brands"
  ADD COLUMN "seller_id" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "orders"
  ADD COLUMN "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "delivery_address" TEXT;

ALTER TABLE "order_items"
  ADD COLUMN "product_id" TEXT,
  ADD COLUMN "seller_id" TEXT;

ALTER TABLE "notifications" ADD COLUMN "readAt" TIMESTAMP(3);

-- Preserve any legacy document rows only if they can be connected to a seller.
ALTER TABLE "SellerDocument" RENAME TO "seller_documents";
DELETE FROM "seller_documents";
ALTER TABLE "seller_documents"
  ADD COLUMN "file_url" TEXT NOT NULL,
  ADD COLUMN "status" "DocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "rejection_reason" TEXT,
  ADD COLUMN "seller_id" TEXT NOT NULL,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Consolidate duplicate cart rows before enforcing idempotent add-to-cart behavior.
WITH totals AS (
  SELECT "cart_id", "product_id", MIN("id") AS keep_id, SUM("quantity")::INTEGER AS total_quantity
  FROM "cart_items"
  GROUP BY "cart_id", "product_id"
), updated AS (
  UPDATE "cart_items" item
  SET "quantity" = totals.total_quantity
  FROM totals
  WHERE item."id" = totals.keep_id
)
DELETE FROM "cart_items" item
USING totals
WHERE item."cart_id" = totals."cart_id"
  AND item."product_id" = totals."product_id"
  AND item."id" <> totals.keep_id;

CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE INDEX "brands_id_seller_id_idx" ON "brands"("id", "seller_id");
DROP INDEX IF EXISTS "brands_id_idx";
CREATE INDEX "order_items_id_order_id_seller_id_idx" ON "order_items"("id", "order_id", "seller_id");
DROP INDEX IF EXISTS "order_items_id_order_id_idx";

CREATE TABLE "business_profiles" (
  "id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "business_name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "registration_number" TEXT NOT NULL,
  "tax_number" TEXT,
  "business_email" TEXT NOT NULL,
  "business_phone" TEXT NOT NULL,
  "business_address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "zip_code" TEXT NOT NULL,
  "website_url" TEXT,
  "description" TEXT,
  "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "rejection_reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_profiles_seller_id_key" ON "business_profiles"("seller_id");
CREATE INDEX "business_profiles_status_idx" ON "business_profiles"("status");

CREATE TABLE "verification_codes" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "purpose" "VerificationPurpose" NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_codes_user_id_purpose_expiresAt_idx" ON "verification_codes"("user_id", "purpose", "expiresAt");

CREATE TABLE "conversations" (
  "id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conversations_buyer_id_seller_id_key" ON "conversations"("buyer_id", "seller_id");
CREATE INDEX "conversations_buyer_id_lastMessageAt_idx" ON "conversations"("buyer_id", "lastMessageAt");
CREATE INDEX "conversations_seller_id_lastMessageAt_idx" ON "conversations"("seller_id", "lastMessageAt");

CREATE TABLE "messages" (
  "id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_conversation_id_createdAt_idx" ON "messages"("conversation_id", "createdAt");
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

CREATE TABLE "promotion_subscriptions" (
  "id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "plan" "PromotionPlan" NOT NULL,
  "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "price" DOUBLE PRECISION NOT NULL,
  "duration_months" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "promotion_subscriptions_seller_id_status_endsAt_idx" ON "promotion_subscriptions"("seller_id", "status", "endsAt");

CREATE TABLE "promotion_products" (
  "promotion_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotion_id", "product_id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "purpose" "PaymentPurpose" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "provider_payment_id" TEXT,
  "order_id" TEXT,
  "promotion_id" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");
CREATE UNIQUE INDEX "payments_promotion_id_key" ON "payments"("promotion_id");
CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");

CREATE TABLE "refund_requests" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
  "admin_note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refund_requests_order_id_key" ON "refund_requests"("order_id");
CREATE INDEX "refund_requests_user_id_status_idx" ON "refund_requests"("user_id", "status");

CREATE TABLE "support_tickets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "admin_response" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "support_tickets_user_id_status_idx" ON "support_tickets"("user_id", "status");

ALTER TABLE "brands" ADD CONSTRAINT "brands_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_profiles" ADD CONSTRAINT "business_profiles_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_logs" ADD CONSTRAINT "order_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_subscriptions" ADD CONSTRAINT "promotion_subscriptions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
