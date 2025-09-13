-- CreateTable
CREATE TABLE "public"."tariffs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pvPricePerKwh" DOUBLE PRECISION NOT NULL,
    "gridPricePerKwh" DOUBLE PRECISION NOT NULL,
    "baseFeePerMonth" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pv_generations" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "generationKwh" DOUBLE PRECISION NOT NULL,
    "meterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pv_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."settlements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gridCostPerKwh" DOUBLE PRECISION NOT NULL,
    "feedInPricePerKwh" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."consumptions" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "consumptionKwh" DOUBLE PRECISION NOT NULL,
    "meterColumn" TEXT NOT NULL,
    "userId" TEXT,
    "tariffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tariffs_name_key" ON "public"."tariffs"("name");

-- CreateIndex
CREATE INDEX "pv_generations_timestamp_idx" ON "public"."pv_generations"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_name_key" ON "public"."settlements"("name");

-- CreateIndex
CREATE INDEX "consumptions_timestamp_userId_idx" ON "public"."consumptions"("timestamp", "userId");

-- CreateIndex
CREATE INDEX "consumptions_meterColumn_timestamp_idx" ON "public"."consumptions"("meterColumn", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."consumptions" ADD CONSTRAINT "consumptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."consumptions" ADD CONSTRAINT "consumptions_tariffId_fkey" FOREIGN KEY ("tariffId") REFERENCES "public"."tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
