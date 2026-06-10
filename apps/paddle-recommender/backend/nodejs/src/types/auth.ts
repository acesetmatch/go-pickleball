import "@fastify/jwt";

// ─── Request / Response Types ─────────────────────────────────────────────

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
  /** Standard JWT claims — populated at sign time, verified at decode time */
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: true;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface AuthErrorResponse {
  success: false;
  error: string;
}

// ─── Fastify Type Augmentations ───────────────────────────────────────────

// Shape of the JWT payload (signed into the token and decoded on verify)
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

// Make `request.user` typed after jwtVerify
declare module "fastify" {
  interface FastifyRequest {
    user: AuthTokenPayload;
  }
}
