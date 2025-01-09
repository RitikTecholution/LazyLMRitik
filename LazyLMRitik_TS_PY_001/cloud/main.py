import os
from typing import Dict, Any
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LazyState:
    def __init__(self):
        self.problem: str = ""
        self.steps: list = []
        self.current_step: int = 0
        self.is_complete: bool = False

class LazyEvaluationClient:
    def __init__(self, api_key: str):
        self.anthropic = Anthropic(api_key=api_key)
        self.state = LazyState()

    def initialize_problem(self, problem: str) -> Dict[str, Any]:
        self.state = LazyState()
        self.state.problem = problem
        return {
            "problem": self.state.problem,
            "current_step": self.state.current_step,
            "is_complete": self.state.is_complete
        }

    def get_current_step(self) -> Dict[str, Any]:
        if not self.state.problem:
            raise ValueError("Problem not initialized")
        return {
            "current_step": self.state.current_step,
            "step_content": self.state.steps[self.state.current_step] if self.state.steps else None,
            "is_complete": self.state.is_complete
        }

    async def get_next_step(self) -> Dict[str, Any]:
        if not self.state.problem:
            raise ValueError("Problem not initialized")
        if self.state.is_complete:
            return {"message": "Problem solving is complete", "is_complete": True}

        prompt = f"{HUMAN_PROMPT}Solve this step-by-step: {self.state.problem}\nCurrent step: {self.state.current_step + 1}{AI_PROMPT}"
        response = await self.anthropic.completions.create(
            model="claude-v1",
            prompt=prompt,
            max_tokens_to_sample=300
        )
        
        next_step = response.completion.strip()
        self.state.steps.append(next_step)
        self.state.current_step += 1
        
        if "final answer" in next_step.lower() or "solution complete" in next_step.lower():
            self.state.is_complete = True

        return {
            "step_number": self.state.current_step,
            "step_content": next_step,
            "is_complete": self.state.is_complete
        }

    async def ask_question(self, question: str) -> Dict[str, str]:
        if not self.state.problem:
            raise ValueError("Problem not initialized")

        context = f"Problem: {self.state.problem}\n"
        context += "Steps taken:\n"
        for i, step in enumerate(self.state.steps):
            context += f"Step {i+1}: {step}\n"

        prompt = f"{HUMAN_PROMPT}{context}\nQuestion: {question}{AI_PROMPT}"
        response = await self.anthropic.completions.create(
            model="claude-v1",
            prompt=prompt,
            max_tokens_to_sample=200
        )
        
        return {"answer": response.completion.strip()}

def main():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not found in environment variables")

    client = LazyEvaluationClient(api_key)
    print("LazyEvaluationClient initialized successfully")

if __name__ == "__main__":
    main()