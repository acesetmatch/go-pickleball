import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * PreHandler hook that verifies the JWT from the Authorization header.
 * On success, `request.user` is populated with `{ userId, username }`.
 * On failure, responds with 401.
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({
      success: false,
      error: "Unauthorized — invalid or missing token",
    });
  }
}

/**
 * PreHandler hook that makes auth optional.
 * If a valid token is present, populates `request.user`.
 * If not, allows the request through without a user.
 */
export async function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    // No token or invalid token — continue without user
  }
}
