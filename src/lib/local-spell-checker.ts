import { adaptiveDictionary } from './adaptive-dictionary';
import { bigramStore } from './bigram-store';

// Bangla phonetic similarity groups — characters in the same group cost 0.5 to substitute
// Groups: aspirated/unaspirated pairs and sibilant variants
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

// Common Bangla suffixes for suffix-aware validation (longest first)
const BANGLA_SUFFIXES = [
  'গুলো', 'গুলি', 'দের', 'তে', 'কে', 'রা', 'ের', 'র', 'ে', 'য়', 'তি', 'নি',
];

// Common spelling mistakes and their corrections
const commonMistakes: { [key: string]: string } = {
  // Common typos
  'আমাক': 'আমাকে',
  'তোমাক': 'তোমাকে',
  'তাক': 'তাকে',
  'আপনাক': 'আপনাকে',
  'কোরো': 'করো',
  'কোরে': 'করে',
  'কোরছি': 'করছি',
  'কোরবো': 'করবো',
  'দেখবো': 'দেখব',
  'করবো': 'করব',
  'হবো': 'হব',
  'যাবো': 'যাব',
  'থাকবো': 'থাকব',
  'দিবো': 'দেব',
  'নিবো': 'নেব',
  'হইতে': 'হতে',
  'হইয়া': 'হয়ে',
  'করিয়া': 'করে',
  'দিয়া': 'দিয়ে',
  'লইয়া': 'নিয়ে',
  'গিয়া': 'গিয়ে',
  'আসিয়া': 'এসে',
  'থাকিয়া': 'থেকে',
  'দেখিয়া': 'দেখে',
  'শুনিয়া': 'শুনে',
  'পড়িয়া': 'পড়ে',
  'চলিয়া': 'চলে',
  'বলিয়া': 'বলে',
  'খাইয়া': 'খেয়ে',
  'যাইয়া': 'গিয়ে',
  'পাইয়া': 'পেয়ে',
  'চাহিয়া': 'চেয়ে',
  'রহিয়া': 'রয়ে',
  'সহিত': 'সাথে',
  'নহে': 'নয়',
  'কাহার': 'কার',
  'তাহার': 'তার',
  'ইহা': 'এটা',
  'উহা': 'ওটা',
  'ইহার': 'এর',
  'উহার': 'ওর',
  'কাহাকে': 'কাকে',
  'তাহাকে': 'তাকে',
  'যাহা': 'যা',
  'তাহা': 'তা',
  'যাহার': 'যার',
  'সকাশে': 'কাছে',
  'নিকটে': 'কাছে',
  'অদ্য': 'আজ',
  'কল্য': 'কাল',
  'পূর্বে': 'আগে',
  'পশ্চাতে': 'পরে',
  'কেহ': 'কেউ',
  'কাহারো': 'কারো',
  'তাহারা': 'তারা',
  'উহারা': 'ওরা',
  'ইহারা': 'এরা',
  'আমাদিগের': 'আমাদের',
  'তোমাদিগের': 'তোমাদের',
  'তাহাদিগের': 'তাদের',
  'যাহারা': 'যারা',
  'ব্যাবহার': 'ব্যবহার',
  'শব্ধ': 'শব্দ',
  'সম্বন্দ': 'সম্বন্ধ',
  'মুল্য': 'মূল্য',
  'শুন্য': 'শূন্য',
  'পুর্ণ': 'পূর্ণ',
  'দুরে': 'দূরে',
  'সুর্য': 'সূর্য',
  'চুল': 'চুল',
  'ভুমি': 'ভূমি',
  'মুর্তি': 'মূর্তি',
  'পুজা': 'পূজা',
  'দুর': 'দূর',
  'সুচনা': 'সূচনা',
  'সুত্র': 'সূত্র',
  'মুলত': 'মূলত',
  'পুর্ব': 'পূর্ব',
  'দুষিত': 'দূষিত',
  'সুক্ষ্ম': 'সূক্ষ্ম',
  'পুরান': 'পুরান',
  'পুরাণ': 'পুরাণ',
  'শিরনাম': 'শিরোনাম',
  'ব্যাতিত': 'ব্যতীত',
  'সম্পাদিত': 'সম্পাদিত',
  'সমাপ্তি': 'সমাপ্তি',
  'সমাপ্ত': 'সমাপ্ত',
  'শেষ্ঠ': 'শ্রেষ্ঠ',
  'আরম্ব': 'আরম্ভ',
  'শম্ভব': 'সম্ভব',
  'শান্তি': 'শান্তি',
  'সান্তি': 'শান্তি',
  'দুরবস্থা': 'দুরবস্থা',
  'দুরাবস্থা': 'দুরবস্থা',
  'নিরব': 'নীরব',
  'নিরস': 'নীরস',
  'নিড়': 'নীড়',
  'স্ত্রি': 'স্ত্রী',
  'পত্নি': 'পত্নী',
  'দেবি': 'দেবী',
  'রাণি': 'রানী',
  'মন্ত্রি': 'মন্ত্রী',
  'প্রাণি': 'প্রাণী',
  'পাখি': 'পাখি',
  'পাখী': 'পাখি',
  'নদি': 'নদী',
  'কবি': 'কবি',
  'ঋষি': 'ঋষি',
  'মুনি': 'মুনি',
  'গাড়ি': 'গাড়ি',
  'গাড়ী': 'গাড়ি',
  'বাড়ি': 'বাড়ি',
  'বাড়ী': 'বাড়ি',
  'পানি': 'পানি',
  'পানী': 'পানি',
  'খুশি': 'খুশি',
  'খুশী': 'খুশি',
  'স্বামি': 'স্বামী',
  'প্রতিদিন': 'প্রতিদিন',
  'প্রতিদীন': 'প্রতিদিন',
  'উন্নতি': 'উন্নতি',
  'উন্নতী': 'উন্নতি',
  'স্বাধিনতা': 'স্বাধীনতা',
  'বিধি': 'বিধি',
  'বিধী': 'বিধি'
};

export interface SpellingError {
  word: string;
  correction: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

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

// Find the closest word using trie prefix search (no full dictionary scan)
function findClosestWord(word: string, maxDistance: number = 2): string | null {
  // 1. Check common mistakes first
  if (commonMistakes[word]) return commonMistakes[word];

  // 2. Get prefix-based suggestions from trie (fast)
  const prefixLength = Math.max(2, word.length - 2);
  const prefixSuggestions = adaptiveDictionary.getSuggestions(word.slice(0, prefixLength), 20);

  // 3. Find closest by phoneticDistance among suggestions (ties broken by shorter word)
  let minDistance = Infinity;
  let closestWord: string | null = null;
  for (const candidate of prefixSuggestions) {
    if (Math.abs(candidate.length - word.length) > maxDistance) continue;
    const distance = phoneticDistance(word, candidate);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closestWord = candidate;
    } else if (distance === minDistance && closestWord !== null) {
      // Prefer shorter word as proxy for higher frequency
      if (candidate.length < closestWord.length) {
        closestWord = candidate;
      }
    }
  }
  return closestWord;
}

// Main spell checking function
export function checkSpelling(text: string): SpellingError[] {
  const errors: SpellingError[] = [];

  // Split text into words while keeping track of positions
  const wordRegex = /[\u0980-\u09FF]+/g;
  let match;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + word.length;

    // Skip very short words (1-2 characters)
    if (word.length <= 2) {
      continue;
    }

    // Check if word is in the trie-backed adaptive dictionary
    if (!adaptiveDictionary.isKnownWord(word)) {
      // Suffix-aware validation: strip common suffixes and check stem
      let knownViaSuffix = false;
      for (const suffix of BANGLA_SUFFIXES) {
        if (word.length > suffix.length && word.endsWith(suffix)) {
          const stem = word.slice(0, word.length - suffix.length);
          if (stem.length >= 2 && adaptiveDictionary.isKnownWord(stem)) {
            knownViaSuffix = true;
            break;
          }
        }
      }

      if (!knownViaSuffix) {
        // Try to find a correction
        const correction = findClosestWord(word);

        if (correction && correction !== word) {
          // Calculate confidence based on phonetic distance
          const distance = phoneticDistance(word, correction);
          const confidence = Math.max(0, 100 - (distance * 25)); // 25% reduction per edit distance

          errors.push({
            word,
            correction,
            startIndex,
            endIndex,
            confidence
          });
        }
      }
    }
  }

  return errors;
}

// Get fuzzy suggestions for a word using phonetic distance + context
export function getSpellingSuggestions(word: string, limit: number = 5, prevWord?: string): string[] {
  if (!word || word.length < 2) return [];

  // 1. Check common mistakes first
  const commonFix = commonMistakes[word];

  // 2. Get candidates from multiple prefix lengths to cast a wider net
  const candidates = new Set<string>();
  for (let prefixLen = Math.max(1, word.length - 3); prefixLen <= Math.min(word.length, word.length - 1); prefixLen++) {
    if (prefixLen < 1) continue;
    const prefix = word.slice(0, prefixLen);
    for (const s of adaptiveDictionary.getSuggestions(prefix, 30)) {
      candidates.add(s);
    }
  }

  // 3. Score by phonetic distance, keep only close matches
  const maxDist = Math.min(3, Math.ceil(word.length * 0.6));

  // Get context-aware next-words from bigrams for re-ranking
  const contextWords = prevWord ? new Set(bigramStore.getSuggestions(prevWord, 50)) : new Set<string>();

  const scored: { word: string; score: number }[] = [];

  if (commonFix) {
    // Common fix gets best score; boost if it also fits context
    scored.push({ word: commonFix, score: contextWords.has(commonFix) ? -1 : 0 });
  }

  for (const candidate of candidates) {
    if (candidate === word) continue;
    if (Math.abs(candidate.length - word.length) > maxDist) continue;
    const dist = phoneticDistance(word, candidate);
    if (dist <= maxDist) {
      // Context boost: subtract 0.5 from distance if candidate is a known collocate
      const contextBoost = contextWords.has(candidate) ? 0.5 : 0;
      scored.push({ word: candidate, score: dist - contextBoost });
    }
  }

  // Sort by score (lowest first), then shorter words first
  scored.sort((a, b) => a.score - b.score || a.word.length - b.word.length);

  return scored.slice(0, limit).map(s => s.word);
}

