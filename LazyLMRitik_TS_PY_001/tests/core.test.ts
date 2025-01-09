import { AnthropicVertex, Message, MessageParam } from 'anthropic';
import { expect } from 'chai';
import sinon from 'sinon';

// Mock implementation of dotenv
const dotenv = {
  config: () => {}
};

// Implementations from the original code
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

        const messages: MessageParam[] = [
            {
                role: "user",
                content: this.state.getContext()
            }
        ];

        const response: Message = await this.client.messages.create({
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

// Mock AnthropicVertex
class MockAnthropicVertex implements AnthropicVertex {
    messages = {
        create: async (params: any): Promise<Message> => {
            return {
                id: 'mock-message-id',
                type: 'message',
                role: 'assistant',
                content: [{ type: 'text', text: 'Mock response' }],
                model: params.model,
                stop_reason: null,
                stop_sequence: null,
                usage: { input_tokens: 10, output_tokens: 20 }
            };
        }
    };

    lazy(problem: string): LazyEvaluationClient {
        const state = new LazyStateClass(problem);
        const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
        return new LazyEvaluationClient(llm, 100, state);
    }
}

// Test suite
describe('LazyEvaluationClient', () => {
    let client: LazyEvaluationClient;
    let mockAnthropicVertex: MockAnthropicVertex;

    beforeEach(() => {
        mockAnthropicVertex = new MockAnthropicVertex();
        const llm: LLM = { client: mockAnthropicVertex, model: "claude-3-5-sonnet@20240620" };
        client = new LazyEvaluationClient(llm);
    });

    it('should initialize a problem', () => {
        client.initializeProblem('Test problem');
        expect(client.getCurrentStep()).to.equal('Test problem');
    });

    it('should get the next step', async () => {
        client.initializeProblem('Test problem');
        const nextStep = await client.getNextStep();
        expect(nextStep).to.equal('Mock response');
    });

    it('should ask a question', async () => {
        client.initializeProblem('Test problem');
        const answer = await client.askQuestion('Test question');
        expect(answer).to.equal('Mock response');
    });

    it('should throw an error when getting current step without initialization', () => {
        expect(() => client.getCurrentStep()).to.throw('Problem is not initialized, call initializeProblem first');
    });

    it('should throw an error when getting next step without initialization', async () => {
        try {
            await client.getNextStep();
        } catch (error) {
            expect(error.message).to.equal('Problem is not initialized, call initializeProblem first');
        }
    });

    it('should throw an error when asking a question without initialization', async () => {
        try {
            await client.askQuestion('Test question');
        } catch (error) {
            expect(error.message).to.equal('Problem is not initialized, call initializeProblem first');
        }
    });
});

describe('LazyStateClass', () => {
    let state: LazyStateClass;

    beforeEach(() => {
        state = new LazyStateClass('Test problem');
    });

    it('should initialize correctly', () => {
        expect(state.problem).to.equal('Test problem');
        expect(state.steps).to.deep.equal(['Test problem']);
        expect(state.currentStep).to.equal(0);
    });

    it('should add a step', () => {
        state.addStep('Step 1');
        expect(state.steps).to.deep.equal(['Test problem', 'Step 1']);
        expect(state.currentStep).to.equal(1);
    });

    it('should get context', () => {
        state.addStep('Step 1');
        expect(state.getContext()).to.equal('Problem: Test problem \n Steps so far: Test problem, Step 1');
    });

    it('should refresh', () => {
        state.addStep('Step 1');
        state.refresh();
        expect(state.steps).to.deep.equal(['Test problem']);
        expect(state.currentStep).to.equal(0);
    });
});

describe('AnthropicVertex.lazy', () => {
    it('should create a LazyEvaluationClient', () => {
        const mockAnthropicVertex = new MockAnthropicVertex();
        const lazyClient = mockAnthropicVertex.lazy('Test problem');
        expect(lazyClient).to.be.instanceOf(LazyEvaluationClient);
    });
});

// Run the tests
import { run } from 'mocha';
run();