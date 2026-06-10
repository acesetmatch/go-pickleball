import { FastifyPluginAsync } from "fastify";
import { authService } from "../services/authService";
import { authMiddleware } from "../middleware/auth";
import type { RegisterRequest, LoginRequest, AuthResponse, AuthErrorResponse } from "../types/auth";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ─── POST /api/v1/auth/register ─────────────────────────────────────────

  fastify.post<{
    Body: RegisterRequest;
    Reply: AuthResponse | AuthErrorResponse;
  }>("/register", async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      reply.status(400).send({
        success: false,
        error: "Username and password are required",
      });
      return;
    }

    try {
      const user = await authService.register(username, password);

      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: "7d" },
      );

      reply.status(201).send({
        success: true,
        data: { token, user },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";

      // Distinguish client errors from server errors
      const status =
        message === "Username already exists"
          ? 409
          : message.startsWith("Username must") ||
              message.startsWith("Password must")
            ? 400
            : 500;

      reply.status(status).send({
        success: false,
        error: message,
      });
    }
  });

  // ─── POST /api/v1/auth/login ────────────────────────────────────────────

  fastify.post<{
    Body: LoginRequest;
    Reply: AuthResponse | AuthErrorResponse;
  }>("/login", async (request, reply) => {
    const { username, password } = request.body;

    if (!username || !password) {
      reply.status(400).send({
        success: false,
        error: "Username and password are required",
      });
      return;
    }

    try {
      const user = await authService.login(username, password);

      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: "7d" },
      );

      reply.send({
        success: true,
        data: { token, user },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";

      const status = message === "Invalid username or password" ? 401 : 500;

      reply.status(status).send({
        success: false,
        error: message,
      });
    }
  });

  // ─── GET /api/v1/auth/me ────────────────────────────────────────────────

  fastify.get<{
    Reply: { success: true; data: { id: number; username: string } } | AuthErrorResponse;
  }>("/me", { preHandler: [authMiddleware] }, async (request, reply) => {
    reply.send({
      success: true,
      data: {
        id: request.user.userId,
        username: request.user.username,
      },
    });
  });
};

export { authRoutes };
