-- CreateTable
CREATE TABLE IF NOT EXISTS "Url" (
    "id" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3)
);

-- CreateIndex
CREATE UNIQUE INDEX "Url.id_unique" ON "Url"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Url.original_unique" ON "Url"("original");

