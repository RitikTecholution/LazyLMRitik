import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

public class LazyStateTest {

    private LazyState lazyState;

    @BeforeEach
    void setUp() {
        lazyState = new LazyState("Test Problem");
    }

    @Test
    void testConstructor() {
        assertEquals("Test Problem", lazyState.getProblem());
        assertEquals(1, lazyState.getSteps().size());
        assertEquals("Test Problem", lazyState.getSteps().get(0));
        assertEquals(0, lazyState.getCurrentStep());
    }

    @Test
    void testAddStep() {
        lazyState.addStep("Step 1");
        assertEquals(2, lazyState.getSteps().size());
        assertEquals("Step 1", lazyState.getSteps().get(1));
        assertEquals(1, lazyState.getCurrentStep());
    }

    @Test
    void testGetContext() {
        lazyState.addStep("Step 1");
        lazyState.addStep("Step 2");
        String expectedContext = "Problem: Test Problem \n Steps so far: [Test Problem, Step 1, Step 2]";
        assertEquals(expectedContext, lazyState.getContext());
    }

    @Test
    void testRefresh() {
        lazyState.addStep("Step 1");
        lazyState.addStep("Step 2");
        lazyState.refresh();
        assertEquals(1, lazyState.getSteps().size());
        assertEquals("Test Problem", lazyState.getSteps().get(0));
        assertEquals(0, lazyState.getCurrentStep());
    }

    @Test
    void testSetProblem() {
        lazyState.setProblem("New Problem");
        assertEquals("New Problem", lazyState.getProblem());
    }

    @Test
    void testSetSteps() {
        List<String> newSteps = new ArrayList<>();
        newSteps.add("Step A");
        newSteps.add("Step B");
        lazyState.setSteps(newSteps);
        assertEquals(newSteps, lazyState.getSteps());
    }

    @Test
    void testSetCurrentStep() {
        lazyState.setCurrentStep(5);
        assertEquals(5, lazyState.getCurrentStep());
    }

    // LazyState class implementation
    private static class LazyState {
        private String problem;
        private List<String> steps;
        private int currentStep;

        public LazyState(String problem) {
            this.problem = problem;
            this.steps = new ArrayList<>();
            this.currentStep = 0;
            this.steps.add(problem);
        }

        public void addStep(String step) {
            this.steps.add(step);
            this.currentStep++;
        }

        public String getContext() {
            return String.format("Problem: %s \n Steps so far: %s", this.problem, this.steps);
        }

        public void refresh() {
            this.currentStep = 0;
            this.steps = new ArrayList<>();
            this.steps.add(this.problem);
        }

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
}