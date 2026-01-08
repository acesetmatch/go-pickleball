// src/services/databaseService.ts
import { Pool, PoolClient } from 'pg';
import { Paddle } from '../types';

export class DatabaseService {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/paddle_recommender_db',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async getPaddles(): Promise<Paddle[]> {
        const client: PoolClient = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    p.id,
                    p.paddle_id,
                    p.brand,
                    p.model,
                    p.price,
                    p.image_url,
                    p.buy_url,
                    p.created_at,
                    ps.shape,
                    ps.surface,
                    ps.average_weight,
                    ps.core,
                    ps.paddle_length,
                    ps.paddle_width,
                    ps.grip_length,
                    ps.grip_type,
                    ps.grip_circumference,
                    pp.power,
                    pp.pop,
                    pp.spin,
                    pp.twist_weight,
                    pp.swing_weight,
                    pp.balance_point
                FROM paddles p
                LEFT JOIN paddle_specs ps ON p.id = ps.paddle_id
                LEFT JOIN paddle_performance pp ON ps.id = pp.paddle_spec_id
                ORDER BY p.created_at DESC
            `);
            
            return result.rows.map(row => this.transformDatabaseRowToPaddle(row));
        } finally {
            client.release();
        }
    }

    async getPaddleById(id: string): Promise<Paddle | null> {
        const client: PoolClient = await this.pool.connect();
        try {
            const result = await client.query(`
                SELECT 
                    p.id,
                    p.paddle_id,
                    p.brand,
                    p.model,
                    p.price,
                    p.image_url,
                    p.buy_url,
                    p.created_at,
                    ps.shape,
                    ps.surface,
                    ps.average_weight,
                    ps.core,
                    ps.paddle_length,
                    ps.paddle_width,
                    ps.grip_length,
                    ps.grip_type,
                    ps.grip_circumference,
                    pp.power,
                    pp.pop,
                    pp.spin,
                    pp.twist_weight,
                    pp.swing_weight,
                    pp.balance_point
                FROM paddles p
                LEFT JOIN paddle_specs ps ON p.id = ps.paddle_id
                LEFT JOIN paddle_performance pp ON ps.id = pp.paddle_spec_id
                WHERE p.paddle_id = $1
            `, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.transformDatabaseRowToPaddle(result.rows[0]);
        } finally {
            client.release();
        }
    }

    private transformDatabaseRowToPaddle(row: any): Paddle {
        return {
            id: row.paddle_id || row.id?.toString(),
            name: row.model || 'Unknown Paddle',
            brand: row.brand || 'Unknown Brand',
            price: row.price || 0,
            weight: this.extractWeight(row),
            grip: this.extractGrip(row) as 'small' | 'medium' | 'large',
            surface: this.extractSurface(row) as 'textured' | 'smooth',
            core: this.extractCore(row),
            playStyle: this.determinePlayStyle(row),
            recommendedFor: this.determineRecommendedFor(row),
            description: `${row.brand || ''} ${row.model || ''} paddle`.trim(),
            image: row.image_url || `/images/${row.paddle_id || row.id}.jpg`,
            specifications: {
                shape: row.shape || 'Standard',
                surface: row.surface || 'Composite',
                average_weight: row.average_weight || 0,
                core: row.core || 0,
                paddle_length: row.paddle_length || 0,
                paddle_width: row.paddle_width || 0,
                grip_length: row.grip_length || 0,
                grip_type: row.grip_type || 'Standard',
                grip_circumference: row.grip_circumference || 0
            },
            performance: {
                power: row.power || 0,
                pop: row.pop || 0,
                spin: row.spin || 0,
                twist_weight: row.twist_weight || 0,
                swing_weight: row.swing_weight || 0,
                balance_point: row.balance_point || 0
            }
        };
    }

    private extractWeight(row: any): string {
        if (row.average_weight) return `${row.average_weight} oz`;
        return '8.0 oz'; // Default weight
    }

    private extractGrip(row: any): string {
        if (row.grip_circumference) {
            const circumference = parseFloat(row.grip_circumference);
            if (circumference <= 4.0) return 'small';
            if (circumference >= 4.5) return 'large';
            return 'medium';
        }
        return 'medium'; // Default grip
    }

    private extractSurface(row: any): string {
        if (row.surface) {
            const surface = row.surface.toLowerCase();
            if (surface.includes('textured') || surface.includes('rough')) return 'textured';
            return 'smooth';
        }
        return 'smooth'; // Default surface
    }

    private extractCore(row: any): string {
        if (row.core) return `${row.core}mm`;
        return '16mm'; // Default core
    }

    private determinePlayStyle(performance: any): 'power' | 'control' | 'balanced' {
        const power = performance.power || 0;
        const spin = performance.spin || 0;
        
        if (power > 85) return 'power';
        if (spin > 3000) return 'control';
        return 'balanced';
    }

    private determineRecommendedFor(performance: any): 'beginner' | 'intermediate' | 'advanced' {
        const power = performance.power || 0;
        const spin = performance.spin || 0;
        
        if (power < 75 && spin < 2500) return 'beginner';
        if (power > 85 || spin > 3200) return 'advanced';
        return 'intermediate';
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    async testConnection(): Promise<boolean> {
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }
}