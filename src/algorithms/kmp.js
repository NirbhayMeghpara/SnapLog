'use strict';

/**
 * Computes the Longest Prefix Suffix (LPS) array for KMP pattern matching.
 * @param {string} pattern - The pattern to preprocess.
 * @returns {number[]} Array of LPS values for the pattern.
 */
const computeLPSArray = (pattern) => {
  const lps = Array.from({ length: pattern.length }, () => 0);
  let len = 0;
  let i = 1;
  while (i < pattern.length) {
    if (pattern[i] === pattern[len]) {
      len++;
      lps[i] = len;
      i++;
    } else if (len !== 0) {
      len = lps[len - 1];
    } else {
      lps[i] = 0;
      i++;
    }
  }
  return lps;
};

/**
 * Searches for a pattern in text using the KMP algorithm with caching.
 * @param {string} pattern - The pattern to search for.
 * @param {string} text - The text to search in.
 * @param {Map<string, number[]>} patternCache - Cache for storing LPS arrays.
 * @returns {boolean} True if the pattern is found, false otherwise.
 */
const findPattern = (pattern, text, patternCache) => {
  if (!pattern || !text) return false;
  let lps = patternCache.get(pattern);
  const m = pattern.length;
  const n = text.length;
  if (m > n) return false;

  if (!lps) {
    lps = computeLPSArray(pattern);
    patternCache.set(pattern, lps);
  }

  let i = 0, j = 0;
  while (i < n) {
    if (pattern[j] === text[i]) {
      i++;
      j++;
    }
    if (j === m) return true;
    else if (pattern[j] !== text[i]) {
      j = j !== 0 ? lps[j - 1] : 0;
      if (j === 0) i++;
    }
  }
  return false;
};

export { computeLPSArray, findPattern };