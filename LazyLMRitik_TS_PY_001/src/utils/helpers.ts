import { LazyState } from '../core';

/**
 * Validates the problem statement to ensure it's not empty.
 * @param problem The problem statement to validate.
 * @throws Error if the problem statement is empty.
 */
export function validateProblem(problem: string): void {
  if (!problem || problem.trim().length === 0) {
    throw new Error('Problem statement cannot be empty');
  }
}

/**
 * Formats the current state of the problem-solving process.
 * @param state The current LazyState object.
 * @returns A formatted string representation of the current state.
 */
export function formatState(state: LazyState): string {
  return `
Current Step: ${state.currentStep}
Problem: ${state.problem}
Solution Progress: ${state.solutionSteps.join('\n')}
`;
}

/**
 * Sanitizes user input to prevent potential security issues.
 * @param input The user input to sanitize.
 * @returns A sanitized version of the input.
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML tags and trim whitespace
  return input.replace(/<[^>]*>?/gm, '').trim();
}

/**
 * Generates a unique identifier for each problem-solving session.
 * @returns A string representing a unique session ID.
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Checks if the problem-solving process is complete.
 * @param state The current LazyState object.
 * @returns A boolean indicating whether the problem is solved.
 */
export function isProblemSolved(state: LazyState): boolean {
  // This is a simple implementation. In a real-world scenario,
  // you might want to use more sophisticated logic or AI to determine this.
  return state.solutionSteps.length > 0 && 
         state.solutionSteps[state.solutionSteps.length - 1].toLowerCase().includes('solution:');
}

/**
 * Extracts the final solution from the state's solution steps.
 * @param state The current LazyState object.
 * @returns The final solution as a string, or null if not found.
 */
export function extractSolution(state: LazyState): string | null {
  const solutionStep = state.solutionSteps.find(step => step.toLowerCase().includes('solution:'));
  return solutionStep ? solutionStep.split('Solution:')[1].trim() : null;
}

/**
 * Logs the progress of the problem-solving process.
 * @param message The message to log.
 */
export function logProgress(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Handles errors in the lazy evaluation process.
 * @param error The error object.
 * @throws A custom error with additional context.
 */
export function handleLazyEvaluationError(error: Error): never {
  console.error('Error in lazy evaluation:', error);
  throw new Error(`Lazy evaluation failed: ${error.message}`);
}