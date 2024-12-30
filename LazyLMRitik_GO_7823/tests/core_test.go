package tests

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
	"github.com/anthropics/anthropic-sdk-go"
	"github.com/your-username/lazy_lm/core"
)

func TestLazyEvaluation(t *testing.T) {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		t.Fatalf("Error loading .env file: %v", err)
	}

	// Initialize Anthropic client
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		t.Fatal("ANTHROPIC_API_KEY environment variable not set")
	}
	client := anthropic.NewClient(apiKey)

	// Test problem
	problem := "Explain the concept of lazy evaluation in programming."

	// Initialize LazyEvaluationClient
	lazy := core.Lazy(client, problem)

	// Test GetCurrentStep
	currentStep := lazy.GetCurrentStep()
	if currentStep == "" {
		t.Error("Expected non-empty current step")
	}

	// Test GetNextStep
	nextStep, err := lazy.GetNextStep()
	if err != nil {
		t.Errorf("Error getting next step: %v", err)
	}
	if nextStep == "" {
		t.Error("Expected non-empty next step")
	}

	// Test AskQuestion
	question := "How does lazy evaluation differ from eager evaluation?"
	answer, err := lazy.AskQuestion(question)
	if err != nil {
		t.Errorf("Error asking question: %v", err)
	}
	if answer == "" {
		t.Error("Expected non-empty answer")
	}

	// Add more specific assertions based on expected behavior
}

func TestLazyState(t *testing.T) {
	state := core.NewLazyState("Test problem")

	// Test AddStep
	state.AddStep("Step 1")
	state.AddStep("Step 2")

	// Test GetContext
	context := state.GetContext()
	if len(context) == 0 {
		t.Error("Expected non-empty context")
	}

	// Test Refresh
	state.Refresh()
	refreshedContext := state.GetContext()
	if len(refreshedContext) != 0 {
		t.Error("Expected empty context after refresh")
	}
}

// Add more test functions as needed to cover all aspects of the core functionality