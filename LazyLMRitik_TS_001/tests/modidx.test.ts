import { describe, expect, test } from '@jest/globals';
import d from '../src/lazy_lm/modidx';

describe('modidx', () => {
  test('settings are correctly defined', () => {
    expect(d.settings).toBeDefined();
    expect(d.settings.branch).toBe('master');
    expect(d.settings.doc_baseurl).toBe('https://LazyLMRitik.github.io/LazyLMRitik/');
    expect(d.settings.doc_host).toBe('https://LazyLMRitik.github.io');
    expect(d.settings.git_url).toBe('https://github.com/LazyLMRitik/LazyLMRitik/tree/master/');
    expect(d.settings.lib_path).toBe('LazyLMRitik');
  });

  test('symbols are correctly defined', () => {
    expect(d.syms).toBeDefined();
    expect(d.syms['lazy_lm']).toBeDefined();
    expect(d.syms['lazy_lm.core']).toBeDefined();
    
    // Test for specific symbols in lazy_lm.core
    const coreSymbols = d.syms['lazy_lm.core'];
    expect(coreSymbols.LazyEvaluationClient).toBeDefined();
    expect(coreSymbols.LazyState).toBeDefined();
    expect(coreSymbols.LLM).toBeDefined();
  });

  test('documentation links are correct', () => {
    const baseUrl = 'https://LazyLMRitik.github.io/LazyLMRitik/lazy_lm.core.html#';
    
    expect(d.syms['lazy_lm.core'].LazyEvaluationClient[0]).toBe(`${baseUrl}LazyEvaluationClient`);
    expect(d.syms['lazy_lm.core'].LazyState[0]).toBe(`${baseUrl}LazyState`);
    expect(d.syms['lazy_lm.core'].LLM[0]).toBe(`${baseUrl}LLM`);
  });

  test('source links are correct', () => {
    const sourceBase = 'https://github.com/LazyLMRitik/LazyLMRitik/tree/master/LazyLMRitik/lazy_lm/core.py';
    
    expect(d.syms['lazy_lm.core'].LazyEvaluationClient[1]).toBe(sourceBase);
    expect(d.syms['lazy_lm.core'].LazyState[1]).toBe(sourceBase);
    expect(d.syms['lazy_lm.core'].LLM[1]).toBe(sourceBase);
  });
});