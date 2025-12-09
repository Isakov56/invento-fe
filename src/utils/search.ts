/**
 * Fuzzy search utility for finding products by SKU, barcode, or name
 */

export interface SearchMatch {
  score: number;
  index: number;
}

/**
 * Simple fuzzy search score - higher is better match
 * Returns a score between 0-100
 */
export function fuzzyScore(searchStr: string, targetStr: string): number {
  if (!searchStr || !targetStr) return 0;

  const search = searchStr.toLowerCase();
  const target = targetStr.toLowerCase();

  // Exact match
  if (target === search) return 100;

  // Starts with match (high priority)
  if (target.startsWith(search)) return 90;

  // Contains match
  if (target.includes(search)) return 70;

  // Fuzzy character matching
  let searchIdx = 0;
  let targetIdx = 0;
  let score = 0;
  const maxScore = search.length * 10;

  while (searchIdx < search.length && targetIdx < target.length) {
    if (search[searchIdx] === target[targetIdx]) {
      score += 10;
      searchIdx++;
    }
    targetIdx++;
  }

  // Only return score if all characters matched
  if (searchIdx !== search.length) return 0;

  return Math.round((score / maxScore) * 50);
}

/**
 * Combines multiple field scores with weights
 */
export function calculateTotalScore(
  searchQuery: string,
  sku: string,
  barcode: string | undefined,
  productName: string
): number {
  const skuScore = fuzzyScore(searchQuery, sku) * 2; // SKU matches are most important
  const barcodeScore = fuzzyScore(searchQuery, barcode || '') * 1.5; // Barcode matches are important
  const nameScore = fuzzyScore(searchQuery, productName) * 1; // Name matches

  return Math.max(skuScore, barcodeScore, nameScore);
}
