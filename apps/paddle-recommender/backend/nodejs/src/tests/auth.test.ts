import Fastify, { FastifyInstance } from "fastify";
import fastifyJwt from "@fastify/jwt";
import { authRoutes } from "../routes/auth";

const TEST_SECRET = "test-secret-for-jwt";

// Collect usernames created during tests so we can clean them up
const createdUsernames: string[] = [];

async function cleanupUsers() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.user.deleteMany({
      where: { username: { in: createdUsernames } },
    });
  } finally {
    await prisma.$disconnect();
  }
}

function trackUsername(): string {
  const username = `test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  createdUsernames.push(username);
  return username;
}

describe("Auth API", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(fastifyJwt, { secret: TEST_SECRET });
    await app.register(authRoutes, { prefix: "/api/v1/auth" });
  });

  afterAll(async () => {
    await cleanupUsers();
    await app.close();
  });

  // ─── Registration ─────────────────────────────────────────────────────

  describe("POST /api/v1/auth/register", () => {
    it("returns 201 with token and user for valid credentials", async () => {
      const username = trackUsername();
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username, password: "strongpass123" },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(typeof body.data.token).toBe("string");
      expect(body.data.token.split(".")).toHaveLength(3);
      expect(body.data.user).toEqual({
        id: expect.any(Number),
        username,
      });
    });

    it("returns 400 when username is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: "", password: "strongpass123" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it("returns 400 when password is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: "someuser", password: "" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it("returns 400 when username is too short (< 3 chars)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: "ab", password: "strongpass123" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe("Username must be at least 3 characters");
    });

    it("returns 400 when password is too short (< 8 chars)", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: "validuser", password: "short" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).error).toBe("Password must be at least 8 characters");
    });

    it("returns 409 when username already exists", async () => {
      const username = trackUsername();

      // First registration — should succeed
      const first = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username, password: "strongpass123" },
      });
      expect(first.statusCode).toBe(201);

      // Duplicate — should fail
      const second = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username, password: "anotherpass456" },
      });

      expect(second.statusCode).toBe(409);
      expect(JSON.parse(second.body).error).toBe("Username already exists");
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────

  describe("POST /api/v1/auth/login", () => {
    const loginUser = trackUsername();

    beforeAll(async () => {
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: loginUser, password: "strongpass123" },
      });
    });

    it("returns 200 with token for valid credentials", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: loginUser, password: "strongpass123" },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.success).toBe(true);
      expect(typeof body.data.token).toBe("string");
      expect(body.data.token.split(".")).toHaveLength(3);
      expect(body.data.user).toEqual({
        id: expect.any(Number),
        username: loginUser,
      });
    });

    it("returns 401 for wrong password", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: loginUser, password: "wrongpassword" },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe("Invalid username or password");
    });

    it("returns 401 for non-existent user", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: "nonexistent_user", password: "strongpass123" },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe("Invalid username or password");
    });

    it("returns 400 when username is empty", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: "", password: "strongpass123" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it("returns 400 when password is empty", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: loginUser, password: "" },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body).success).toBe(false);
    });

    it("uses same error message for missing user vs wrong password", async () => {
      const missingResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: "ghost_user", password: "strongpass123" },
      });

      const wrongPwResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: { username: loginUser, password: "strongpassNOT" },
      });

      const missing = JSON.parse(missingResponse.body);
      const wrong = JSON.parse(wrongPwResponse.body);

      expect(missing.error).toBe("Invalid username or password");
      expect(wrong.error).toBe("Invalid username or password");
    });
  });

  // ─── /me (protected) ──────────────────────────────────────────────────

  describe("GET /api/v1/auth/me", () => {
    const meUser = trackUsername();
    let validToken: string;

    beforeAll(async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: { username: meUser, password: "strongpass123" },
      });
      validToken = JSON.parse(response.body).data.token;
    });

    it("returns user data for a valid token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${validToken}` },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: { id: expect.any(Number), username: meUser },
      });
    });

    it("returns 401 when no Authorization header is sent", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe("Unauthorized — invalid or missing token");
    });

    it("returns 401 for a malformed token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: "Bearer not-a-valid-jwt" },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body).error).toBe("Unauthorized — invalid or missing token");
    });

    it("returns 401 for an expired token", async () => {
      const expiredToken = app.jwt.sign({
        userId: 999,
        username: "expired",
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${expiredToken}` },
      });

      expect(response.statusCode).toBe(401);
    });

    it("returns 401 for a token signed with a different secret", async () => {
      const otherApp = Fastify({ logger: false });
      await otherApp.register(fastifyJwt, { secret: "different-secret" });
      const foreignToken = otherApp.jwt.sign(
        { userId: 1, username: "hacker" },
        { expiresIn: "1h" },
      );
      await otherApp.close();

      const response = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${foreignToken}` },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
