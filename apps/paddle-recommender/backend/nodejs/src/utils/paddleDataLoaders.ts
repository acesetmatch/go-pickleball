import fs from 'fs/promises';
import path from 'path';
import type { CombinedPaddle, HarmonizedPaddle, PaddleSource } from '../types';
import type { PrismaService } from '../services/prismaService';
import { combineSourcePaddles } from './combinedPaddles';

export async function loadHarmonizedDataFromDB(
  prismaService: PrismaService,
  source: PaddleSource
): Promise<HarmonizedPaddle[]> {
  const paddles = await prismaService.getSourcePaddlesBySource(source);

  return paddles.map(paddle => ({
    source: paddle.source as PaddleSource,
    company: paddle.company,
    paddleName: paddle.paddleName,
    price: paddle.price || undefined,
    discountCode: paddle.discountCode || undefined,
    purchaseLink: paddle.purchaseLink || undefined,
    swingWeight: paddle.swingWeight || undefined,
    twistWeight: paddle.twistWeight || undefined,
    weight: paddle.weight || undefined,
    weightGrams: paddle.weightGrams || undefined,
    spinRPM: paddle.spinRPM || undefined,
    serveSpeed: paddle.serveSpeed || undefined,
    punchVolleySpeed: paddle.punchVolleySpeed || undefined,
    swingWeightPercentile: paddle.swingWeightPercentile || undefined,
    twistWeightPercentile: paddle.twistWeightPercentile || undefined,
    powerPercentile: paddle.powerPercentile || undefined,
    popPercentile: paddle.popPercentile || undefined,
    spinPercentile: paddle.spinPercentile || undefined,
    coreThickness: paddle.coreThickness || undefined,
    shape: paddle.shape || undefined,
    length: paddle.length || undefined,
    width: paddle.width || undefined,
    gripLength: paddle.gripLength || undefined,
    gripCircumference: paddle.gripCircumference || undefined,
    gripSize: paddle.gripSize || undefined,
    balancePoint: paddle.balancePoint || undefined,
    faceMaterial: paddle.faceMaterial || undefined,
    coreMaterial: paddle.coreMaterial || undefined,
    surfaceTexture: paddle.surfaceTexture || undefined,
    paddleType: paddle.paddleType || undefined,
    manufacturingProcess: paddle.manufacturingProcess || undefined,
    buildType: paddle.buildType || undefined,
    controlRating: paddle.controlRating || undefined,
    feelRating: paddle.feelRating || undefined,
    forgivenessRating: paddle.forgivenessRating || undefined,
    powerRating: paddle.powerRating || undefined,
    spinRating: paddle.spinRating || undefined,
    touchShotsRating: paddle.touchShotsRating || undefined,
    paddleRating: paddle.paddleRating || undefined,
    releaseYear: paddle.releaseYear || undefined,
    approvalBody: paddle.approvalBody || undefined,
    paddleImage: paddle.paddleImage || undefined,
    youtubeReview: paddle.youtubeReview || undefined,
    sourceData: paddle.sourceData
  }));
}

export async function loadHarmonizedDataFromFile(
  outputDir: string,
  source: PaddleSource
): Promise<HarmonizedPaddle[]> {
  const filePath = path.join(outputDir, `harmonized_${source}.json`);
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

export async function loadCombinedMedianDataFromDB(
  prismaService: PrismaService
): Promise<CombinedPaddle[]> {
  const paddles = await prismaService.getAllSourcePaddles();
  return combineSourcePaddles(paddles);
}

export async function loadCombinedMedianDataFromFile(
  outputDir: string
): Promise<CombinedPaddle[]> {
  const filePath = path.join(outputDir, 'harmonized_combined_median.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent) as CombinedPaddle[];
}
