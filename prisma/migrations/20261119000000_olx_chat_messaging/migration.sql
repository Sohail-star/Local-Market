-- CreateEnum
CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'VOICE', 'IMAGE');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "serviceId" TEXT,
    "listingType" TEXT,
    "listingRefId" TEXT,
    "listingTitle" TEXT,
    "listingPriceLabel" TEXT,
    "listingImageUrl" TEXT,
    "locationLabel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- AlterTable (non-destructive updates preserving existing Enquiry messages)
ALTER TABLE "messages"
    ALTER COLUMN "enquiryId" DROP NOT NULL,
    ALTER COLUMN "body" DROP NOT NULL,
    ADD COLUMN "conversationId" TEXT,
    ADD COLUMN "content" TEXT,
    ADD COLUMN "messageType" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
    ADD COLUMN "mediaUrl" TEXT;

-- CreateIndex
CREATE INDEX "conversations_buyerId_updatedAt_idx" ON "conversations"("buyerId", "updatedAt");
CREATE INDEX "conversations_sellerId_updatedAt_idx" ON "conversations"("sellerId", "updatedAt");
CREATE INDEX "conversations_buyerId_sellerId_productId_serviceId_idx" ON "conversations"("buyerId", "sellerId", "productId", "serviceId");
CREATE INDEX "conversations_buyerId_sellerId_listingRefId_idx" ON "conversations"("buyerId", "sellerId", "listingRefId");
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
