import { AnthropicVertex, Message, MessageParam } from 'anthropic';
import { config } from 'dotenv';
import { swagger } from 'swagger-express-ts';

// Mock implementations
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

jest.mock('anthropic', () => ({
  AnthropicVertex: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: 'Mocked response' }],
      }),
    },
  })),
}));

jest.mock('swagger-express-ts', () => ({
  swagger: {
    tags: jest.fn(),
    apiOperation: jest.fn(),
    apiParam: jest.fn(),
    apiResponse: jest.fn(),
  },
}));

// Actual implementations
class LazyState {
  problem: string;
  steps: string[];
  currentStep: number;

  constructor(problem: string) {
    this.problem = problem;
    this.steps = [problem];
    this.currentStep = 0;
  }

  addStep(step: string): void {
    this.steps.push(step);
    this.currentStep++;
  }

  getContext(): string {
    return `Problem: ${this.problem} \n Steps so far: ${this.steps}`;
  }

  refresh(): void {
    this.currentStep = 0;
    this.steps = [this.problem];
  }
}

class LLM {
  client: AnthropicVertex;
  model: string;

  constructor(client: AnthropicVertex, model: string) {
    this.client = client;
    this.model = model;
  }
}

const lazySystemP = `
You are a helpful assistant that can help with math problems.
You will be given a problem and a list of steps as context, the format will be:
        
PROBLEM: <problem>
STEPS: <steps>

Your job is to complete the next step and only the next step in the problem-solving process. You should never give more than one step.
If you evaluate that the problem is done, respond with "PROBLEM DONE"
`;

class LazyEvaluationClient {
  private model: string;
  private client: AnthropicVertex;
  private maxTokens: number;
  private state: LazyState | null;
  private lazySystemP: string;
  private questionHistory: string[];

  constructor(
    llm: LLM,
    maxTokens: number = 100,
    state: LazyState | null = null,
    lazySystemP: string = lazySystemP
  ) {
    this.model = llm.model;
    this.client = llm.client;
    this.maxTokens = maxTokens;
    this.state = state;
    this.lazySystemP = lazySystemP;
    this.questionHistory = [];
  }

  initalizeProblem(problem: string): void {
    this.state = new LazyState(problem);
  }

  getCurrentStep(): string {
    if (!this.state) {
      throw new Error("Problem is not initialized, call initalizeProblem first");
    }
    return this.state.steps[this.state.currentStep];
  }

  async getNextStep(): Promise<string> {
    if (!this.state) {
      throw new Error("Problem is not initialized, call initalizeProblem first");
    }

    const messages: MessageParam[] = [
      {
        role: "user",
        content: this.state.getContext()
      }
    ];

    const response: Message = await this.client.messages.create({
      system: this.lazySystemP,
      model: this.model,
      messages: messages,
      max_tokens: this.maxTokens
    });

    const nextStep = response.content[0].text;
    if (nextStep) {
      this.state.addStep(nextStep.trim());
      return nextStep.trim();
    } else {
      throw new Error("No next step found");
    }
  }

  async askQuestion(question: string): Promise<string> {
    if (!this.state) {
      throw new Error("Problem is not initialized, call initalizeProblem first");
    }

    const currentState = `
      System: ${this.lazySystemP}
      Problem: ${this.state.problem}
      Context: ${this.state.getContext()}
      Current step: ${this.state.steps[this.state.currentStep]}
    `;

    const prompt = `
      Question History: ${this.questionHistory}
      Question: ${question}
      Please answer the question without advancing to the next step.
      If you are asked to provide an example for a specific step, please provide an example that is not in the current context.
    `;

    const messages: MessageParam[] = [
      {
        role: "user",
        content: prompt
      }
    ];

    const response: Message = await this.client.messages.create({
      system: currentState,
      model: this.model,
      messages: messages,
      max_tokens: this.maxTokens
    });

    const answer = response.content[0].text.trim();
    this.questionHistory.push(question);
    this.questionHistory.push(answer);

    return answer;
  }
}

AnthropicVertex.prototype.lazy = function(problem: string): LazyEvaluationClient {
  const state = new LazyState(problem);
  const llm = new LLM(this, "claude-3-5-sonnet@20240620");
  return new LazyEvaluationClient(llm, 100, state);
};

// Tests
describe('LazyEvaluationClient', () => {
  let client: LazyEvaluationClient;
  let anthropicClient: AnthropicVertex;

  beforeEach(() => {
    anthropicClient = new AnthropicVertex();
    client = anthropicClient.lazy('What is 2 + 2?');
  });

  test('initalizeProblem initializes the state', () => {
    client.initalizeProblem('What is 3 + 3?');
    expect(client['state']?.problem).toBe('What is 3 + 3?');
  });

  test('getCurrentStep returns the current step', () => {
    expect(client.getCurrentStep()).toBe('What is 2 + 2?');
  });

  test('getNextStep adds a new step', async () => {
    const nextStep = await client.getNextStep();
    expect(nextStep).toBe('Mocked response');
    expect(client['state']?.steps.length).toBe(2);
  });

  test('askQuestion adds to question history', async () => {
    const answer = await client.askQuestion('Can you explain the problem?');
    expect(answer).toBe('Mocked response');
    expect(client['questionHistory'].length).toBe(2);
  });
});

describe('LazyState', () => {
  let state: LazyState;

  beforeEach(() => {
    state = new LazyState('Test problem');
  });

  test('constructor initializes correctly', () => {
    expect(state.problem).toBe('Test problem');
    expect(state.steps).toEqual(['Test problem']);
    expect(state.currentStep).toBe(0);
  });

  test('addStep adds a step and increments currentStep', () => {
    state.addStep('Step 1');
    expect(state.steps).toEqual(['Test problem', 'Step 1']);
    expect(state.currentStep).toBe(1);
  });

  test('getContext returns correct context', () => {
    state.addStep('Step 1');
    expect(state.getContext()).toBe('Problem: Test problem \n Steps so far: Test problem,Step 1');
  });

  test('refresh resets steps and currentStep', () => {
    state.addStep('Step 1');
    state.refresh();
    expect(state.steps).toEqual(['Test problem']);
    expect(state.currentStep).toBe(0);
  });
});

// Run the tests
const runTests = async () => {
  const testResults = await new Promise((resolve) => {
    const results: any = {};
    const oldConsoleLog = console.log;
    console.log = (message: string) => {
      results[message] = (results[message] || 0) + 1;
    };

    describe('All Tests', () => {
      afterAll(() => {
        console.log = oldConsoleLog;
        resolve(results);
      });
    });

    require('jest-cli/build/cli').run();
  });

  console.log('Test Results:', testResults);
};

runTests();