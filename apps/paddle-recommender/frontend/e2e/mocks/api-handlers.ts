import type { Page } from '@playwright/test';

export const MOCK_COMBINED_PADDLES = {
  success: true,
  count: 4,
  totalCount: 4,
  data: [
    {
      company: 'Selkirk',
      paddleName: 'Epic',
      sources: ['mattspickleball'],
      sourceCount: 1,
      averageRating: 4.5,
      price: '$149.99',
      swingWeight: 115,
      twistWeight: 6.5,
      weight: 8.2,
      coreThickness: 16,
      spinRPM: 2200,
      controlRating: 85,
      powerRating: '75',
      spinRating: '8.5',
      feelRating: 80,
      forgivenessRating: 78,
      shape: 'Standard',
      faceMaterial: 'Carbon Fiber',
      coreMaterial: 'Polypropylene',
      surfaceTexture: 'Textured',
      paddleImage: null,
    },
    {
      company: 'JOOLA',
      paddleName: 'Hyperion',
      sources: ['pickleballeffect', 'pickleballstudio'],
      sourceCount: 2,
      averageRating: 4.7,
      price: '$219.99',
      swingWeight: 118,
      twistWeight: 6.8,
      weight: 8.4,
      coreThickness: 16,
      spinRPM: 2500,
      controlRating: 82,
      powerRating: '90',
      spinRating: '9.2',
      feelRating: 85,
      forgivenessRating: 75,
      shape: 'Elongated',
      faceMaterial: 'Carbon Fiber',
      coreMaterial: 'Polypropylene',
      surfaceTexture: 'Textured',
      paddleImage: null,
    },
    {
      company: 'CRBN',
      paddleName: 'Power Series',
      sources: ['mattspickleball', 'pickleballstudio'],
      sourceCount: 2,
      averageRating: 4.3,
      price: '$179.99',
      swingWeight: 112,
      twistWeight: 6.2,
      weight: 8.0,
      spinRPM: 2000,
      controlRating: 80,
      powerRating: '85',
      spinRating: '8.0',
      feelRating: 78,
      forgivenessRating: 82,
      shape: 'Standard',
      faceMaterial: 'Carbon Fiber',
      coreMaterial: 'Polypropylene',
      surfaceTexture: 'Smooth',
      paddleImage: null,
    },
    {
      company: 'Six Zero',
      paddleName: 'Double Black',
      sources: ['pickleballeffect'],
      sourceCount: 1,
      averageRating: 4.6,
      price: '$189.99',
      swingWeight: 114,
      twistWeight: 6.4,
      weight: 8.1,
      spinRPM: 2300,
      controlRating: 88,
      powerRating: '78',
      spinRating: '8.8',
      feelRating: 86,
      forgivenessRating: 80,
      shape: 'Standard',
      faceMaterial: 'Carbon Fiber',
      coreMaterial: 'Polypropylene',
      surfaceTexture: 'Textured',
      paddleImage: null,
    },
  ],
};

export async function setupApiMocks(page: Page) {
  await page.route('**/api/paddles/combined', async (route) => {
    await route.fulfill({ json: MOCK_COMBINED_PADDLES });
  });

  await page.route('**/api/paddles/sources/all', async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          mattspickleball: [{ company: 'Selkirk', paddleName: 'Epic', source: 'mattspickleball' }],
          pickleballeffect: [{ company: 'JOOLA', paddleName: 'Hyperion', source: 'pickleballeffect' }],
          pickleballstudio: [{ company: 'CRBN', paddleName: 'Power Series', source: 'pickleballstudio' }],
        },
        counts: { mattspickleball: 1, pickleballeffect: 1, pickleballstudio: 1, total: 3 },
      },
    });
  });

  await page.route('**/api/recommendations**', async (route) => {
    await route.fulfill({
      json: {
        recommendation_id: 'rec_123',
        recommendations: [
          {
            id: 1,
            company: 'JOOLA',
            paddle_name: 'Hyperion',
            price: 219.99,
            match_score: 0.95,
            match_reasons: ['Perfect for intermediate players', 'Matches your power play style'],
            specs: { weight: 8.4, swing_weight: 118, control_rating: 82, power_rating: '90' },
            source: 'pickleballeffect',
          },
        ],
      },
    });
  });
}
