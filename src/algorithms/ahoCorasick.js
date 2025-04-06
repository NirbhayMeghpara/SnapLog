'use strict';

const createTrie = () => ({
  root: { children: {}, fail: null, outputs: [] },
  patterns: []
});

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