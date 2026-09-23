-- CreateIndex
CREATE INDEX "Collection_userId_isFavorite_idx" ON "Collection"("userId", "isFavorite");

-- CreateIndex
CREATE INDEX "Item_userId_createdAt_idx" ON "Item"("userId", "createdAt");
