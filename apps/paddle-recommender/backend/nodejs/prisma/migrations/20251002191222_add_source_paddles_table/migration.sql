-- CreateTable
CREATE TABLE "source_paddles" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "paddle_name" TEXT NOT NULL,
    "price" TEXT,
    "discount_code" TEXT,
    "purchase_link" TEXT,
    "swing_weight" DOUBLE PRECISION,
    "twist_weight" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "weight_grams" DOUBLE PRECISION,
    "spin_rpm" INTEGER,
    "serve_speed" DOUBLE PRECISION,
    "punch_volley_speed" DOUBLE PRECISION,
    "swing_weight_percentile" TEXT,
    "twist_weight_percentile" TEXT,
    "power_percentile" TEXT,
    "pop_percentile" TEXT,
    "spin_percentile" TEXT,
    "core_thickness" DOUBLE PRECISION,
    "shape" TEXT,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "grip_length" DOUBLE PRECISION,
    "grip_circumference" DOUBLE PRECISION,
    "grip_size" DOUBLE PRECISION,
    "balance_point" TEXT,
    "face_material" TEXT,
    "core_material" TEXT,
    "surface_texture" TEXT,
    "paddle_type" TEXT,
    "manufacturing_process" TEXT,
    "build_type" TEXT,
    "control_rating" INTEGER,
    "feel_rating" INTEGER,
    "forgiveness_rating" INTEGER,
    "power_rating" TEXT,
    "spin_rating" TEXT,
    "touch_shots_rating" INTEGER,
    "paddle_rating" TEXT,
    "release_year" TEXT,
    "approval_body" TEXT,
    "paddle_image" TEXT,
    "youtube_review" TEXT,
    "source_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_paddles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "source_paddles_source_idx" ON "source_paddles"("source");

-- CreateIndex
CREATE INDEX "source_paddles_company_idx" ON "source_paddles"("company");

-- CreateIndex
CREATE UNIQUE INDEX "source_paddles_source_company_paddle_name_key" ON "source_paddles"("source", "company", "paddle_name");
