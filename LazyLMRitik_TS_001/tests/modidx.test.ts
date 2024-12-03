import { describe, expect, test } from '@jest/globals';
import d from '../src/lazy_lm/modidx';

describe('modidx', () => {
  test('settings are correctly defined', () => {
    expect(d.settings).toBeDefined();
    expect(d.settings.branch).toBe('main');
    expect(d.settings.doc_baseurl).toBe('https://ritik-garg.github.io/LazyLMRitik/');
    expect(d.settings.doc_host).toBe('https://ritik-garg.github.io');
    expect(d.settings.git_url).toBe('https://github.com/ritik-garg/LazyLMRitik/tree/main/');
    expect(d.settings.lib_path).toBe('lazy_lm');
  });

  test('syms object is correctly defined', () => {
    expect(d.syms).toBeDefined();
    expect(d.syms['lazy_lm.core']).toBeDefined();
  });

  test('lazy_lm.core symbols are correctly defined', () => {
    const coreSymbols = d.syms['lazy_lm.core'];
    expect(coreSymbols.LazyState).toBeDefined();
    expect(coreSymbols.LLM).toBeDefined();
    expect(coreSymbols.LazyEvaluationClient).toBeDefined();
  });

  test('symbol information is correctly structured', () => {
    const lazyStateInfo = d.syms['lazy_lm.core'].LazyState;
    expect(lazyStateInfo.doc).toBe('lazy_lm.core.html#LazyState');
    expect(lazyStateInfo.name).toBe('LazyState');
    expect(lazyStateInfo.qual).toBe('lazy_lm.core.LazyState');
    expect(lazyStateInfo.source).toBe('lazy_lm/core.ts');
  });
});