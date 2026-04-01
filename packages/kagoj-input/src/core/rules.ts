import type { TransliterationRule } from './types';

/**
 * Defines transliteration rules with optional context patterns.
 * Each rule consists of:
 * - pattern: The regular expression pattern to match.
 * - contextPattern (optional): A regular expression pattern for the preceding context.
 * - replacement: The string to replace the matched pattern with.
 */
export const contextPatterns: TransliterationRule[] = [
  // Rules for 'ৃ'
  { pattern: '([ক-হড়ঢ়য়])্?ররi', contextPattern: '[^o`]', replacement: '$1ৃ' },
  { pattern: 'ররi', contextPattern: '[^o`]', replacement: 'ঋ' },

  // Rules for 'ং' and 'ঙ'
  { pattern: 'ঙহo', replacement: 'ঙ্ঘ' },
  { pattern: '([ক-হড়ঢ়য়])াZ', contextPattern: '[^o`]', replacement: '$1্যা' },
  {
    pattern: '(([ক-হড়ঢ়য়])|য়)o',
    contextPattern: '[^o`]',
    replacement: '$1',
  },
  { pattern: '([ক-হড়ঢ়য়])a', contextPattern: '[^o`]', replacement: '$1া' },

  // Specific rule for "ীর" (dir)
  {
    pattern: '([ক-হ])ীর',
    replacement: '$1ীর্ঘ',
  },
  {
    pattern: 'ীর',
    replacement: 'ীরঘ',
  },
  // Rules for i, I, e, ee
  {
    pattern: '([ক-হড়ঢ়য়])i',
    contextPattern: '[^o`অআইঈউঊঋএঐওঔ]',
    replacement: '$1ি',
  },
  { pattern: 'i', contextPattern: '^|[\\s.,!?।]', replacement: 'ই' },
  { pattern: '([ক-হড়ঢ়য়])(I|েe)', contextPattern: '[^o`]', replacement: '$1ী' },
  { pattern: '([ক-হড়ঢ়য়])u', contextPattern: '[^o`]', replacement: '$1ু' },
  { pattern: '([ক-হড়ঢ়য়])U', contextPattern: '[^o`]', replacement: '$1ূ' },
  { pattern: '([ক-হড়ঢ়য়])o', contextPattern: '[o`]', replacement: '$1ু' },
  { pattern: '([ক-হড়ঢ়য়])e', contextPattern: '[^o`]', replacement: '$1ে' },
  { pattern: '([ক-হড়ঢ়য়])োI', contextPattern: '[^o`]', replacement: '$1ৈ' },
  { pattern: '([ক-হড়ঢ়য়])O', contextPattern: '[^o`]', replacement: '$1ো' },
  { pattern: '([ক-হড়ঢ়য়])োU', contextPattern: '[^o`]', replacement: '$1ৌ' },

  // Rules for 'য়া', 'ও'
  {
    pattern: '([ক-হড়ঢ়য়][িুেো]|[এইওউ])a',
    contextPattern: '[^o`]',
    replacement: '$1য়া',
  },
  {
    pattern: '([ক-হড়ঢ়য়][াে]|[আএ])o',
    contextPattern: '[^o`]',
    replacement: '$1ও',
  },

  // Rules for consonant conjuncts
  { pattern: '([কঙলষস])(k|K)', contextPattern: '[^o`]', replacement: '$1্ক' },
  { pattern: '([ঙদল])(g|G)', contextPattern: '[^o`]', replacement: '$1্গ' },
  { pattern: 'গg', contextPattern: '[^o`]', replacement: 'জ্ঞ' },
  { pattern: '([চশ])c', contextPattern: '[^o`]', replacement: '$1্চ' },
  { pattern: '([জঞব])j', contextPattern: '[^o`]', replacement: '$1্জ' },
  { pattern: 'নj', contextPattern: '[^o`]', replacement: 'ঞ্জ' },
  { pattern: '([কটণনপলষস])T', contextPattern: '[^o`]', replacement: '$1্ট' },
  { pattern: '([ডণনল])D', contextPattern: '[^o`]', replacement: '$1্ড' },
  { pattern: '([গষহ])N', contextPattern: '[^o`]', replacement: '$1্ণ' },
  { pattern: '([কতনপশসহ])t', contextPattern: '[^o`]', replacement: '$1্ত' },
  { pattern: '([দনব])d', contextPattern: '[^o`]', replacement: '$1্দ' },
  { pattern: '([গঘণতধনপমশসহ])n', contextPattern: '[^o`]', replacement: '$1্ন' },
  { pattern: '([পমলষস])p', contextPattern: '[^o`]', replacement: '$1্প' },
  { pattern: '([স])(f|F)', contextPattern: '[^o`]', replacement: '$1্ফ' },
  { pattern: '([বমল])b', contextPattern: '[^o`]', replacement: '$1্ব' },
  { pattern: '([দম])(v|V)', contextPattern: '[^o`]', replacement: '$1্ভ' },
  {
    pattern: '([কগঙটণতদধনমলশষসহ])m',
    contextPattern: '[^o`]',
    replacement: '$1্ম',
  },
  {
    pattern: '([ক-ঘচ-ঝট-যলশ-হড়ঢ়য়])r',
    contextPattern: '[^o`]',
    replacement: '$1্র',
  },
  { pattern: '([কগপ-বমলশসহ])l', contextPattern: '[^o`]', replacement: '$1্ল' },
  { pattern: '([কনপ])s', contextPattern: '[^o`]', replacement: '$1্স' },
  { pattern: '([ক-হড়ঢ়য়])(w|W)', contextPattern: '[^o`]', replacement: '$1্ব' },
  { pattern: '([ক-হড়ঢ়য়])y', contextPattern: '[^o`]', replacement: '$1্য' },
  { pattern: 'নc', contextPattern: '[^o`]', replacement: 'ঞ্চ' },

  // Rules for 'ৎ'
  { pattern: 'ত`', replacement: 'ৎ' },

  // Rules for 'ক্ষ'
  { pattern: 'ক্ক(h|H)', contextPattern: '[^o`]', replacement: 'ক্ষ' },
  { pattern: 'কশ(h|H)', contextPattern: '[^o`]', replacement: 'ক্ষ' },

  // Rules for 'র্' (reph)
  { pattern: 'ররk', replacement: 'র্ক' },
  { pattern: 'ররg', replacement: 'র্গ' },
  { pattern: 'ররc', replacement: 'র্চ' },
  { pattern: 'ররj', replacement: 'র্জ' },
  { pattern: 'ররT', replacement: 'র্ট' },
  { pattern: 'ররD', replacement: 'র্ড' },
  { pattern: 'ররN', replacement: 'র্ণ' },
  { pattern: 'ররt', replacement: 'র্ত' },
  { pattern: 'ররd', replacement: 'র্দ' },
  { pattern: 'ররn', replacement: 'র্ন' },
  { pattern: 'ররp', replacement: 'র্প' },
  { pattern: 'রর(f|F)', replacement: 'র্ফ' },
  { pattern: 'ররb', replacement: 'র্ব' },
  { pattern: 'ররv', replacement: 'র্ভ' },
  { pattern: 'ররm', replacement: 'র্ম' },
  { pattern: 'ররz', replacement: 'র্য' },
  { pattern: 'ররl', replacement: 'র্ল' },
  { pattern: 'ররS', replacement: 'র্শ' },
  { pattern: 'ররs', replacement: 'র্স' },
  { pattern: 'ররh', replacement: 'র্হ' },
  { pattern: 'ররR', replacement: 'র্ড়' },
  { pattern: 'রর(y|Y)', replacement: 'র্য়' },

  // Rules for 'ং' variations
  { pattern: 'ংo', replacement: 'ঙ্গ' },
  { pattern: 'ংi', replacement: 'ঙ্গি' },
  { pattern: 'ংI', replacement: 'ঙ্গী' },
  { pattern: '(ংu|ঙ্গo)', replacement: 'ঙ্গু' },
  { pattern: 'ংU', replacement: 'ঙ্গূ' },
  { pattern: 'ং', replacement: 'ঙ্গি' },

  // Rules for 'ষ'
  { pattern: 'শ(h|H)', replacement: 'ষ' },

  // Rules for vowels
  { pattern: 'অo', contextPattern: '[^`]', replacement: 'উ' },
  { pattern: 'এe', contextPattern: '[^o`]', replacement: 'ঈ' },

  // Rules for consonant doubling
  { pattern: 'ক(h|H)', contextPattern: '[^o`]', replacement: 'খ' },
  { pattern: 'গ(h|H)', contextPattern: '[^o`]', replacement: 'ঘ' },
  { pattern: 'ণg', contextPattern: '[^o`]', replacement: 'ঙ' },
  { pattern: 'চ(h|H)', contextPattern: '[^o`]', replacement: 'ছ' },
  { pattern: 'জ(h|H)', contextPattern: '[^o`]', replacement: 'ঝ' },
  { pattern: 'ণG', contextPattern: '[^o`]', replacement: 'ঞ' },
  { pattern: 'ট(h|H)', contextPattern: '[^o`]', replacement: 'ঠ' },
  { pattern: 'ড(h|H)', contextPattern: '[^o`]', replacement: 'ঢ' },
  { pattern: 'ত(h|H)', contextPattern: '[^o`]', replacement: 'থ' },
  { pattern: 'দ(h|H)', contextPattern: '[^o`]', replacement: 'ধ' },
  { pattern: 'প(h|H)', contextPattern: '[^o`]', replacement: 'ফ' },
  { pattern: 'ব(h|H)', contextPattern: '[^o`]', replacement: 'ভ' },
  { pattern: '(স(h|H))', contextPattern: '[^o`]', replacement: 'শ' },
  { pattern: 'ড়(h|H)', contextPattern: '[^o`]', replacement: 'ঢ়' },
  { pattern: 'ত্`', contextPattern: '[^o`]', replacement: 'ৎ' },
  { pattern: 'নg', contextPattern: '[^o`]', replacement: 'ং' },
  { pattern: 'ঃ`', contextPattern: '[^o`]', replacement: ':' },
  { pattern: 'ররi', contextPattern: '[^o`]', replacement: 'ঋ' },
  { pattern: 'ওI', contextPattern: '[^o`]', replacement: 'ঐ' },
  { pattern: 'ওU', contextPattern: '[^o`]', replacement: 'ঔ' },

  // Rules for vowel modifiers
  { pattern: 'আ`', replacement: 'া' },
  { pattern: 'ই`', replacement: 'ি' },
  { pattern: 'ঈ`', replacement: 'ী' },
  { pattern: 'উ`', replacement: 'ু' },
  { pattern: 'ঊ`', replacement: 'ূ' },
  { pattern: 'এ`', replacement: 'ে' },

  // Rules for consonants
  { pattern: '([kKqQ])', replacement: 'ক' },
  { pattern: '(g|G)', replacement: 'গ' },
  { pattern: '(c|C)', replacement: 'চ' },
  { pattern: '(j|J)', replacement: 'জ' },
  { pattern: 'T', replacement: 'ট' },
  { pattern: 'D', replacement: 'ড' },
  { pattern: 'N', replacement: 'ণ' },
  { pattern: 't', replacement: 'ত' },
  { pattern: 'd', replacement: 'দ' },
  { pattern: 'n', replacement: 'ন' },
  { pattern: '(p|P)', replacement: 'প' },
  { pattern: '(f|F)', replacement: 'ফ' },
  { pattern: '(b|B)', replacement: 'ব' },
  { pattern: '(v|V)', replacement: 'ভ' },
  { pattern: '(m|M)', replacement: 'ম' },
  { pattern: 'z', replacement: 'য' },
  { pattern: 'r', replacement: 'র' },
  { pattern: '(l|L)', replacement: 'ল' },
  { pattern: 'S', replacement: 'শ' },
  { pattern: 's', replacement: 'স' },
  { pattern: '(h|H)', replacement: 'হ' },
  { pattern: 'R', replacement: 'ড়' },
  { pattern: '(w|W)', replacement: 'ও' },
  { pattern: '(x|X)', replacement: 'ক্স' },
  { pattern: '(y|Y)', replacement: 'য়' },

  // Rules for '্য'
  { pattern: 'Z', replacement: '্য' },

  // Rules for vowels
  { pattern: 'o', replacement: 'অ' },
  { pattern: '(a|A)', replacement: 'আ' },
  { pattern: 'I', replacement: 'ঈ' },
  { pattern: 'u', replacement: 'উ' },
  { pattern: 'U', replacement: 'ঊ' },
  { pattern: '(e|E)', replacement: 'এ' },
  { pattern: 'O', replacement: 'ও' },

  // Rules for numbers
  { pattern: '0', replacement: '০' },
  { pattern: '1', replacement: '১' },
  { pattern: '2', replacement: '২' },
  { pattern: '3', replacement: '৩' },
  { pattern: '4', replacement: '৪' },
  { pattern: '5', replacement: '৫' },
  { pattern: '6', replacement: '৬' },
  { pattern: '7', replacement: '৭' },
  { pattern: '8', replacement: '৮' },
  { pattern: '9', replacement: '৯' },

  // Rules for punctuation
  { pattern: '\\\\\\.', replacement: '.' },
  { pattern: ',,', replacement: '্' },
  { pattern: '\\:', replacement: 'ঃ' },
  { pattern: '\\^', replacement: 'ঁ' },
  { pattern: '।।\\.', replacement: '...' },
  { pattern: '\\.', replacement: '।' },
  { pattern: '\\$', replacement: '৳' },
  { pattern: 'ঃ`', replacement: ':' },
  { pattern: '`', replacement: '' },
];
