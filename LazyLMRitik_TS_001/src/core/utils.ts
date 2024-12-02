// utils.ts

import { config } from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';
import { Message } from '@anthropic-ai/sdk/dist/resources/messages';
import { MessageParam } from '@anthropic-ai/sdk/dist/resources/messages';

// Note: fastcore, nbdev, and other Python-specific libraries don't have direct TypeScript equivalents.
// We'll need to implement or find alternatives for their functionalities.

config(); // Load environment variables

/**
 * Represents the state of a lazy evaluation process.
 */
class LazyState {
    private problem: string;
    private steps: string[];
    private currentStep: number;

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

/**
 * Represents a Language Model configuration.
 */
interface LLM {
    client: Anthropic;
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

/**
 * Client for lazy evaluation of problems using a language model.
 */
class LazyEvaluationClient {
    private model: string;
    private client: Anthropic;
    private maxTokens: number;
    private state: LazyState | null;
    private lazySystemPrompt: string;
    private questionHistory: string[];

    /**
     * @param llm - The language model to use
     * @param maxTokens - The maximum number of tokens to generate
     * @param state - Optional initial state
     * @param lazySystemPrompt - System prompt for lazy evaluation
     */
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

    /**
     * Initialize a new problem.
     * @param problem - The problem to solve
     */
    initializeProblem(problem: string): void {
        this.state = new LazyState(problem);
    }

    /**
     * Get the current step in the problem-solving process.
     * @returns The current step
     */
    getCurrentStep(): string {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initializeProblem first");
        }
        return this.state.getContext().split('\n').pop() || '';
    }

    /**
     * Get the next step in the problem-solving process.
     * @returns The next step
     */
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

        const response = await this.client.messages.create({
            model: this.model,
            messages: messages,
            max_tokens: this.maxTokens,
            system: this.lazySystemPrompt
        });

        const nextStep = response.content[0].text;
        if (nextStep) {
            this.state.addStep(nextStep.trim());
            return nextStep.trim();
        } else {
            throw new Error("No next step found");
        }
    }

    /**
     * Ask a question about the current step without affecting the model's ability to generate the next step.
     * @param question - The question to ask
     * @returns The model's response to the question
     */
    async askQuestion(question: string): Promise<string> {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initializeProblem first");
        }

        const currentState = `
            System: ${this.lazySystemPrompt}
            Problem: ${this.state.getContext().split('\n')[0]}
            Context: ${this.state.getContext()}
            Current step: ${this.getCurrentStep()}
        `;

        const prompt = `
            Question History: ${this.questionHistory.join('\n')}
            Question: ${question}\n
            Please answer the question without advancing to the next step.
            If you are asked to provide an example for a specific step, please provide an example that is not in the current context.
        `;

        const messages: MessageParam[] = [
            {
                role: "user",
                content: prompt
            }
        ];

        const response = await this.client.messages.create({
            model: this.model,
            messages: messages,
            max_tokens: this.maxTokens,
            system: currentState
        });

        const answer = response.content[0].text.trim();
        this.questionHistory.push(question);
        this.questionHistory.push(answer);

        return answer;
    }
}

/**
 * Entry point of the LazyLM Framework for the Anthropic client API.
 * @param problem - The problem to solve
 * @returns A LazyEvaluationClient instance
 */
function lazy(this: Anthropic, problem: string): LazyEvaluationClient {
    const state = new LazyState(problem);
    const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
    return new LazyEvaluationClient(llm, 100, state);
}

// Extend the Anthropic class with the lazy method
declare module '@anthropic-ai/sdk' {
    interface Anthropic {
        lazy(problem: string): LazyEvaluationClient;
    }
}

Anthropic.prototype.lazy = lazy;

export { LazyState, LLM, LazyEvaluationClient, lazy };