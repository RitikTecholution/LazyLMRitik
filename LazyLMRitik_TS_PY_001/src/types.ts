/**
 * types.ts
 * This file contains type definitions and interfaces for the lazy evaluation system.
 */

// Version of the package
export const VERSION: string = "0.0.1";

// Interface for the language model configuration
export interface LLM {
  apiKey: string;
  model: string;
}

// Interface for the problem state
export interface LazyState {
  problem: string;
  currentStep: string;
  solution: string;
  isComplete: boolean;
}

// Type for the initialization options
export type InitializationOptions = {
  problem: string;
  model?: string;
};

// Type for the step options
export type StepOptions = {
  detailed?: boolean;
};

// Type for the question options
export type QuestionOptions = {
  context?: string;
};

// Interface for the LazyEvaluationClient
export interface ILazyEvaluationClient {
  initializeProblem(options: InitializationOptions): Promise<LazyState>;
  getCurrentStep(): Promise<string>;
  getNextStep(options?: StepOptions): Promise<LazyState>;
  askQuestion(question: string, options?: QuestionOptions): Promise<string>;
}

// Type for error responses
export type ErrorResponse = {
  message: string;
  code: string;
};

// Enum for error codes
export enum ErrorCode {
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
  STEP_ERROR = "STEP_ERROR",
  QUESTION_ERROR = "QUESTION_ERROR",
  API_ERROR = "API_ERROR",
}