import dotenv from 'dotenv';
import { AnthropicVertex, Message, MessageParam } from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

dotenv.config();

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

    constructor(llm: LLM, maxTokens: number = 100, state: LazyState | null = null) {
        this.model = llm.model;
        this.client = llm.client;
        this.maxTokens = maxTokens;
        this.state = state;
        this.lazySystemPrompt = lazySystemPrompt;
        this.questionHistory = [];
    }

    /**
     * @swagger
     * /initializeProblem:
     *   post:
     *     summary: Initialize a new problem
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               problem:
     *                 type: string
     *     responses:
     *       200:
     *         description: Problem initialized successfully
     */
    initializeProblem(problem: string): void {
        this.state = new LazyState(problem);
    }

    getCurrentStep(): string {
        if (!this.state) {
            throw new Error("Problem is not initialized, call initializeProblem first");
        }
        return this.state.steps[this.state.currentStep];
    }

    /**
     * @swagger
     * /getNextStep:
     *   get:
     *     summary: Get the next step in problem-solving
     *     responses:
     *       200:
     *         description: Next step retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 nextStep:
     *                   type: string
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
     * /askQuestion:
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
     *         description: Question answered successfully
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

/**
 * @swagger
 * /lazy:
 *   post:
 *     summary: Create a new LazyEvaluationClient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               problem:
 *                 type: string
 *     responses:
 *       200:
 *         description: LazyEvaluationClient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LazyEvaluationClient'
 */
function lazy(this: AnthropicVertex, problem: string): LazyEvaluationClient {
    const state = new LazyState(problem);
    const llm: LLM = { client: this, model: "claude-3-5-sonnet@20240620" };
    return new LazyEvaluationClient(llm, 100, state);
}

// Add the lazy method to AnthropicVertex prototype
AnthropicVertex.prototype.lazy = lazy;

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'LazyLM API',
            version: '1.0.0',
            description: 'API for LazyLM framework',
        },
    },
    apis: ['./src/lazy_lm/core.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export { LazyState, LLM, LazyEvaluationClient, lazy, swaggerSpec };