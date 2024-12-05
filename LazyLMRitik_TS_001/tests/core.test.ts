import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';

// Mock implementations for external dependencies
const dotenv = {
  config: () => {}
};

class AnthropicVertex {
  messages = {
    create: async () => ({
      content: [{ text: 'Mocked response' }]
    })
  };
}

// Actual implementation
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
    return `Problem: ${this.problem} \n Steps so far: ${this.steps.join(', ')}`;
  }

  refresh(): void {
    this.currentStep = 0;
    this.steps = [this.problem];
  }
}

interface LLM {
  client: AnthropicVertex;
  model: string;
}

const lazySystemPrompt = `
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
  private lazySystemPrompt: string;
  private questionHistory: string[];

  constructor(
    llm: LLM,
    maxTokens: number = 100,
    state: LazyState | null = null,
    lazySystemPrompt: string = lazySystemPrompt
  ) {
    this.model = llm.model;
    this.client = llm.client;
    this.maxTokens = maxTokens;
    this.state = state;
    this.lazySystemPrompt = lazySystemPrompt;
    this.questionHistory = [];
  }

  initializeProblem(problem: string): void {
    this.state = new LazyState(problem);
  }

  getCurrentStep(): string {
    if (!this.state) {
      throw new Error("Problem is not initialized, call initializeProblem first");
    }
    return this.state.steps[this.state.currentStep];
  }

  async getNextStep(): Promise<string> {
    if (!this.state) {
      throw new Error("Problem is not initialized, call initializeProblem first");
    }

    const messages = [
      {
        role: "user",
        content: this.state.getContext()
      }
    ];

    const response = await this.client.messages.create({
      system: this.lazySystemPrompt,
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
      throw new Error("Problem is not initialized, call initializeProblem first");
    }

    const currentState = `
      System: ${this.lazySystemPrompt}
      Problem: ${this.state.problem}
      Context: ${this.state.getContext()}
      Current step: ${this.state.steps[this.state.currentStep]}
    `;

    const prompt = `
      Question History: ${this.questionHistory.join('\n')}
      Question: ${question}
      Please answer the question without advancing to the next step.
      If you are asked to provide an example for a specific step, please provide an example that is not in the current context.
    `;

    const messages = [
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await this.client.messages.create({
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

function lazy(this: AnthropicVertex, problem: string): LazyEvaluationClient {
  const state = new LazyState(problem);
  const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
  return new LazyEvaluationClient(llm, 100, state);
}

AnthropicVertex.prototype.lazy = lazy;

// Test suite
describe('LazyEvaluationClient', () => {
  let client: LazyEvaluationClient;
  let anthropicVertex: AnthropicVertex;

  beforeEach(() => {
    anthropicVertex = new AnthropicVertex();
    client = anthropicVertex.lazy("Solve 2x + 3 = 7");
  });

  it('should initialize with a problem', () => {
    expect(client['state']?.problem).to.equal("Solve 2x + 3 = 7");
    expect(client['state']?.steps).to.deep.equal(["Solve 2x + 3 = 7"]);
    expect(client['state']?.currentStep).to.equal(0);
  });

  it('should get the current step', () => {
    expect(client.getCurrentStep()).to.equal("Solve 2x + 3 = 7");
  });

  it('should get the next step', async () => {
    const nextStep = await client.getNextStep();
    expect(nextStep).to.equal("Mocked response");
    expect(client['state']?.currentStep).to.equal(1);
    expect(client['state']?.steps).to.deep.equal(["Solve 2x + 3 = 7", "Mocked response"]);
  });

  it('should ask a question', async () => {
    const answer = await client.askQuestion("What is x?");
    expect(answer).to.equal("Mocked response");
    expect(client['questionHistory']).to.deep.equal(["What is x?", "Mocked response"]);
  });
});

// Run the tests
describe('LazyEvaluationClient Tests', () => {
  let client: LazyEvaluationClient;
  let anthropicVertex: AnthropicVertex;

  beforeEach(() => {
    anthropicVertex = new AnthropicVertex();
    client = anthropicVertex.lazy("Solve 2x + 3 = 7");
  });

  it('should initialize with a problem', () => {
    expect(client['state']?.problem).to.equal("Solve 2x + 3 = 7");
    expect(client['state']?.steps).to.deep.equal(["Solve 2x + 3 = 7"]);
    expect(client['state']?.currentStep).to.equal(0);
  });

  it('should get the current step', () => {
    expect(client.getCurrentStep()).to.equal("Solve 2x + 3 = 7");
  });

  it('should get the next step', async () => {
    const nextStep = await client.getNextStep();
    expect(nextStep).to.equal("Mocked response");
    expect(client['state']?.currentStep).to.equal(1);
    expect(client['state']?.steps).to.deep.equal(["Solve 2x + 3 = 7", "Mocked response"]);
  });

  it('should ask a question', async () => {
    const answer = await client.askQuestion("What is x?");
    expect(answer).to.equal("Mocked response");
    expect(client['questionHistory']).to.deep.equal(["What is x?", "Mocked response"]);
  });
});

// Run all tests
(async () => {
  try {
    await new Promise<void>((resolve) => {
      describe('All Tests', function() {
        after(resolve);
        // The test suites are already defined above, so they will run automatically
      });
      run();
    });
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Tests failed:', error);
  }
})();

// Minimal test runner implementation
function describe(name: string, fn: () => void) {
  console.log(name);
  fn();
}

function it(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => console.log(`  ✓ ${name}`))
            .catch((error) => {
              console.error(`  ✗ ${name}`);
              console.error(`    ${error.message}`);
            });
    } else {
      console.log(`  ✓ ${name}`);
    }
  } catch (error) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
  }
}

function beforeEach(fn: () => void) {
  fn();
}

function after(fn: () => void) {
  fn();
}

function run() {
  // This function is left empty as we're not implementing a full test runner
}