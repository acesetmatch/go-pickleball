import bcrypt from "bcryptjs";
import { prismaService, PrismaService } from "./prismaService";
import type { AuthUser } from "../types/auth";

const SALT_ROUNDS = 12;

export class AuthService {
  private prismaService: PrismaService;

  constructor(prismaService: PrismaService) {
    this.prismaService = prismaService;
  }

  /**
   * Register a new user with a hashed password.
   */
  async register(
    username: string,
    password: string,
  ): Promise<AuthUser> {
    // Validate input
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Check for existing user
    const existing = await this.prismaService.findUserByUsername(
      trimmedUsername,
    );
    if (existing) {
      throw new Error("Username already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.prismaService.createUser(
      trimmedUsername,
      passwordHash,
    );

    return { id: user.id, username: user.username };
  }

  /**
   * Authenticate a user and return their profile.
   * Throws on invalid credentials.
   */
  async login(
    username: string,
    password: string,
  ): Promise<AuthUser> {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      throw new Error("Username and password are required");
    }

    const user = await this.prismaService.findUserByUsername(
      trimmedUsername,
    );
    if (!user) {
      throw new Error("Invalid username or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid username or password");
    }

    return { id: user.id, username: user.username };
  }
}

export const authService = new AuthService(prismaService);
