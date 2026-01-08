import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create paddles with specs and performance data
  const paddlesData = [
    {
      paddleId: 'selkirk-amped-x5',
      brand: 'Selkirk',
      model: 'AMPED X5 FiberFlex',
      price: 149.99,
      imageUrl: '/images/selkirk-amped-x5.jpg',
      buyUrl: 'https://selkirk.com/amped-x5',
      specs: {
        shape: 'Standard',
        surface: 'Composite',
        averageWeight: 8.2,
        core: 16,
        paddleLength: 15.75,
        paddleWidth: 8.0,
        gripLength: 5.25,
        gripType: 'Cushioned',
        gripCircumference: 4.25,
        performance: {
          power: 85,
          pop: 88,
          spin: 2800,
          twistWeight: 6.2,
          swingWeight: 112,
          balancePoint: 7.8,
        },
      },
    },
    {
      paddleId: 'paddletek-bantam-ex-l',
      brand: 'Paddletek',
      model: 'Bantam EX-L',
      price: 179.99,
      imageUrl: '/images/paddletek-bantam-ex-l.jpg',
      buyUrl: 'https://paddletek.com/bantam-ex-l',
      specs: {
        shape: 'Elongated',
        surface: 'Graphite',
        averageWeight: 7.8,
        core: 13,
        paddleLength: 16.5,
        paddleWidth: 7.5,
        gripLength: 5.0,
        gripType: 'Perforated',
        gripCircumference: 4.125,
        performance: {
          power: 78,
          pop: 82,
          spin: 3200,
          twistWeight: 5.9,
          swingWeight: 108,
          balancePoint: 8.2,
        },
      },
    },
    {
      paddleId: 'onix-z5-graphite',
      brand: 'Onix',
      model: 'Z5 Graphite',
      price: 129.99,
      imageUrl: '/images/onix-z5-graphite.jpg',
      buyUrl: 'https://onixpickleball.com/z5-graphite',
      specs: {
        shape: 'Standard',
        surface: 'Graphite',
        averageWeight: 8.0,
        core: 16,
        paddleLength: 15.75,
        paddleWidth: 8.0,
        gripLength: 5.25,
        gripType: 'Standard',
        gripCircumference: 4.25,
        performance: {
          power: 80,
          pop: 85,
          spin: 3000,
          twistWeight: 6.0,
          swingWeight: 110,
          balancePoint: 8.0,
        },
      },
    },
    {
      paddleId: 'head-radical-elite',
      brand: 'HEAD',
      model: 'Radical Elite',
      price: 199.99,
      imageUrl: '/images/head-radical-elite.jpg',
      buyUrl: 'https://head.com/radical-elite',
      specs: {
        shape: 'Standard',
        surface: 'Carbon Fiber',
        averageWeight: 8.4,
        core: 16,
        paddleLength: 15.75,
        paddleWidth: 8.0,
        gripLength: 5.5,
        gripType: 'Cushioned',
        gripCircumference: 4.375,
        performance: {
          power: 90,
          pop: 92,
          spin: 2600,
          twistWeight: 6.5,
          swingWeight: 115,
          balancePoint: 7.5,
        },
      },
    },
    {
      paddleId: 'wilson-energy-pro',
      brand: 'Wilson',
      model: 'Energy Pro',
      price: 89.99,
      imageUrl: '/images/wilson-energy-pro.jpg',
      buyUrl: 'https://wilson.com/energy-pro',
      specs: {
        shape: 'Standard',
        surface: 'Composite',
        averageWeight: 7.9,
        core: 16,
        paddleLength: 15.75,
        paddleWidth: 8.0,
        gripLength: 5.25,
        gripType: 'Standard',
        gripCircumference: 4.25,
        performance: {
          power: 75,
          pop: 80,
          spin: 2900,
          twistWeight: 5.8,
          swingWeight: 105,
          balancePoint: 8.3,
        },
      },
    },
  ];

  for (const paddleData of paddlesData) {
    const { specs, ...paddle } = paddleData;
    const { performance, ...specData } = specs;

    console.log(`Creating paddle: ${paddle.brand} ${paddle.model}`);

    await prisma.paddle.create({
      data: {
        ...paddle,
        specs: {
          create: {
            ...specData,
            performance: {
              create: performance,
            },
          },
        },
      },
    });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
