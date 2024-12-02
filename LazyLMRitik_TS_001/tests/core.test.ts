import { config } from 'dotenv';
import { AnthropicVertex, MessageParam, Message } from 'anthropic';
import { dataclass, field } from 'dataclass-decorator';

// Note: fastcore, nbdev, and setuptools don't have direct TypeScript equivalents.
// We'll need to implement or find alternatives for their functionalities.

@dataclass
class LazyState {
    problem: string;
    steps: string[] = field(() => []);
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
        return `Problem: ${this.problem} \n Steps so far: ${this.steps.join(', ')}`;
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

// Extending AnthropicVertex prototype
declare module 'anthropic' {
    interface AnthropicVertex {
        lazy(problem: string): LazyEvaluationClient;
    }
}

AnthropicVertex.prototype.lazy = function(problem: string): LazyEvaluationClient {
    const state = new LazyState(problem);
    const llm = new LLM(this, "claude-3-5-sonnet@20240620");
    return new LazyEvaluationClient(llm, 100, state);
};

export { LazyState, LLM, LazyEvaluationClient, lazySystemPrompt };