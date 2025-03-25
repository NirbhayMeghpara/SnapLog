'use strict';

const createTrie = () => ({
  root: { children: {}, fail: null, outputs: [] },
  patterns: []
});

const addPatternToTrie = (trie, pattern) => {
  const newTrie = {
    root: { ...trie.root, children: { ...trie.root.children } },
    patterns: [...trie.patterns, pattern]
  };
  let node = newTrie.root;
  for (const char of pattern) {
    node.children[char] = node.children[char] || { children: {}, fail: null, outputs: [] };
    node = node.children[char];
  }
  node.outputs.push(pattern);
  return newTrie;
};

const buildFailureLinks = (trie) => {
  const newTrie = {
    root: { ...trie.root, children: { ...trie.root.children } },
    patterns: [...trie.patterns]
  };
  newTrie.root.fail = newTrie.root;

  const queue = [];
  for (const char in newTrie.root.children) {
    const child = { ...newTrie.root.children[char], children: { ...newTrie.root.children[char].children } };
    newTrie.root.children[char] = child;
    child.fail = newTrie.root;
    queue.push(child);
  }

  while (queue.length) {
    const node = queue.shift();
    for (const char in node.children) {
      const child = { ...node.children[char], children: { ...node.children[char].children } };
      node.children[char] = child;
      let fail = node.fail;
      while (fail !== newTrie.root && !fail.children[char]) fail = fail.fail;
      child.fail = fail.children[char] || newTrie.root;
      child.outputs = [...child.outputs, ...child.fail.outputs];
      queue.push(child);
    }
  }
  return newTrie;
};

const findMultiplePatterns = (patterns, text, trie) => {
  if (!patterns || !text || !trie) return false;
  let node = trie.root;
  const matches = [];
  for (let i = 0; i < text.length; i++) {
    while (node !== trie.root && !node.children[text[i]]) node = node.fail;
    node = node.children[text[i]] || trie.root;
    if (node.outputs.length) {
      matches.push(...node.outputs.map(pattern => ({ pattern, end: i })));
    }
  }
  return matches.some(match => patterns.includes(match.pattern));
};

export { createTrie, addPatternToTrie, buildFailureLinks, findMultiplePatterns };