import { describe, test, expect } from '@jest/globals';
import d from '../src/lazy_lm/modidx';

describe('modidx', () => {
  test('settings should have correct properties', () => {
    expect(d.settings).toHaveProperty('branch');
    expect(d.settings).toHaveProperty('doc_baseurl');
    expect(d.settings).toHaveProperty('git_url');
    expect(d.settings).toHaveProperty('lib_path');
  });

  test('symbols should contain correct modules', () => {
    expect(d.symbols).toHaveProperty('core');
    expect(d.symbols).toHaveProperty('modidx');
  });

  test('core module should have correct symbols', () => {
    const coreSymbols = d.symbols.core;
    expect(coreSymbols).toContain('LazyState');
    expect(coreSymbols).toContain('LLM');
    expect(coreSymbols).toContain('LazyEvaluationClient');
  });

  test('modidx module should have correct symbols', () => {
    const modidxSymbols = d.symbols.modidx;
    expect(modidxSymbols).toContain('Settings');
    expect(modidxSymbols).toContain('SymbolInfo');
    expect(modidxSymbols).toContain('Symbols');
    expect(modidxSymbols).toContain('ModuleIndex');
  });
});