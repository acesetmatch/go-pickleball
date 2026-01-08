import { FastifyPluginAsync } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { PrismaService } from '../services/prismaService';

interface HarmonizedPaddle {
  source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';
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
  [key: string]: any; // For sourceData and other dynamic fields
}

interface HarmonizedDataResponse {
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

interface SingleSourceResponse {
  success: boolean;
  source: string;
  data: HarmonizedPaddle[];
  count: number;
}

const paddleRoutes: FastifyPluginAsync = async (fastify) => {
  const outputDir = path.join(process.cwd(), 'output', 'harmonized');
  const prismaService = new PrismaService();

  // Helper function to load harmonized data from database
  async function loadHarmonizedDataFromDB(source: string): Promise<HarmonizedPaddle[]> {
    const paddles = await prismaService.prisma.sourcePaddle.findMany({
      where: { source },
      orderBy: [
        { company: 'asc' },
        { paddleName: 'asc' }
      ]
    });

    return paddles.map(paddle => ({
      source: paddle.source as 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio',
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

  // Helper function to load harmonized data from file (fallback)
  async function loadHarmonizedDataFromFile(source: string): Promise<HarmonizedPaddle[]> {
    const filePath = path.join(outputDir, `harmonized_${source}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  // Helper function to load combined median data
  async function loadCombinedMedianData(): Promise<any[]> {
    const filePath = path.join(outputDir, 'harmonized_combined_median.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  }

  // GET /api/paddles - Get all paddles with basic info (from database)
  fastify.get('/', async (request, reply) => {
    try {
      const paddles = await prismaService.getAllPaddles();
      reply.send(paddles);
    } catch (error) {
      fastify.log.error(error, 'Error getting all paddles');
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch paddles'
      });
    }
  });

  // GET /api/paddles/:id - Get complete details for a specific paddle
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const paddle = await prismaService.getPaddleById(id);

      if (!paddle) {
        reply.status(404).send({
          success: false,
          error: 'Paddle not found'
        });
        return;
      }

      reply.send(paddle);
    } catch (error) {
      fastify.log.error(error, 'Error getting paddle by ID');
      reply.status(500).send({
        success: false,
        error: 'Failed to fetch paddle details'
      });
    }
  });

  // POST /api/paddles - Upload paddle stats (harmonized data)
  fastify.post<{
    Body: {
      source: 'mattspickleball' | 'pickleballeffect' | 'pickleballstudio';
      data: HarmonizedPaddle[];
    };
  }>('/', async (request, reply) => {
    try {
      const { source, data } = request.body;

      if (!source || !data || !Array.isArray(data)) {
        reply.status(400).send({
          success: false,
          error: 'Invalid request body. Expected { source, data }'
        });
        return;
      }

      const validSources = ['mattspickleball', 'pickleballeffect', 'pickleballstudio'];
      if (!validSources.includes(source)) {
        reply.status(400).send({
          success: false,
          error: `Invalid source. Must be one of: ${validSources.join(', ')}`
        });
        return;
      }

      // Save to file
      await fs.mkdir(outputDir, { recursive: true });
      const filePath = path.join(outputDir, `harmonized_${source}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      reply.send({
        success: true,
        message: `Successfully uploaded ${data.length} paddles for source: ${source}`,
        count: data.length
      });
    } catch (error) {
      fastify.log.error(error, 'Error uploading paddle stats');
      reply.status(500).send({
        success: false,
        error: 'Failed to upload paddle stats'
      });
    }
  });

  // GET /api/paddles/sources/all - Get all harmonized paddle data from all sources
  fastify.get<{ Reply: HarmonizedDataResponse }>('/sources/all', async (request, reply) => {
    try {
      const [mattData, effectData, studioData] = await Promise.all([
        loadHarmonizedDataFromDB('mattspickleball'),
        loadHarmonizedDataFromDB('pickleballeffect'),
        loadHarmonizedDataFromDB('pickleballstudio')
      ]);

      const response: HarmonizedDataResponse = {
        success: true,
        data: {
          mattspickleball: mattData,
          pickleballeffect: effectData,
          pickleballstudio: studioData
        },
        counts: {
          mattspickleball: mattData.length,
          pickleballeffect: effectData.length,
          pickleballstudio: studioData.length,
          total: mattData.length + effectData.length + studioData.length
        }
      };

      reply.send(response);
    } catch (error) {
      fastify.log.error(error, 'Error loading harmonized paddle data');
      reply.status(500).send({
        success: false,
        error: 'Failed to load harmonized paddle data'
      });
    }
  });

  // GET /api/paddles/combined - Get combined median paddle data
  fastify.get('/combined', async (request, reply) => {
    try {
      const combinedData = await loadCombinedMedianData();

      reply.send({
        success: true,
        count: combinedData.length,
        data: combinedData
      });
    } catch (error) {
      fastify.log.error(error, 'Error loading combined median data');
      reply.status(500).send({
        success: false,
        error: 'Failed to load combined paddle data'
      });
    }
  });

  // GET /api/paddles/sources/:source - Get harmonized data from a specific source
  fastify.get<{
    Params: { source: string };
    Reply: SingleSourceResponse;
  }>('/sources/:source', async (request, reply) => {
    const { source } = request.params;

    const validSources = ['mattspickleball', 'pickleballeffect', 'pickleballstudio'];
    if (!validSources.includes(source)) {
      reply.status(400).send({
        success: false,
        error: `Invalid source. Must be one of: ${validSources.join(', ')}`
      });
      return;
    }

    try {
      const data = await loadHarmonizedDataFromDB(source);

      const response: SingleSourceResponse = {
        success: true,
        source,
        data,
        count: data.length
      };

      reply.send(response);
    } catch (error) {
      fastify.log.error(error, `Error loading harmonized data for source: ${source}`);
      reply.status(500).send({
        success: false,
        error: `Failed to load harmonized data for source: ${source}`
      });
    }
  });
};

export { paddleRoutes };
