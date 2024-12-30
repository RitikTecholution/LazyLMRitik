package lazylm

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/anthropic-ai/anthropic-sdk-go"
)

// LazyState represents the state of the lazy evaluation process
type LazyState struct {
	Problem     string   `json:"problem"`
	Steps       []string `json:"steps"`
	CurrentStep int      `json:"current_step"`
}

// NewLazyState creates a new LazyState instance
func NewLazyState(problem string) *LazyState {
	return &LazyState{
		Problem:     problem,
		Steps:       []string{problem},
		CurrentStep: 0,
	}
}

// AddStep adds a new step to the LazyState
func (ls *LazyState) AddStep(step string) {
	ls.Steps = append(ls.Steps, step)
	ls.CurrentStep++
}

// GetContext returns the current context of the LazyState
func (ls *LazyState) GetContext() string {
	return fmt.Sprintf("Problem: %s \n Steps so far: %v", ls.Problem, ls.Steps)
}

// Refresh resets the LazyState to its initial state
func (ls *LazyState) Refresh() {
	ls.CurrentStep = 0
	ls.Steps = []string{ls.Problem}
}

// LLM represents the language model configuration
type LLM struct {
	Client *anthropic.Client
	Model  string
}

const LazySystemPrompt = `
You are a helpful assistant that can help with math problems.
You will be given a problem and a list of steps as context, the format will be:
		
PROBLEM: <problem>
STEPS: <steps>

Your job is to complete the next step and only the next step in the problem-solving process. You should never give more than one step.
If you evaluate that the problem is done, respond with "PROBLEM DONE"
`

// LazyEvaluationClient represents the main client for lazy evaluation
type LazyEvaluationClient struct {
	LLM             *LLM
	MaxTokens       int
	State           *LazyState
	LazySystemPrompt string
	QuestionHistory []string
}

// NewLazyEvaluationClient creates a new LazyEvaluationClient instance
func NewLazyEvaluationClient(llm *LLM, maxTokens int, state *LazyState) *LazyEvaluationClient {
	return &LazyEvaluationClient{
		LLM:             llm,
		MaxTokens:       maxTokens,
		State:           state,
		LazySystemPrompt: LazySystemPrompt,
		QuestionHistory: []string{},
	}
}

// InitializeProblem initializes a new problem in the LazyEvaluationClient
func (lec *LazyEvaluationClient) InitializeProblem(problem string) {
	lec.State = NewLazyState(problem)
}

// GetCurrentStep returns the current step in the problem-solving process
func (lec *LazyEvaluationClient) GetCurrentStep() string {
	return lec.State.Steps[lec.State.CurrentStep]
}

// GetNextStep generates the next step in the problem-solving process
func (lec *LazyEvaluationClient) GetNextStep() (string, error) {
	if lec.State == nil {
		return "", errors.New("problem is not initialized, call InitializeProblem first")
	}

	messages := []anthropic.Message{
		{
			Role:    anthropic.RoleUser,
			Content: lec.State.GetContext(),
		},
	}

	resp, err := lec.LLM.Client.CreateMessage(anthropic.CreateMessageRequest{
		Model:     lec.LLM.Model,
		Messages:  messages,
		MaxTokens: lec.MaxTokens,
		System:    lec.LazySystemPrompt,
	})

	if err != nil {
		return "", err
	}

	nextStep := strings.TrimSpace(resp.Content[0].Text)
	if nextStep != "" {
		lec.State.AddStep(nextStep)
		return nextStep, nil
	}

	return "", errors.New("no next step found")
}

// AskQuestion allows the user to ask a question about the current step
func (lec *LazyEvaluationClient) AskQuestion(question string) (string, error) {
	currentState := fmt.Sprintf(`
		System: %s
		Problem: %s
		Context: %s
		Current step: %s
	`, lec.LazySystemPrompt, lec.State.Problem, lec.State.GetContext(), lec.State.Steps[lec.State.CurrentStep])

	questionHistory, err := json.Marshal(lec.QuestionHistory)
	if err != nil {
		return "", err
	}

	prompt := fmt.Sprintf(`
		Question History: %s
		Question: %s

		Please answer the question without advancing to the next step.
		If you are asked to provide an example for a specific step, please provide an example that is not in the current context.
	`, string(questionHistory), question)

	messages := []anthropic.Message{
		{
			Role:    anthropic.RoleUser,
			Content: prompt,
		},
	}

	resp, err := lec.LLM.Client.CreateMessage(anthropic.CreateMessageRequest{
		Model:     lec.LLM.Model,
		Messages:  messages,
		MaxTokens: lec.MaxTokens,
		System:    currentState,
	})

	if err != nil {
		return "", err
	}

	answer := strings.TrimSpace(resp.Content[0].Text)
	lec.QuestionHistory = append(lec.QuestionHistory, question, answer)

	return answer, nil
}

// Lazy is the entry point of the LazyLM Framework for the AnthropicVertex client API
func Lazy(client *anthropic.Client, problem string) *LazyEvaluationClient {
	state := NewLazyState(problem)
	llm := &LLM{
		Client: client,
		Model:  "claude-3-5-sonnet@20240620",
	}
	return NewLazyEvaluationClient(llm, 100, state)
}

func init() {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("Error loading .env file:", err)
	}
}