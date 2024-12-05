import { strict as assert } from 'assert';

// Mock implementations
const config = () => {};

class AnthropicVertex {
    messages = {
        create: async ({ system, model, messages, max_tokens }: any) => {
            return {
                content: [{ text: "Mocked response" }]
            };
        }
    };
}

const swagger = {
    tags: () => (target: any) => target,
    apiOperation: (options: any) => (target: any, key: string, descriptor: PropertyDescriptor) => descriptor,
    apiParam: (options: any) => (target: any, key: string, descriptor: PropertyDescriptor) => descriptor,
    apiResponse: (options: any) => (target: any, key: string, descriptor: PropertyDescriptor) => descriptor,
};

function dataclass(constructor: Function) {
    return constructor;
}

function field(defaultValueFunc: () => any) {
    return (target: any, key: string) => {
        const value = defaultValueFunc();
        Object.defineProperty(target, key, {
            get: () => value,
            set: (newValue) => { value = newValue; },
            enumerable: true,
            configurable: true,
        });
    };
}

// Actual implementations
@dataclass
class LazyState {
    problem: string;
    @field(() => [])
    steps: string[];
    currentStep: number = 0;

    constructor(problem: string) {
        this.problem = problem;
        this.steps.push(problem);
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

@dataclass
class LLM {
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

@swagger.tags('LazyEvaluationClient')
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

    @swagger.apiOperation({ summary: 'Initialize a new problem' })
    @swagger.apiParam({ name: 'problem', description: 'The problem to initialize', required: true, type: 'string' })
    initalizeProblem(problem: string): void {
        this.state = new LazyState(problem);
    }

    @swagger.apiOperation({ summary: 'Get the current step' })
    @swagger.apiResponse({ status: 200, description: 'The current step', type: 'string' })
    getCurrentStep(): string {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initalizeProblem first");
        }
        return this.state.steps[this.state.currentStep];
    }

    @swagger.apiOperation({ summary: 'Get the next step' })
    @swagger.apiResponse({ status: 200, description: 'The next step', type: 'string' })
    async getNextStep(): Promise<string> {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initalizeProblem first");
        }

        const messages = [
            {
                role: "user",
                content: this.state.getContext()
            }
        ];

        const response = await this.client.messages.create({
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

    @swagger.apiOperation({ summary: 'Ask a question about the current step' })
    @swagger.apiParam({ name: 'question', description: 'The question to ask', required: true, type: 'string' })
    @swagger.apiResponse({ status: 200, description: 'The answer to the question', type: 'string' })
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

// Test suite
describe('LazyState', () => {
    it('should initialize correctly', () => {
        const state = new LazyState('Test problem');
        assert.strictEqual(state.problem, 'Test problem');
        assert.deepStrictEqual(state.steps, ['Test problem']);
        assert.strictEqual(state.currentStep, 0);
    });

    it('should add steps correctly', () => {
        const state = new LazyState('Test problem');
        state.addStep('Step 1');
        assert.deepStrictEqual(state.steps, ['Test problem', 'Step 1']);
        assert.strictEqual(state.currentStep, 1);
    });

    it('should get context correctly', () => {
        const state = new LazyState('Test problem');
        state.addStep('Step 1');
        assert.strictEqual(state.getContext(), 'Problem: Test problem \n Steps so far: Test problem,Step 1');
    });

    it('should refresh correctly', () => {
        const state = new LazyState('Test problem');
        state.addStep('Step 1');
        state.refresh();
        assert.deepStrictEqual(state.steps, ['Test problem']);
        assert.strictEqual(state.currentStep, 0);
    });
});

describe('LazyEvaluationClient', () => {
    let client: LazyEvaluationClient;

    beforeEach(() => {
        const anthropicClient = new AnthropicVertex();
        const llm = new LLM(anthropicClient, 'test-model');
        client = new LazyEvaluationClient(llm);
    });

    it('should initialize problem correctly', () => {
        client.initalizeProblem('Test problem');
        assert.strictEqual(client['state']!.problem, 'Test problem');
    });

    it('should get current step correctly', () => {
        client.initalizeProblem('Test problem');
        assert.strictEqual(client.getCurrentStep(), 'Test problem');
    });

    it('should get next step correctly', async () => {
        client.initalizeProblem('Test problem');
        const nextStep = await client.getNextStep();
        assert.strictEqual(nextStep, 'Mocked response');
        assert.strictEqual(client['state']!.steps.length, 2);
    });

    it('should ask question correctly', async () => {
        client.initalizeProblem('Test problem');
        const answer = await client.askQuestion('Test question');
        assert.strictEqual(answer, 'Mocked response');
        assert.deepStrictEqual(client['questionHistory'], ['Test question', 'Mocked response']);
    });
});

// Run the tests
(async () => {
    try {
        await new Promise(resolve => {
            describe('All Tests', function() {
                after(resolve);
            });
            run();
        });
        console.log('All tests passed!');
    } catch (error) {
        console.error('Test failed:', error);
    }
})();

// Minimal test runner implementation
function describe(name: string, fn: () => void) {
    console.log(`\n${name}`);
    fn();
}

function it(name: string, fn: () => void | Promise<void>) {
    try {
        const result = fn();
        if (result instanceof Promise) {
            result.then(() => console.log(`  ✓ ${name}`))
                  .catch(error => {
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
    (global as any).beforeEachFn = fn;
}

function run() {
    const tests = Object.keys(global).filter(key => key.startsWith('test'));
    tests.forEach(test => {
        if ((global as any).beforeEachFn) (global as any).beforeEachFn();
        (global as any)[test]();
    });
}