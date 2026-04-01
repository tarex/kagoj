// Bangla phonetic similarity groups -- characters in the same group cost 0.5 to substitute
const BANGLA_PHONETIC_GROUPS: Map<string, number> = new Map([
  // Group 1: ক/খ (velar unvoiced)
  ['ক', 1], ['খ', 1],
  // Group 2: গ/ঘ (velar voiced)
  ['গ', 2], ['ঘ', 2],
  // Group 3: চ/ছ (palatal unvoiced)
  ['চ', 3], ['ছ', 3],
  // Group 4: জ/ঝ (palatal voiced)
  ['জ', 4], ['ঝ', 4],
  // Group 5: ট/ঠ (retroflex unvoiced)
  ['ট', 5], ['ঠ', 5],
  // Group 6: ড/ঢ (retroflex voiced)
  ['ড', 6], ['ঢ', 6],
  // Group 7: ত/থ (dental unvoiced)
  ['ত', 7], ['থ', 7],
  // Group 8: দ/ধ (dental voiced)
  ['দ', 8], ['ধ', 8],
  // Group 9: প/ফ (labial unvoiced)
  ['প', 9], ['ফ', 9],
  // Group 10: ব/ভ (labial voiced)
  ['ব', 10], ['ভ', 10],
  // Group 11: শ/ষ/স (sibilants)
  ['শ', 11], ['ষ', 11], ['স', 11],
  // Group 12: ন/ণ (nasals)
  ['ন', 12], ['ণ', 12],
]);

/**
 * Phonetic-aware distance: like Levenshtein but substitution within the same
 * phonetic group costs 0.5 instead of 1.0.
 */
export function phoneticDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const c1 = str1[i - 1];
      const c2 = str2[j - 1];
      if (c1 === c2) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        const g1 = BANGLA_PHONETIC_GROUPS.get(c1);
        const g2 = BANGLA_PHONETIC_GROUPS.get(c2);
        const subCost = (g1 !== undefined && g1 === g2) ? 0.5 : 1.0;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,           // deletion
          dp[i][j - 1] + 1,           // insertion
          dp[i - 1][j - 1] + subCost  // substitution (possibly 0.5 for same-group)
        );
      }
    }
  }

  return dp[len1][len2];
}
