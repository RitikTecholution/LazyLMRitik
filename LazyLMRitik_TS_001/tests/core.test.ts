import { describe, expect, test, jest } from '@jest/globals';
import { LazyState, LazyEvaluationClient, LLM, AnthropicVertex } from '../src/lazy_lm/core';

describe('LazyState', () => {
  test('constructor initializes correctly', () => {
    const problem = 'Test problem';
    const state = new LazyState(problem);
    expect(state.problem).toBe(problem);
    expect(state.steps).toEqual([]);
    expect(state.currentStep).toBe(0);
  });

  test('addStep adds a step', () => {
    const state = new LazyState('Test problem');
    state.addStep('Step 1');
    expect(state.steps).toEqual(['Step 1']);
    expect(state.currentStep).toBe(1);
  });

  test('getContext returns correct context', () => {
    const state = new LazyState('Test problem');
    state.addStep('Step 1');
    state.addStep('Step 2');
    const context = state.getContext();
    expect(context).toContain('Test problem');
    expect(context).toContain('Step 1');
    expect(context).toContain('Step 2');
  });

  test('refresh resets steps and currentStep', () => {
    const state = new LazyState('Test problem');
    state.addStep('Step 1');
    state.refresh();
    expect(state.steps).toEqual([]);
    expect(state.currentStep).toBe(0);
  });
});

describe('LazyEvaluationClient', () => {
  let mockLLM: LLM;
  let mockClient: AnthropicVertex;

  beforeEach(() => {
    mockClient = {
      completions: {
        create: jest.fn().mockResolvedValue({ completion: 'Mocked response' })
      }
    } as unknown as AnthropicVertex;

    mockLLM = {
      client: mockClient,
      model: 'test-model'
    };
  });

  test('constructor initializes correctly', () => {
    const state = new LazyState('Test problem');
    const client = new LazyEvaluationClient(mockLLM, 100, state);
    expect(client.model).toBe('test-model');
    expect(client.maxTokens).toBe(100);
    expect(client.state).toBe(state);
  });

  test('initializeProblem sets up the state', () => {
    const client = new LazyEvaluationClient(mockLLM, 100, null);
    client.initializeProblem('New problem');
    expect(client.state?.problem).toBe('New problem');
  });

  test('getCurrentStep returns correct step', () => {
    const state = new LazyState('Test problem');
    state.addStep('Step 1');
    const client = new LazyEvaluationClient(mockLLM, 100, state);
    expect(client.getCurrentStep()).toBe('Step 1');
  });

  test('getNextStep calls API and updates state', async () => {
    const state = new LazyState('Test problem');
    const client = new LazyEvaluationClient(mockLLM, 100, state);
    const nextStep = await client.getNextStep();
    expect(nextStep).toBe('Mocked response');
    expect(state.steps).toContain('Mocked response');
  });

  test('askQuestion calls API and returns response', async () => {
    const state = new LazyState('Test problem');
    const client = new LazyEvaluationClient(mockLLM, 100, state);
    const response = await client.askQuestion('Test question');
    expect(response).toBe('Mocked response');
  });
});

describe('AnthropicVertex prototype extension', () => {
  test('lazy method returns LazyEvaluationClient', () => {
    const mockAnthropicVertex = {
      completions: {
        create: jest.fn()
      }
    } as unknown as AnthropicVertex;

    const lazyClient = mockAnthropicVertex.lazy('Test problem');
    expect(lazyClient).toBeInstanceOf(LazyEvaluationClient);
    expect(lazyClient.state?.problem).toBe('Test problem');
  });
});