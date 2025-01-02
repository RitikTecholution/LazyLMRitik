import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LazyEvaluationClientTest {

    @Mock
    private AnthropicVertex mockClient;

    private LazyEvaluationClient lazyEvaluationClient;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        LazyState state = new LazyState("Test problem");
        LLM llm = new LLM(mockClient, "claude-3-5-sonnet@20240620");
        lazyEvaluationClient = new LazyEvaluationClient(llm, 100, state, "Lazy System Prompt");
    }

    @Test
    void testInitializeProblem() {
        lazyEvaluationClient.initializeProblem("New problem");
        assertEquals("New problem", lazyEvaluationClient.getCurrentStep());
    }

    @Test
    void testGetNextStep() {
        Message mockResponse = new Message();
        List<Message.Content> contentList = new ArrayList<>();
        Message.Content content = new Message.Content();
        content.setText("Next step");
        contentList.add(content);
        mockResponse.setContent(contentList);

        when(mockClient.messages().create(anyString(), anyString(), anyList(), anyInt()))
                .thenReturn(mockResponse);

        String nextStep = lazyEvaluationClient.getNextStep();
        assertEquals("Next step", nextStep);
    }

    @Test
    void testAskQuestion() {
        Message mockResponse = new Message();
        List<Message.Content> contentList = new ArrayList<>();
        Message.Content content = new Message.Content();
        content.setText("Answer to the question");
        contentList.add(content);
        mockResponse.setContent(contentList);

        when(mockClient.messages().create(anyString(), anyString(), anyList(), anyInt()))
                .thenReturn(mockResponse);

        String answer = lazyEvaluationClient.askQuestion("Test question");
        assertEquals("Answer to the question", answer);
    }

    // Mock implementations of external dependencies

    static class AnthropicVertex {
        public Messages messages() {
            return new Messages();
        }
    }

    static class Messages {
        public Message create(String system, String model, List<MessageParam> messages, int maxTokens) {
            return new Message();
        }
    }

    static class Message {
        private List<Content> content;

        public List<Content> getContent() {
            return content;
        }

        public void setContent(List<Content> content) {
            this.content = content;
        }

        static class Content {
            private String text;

            public String getText() {
                return text;
            }

            public void setText(String text) {
                this.text = text;
            }
        }
    }

    static class MessageParam {
        private String role;
        private String content;

        public MessageParam(String role, String content) {
            this.role = role;
            this.content = content;
        }
    }

    static class LLM {
        private AnthropicVertex client;
        private String model;

        public LLM(AnthropicVertex client, String model) {
            this.client = client;
            this.model = model;
        }

        public AnthropicVertex getClient() {
            return client;
        }

        public String getModel() {
            return model;
        }
    }

    static class LazyState {
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

        public String getProblem() {
            return problem;
        }

        public List<String> getSteps() {
            return steps;
        }

        public int getCurrentStep() {
            return currentStep;
        }
    }

    static class LazyEvaluationClient {
        private final String model;
        private final AnthropicVertex client;
        private final int maxTokens;
        private LazyState state;
        private final String lazySystemP;
        private final List<String> questionHistory;

        public LazyEvaluationClient(LLM llm, int maxTokens, LazyState state, String lazySystemP) {
            this.model = llm.getModel();
            this.client = llm.getClient();
            this.maxTokens = maxTokens;
            this.state = state;
            this.lazySystemP = lazySystemP;
            this.questionHistory = new ArrayList<>();
        }

        public void initializeProblem(String problem) {
            this.state = new LazyState(problem);
        }

        public String getCurrentStep() {
            return this.state.getSteps().get(this.state.getCurrentStep());
        }

        public String getNextStep() {
            if (this.state == null) {
                throw new IllegalStateException("Problem is not initialized, call initializeProblem first");
            }

            List<MessageParam> messages = new ArrayList<>();
            messages.add(new MessageParam("user", this.state.getContext()));

            Message response = this.client.messages().create(
                this.lazySystemP,
                this.model,
                messages,
                this.maxTokens
            );

            String nextStep = response.getContent().get(0).getText();
            if (nextStep != null) {
                this.state.addStep(nextStep.trim());
                return nextStep.trim();
            } else {
                throw new RuntimeException("No next step found");
            }
        }

        public String askQuestion(String question) {
            String currentState = String.format(
                "System: %s\nProblem: %s\nContext: %s\nCurrent step: %s",
                this.lazySystemP,
                this.state.getProblem(),
                this.state.getContext(),
                this.state.getSteps().get(this.state.getCurrentStep())
            );

            String prompt = String.format(
                "Question History: %s\nQuestion: %s\n" +
                "Please answer the question without advancing to the next step. " +
                "If you are asked to provide an example for a specific step, please provide an example that is not in the current context.",
                this.questionHistory,
                question
            );

            List<MessageParam> messages = new ArrayList<>();
            messages.add(new MessageParam("user", prompt));

            Message response = this.client.messages().create(
                currentState,
                this.model,
                messages,
                this.maxTokens
            );

            String answer = response.getContent().get(0).getText().trim();
            this.questionHistory.add(question);
            this.questionHistory.add(answer);

            return answer;
        }
    }
}