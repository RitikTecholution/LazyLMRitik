import { describe, expect, test } from '@jest/globals';
import moduleIndex from '../src/lazy_lm/modidx';

describe('moduleIndex', () => {
  test('should have correct settings', () => {
    expect(moduleIndex.settings).toEqual({
      branch: 'main',
      host: 'github',
      lib_name: 'lazy_lm',
      owner: 'LazyLMRitik',
      repo: 'LazyLMRitik',
      version: '0.0.1',
    });
  });

  test('should have correct symbols for lazy_lm.core', () => {
    const coreSymbols = moduleIndex.symbols['lazy_lm.core'];
    expect(coreSymbols).toBeDefined();
    expect(coreSymbols.length).toBeGreaterThan(0);

    // Check for specific symbols
    const expectedSymbols = ['LazyState', 'LLM', 'LazyEvaluationClient', 'lazySystemPrompt'];
    expectedSymbols.forEach(symbol => {
      const foundSymbol = coreSymbols.find(s => s.name === symbol);
      expect(foundSymbol).toBeDefined();
      expect(foundSymbol?.kind).toBe('class');
      expect(foundSymbol?.doc).toBeDefined();
    });
  });

  test('should have correct structure for symbol info', () => {
    const coreSymbols = moduleIndex.symbols['lazy_lm.core'];
    const lazyStateSymbol = coreSymbols.find(s => s.name === 'LazyState');
    
    expect(lazyStateSymbol).toEqual({
      name: 'LazyState',
      kind: 'class',
      doc: expect.any(String),
      signature: expect.any(String),
    });
  });
});