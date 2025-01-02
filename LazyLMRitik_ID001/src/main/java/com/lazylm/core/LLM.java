package com.lazylm.core;

import com.anthropic.sdk.AnthropicVertex;

/**
 * Represents a Language Model with its associated client and model name.
 */
public class LLM {
    private AnthropicVertex client;
    private String model;

    /**
     * Constructs a new LLM instance.
     *
     * @param client The AnthropicVertex client to be used for API calls.
     * @param model The name of the language model to be used.
     */
    public LLM(AnthropicVertex client, String model) {
        this.client = client;
        this.model = model;
    }

    /**
     * Gets the AnthropicVertex client.
     *
     * @return The AnthropicVertex client.
     */
    public AnthropicVertex getClient() {
        return client;
    }

    /**
     * Sets the AnthropicVertex client.
     *
     * @param client The AnthropicVertex client to be set.
     */
    public void setClient(AnthropicVertex client) {
        this.client = client;
    }

    /**
     * Gets the model name.
     *
     * @return The model name.
     */
    public String getModel() {
        return model;
    }

    /**
     * Sets the model name.
     *
     * @param model The model name to be set.
     */
    public void setModel(String model) {
        this.model = model;
    }
}