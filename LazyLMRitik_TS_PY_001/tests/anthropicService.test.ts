import { expect } from 'chai';
import { describe, it } from 'mocha';

// Mock implementation of dotenv
const dotenv = {
  config: () => {}
};

// Mock implementation of AnthropicVertex
class AnthropicVertex {
  messages = {
    create: async ({ system, model, messages, max_tokens }: any) => {
      // Mock response based on the input
      if (messages[0].content.includes("Problem: Solve 2 + 2")) {
        return {
          content: [{ text: "Let's add 2 and 2 together." }]
        };
      } else if (messages[0].content.includes("Steps so far: Solve 2 + 2, Let's add 2 and 2 together.")) {
        return {
          content: [{ text: "2 + 2 = 4" }]
        };
      } else if (messages[0].content.includes("Steps so far: Solve 2 + 2, Let's add 2 and 2 together., 2 + 2 = 4")) {
        return {
          content: [{ text: "PROBLEM DONE" }]
        };
      } else if (messages[0].content.includes("Question: Can you explain the first step?")) {
        return {
          content: [{ text: "The first step is to identify the numbers we need to add, which are 2 and 2." }]
        };
      }
      return { content: [{ text: "Mock response" }] };
    }
  };

  lazy(problem: string): LazyEvaluationClient {
    const state = new LazyStateClass(problem);
    const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
    return new LazyEvaluationClient(llm, 100, state);
  }
}

// Interfaces and classes from the original code
interface LazyState {
  problem: string;
  steps: string[];
  currentStep: number;
}

class LazyStateClass implements LazyState {
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
  private state: LazyStateClass | null;
  private lazySystemPrompt: string;
  private questionHistory: string[];

  constructor(
    llm: LLM,
    maxTokens: number = 100,
    state: LazyStateClass | null = null,
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
    this.state = new LazyStateClass(problem);
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

    const messages: any[] = [
      {
        role: "user",
        content: this.state.getContext()
      }
    ];

    const response: any = await this.client.messages.create({
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
      Question History: ${this.questionHistory.join(', ')}
      Question: ${question}
      Please answer the question without advancing to the next step.
      If you are asked to provide an example for a specific step, please provide an example that is not in the current context.
    `;

    const messages: any[] = [
      {
        role: "user",
        content: prompt
      }
    ];

    const response: any = await this.client.messages.create({
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

// Test suite
describe('LazyEvaluationClient', () => {
  let client: LazyEvaluationClient;
  let anthropic: AnthropicVertex;

  beforeEach(() => {
    anthropic = new AnthropicVertex();
    client = anthropic.lazy("Solve 2 + 2");
  });

  it('should initialize a problem', () => {
    expect(client.getCurrentStep()).to.equal("Solve 2 + 2");
  });

  it('should get the next step', async () => {
    const nextStep = await client.getNextStep();
    expect(nextStep).to.equal("Let's add 2 and 2 together.");
  });

  it('should complete all steps', async () => {
    await client.getNextStep(); // First step
    await client.getNextStep(); // Second step
    const finalStep = await client.getNextStep(); // Final step
    expect(finalStep).to.equal("PROBLEM DONE");
  });

  it('should ask a question', async () => {
    const answer = await client.askQuestion("Can you explain the first step?");
    expect(answer).to.equal("The first step is to identify the numbers we need to add, which are 2 and 2.");
  });

  it('should throw an error if problem is not initialized', async () => {
    const uninitializedClient = new LazyEvaluationClient({ client: anthropic, model: "test-model" });
    try {
      await uninitializedClient.getNextStep();
    } catch (error: any) {
      expect(error.message).to.equal("Problem is not initialized, call initializeProblem first");
    }
  });
});