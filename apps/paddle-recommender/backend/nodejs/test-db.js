// Quick test of database connection
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/paddle_recommender_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        const client = await pool.connect();
        
        const result = await client.query(`
            SELECT 
                p.id,
                p.paddle_id,
                p.brand,
                p.model,
                p.price
            FROM paddles p
            ORDER BY p.created_at DESC
            LIMIT 3
        `);
        
        console.log('Database query successful!');
        console.log('Results:', result.rows);
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('Database test failed:', error);
    }
}

testDatabase();
