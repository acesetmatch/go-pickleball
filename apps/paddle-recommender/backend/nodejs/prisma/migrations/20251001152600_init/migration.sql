-- CreateTable
CREATE TABLE "paddles" (
    "id" SERIAL NOT NULL,
    "paddle_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "image_url" TEXT,
    "buy_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_specs" (
    "id" SERIAL NOT NULL,
    "paddle_id" INTEGER NOT NULL,
    "shape" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "average_weight" DOUBLE PRECISION NOT NULL,
    "core" DOUBLE PRECISION NOT NULL,
    "paddle_length" DOUBLE PRECISION NOT NULL,
    "paddle_width" DOUBLE PRECISION NOT NULL,
    "grip_length" DOUBLE PRECISION NOT NULL,
    "grip_type" TEXT NOT NULL,
    "grip_circumference" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paddle_performance" (
    "id" SERIAL NOT NULL,
    "paddle_spec_id" INTEGER NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "pop" DOUBLE PRECISION NOT NULL,
    "spin" DOUBLE PRECISION NOT NULL,
    "twist_weight" DOUBLE PRECISION NOT NULL,
    "swing_weight" DOUBLE PRECISION NOT NULL,
    "balance_point" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paddle_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "paddles_paddle_id_key" ON "paddles"("paddle_id");

-- AddForeignKey
ALTER TABLE "paddle_specs" ADD CONSTRAINT "paddle_specs_paddle_id_fkey" FOREIGN KEY ("paddle_id") REFERENCES "paddles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paddle_performance" ADD CONSTRAINT "paddle_performance_paddle_spec_id_fkey" FOREIGN KEY ("paddle_spec_id") REFERENCES "paddle_specs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
