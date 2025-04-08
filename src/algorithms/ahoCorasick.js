'use strict';

/**
 * Creates an Aho-Corasick trie structure for multi-pattern matching.
 * @returns {Object} Trie object with root node and pattern list.
 */
const createTrie = () => ({
  root: { children: {}, fail: null, outputs: [] },
  patterns: []
});

/**
 * Adds a pattern to the Aho-Corasick trie.
 * @param {Object} trie - Existing trie object.
 * @param {string} pattern - Pattern to add.
 * @param {Set<string>} [patternSet=null] - Optional set of patterns to filter outputs.
 * @returns {Object} Updated trie object.
 */
const addPatternToTrie = (trie, pattern, patternSet = null) => {
  let node = trie.root;
  for (const char of pattern) {
    if (!node.children[char]) node.children[char] = { children: {}, fail: null, outputs: [] };
    node = node.children[char];
  }
  if (!patternSet || patternSet.has(pattern)) node.outputs.push(pattern);
  trie.patterns.push(pattern);
  return trie;
};

/**
 * Builds failure links in the Aho-Corasick trie for efficient matching.
 * @param {Object} trie - Trie object to process.
 * @returns {Object} Trie with failure links constructed.
 */
const buildFailureLinks = (trie) => {
  trie.root.fail = trie.root;
  const queue = [];
  let head = 0;
  for (const char in trie.root.children) {
    const child = trie.root.children[char];
    child.fail = trie.root;
    queue.push(child);
  }
  while (head < queue.length) {
    const node = queue[head++];
    for (const char in node.children) {
      const child = node.children[char];
      let fail = node.fail;
      while (fail !== trie.root && !fail.children[char]) fail = fail.fail;
      child.fail = fail.children[char] || trie.root;
      child.outputs.push(...child.fail.outputs);
      queue.push(child);
    }
  }
  return trie;
};

/**
 * Searches for multiple patterns in a text using the Aho-Corasick trie.
 * @param {string[]} patterns - Array of patterns to search for.
 * @param {string} text - Text to search in.
 * @param {Object} trie - Pre-built Aho-Corasick trie.
 * @returns {boolean} True if any pattern is found, false otherwise.
 */
const findMultiplePatterns = (patterns, text, trie) => {
  if (!patterns || !text || !trie) return false;
  const patternSet = new Set(patterns);
  let node = trie.root;
  for (let i = 0; i < text.length; i++) {
    while (node !== trie.root && !node.children[text[i]]) node = node.fail;
    node = node.children[text[i]] || trie.root;
    if (node.outputs.length) {
      for (const pattern of node.outputs) {
        if (patternSet.has(pattern)) return true;
      }
    }
  }
  return false;
};

export { createTrie, addPatternToTrie, buildFailureLinks, findMultiplePatterns };