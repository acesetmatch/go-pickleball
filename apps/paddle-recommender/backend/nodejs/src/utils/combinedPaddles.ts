import type { SourcePaddle } from '@prisma/client';
import type { CombinedPaddle, CombinedPaginationCursor } from '../types/paddles';

export function encodeCombinedCursor(paddle: CombinedPaddle): string {
  return Buffer.from(
    JSON.stringify({ company: paddle.company, paddleName: paddle.paddleName })
  ).toString('base64');
}

export function decodeCombinedCursor(cursor: string): CombinedPaginationCursor {
  const raw = Buffer.from(cursor, 'base64').toString('utf8');
  const parsed = JSON.parse(raw) as Partial<CombinedPaginationCursor>;
  if (typeof parsed.company !== 'string' || typeof parsed.paddleName !== 'string') {
    throw new Error('Invalid cursor');
  }
  return { company: parsed.company, paddleName: parsed.paddleName };
}

export function combineSourcePaddles(paddles: SourcePaddle[]): CombinedPaddle[] {
  const paddleMap = new Map<string, SourcePaddle[]>();

  paddles.forEach(paddle => {
    const key = normalizeKey(paddle.company, paddle.paddleName, paddle.coreThickness);
    if (!paddleMap.has(key)) {
      paddleMap.set(key, []);
    }
    paddleMap.get(key)!.push(paddle);
  });

  const combinedPaddles: CombinedPaddle[] = [];

  paddleMap.forEach((group) => {
    const sortedForDisplay = [...group].sort((a, b) => {
      const aHasAmpersand = a.company.includes('&') ? 1 : 0;
      const bHasAmpersand = b.company.includes('&') ? 1 : 0;
      if (aHasAmpersand !== bHasAmpersand) return bHasAmpersand - aHasAmpersand;

      const aHasSpace = a.company.includes(' ') ? 1 : 0;
      const bHasSpace = b.company.includes(' ') ? 1 : 0;
      if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

      return b.company.length - a.company.length;
    });
    const displayCompany = sortedForDisplay[0].company;

    const sortedNamesForDisplay = [...group].sort((a, b) => {
      const aHasSpace = a.paddleName.includes(' ') ? 1 : 0;
      const bHasSpace = b.paddleName.includes(' ') ? 1 : 0;
      if (aHasSpace !== bHasSpace) return bHasSpace - aHasSpace;

      return b.paddleName.length - a.paddleName.length;
    });
    const displayName = sortedNamesForDisplay[0].paddleName;

    const combined: CombinedPaddle = {
      company: displayCompany,
      paddleName: displayName,
      sources: group.map(p => p.source),
      sourceCount: group.length,
      allSourceData: group.map(p => ({
        source: p.source,
        price: p.price || undefined,
        discountCode: p.discountCode || undefined,
        purchaseLink: p.purchaseLink || undefined,
        paddleImage: p.paddleImage || undefined
      }))
    };

    const numericFields = [
      'swingWeight', 'twistWeight', 'weight', 'weightGrams', 'spinRPM',
      'serveSpeed', 'punchVolleySpeed', 'coreThickness', 'length', 'width',
      'gripLength', 'gripCircumference', 'gripSize',
      'controlRating', 'feelRating', 'forgivenessRating', 'touchShotsRating'
    ] as const;

    numericFields.forEach(field => {
      const values = group
        .map(p => p[field as keyof SourcePaddle])
        .filter((v): v is number => typeof v === 'number');
      if (values.length > 0) {
        setCombinedField(combined, field, median(values));
      }
    });

    const percentileFields = [
      'swingWeightPercentile', 'twistWeightPercentile', 'powerPercentile',
      'popPercentile', 'spinPercentile', 'balancePoint'
    ] as const;

    percentileFields.forEach(field => {
      const values = group
        .map(p => parsePercentile(p[field as keyof SourcePaddle] as string))
        .filter((v): v is number => v !== undefined);
      if (values.length > 0) {
        setCombinedField(combined, field, formatPercentile(mean(values)));
      }
    });

    const stringFields = [
      'shape', 'faceMaterial', 'coreMaterial', 'surfaceTexture',
      'paddleType', 'manufacturingProcess', 'buildType',
      'spinRating', 'paddleRating', 'releaseYear', 'approvalBody'
    ] as const;

    stringFields.forEach(field => {
      const values = group
        .map(p => p[field as keyof SourcePaddle])
        .filter((v): v is string => typeof v === 'string' && v.length > 0);
      if (values.length > 0) {
        setCombinedField(combined, field, mode(values));
      }
    });

    const powerRatings = group
      .map(p => p.powerRating !== null && p.powerRating !== undefined ? String(p.powerRating) : undefined)
      .filter((v): v is string => v !== undefined);
    if (powerRatings.length > 0) {
      combined.powerRating = mode(powerRatings);
    }

    combined.paddleImage = group.find(p => p.paddleImage)?.paddleImage || undefined;
    combined.youtubeReview = group.find(p => p.youtubeReview)?.youtubeReview || undefined;

    const offersWithPrice = group.filter(p => p.price);
    if (offersWithPrice.length > 0) {
      const sortedByPrice = offersWithPrice.sort((a, b) => {
        const priceA = parseFloat(a.price || '0');
        const priceB = parseFloat(b.price || '0');
        return priceA - priceB;
      });
      const best = sortedByPrice[0];
      combined.bestOffer = {
        price: best.price!,
        discountCode: best.discountCode || undefined,
        purchaseLink: best.purchaseLink || undefined,
        source: best.source
      };
    }

    combinedPaddles.push(combined);
  });

  combinedPaddles.sort((a, b) => {
    const companyCompare = a.company.localeCompare(b.company);
    return companyCompare !== 0 ? companyCompare : a.paddleName.localeCompare(b.paddleName);
  });

  return combinedPaddles;
}

function setCombinedField<T extends keyof CombinedPaddle>(
  target: CombinedPaddle,
  field: T,
  value: CombinedPaddle[T]
): void {
  target[field] = value;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function mode<T>(values: T[]): T | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<T, number>();
  values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let maxCount = 0;
  let modeValue: T | undefined;
  counts.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      modeValue = value;
    }
  });
  return modeValue;
}

function normalizeCompanyName(company: string): string {
  return company
    .toLowerCase()
    .trim()
    .replace(/[-\s](co|company|inc|llc|corporation)\.?$/i, '')
    .replace(/\s*&\s*/g, '')
    .replace(/\s+and\s+/g, '')
    .replace(/[\s\-._]/g, '')
    .trim();
}

function normalizePaddleName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\d{2}mm\s*/gi, ' ')
    .replace(/\s*\d{2}\s*mm\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(company: string, paddleName: string, coreThickness?: number | null): string {
  const normalizedCompany = normalizeCompanyName(company);
  const normalizedName = normalizePaddleName(paddleName);
  const coreKey = coreThickness ? `_${coreThickness}mm` : '_nocore';
  return `${normalizedCompany}|||${normalizedName}${coreKey}`;
}

function parsePercentile(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function formatPercentile(value: number): string {
  return `${Math.round(value)}%`;
}
