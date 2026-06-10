import { FastifyPluginAsync } from "fastify";
import fs from "fs/promises";
import path from "path";
import { prismaService } from "../services/prismaService";
import { authMiddleware } from "../middleware/auth";
import type {
  CombinedPaginationCursor,
  CombinedPaddle,
  ErrorResponse,
  HarmonizedDataResponse,
  HarmonizedPaddle,
  PaddleSource,
  SingleSourceResponse,
} from "../types";
import { decodeCombinedCursor, encodeCombinedCursor } from "../utils/combinedPaddles";
import {
  loadCombinedMedianDataFromDB,
  loadCombinedMedianDataFromFile,
  loadHarmonizedDataFromDB,
} from "../utils/paddleDataLoaders";

const COMBINED_DEFAULT_LIMIT = 25;
const COMBINED_MAX_LIMIT = 100;
const COMBINED_CACHE_TTL_MS = 5 * 60 * 1000;
let combinedCache: { data: CombinedPaddle[]; expiresAt: number } | null = null;

const paddleRoutes: FastifyPluginAsync = async (fastify) => {
  const outputDir = path.join(process.cwd(), "output", "harmonized");

  // GET /api/paddles - Get all paddles with basic info (from database)
  fastify.get("/", async (request, reply) => {
    try {
      const paddles = await prismaService.getPaddles();
      reply.send(paddles);
    } catch (error) {
      fastify.log.error(error, "Error getting all paddles");
      reply.status(500).send({
        success: false,
        error: "Failed to fetch paddles",
      });
    }
  });

  // GET /api/paddles/:id - Get complete details for a specific paddle
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const paddle = await prismaService.getPaddleById(id);

      if (!paddle) {
        reply.status(404).send({
          success: false,
          error: "Paddle not found",
        });
        return;
      }

      reply.send(paddle);
    } catch (error) {
      fastify.log.error(error, "Error getting paddle by ID");
      reply.status(500).send({
        success: false,
        error: "Failed to fetch paddle details",
      });
    }
  });

  // POST /api/paddles - Upload paddle stats (harmonized data)
  fastify.post<{
    Body: {
      source: PaddleSource;
      data: HarmonizedPaddle[];
    };
  }>("/", { preHandler: [authMiddleware] }, async (request, reply) => {
    try {
      const { source, data } = request.body;

      if (!source || !data || !Array.isArray(data)) {
        reply.status(400).send({
          success: false,
          error: "Invalid request body. Expected { source, data }",
        });
        return;
      }

      const validSources: PaddleSource[] = [
        "mattspickleball",
        "pickleballeffect",
        "pickleballstudio",
      ];
      if (!validSources.includes(source)) {
        reply.status(400).send({
          success: false,
          error: `Invalid source. Must be one of: ${validSources.join(", ")}`,
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
        count: data.length,
      });
    } catch (error) {
      fastify.log.error(error, "Error uploading paddle stats");
      reply.status(500).send({
        success: false,
        error: "Failed to upload paddle stats",
      });
    }
  });

  // GET /api/paddles/sources/all - Get all harmonized paddle data from all sources
  fastify.get<{ Reply: HarmonizedDataResponse | ErrorResponse }>(
    "/sources/all",
    async (request, reply) => {
      try {
        const [mattData, effectData, studioData] = await Promise.all([
          loadHarmonizedDataFromDB(prismaService, "mattspickleball"),
          loadHarmonizedDataFromDB(prismaService, "pickleballeffect"),
          loadHarmonizedDataFromDB(prismaService, "pickleballstudio"),
        ]);

        const response: HarmonizedDataResponse = {
          success: true,
          data: {
            mattspickleball: mattData,
            pickleballeffect: effectData,
            pickleballstudio: studioData,
          },
          counts: {
            mattspickleball: mattData.length,
            pickleballeffect: effectData.length,
            pickleballstudio: studioData.length,
            total: mattData.length + effectData.length + studioData.length,
          },
        };

        reply.send(response);
      } catch (error) {
        fastify.log.error(error, "Error loading harmonized paddle data");
        reply.status(500).send({
          success: false,
          error: "Failed to load harmonized paddle data",
        });
      }
    },
  );

  // GET /api/paddles/combined - Get combined median paddle data
  fastify.get("/combined", async (request, reply) => {
    try {
      let combinedData: CombinedPaddle[];
      const query = request.query as
        | { refresh?: string; limit?: string; cursor?: string }
        | undefined;
      const refresh = query?.refresh;
      const limitParam = query?.limit;
      const cursorParam = query?.cursor;
      const shouldBypassCache = refresh === "1" || refresh === "true";
      const parsedLimit = limitParam ? Number(limitParam) : COMBINED_DEFAULT_LIMIT;

      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        reply.status(400).send({
          success: false,
          error: "Invalid limit",
        });
        return;
      }

      const limit = Math.min(parsedLimit, COMBINED_MAX_LIMIT);

      if (!shouldBypassCache && combinedCache && combinedCache.expiresAt > Date.now()) {
        combinedData = combinedCache.data;
      } else {
        try {
          combinedData = await loadCombinedMedianDataFromDB(prismaService);
        } catch (error) {
          fastify.log.error(error, "Error loading combined data from DB, falling back to file");
          combinedData = await loadCombinedMedianDataFromFile(outputDir);
        }

        combinedCache = {
          data: combinedData,
          expiresAt: Date.now() + COMBINED_CACHE_TTL_MS,
        };
      }

      const normalizedData = combinedData.map((paddle) => {
        if (typeof paddle.company !== "string") {
          return paddle;
        }

        const company =
          paddle.company === paddle.company.toLowerCase()
            ? paddle.company
                .split(" ")
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
            : paddle.company;

        return { ...paddle, company };
      });

      let startIndex = 0;
      if (cursorParam) {
        let cursor: CombinedPaginationCursor;
        try {
          cursor = decodeCombinedCursor(cursorParam);
        } catch (error) {
          reply.status(400).send({
            success: false,
            error: "Invalid cursor",
          });
          return;
        }

        const cursorIndex = normalizedData.findIndex(
          (paddle) => paddle.company === cursor.company && paddle.paddleName === cursor.paddleName,
        );
        if (cursorIndex === -1) {
          reply.status(400).send({
            success: false,
            error: "Cursor not found",
          });
          return;
        }
        startIndex = cursorIndex + 1;
      }

      const pageItems = normalizedData.slice(startIndex, startIndex + limit);
      const lastItem = pageItems[pageItems.length - 1];
      const nextCursor =
        pageItems.length > 0 && startIndex + pageItems.length < normalizedData.length
          ? encodeCombinedCursor(lastItem)
          : undefined;

      reply.send({
        success: true,
        count: pageItems.length,
        totalCount: normalizedData.length,
        nextCursor,
        data: pageItems,
      });
    } catch (error) {
      fastify.log.error(error, "Error loading combined median data");
      reply.status(500).send({
        success: false,
        error: "Failed to load combined paddle data",
      });
    }
  });

  // GET /api/paddles/sources/:source - Get harmonized data from a specific source
  fastify.get<{
    Params: { source: string };
    Reply: SingleSourceResponse | ErrorResponse;
  }>("/sources/:source", async (request, reply) => {
    const { source } = request.params;

    const validSources: PaddleSource[] = [
      "mattspickleball",
      "pickleballeffect",
      "pickleballstudio",
    ];
    if (!validSources.includes(source as PaddleSource)) {
      reply.status(400).send({
        success: false,
        error: `Invalid source. Must be one of: ${validSources.join(", ")}`,
      });
      return;
    }

    try {
      const data = await loadHarmonizedDataFromDB(prismaService, source as PaddleSource);

      const response: SingleSourceResponse = {
        success: true,
        source,
        data,
        count: data.length,
      };

      reply.send(response);
    } catch (error) {
      fastify.log.error(error, `Error loading harmonized data for source: ${source}`);
      reply.status(500).send({
        success: false,
        error: `Failed to load harmonized data for source: ${source}`,
      });
    }
  });
};

export { paddleRoutes };
