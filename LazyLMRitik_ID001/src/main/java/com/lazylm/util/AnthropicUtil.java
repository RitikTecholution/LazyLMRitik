package com.lazylm;

import com.lazylm.core.LazyState;
import com.lazylm.core.LLM;
import com.lazylm.core.LazyEvaluationClient;
import com.lazylm.util.AnthropicUtil;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class Main {
    private static final String LAZY_SYSTEM_PROMPT_FILE = "src/main/resources/lazy_system_prompt.txt";

    public static void main(String[] args) {
        try {
            String lazySystemPrompt = readLazySystemPrompt();
            
            LazyState lazyState = new LazyState();
            LLM llm = new LLM(new AnthropicUtil());
            LazyEvaluationClient lazyEvaluationClient = new LazyEvaluationClient(lazyState, llm);

            // Your main application logic here
            // For example:
            // lazyEvaluationClient.processInput("Your input here");

        } catch (IOException e) {
            System.err.println("Error reading lazy system prompt: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("An unexpected error occurred: " + e.getMessage());
        }
    }

    private static String readLazySystemPrompt() throws IOException {
        return new String(Files.readAllBytes(Paths.get(LAZY_SYSTEM_PROMPT_FILE)));
    }
}