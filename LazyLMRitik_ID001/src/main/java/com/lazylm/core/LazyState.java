package com.lazylm.core;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents the state of a lazy evaluation problem-solving process.
 */
public class LazyState {
    private String problem;
    private List<String> steps;
    private int currentStep;

    /**
     * Constructs a new LazyState with the given problem.
     *
     * @param problem The problem statement.
     */
    public LazyState(String problem) {
        this.problem = problem;
        this.steps = new ArrayList<>();
        this.currentStep = 0;
        this.steps.add(problem);
    }

    /**
     * Adds a new step to the problem-solving process.
     *
     * @param step The step to be added.
     */
    public void addStep(String step) {
        this.steps.add(step);
        this.currentStep++;
    }

    /**
     * Gets the current context of the problem-solving process.
     *
     * @return A string representation of the problem and steps so far.
     */
    public String getContext() {
        return String.format("Problem: %s \n Steps so far: %s", this.problem, this.steps);
    }

    /**
     * Refreshes the state, resetting it to the initial condition.
     */
    public void refresh() {
        this.currentStep = 0;
        this.steps = new ArrayList<>();
        this.steps.add(this.problem);
    }

    // Getters and setters

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }

    public int getCurrentStep() {
        return currentStep;
    }

    public void setCurrentStep(int currentStep) {
        this.currentStep = currentStep;
    }
}