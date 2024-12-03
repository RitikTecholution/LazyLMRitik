const { LazyEvaluationClient, LazyState, LLM } = require('../src/lazy_lm/core');
const { AnthropicVertex } = require('@anthropic-ai/sdk');

jest.mock('@anthropic-ai/sdk');

describe('LazyEvaluationClient', () => {
  let client;
  let lazyEvaluationClient;

  beforeEach(() => {
    client = new AnthropicVertex({ apiKey: 'test-api-key' });
    lazyEvaluationClient = new LazyEvaluationClient('test-model', client);
  });

  test('initalize_problem sets the state correctly', () => {
    const problem = 'Solve 2 + 2';
    lazyEvaluationClient.initalize_problem(problem);
    expect(lazyEvaluationClient.state).toBeInstanceOf(LazyState);
    expect(lazyEvaluationClient.state.problem).toBe(problem);
  });

  test('get_current_step returns the current step', () => {
    lazyEvaluationClient.initalize_problem('Solve 2 + 2');
    lazyEvaluationClient.state.add_step('Step 1: Identify the operation');
    expect(lazyEvaluationClient.get_current_step()).toBe('Step 1: Identify the operation');
  });

  test('get_next_step calls the AI model and adds the step', async () => {
    const mockResponse = {
      content: [{ text: 'Step 2: Add the numbers' }],
    };
    client.messages.create.mockResolvedValue(mockResponse);

    lazyEvaluationClient.initalize_problem('Solve 2 + 2');
    await lazyEvaluationClient.get_next_step();

    expect(client.messages.create).toHaveBeenCalled();
    expect(lazyEvaluationClient.state.steps).toContain('Step 2: Add the numbers');
  });

  test('ask_question calls the AI model with the question', async () => {
    const mockResponse = {
      content: [{ text: 'The answer is 4' }],
    };
    client.messages.create.mockResolvedValue(mockResponse);

    lazyEvaluationClient.initalize_problem('Solve 2 + 2');
    const answer = await lazyEvaluationClient.ask_question('What is the final answer?');

    expect(client.messages.create).toHaveBeenCalled();
    expect(answer).toBe('The answer is 4');
  });
});

describe('LazyState', () => {
  test('add_step adds a step and increments current_step', () => {
    const state = new LazyState('Test problem');
    state.add_step('Step 1');
    expect(state.steps).toContain('Step 1');
    expect(state.current_step).toBe(1);
  });

  test('get_context returns the full context', () => {
    const state = new LazyState('Test problem');
    state.add_step('Step 1');
    state.add_step('Step 2');
    const context = state.get_context();
    expect(context).toContain('Test problem');
    expect(context).toContain('Step 1');
    expect(context).toContain('Step 2');
  });

  test('refresh resets steps and current_step', () => {
    const state = new LazyState('Test problem');
    state.add_step('Step 1');
    state.refresh();
    expect(state.steps).toHaveLength(0);
    expect(state.current_step).toBe(0);
  });
});

describe('LLM', () => {
  test('constructor sets client and model correctly', () => {
    const client = new AnthropicVertex({ apiKey: 'test-api-key' });
    const llm = new LLM(client, 'test-model');
    expect(llm.client).toBe(client);
    expect(llm.model).toBe('test-model');
  });
});

describe('AnthropicVertex prototype extension', () => {
  test('lazy method creates a LazyEvaluationClient', () => {
    const client = new AnthropicVertex({ apiKey: 'test-api-key' });
    const lazyClient = client.lazy('test-model');
    expect(lazyClient).toBeInstanceOf(LazyEvaluationClient);
  });
});