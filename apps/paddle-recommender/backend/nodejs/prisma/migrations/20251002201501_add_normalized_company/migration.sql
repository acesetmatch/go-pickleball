-- AlterTable
ALTER TABLE "source_paddles" ADD COLUMN     "normalized_company" TEXT;

-- CreateIndex
CREATE INDEX "source_paddles_normalized_company_idx" ON "source_paddles"("normalized_company");
