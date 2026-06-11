-- CreateTable
CREATE TABLE "CardShare" (
    "id" SERIAL NOT NULL,
    "creditCardId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardShare_creditCardId_userId_key" ON "CardShare"("creditCardId", "userId");

-- AddForeignKey
ALTER TABLE "CardShare" ADD CONSTRAINT "CardShare_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardShare" ADD CONSTRAINT "CardShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
