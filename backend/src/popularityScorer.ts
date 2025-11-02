/**
 * Popularity Scoring Algorithm
 *
 * Combines views, likes, and purchases with weighted importance
 * and applies time decay to boost recent content.
 */

// Scoring weights
const WEIGHTS = {
  VIEWS: 1,
  LIKES: 10,      // Likes are 10x more valuable than views
  PURCHASES: 50,  // Purchases are 50x more valuable than views
};

// Time decay parameters
const HALF_LIFE_DAYS = 7; // Article loses 50% of time boost after 7 days

/**
 * Calculate time decay factor based on article age
 * Uses exponential decay: newer articles get higher scores
 */
export function calculateTimeDecay(publishDate: string): number {
  const now = new Date().getTime();
  const published = new Date(publishDate).getTime();
  const ageInDays = (now - published) / (1000 * 60 * 60 * 24);

  // Exponential decay formula: 2^(-age/halfLife)
  // At halfLife days, factor = 0.5
  // At 2×halfLife days, factor = 0.25
  const decayFactor = Math.pow(2, -ageInDays / HALF_LIFE_DAYS);

  return decayFactor;
}

/**
 * Calculate popularity score for an article
 */
export function calculatePopularityScore(
  views: number,
  likes: number,
  purchases: number,
  publishDate: string
): number {
  // Base score from engagement metrics
  const baseScore = (
    views * WEIGHTS.VIEWS +
    likes * WEIGHTS.LIKES +
    purchases * WEIGHTS.PURCHASES
  );

  // Apply time decay
  const timeDecay = calculateTimeDecay(publishDate);

  // Final score
  const popularityScore = baseScore * timeDecay;

  // Round to 2 decimal places for storage
  return Math.round(popularityScore * 100) / 100;
}

/**
 * Get human-readable explanation of score
 */
export function explainScore(
  views: number,
  likes: number,
  purchases: number,
  publishDate: string
): string {
  const baseScore = (
    views * WEIGHTS.VIEWS +
    likes * WEIGHTS.LIKES +
    purchases * WEIGHTS.PURCHASES
  );
  const timeDecay = calculateTimeDecay(publishDate);
  const finalScore = baseScore * timeDecay;
  const ageInDays = calculateAgeInDays(publishDate);

  return `
Score Breakdown:
  Views: ${views} × ${WEIGHTS.VIEWS} = ${views * WEIGHTS.VIEWS}
  Likes: ${likes} × ${WEIGHTS.LIKES} = ${likes * WEIGHTS.LIKES}
  Purchases: ${purchases} × ${WEIGHTS.PURCHASES} = ${purchases * WEIGHTS.PURCHASES}
  Base Score: ${baseScore}
  Time Decay (${Math.round(ageInDays)} days old): ${(timeDecay * 100).toFixed(1)}%
  Final Score: ${finalScore.toFixed(2)}
  `.trim();
}

function calculateAgeInDays(publishDate: string): number {
  const now = new Date().getTime();
  const published = new Date(publishDate).getTime();
  return (now - published) / (1000 * 60 * 60 * 24);
}
