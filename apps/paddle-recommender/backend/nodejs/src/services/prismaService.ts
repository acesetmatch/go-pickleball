import { PrismaClient } from '@prisma/client';
import { Paddle } from '../types';

export class PrismaService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async getPaddles(): Promise<Paddle[]> {
        const paddles = await this.prisma.paddle.findMany({
            include: {
                specs: {
                    include: {
                        performance: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return paddles.map(paddle => this.transformPrismaToPaddle(paddle));
    }

    async getPaddleById(id: string): Promise<Paddle | null> {
        const paddle = await this.prisma.paddle.findUnique({
            where: { paddleId: id },
            include: {
                specs: {
                    include: {
                        performance: true,
                    },
                },
            },
        });

        if (!paddle) return null;
        return this.transformPrismaToPaddle(paddle);
    }

    private transformPrismaToPaddle(paddle: any): Paddle {
        const spec = paddle.specs[0]; // Assuming one spec per paddle for now
        const performance = spec?.performance[0]; // Assuming one performance per spec

        return {
            id: paddle.paddleId,
            name: paddle.model,
            brand: paddle.brand,
            price: paddle.price?.toString() || '0',
            weight: this.extractWeight(spec),
            grip: this.extractGrip(spec),
            surface: this.extractSurface(spec),
            core: this.extractCore(spec),
            playStyle: this.determinePlayStyle(performance),
            recommendedFor: this.determineRecommendedFor(performance),
            description: `${paddle.brand} ${paddle.model} paddle`,
            image: paddle.imageUrl || `/images/${paddle.paddleId}.jpg`,
            specifications: {
                shape: spec?.shape || 'Standard',
                surface: spec?.surface || 'Composite',
                average_weight: spec?.averageWeight || 0,
                core: spec?.core || 0,
                paddle_length: spec?.paddleLength || 0,
                paddle_width: spec?.paddleWidth || 0,
                grip_length: spec?.gripLength || 0,
                grip_type: spec?.gripType || 'Standard',
                grip_circumference: spec?.gripCircumference || 0,
            },
            performance: {
                power: performance?.power || 0,
                pop: performance?.pop || 0,
                spin: performance?.spin || 0,
                twist_weight: performance?.twistWeight || 0,
                swing_weight: performance?.swingWeight || 0,
                balance_point: performance?.balancePoint || 0,
            },
        };
    }

    private extractWeight(spec: any): string {
        if (spec?.averageWeight) return `${spec.averageWeight} oz`;
        return '8.0 oz';
    }

    private extractGrip(spec: any): 'small' | 'medium' | 'large' {
        if (spec?.gripCircumference) {
            const circumference = spec.gripCircumference;
            if (circumference <= 4.0) return 'small';
            if (circumference >= 4.5) return 'large';
            return 'medium';
        }
        return 'medium';
    }

    private extractSurface(spec: any): 'textured' | 'smooth' {
        if (spec?.surface) {
            const surface = spec.surface.toLowerCase();
            if (surface.includes('textured') || surface.includes('rough')) return 'textured';
            return 'smooth';
        }
        return 'smooth';
    }

    private extractCore(spec: any): string {
        if (spec?.core) return `${spec.core}mm`;
        return '16mm';
    }

    private determinePlayStyle(performance: any): 'power' | 'control' | 'balanced' {
        const power = performance?.power || 0;
        const spin = performance?.spin || 0;
        
        if (power > 85) return 'power';
        if (spin > 3000) return 'control';
        return 'balanced';
    }

    private determineRecommendedFor(performance: any): 'beginner' | 'intermediate' | 'advanced' {
        const power = performance?.power || 0;
        const spin = performance?.spin || 0;
        
        if (power < 75 && spin < 2500) return 'beginner';
        if (power > 85 || spin > 3200) return 'advanced';
        return 'intermediate';
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return true;
        } catch (error) {
            console.error('Prisma connection test failed:', error);
            return false;
        }
    }

    async close(): Promise<void> {
        await this.prisma.$disconnect();
    }
}
