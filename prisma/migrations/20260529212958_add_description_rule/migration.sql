-- CreateTable
CREATE TABLE "DescriptionRule" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "creditCardId" INTEGER NOT NULL,
    "palavra" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DescriptionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DescriptionRule_creditCardId_palavra_key" ON "DescriptionRule"("creditCardId", "palavra");

-- AddForeignKey
ALTER TABLE "DescriptionRule" ADD CONSTRAINT "DescriptionRule_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DescriptionRule" ADD CONSTRAINT "DescriptionRule_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
