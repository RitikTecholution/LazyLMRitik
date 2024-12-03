import { expect } from 'chai';
import { describe, it } from 'mocha';

// Mock implementations for external dependencies
const dotenv = {
  config: () => {}
};

class AnthropicVertex {
  messages = {
    create: async ({ system, model, messages, max_tokens }: any) => ({
      content: [{ text: 'Mocked response' }]
    })
  };
}

const swagger = () => ({});

const express = () => ({
  use: () => {}
});

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
    return `Problem: ${this.problem} \n Steps so far: ${this.steps}`;
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

const lazySystemP = `
You are a helpful assistant that can help with math problems.
You will be given a problem and a list of steps as context, the format will be:
        
PROBLEM: <problem>
STEPS: <steps>

Your job is to complete the next step and only the next step in the problem-solving process. You should never give more than one step.
If you evaluate that the problem is done, respond with "PROBLEM DONE"
`;

class LazyEvaluationClient {
  model: string;
  client: AnthropicVertex;
  maxTokens: number;
  state: LazyState | null;
  lazySystemP: string;
  questionHistory: string[];

  constructor(llm: LLM, maxTokens: number = 100, state: LazyState | null = null, lazySystemP: string = lazySystemP) {
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

    const response = await this.client.messages.create({
      system: this.lazySystemP,
      model: this.model,
      messages: [{ role: "user", content: this.state.getContext() }],
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

    const response = await this.client.messages.create({
      system: this.lazySystemP,
      model: this.model,
      messages: [{ role: "user", content: question }],
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
  const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
  return new LazyEvaluationClient(llm, 100, state);
};

// Test suite
describe('LazyLM', () => {
  let anthropicVertex: AnthropicVertex;
  let lazyEvaluationClient: LazyEvaluationClient;

  beforeEach(() => {
    anthropicVertex = new AnthropicVertex();
    lazyEvaluationClient = anthropicVertex.lazy('Test problem');
  });

  describe('LazyState', () => {
    it('should initialize correctly', () => {
      const state = new LazyState('Test problem');
      expect(state.problem).to.equal('Test problem');
      expect(state.steps).to.deep.equal(['Test problem']);
      expect(state.currentStep).to.equal(0);
    });

    it('should add steps correctly', () => {
      const state = new LazyState('Test problem');
      state.addStep('Step 1');
      expect(state.steps).to.deep.equal(['Test problem', 'Step 1']);
      expect(state.currentStep).to.equal(1);
    });

    it('should get context correctly', () => {
      const state = new LazyState('Test problem');
      state.addStep('Step 1');
      expect(state.getContext()).to.equal('Problem: Test problem \n Steps so far: Test problem,Step 1');
    });

    it('should refresh correctly', () => {
      const state = new LazyState('Test problem');
      state.addStep('Step 1');
      state.refresh();
      expect(state.steps).to.deep.equal(['Test problem']);
      expect(state.currentStep).to.equal(0);
    });
  });

  describe('LazyEvaluationClient', () => {
    it('should initialize problem correctly', () => {
      lazyEvaluationClient.initalizeProblem('New problem');
      expect(lazyEvaluationClient.state?.problem).to.equal('New problem');
    });

    it('should get current step correctly', () => {
      expect(lazyEvaluationClient.getCurrentStep()).to.equal('Test problem');
    });

    it('should get next step correctly', async () => {
      const nextStep = await lazyEvaluationClient.getNextStep();
      expect(nextStep).to.equal('Mocked response');
    });

    it('should ask question correctly', async () => {
      const answer = await lazyEvaluationClient.askQuestion('Test question');
      expect(answer).to.equal('Mocked response');
    });

    it('should throw error if problem is not initialized', () => {
      const client = new LazyEvaluationClient({ client: new AnthropicVertex(), model: 'test' });
      expect(() => client.getCurrentStep()).to.throw('Problem is not initialized, call initalizeProblem first');
    });
  });
});

// Run the tests
describe('Run all tests', () => {
  it('should run without errors', () => {
    // This will run all the tests defined above
  });
});

// If you're running this in a Node.js environment, you can use this to execute the tests:
// if (require.main === module) {
//   run();
// }

// For browser environments, you can use:
// mocha.run();