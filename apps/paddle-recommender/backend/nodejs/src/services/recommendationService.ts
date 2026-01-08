import { UserProfile, Paddle, PaddleRecommendation } from '../types';
import { PrismaService } from './prismaService';

class RecommendationService {
  private prismaService: PrismaService;

  constructor() {
    this.prismaService = new PrismaService();
  }

  /**
   * Get paddle recommendations based on user profile
   */
  async getRecommendations(profile: UserProfile): Promise<PaddleRecommendation[]> {
    try {
      // Get all paddles from database
      const paddles = await this.prismaService.getPaddles();
      
      // Score all paddles based on profile
      const scoredPaddles = paddles.map((paddle: Paddle) => ({
        ...paddle,
        score: this.calculateScore(paddle, profile),
        matchReasons: this.getMatchReasons(paddle, profile)
      }));

      // Sort by score and filter by budget
      const filteredPaddles = scoredPaddles
        .filter((paddle: any) => this.isWithinBudget(paddle, profile.budget))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5); // Top 5 recommendations

      return filteredPaddles.map((paddle: any) => ({
        id: paddle.id,
        name: paddle.name,
        brand: paddle.brand,
        price: paddle.price,
        score: Math.round(paddle.score * 100) / 100,
        matchReasons: paddle.matchReasons,
        weight: paddle.weight,
        grip: paddle.grip,
        surface: paddle.surface,
        core: paddle.core,
        playStyle: paddle.playStyle,
        recommendedFor: paddle.recommendedFor,
        description: paddle.description,
        image: paddle.image,
        specifications: paddle.specifications,
        performance: paddle.performance
      }));
    } catch (error) {
      console.error('Database error in getRecommendations:', error);
      throw new Error(`Failed to calculate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate compatibility score between paddle and profile
   */
  private calculateScore(paddle: Paddle, profile: UserProfile): number {
    let score = 0;
    let factors = 0;

    // Experience level matching
    const experienceMatch = this.getExperienceMatch(paddle, profile.experience);
    score += experienceMatch * 0.3;
    factors += 0.3;

    // Play style matching
    const playStyleMatch = this.getPlayStyleMatch(paddle, profile.playStyle);
    score += playStyleMatch * 0.4;
    factors += 0.4;

    // Preference matching (weight, grip, surface)
    if (profile.preferences) {
      if (profile.preferences.weight) {
        const weightMatch = this.getWeightMatch(paddle, profile.preferences.weight);
        score += weightMatch * 0.1;
        factors += 0.1;
      }

      if (profile.preferences.grip) {
        const gripMatch = paddle.grip === profile.preferences.grip ? 1 : 0.5;
        score += gripMatch * 0.1;
        factors += 0.1;
      }

      if (profile.preferences.surface) {
        const surfaceMatch = paddle.surface === profile.preferences.surface ? 1 : 0.5;
        score += surfaceMatch * 0.1;
        factors += 0.1;
      }
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Get experience level compatibility
   */
  private getExperienceMatch(paddle: Paddle, experience: UserProfile['experience']): number {
    const experienceMap: Record<string, Record<string, number>> = {
      beginner: { beginner: 1, intermediate: 0.3, advanced: 0.1 },
      intermediate: { beginner: 0.5, intermediate: 1, advanced: 0.7 },
      advanced: { beginner: 0.2, intermediate: 0.8, advanced: 1 }
    };

    return experienceMap[experience]?.[paddle.recommendedFor] ?? 0.5;
  }

  /**
   * Get play style compatibility
   */
  private getPlayStyleMatch(paddle: Paddle, playStyle: UserProfile['playStyle']): number {
    const styleMap: Record<string, Record<string, number>> = {
      power: { power: 1, balanced: 0.7, control: 0.3 },
      control: { control: 1, balanced: 0.7, power: 0.3 },
      balanced: { balanced: 1, power: 0.8, control: 0.8 }
    };

    return styleMap[playStyle]?.[paddle.playStyle] ?? 0.5;
  }

  /**
   * Get weight preference match
   */
  private getWeightMatch(paddle: Paddle, preferredWeight: NonNullable<UserProfile['preferences']>['weight']): number {
    if (!preferredWeight) return 0.5;

    const weightRanges: Record<string, { min: number; max: number }> = {
      light: { min: 0, max: 7.5 },
      medium: { min: 7.5, max: 8.5 },
      heavy: { min: 8.5, max: 12 }
    };

    const range = weightRanges[preferredWeight];
    if (!range) return 0.5;

    const paddleWeight = parseFloat(paddle.weight);
    if (paddleWeight >= range.min && paddleWeight <= range.max) {
      return 1;
    }

    // Partial match for close weights
    const distance = Math.min(
      Math.abs(paddleWeight - range.min),
      Math.abs(paddleWeight - range.max)
    );
    
    return Math.max(0, 1 - (distance / 2));
  }

  /**
   * Check if paddle is within budget
   */
  private isWithinBudget(paddle: Paddle, budget: UserProfile['budget']): boolean {
    const price = parseFloat(paddle.price.replace('$', ''));
    return price >= budget.min && price <= budget.max;
  }

  /**
   * Generate human-readable match reasons
   */
  private getMatchReasons(paddle: Paddle, profile: UserProfile): string[] {
    const reasons: string[] = [];

    // Experience match
    if (paddle.recommendedFor === profile.experience) {
      reasons.push(`Perfect for ${profile.experience} players`);
    }

    // Play style match
    if (paddle.playStyle === profile.playStyle) {
      reasons.push(`Matches your ${profile.playStyle} play style`);
    }

    // Preference matches
    if (profile.preferences?.weight) {
      const weightMatch = this.getWeightMatch(paddle, profile.preferences.weight);
      if (weightMatch > 0.8) {
        reasons.push(`${profile.preferences.weight} weight as preferred`);
      }
    }

    if (profile.preferences?.surface && paddle.surface === profile.preferences.surface) {
      reasons.push(`${profile.preferences.surface} surface as requested`);
    }

    return reasons;
  }

  /**
   * Get paddle by ID
   */
  async getPaddleById(id: string): Promise<Paddle | undefined> {
    const paddle = await this.prismaService.getPaddleById(id);
    return paddle || undefined;
  }

  /**
   * Get all paddles
   */
  async getAllPaddles(): Promise<Paddle[]> {
    return await this.prismaService.getPaddles();
  }
}

export const recommendationService = new RecommendationService();
