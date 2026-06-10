export type PaddleSource = 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';

export interface HarmonizedPaddle {
  source: PaddleSource;
  company: string;
  paddleName: string;
  price?: string;
  discountCode?: string;
  purchaseLink?: string;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  coreThickness?: number;
  shape?: string;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  balancePoint?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  powerRating?: number | string;
  spinRating?: string;
  touchShotsRating?: number;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  sourceData?: unknown;
}

export interface HarmonizedDataResponse {
  success: boolean;
  data: {
    mattspickleball: HarmonizedPaddle[];
    pickleballeffect: HarmonizedPaddle[];
    pickleballstudio: HarmonizedPaddle[];
  };
  counts: {
    mattspickleball: number;
    pickleballeffect: number;
    pickleballstudio: number;
    total: number;
  };
}

export interface SingleSourceResponse {
  success: boolean;
  source: string;
  data: HarmonizedPaddle[];
  count: number;
}

export interface CombinedPaddle {
  company: string;
  paddleName: string;
  sources: string[];
  sourceCount: number;
  swingWeight?: number;
  twistWeight?: number;
  weight?: number;
  weightGrams?: number;
  spinRPM?: number;
  serveSpeed?: number;
  punchVolleySpeed?: number;
  coreThickness?: number;
  length?: number;
  width?: number;
  gripLength?: number;
  gripCircumference?: number;
  gripSize?: number;
  controlRating?: number;
  feelRating?: number;
  forgivenessRating?: number;
  touchShotsRating?: number;
  swingWeightPercentile?: string;
  twistWeightPercentile?: string;
  powerPercentile?: string;
  popPercentile?: string;
  spinPercentile?: string;
  balancePoint?: string;
  shape?: string;
  faceMaterial?: string;
  coreMaterial?: string;
  surfaceTexture?: string;
  paddleType?: string;
  manufacturingProcess?: string;
  buildType?: string;
  powerRating?: string;
  spinRating?: string;
  paddleRating?: string;
  releaseYear?: string;
  approvalBody?: string;
  paddleImage?: string;
  youtubeReview?: string;
  bestOffer?: {
    price: string;
    discountCode?: string;
    purchaseLink?: string;
    source: string;
  };
  allSourceData: Array<{
    source: string;
    price?: string;
    discountCode?: string;
    purchaseLink?: string;
    paddleImage?: string;
  }>;
}

export interface CombinedPaginationCursor {
  company: string;
  paddleName: string;
}
