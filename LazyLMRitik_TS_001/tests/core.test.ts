import { describe, expect, test, jest } from '@jest/globals';
import { AnthropicVertex } from 'anthropic';
import { LazyEvaluationClient, LazyState, LLM } from '../src/lazy_lm/core';

jest.mock('anthropic');

describe('LazyEvaluationClient', () => {
  let mockLLM: LLM;
  let lazyClient: LazyEvaluationClient;
  let mockState: LazyState;

  beforeEach(() => {
    mockLLM = {
      client: new AnthropicVertex({ apiKey: 'test-key' }),
      model: 'test-model',
    };
    mockState = new LazyState('Test problem');
    lazyClient = new LazyEvaluationClient(mockLLM, 100, mockState, 'Test system prompt');
  });

  test('initializeProblem sets the problem correctly', () => {
    lazyClient.initializeProblem('New problem');
    expect(lazyClient.getCurrentStep()).toBe('New problem');
  });

  test('getCurrentStep returns the current step', () => {
    expect(lazyClient.getCurrentStep()).toBe('Test problem');
  });

  test('getNextStep calls the LLM client and updates the state', async () => {
    const mockResponse = { completion: 'Next step' };
    mockLLM.client.completions.create = jest.fn().mockResolvedValue(mockResponse);

    const nextStep = await lazyClient.getNextStep();

    expect(nextStep).toBe('Next step');
    expect(mockLLM.client.completions.create).toHaveBeenCalled();
  });

  test('askQuestion calls the LLM client without updating the state', async () => {
    const mockResponse = { completion: 'Answer to question' };
    mockLLM.client.completions.create = jest.fn().mockResolvedValue(mockResponse);

    const answer = await lazyClient.askQuestion('Test question');

    expect(answer).toBe('Answer to question');
    expect(mockLLM.client.completions.create).toHaveBeenCalled();
  });
});

describe('LazyState', () => {
  test('addStep adds a step to the state', () => {
    const state = new LazyState('Initial problem');
    state.addStep('Step 1');
    expect(state.getContext()).toContain('Step 1');
  });

  test('refresh clears all steps except the initial problem', () => {
    const state = new LazyState('Initial problem');
    state.addStep('Step 1');
    state.addStep('Step 2');
    state.refresh();
    expect(state.getContext()).toBe('Initial problem');
  });
});