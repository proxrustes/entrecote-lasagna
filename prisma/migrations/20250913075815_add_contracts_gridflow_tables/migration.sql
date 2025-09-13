-- AlterTable
ALTER TABLE "public"."tariffs" ADD COLUMN     "model" TEXT NOT NULL DEFAULT 'two_price';

-- CreateTable
CREATE TABLE "public"."contracts" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "tenantName" TEXT NOT NULL,
    "meterColumn" TEXT NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "billingCycle" TEXT NOT NULL DEFAULT 'yearly',
    "baseFeeShare" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "tariffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grid_flows" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "importKwh" DOUBLE PRECISION NOT NULL,
    "exportKwh" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grid_flows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractId_key" ON "public"."contracts"("contractId");

-- CreateIndex
CREATE INDEX "grid_flows_timestamp_idx" ON "public"."grid_flows"("timestamp");

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contracts" ADD CONSTRAINT "contracts_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "public"."tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
