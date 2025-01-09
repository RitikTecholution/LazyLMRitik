import { Configuration, AnthropicApi } from 'anthropic';
import dotenv from 'dotenv';

dotenv.config();

// Ensure the API key is set in the environment variables
if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set in the environment variables');
}

// Configuration for the Anthropic API
const configuration = new Configuration({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create an instance of the Anthropic API
const anthropicApi = new AnthropicApi(configuration);

/**
 * Service class for interacting with the Anthropic API
 */
export class AnthropicService {
    /**
     * Send a prompt to the Anthropic API and get a response
     * @param prompt The prompt to send to the API
     * @returns The response from the API
     */
    public async getCompletion(prompt: string): Promise<string> {
        try {
            const response = await anthropicApi.completions.create({
                model: 'claude-2', // Using Claude 2 model, adjust as needed
                prompt: prompt,
                max_tokens_to_sample: 1000,
                temperature: 0.7,
            });

            return response.completion;
        } catch (error) {
            console.error('Error calling Anthropic API:', error);
            throw new Error('Failed to get completion from Anthropic API');
        }
    }

    /**
     * Initialize a problem-solving session with the Anthropic API
     * @param problem The problem description
     * @returns The initial response from the API
     */
    public async initializeProblem(problem: string): Promise<string> {
        const prompt = `You are a problem-solving assistant. Please analyze the following problem and provide an initial approach: ${problem}`;
        return this.getCompletion(prompt);
    }

    /**
     * Get the next step in problem-solving from the Anthropic API
     * @param currentState The current state of the problem-solving process
     * @returns The next step suggested by the API
     */
    public async getNextStep(currentState: string): Promise<string> {
        const prompt = `Given the current state of the problem: ${currentState}, what should be the next step?`;
        return this.getCompletion(prompt);
    }

    /**
     * Ask a specific question related to the problem-solving process
     * @param question The question to ask
     * @param context The context of the problem-solving process
     * @returns The answer from the API
     */
    public async askQuestion(question: string, context: string): Promise<string> {
        const prompt = `In the context of this problem-solving process: ${context}, please answer the following question: ${question}`;
        return this.getCompletion(prompt);
    }
}

// Export a singleton instance of the AnthropicService
export const anthropicService = new AnthropicService();