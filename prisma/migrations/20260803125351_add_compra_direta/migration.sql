-- CreateTable
CREATE TABLE "CompraDireta" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "numeroParcelas" INTEGER NOT NULL DEFAULT 1,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompraDireta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompraDireta" ADD CONSTRAINT "CompraDireta_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
