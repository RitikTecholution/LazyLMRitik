import { config } from 'dotenv';
import { AnthropicVertex, Message, MessageParam } from '@anthropic-ai/sdk';
import { dataclass, field } from 'ts-dataclass';
import swagger from 'swagger-jsdoc';
import express from 'express';

// Load environment variables
config();

/**
 * @swagger
 * components:
 *   schemas:
 *     LazyState:
 *       type: object
 *       properties:
 *         problem: 
 *           type: string
 *         steps: 
 *           type: array
 *           items:
 *             type: string
 *         currentStep: 
 *           type: number
 */
@dataclass
class LazyState {
    problem: string;
    steps: string[] = field(() => []);
    currentStep: number = 0;

    constructor() {
        this.steps.push(this.problem);
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

/**
 * @swagger
 * components:
 *   schemas:
 *     LLM:
 *       type: object
 *       properties:
 *         client: 
 *           $ref: '#/components/schemas/AnthropicVertex'
 *         model: 
 *           type: string
 */
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

/**
 * @swagger
 * components:
 *   schemas:
 *     LazyEvaluationClient:
 *       type: object
 *       properties:
 *         model: 
 *           type: string
 *         client: 
 *           $ref: '#/components/schemas/AnthropicVertex'
 *         maxTokens: 
 *           type: number
 *         state: 
 *           $ref: '#/components/schemas/LazyState'
 *         lazySystemPrompt: 
 *           type: string
 *         questionHistory: 
 *           type: array
 *           items:
 *             type: string
 */
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

    initalizeProblem(problem: string): void {
        this.state = new LazyState();
        this.state.problem = problem;
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

    /**
     * @swagger
     * /ask-question:
     *   post:
     *     summary: Ask a question about the current step
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               question:
     *                 type: string
     *     responses:
     *       200:
     *         description: The model's response to the question
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 answer:
     *                   type: string
     */
    async askQuestion(question: string): Promise<string> {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initalizeProblem first");
        }

        const currentState = `
            System: ${this.lazySystemPrompt}
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

// Extend AnthropicVertex prototype
declare module '@anthropic-ai/sdk' {
    interface AnthropicVertex {
        lazy(problem: string): LazyEvaluationClient;
    }
}

AnthropicVertex.prototype.lazy = function(problem: string): LazyEvaluationClient {
    const state = new LazyState();
    state.problem = problem;
    const llm = new LLM(this, "claude-3-5-sonnet@20240620");
    return new LazyEvaluationClient(llm, 100, state);
};

// Setup Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LazyLM API',
            version: '1.0.0',
            description: 'API for LazyLM Framework',
        },
    },
    apis: ['./src/**/*.ts'],
};

const swaggerSpec = swagger(swaggerOptions);

// Setup Express app
const app = express();
app.use('/api-docs', swagger.serve, swagger.setup(swaggerSpec));

export { LazyState, LLM, LazyEvaluationClient, lazySystemPrompt };