import { describe, it, expect, jest } from '@jest/globals';
import { LazyState, LLM, LazyEvaluationClient } from '../src/lazy_lm/core';
import { AnthropicVertex } from 'anthropic';

jest.mock('anthropic');

describe('LazyState', () => {
  it('should add steps and get context', () => {
    const state = new LazyState();
    state.addStep('Step 1');
    state.addStep('Step 2');
    expect(state.getContext()).toBe('Step 1\nStep 2');
  });

  it('should refresh the state', () => {
    const state = new LazyState();
    state.addStep('Step 1');
    state.refresh();
    expect(state.getContext()).toBe('');
  });
});

describe('LLM', () => {
  it('should create an instance with default values', () => {
    const llm = new LLM();
    expect(llm.model).toBe('claude-2');
    expect(llm.temperature).toBe(0.7);
    expect(llm.max_tokens).toBe(1000);
  });

  it('should create an instance with custom values', () => {
    const llm = new LLM('custom-model', 0.5, 500);
    expect(llm.model).toBe('custom-model');
    expect(llm.temperature).toBe(0.5);
    expect(llm.max_tokens).toBe(500);
  });
});

describe('LazyEvaluationClient', () => {
  let mockAnthropicVertex: jest.Mocked<AnthropicVertex>;
  let client: LazyEvaluationClient;

  beforeEach(() => {
    mockAnthropicVertex = new AnthropicVertex({ apiKey: 'test-key' }) as jest.Mocked<AnthropicVertex>;
    mockAnthropicVertex.completions.create = jest.fn().mockResolvedValue({ completion: 'Mocked response' });
    client = new LazyEvaluationClient(mockAnthropicVertex);
  });

  it('should initialize a problem', () => {
    client.initializeProblem('Test problem');
    expect(client.getCurrentStep()).toBe('Test problem');
  });

  it('should get the next step', async () => {
    client.initializeProblem('Test problem');
    const nextStep = await client.getNextStep();
    expect(nextStep).toBe('Mocked response');
    expect(mockAnthropicVertex.completions.create).toHaveBeenCalled();
  });

  it('should ask a question', async () => {
    client.initializeProblem('Test problem');
    const answer = await client.askQuestion('Test question');
    expect(answer).toBe('Mocked response');
    expect(mockAnthropicVertex.completions.create).toHaveBeenCalled();
  });
});