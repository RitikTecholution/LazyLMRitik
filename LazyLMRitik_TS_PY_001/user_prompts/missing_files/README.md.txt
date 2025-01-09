
You are tasked with a code generation and conversion task. Below are the details and instructions to ensure the process aligns with the specified requirements:

### Details:

- **Target Language**: ['typescript', 'python'] (e.g., TypeScript)  
- **Technology Stack**: `['Markdown']` (e.g., React, TypeScript)  
- **Target File Path**: `LazyLMRitik_TS_PY_001/README.md`  
- **Code Type**: `documentation`

### Generated Directory Structure:
```

```

### File Summaries:
```
Summary for File (LazyLMRitik_TS_PY_001/src/index.ts): This TypeScript file defines and exports a constant VERSION with the value "0.0.1". This is typically used to specify the version of the package or module. The file doesn't import any other modules or define any functions or classes. It serves as a simple version declaration for the project.
Dependencies: {
    "dependencies": {
        "@types/node": "^14.14.31"
    }
}
Summary for File (LazyLMRitik_TS_PY_001/src/core.ts): This TypeScript file implements a lazy evaluation system for solving math problems using the Anthropic AI model. It imports necessary modules and defines interfaces and classes for managing the problem-solving state and interacting with the AI model. The main components include:

1. LazyState interface and LazyStateClass for managing problem state.
2. LLM interface for the language model configuration.
3. LazyEvaluationClient class for handling the lazy evaluation process, including methods for initializing problems, getting next steps, and asking questions.
4. Extension of AnthropicVertex prototype to include a 'lazy' method for easy initialization of the LazyEvaluationClient.

Key functions: initializeProblem, getCurrentStep, getNextStep, askQuestion. The file uses async/await for asynchronous operations and implements error handling for various scenarios.
Dependencies: {
    "dependencies": {
        "dotenv": "^16.0.3",
        "anthropic": "^0.4.3"
    },
    "devDependencies": {
        "@types/node": "^14.14.31",
        "typescript": "^4.2.3"
    }
}
Summary for File (LazyLMRitik_TS_PY_001/LICENSE): This file contains the full text of the Apache License, Version 2.0. It is a widely used open-source software license that allows users to use, modify, and distribute the licensed software under certain conditions. The license includes definitions of key terms, grants of copyright and patent licenses, conditions for redistribution, and disclaimers of warranty and liability. It also provides instructions on how to apply the license to a work. This license is language-agnostic and can be used for projects in any programming language without modification.
Dependencies: {
    "dependencies": null,
    "Libraries": null,
    "Scripts": null,
    "Others": null
}
```

---

### Role:
You are a **Senior Software Engineer** with 7+ years of experience. Your role is to generate missing files or convert existing ones into the **target language** while ensuring:
    1. Adherence to **organizational coding standards**.
    2. Compatibility with the provided **directory structure** and dependencies.
    3. Alignment with **technology stack best practices**.

---

### Instructions:

#### 1. Analyze the File or Generate Missing File Content:
    - **For empty or missing files**:
        - Use the provided **file summaries**, **directory structure**, and **technology stack** to infer the required logic and generate the file content.
        - Ensure the generated content aligns with the project's overall architecture and dependencies.
        - **For existing files with content**:
        - Examine the code in `LazyLMRitik_TS_PY_001/README.md` and its summary to understand its logic and structure.

#### 2. Ensure Directory Structure Alignment:
    - Align the generated or converted file with the above mentioned directory structure.
    - Update file paths, imports/exports, and dependencies as necessary to maintain logical consistency within the project.

#### 3. Swagger Documentation (if applicable):
    - **For backend API files**:
    - Integrate Swagger documentation, specifying endpoints, data contracts, and responses.

#### 4. Adhere to Coding Standards:
    - Follow the guidelines in `<Coding_Standards>` for the target language (e.g., TypeScript) to produce clean, maintainable, and standard-compliant code.

#### 5. Documentation Generation Rules :
    - If `code_type` is `documentation` ensure that you provide detailed on step on how to setup and start the project in files like `README.md`.
    
#### 6. Output Requirements:
    - Provide the generated file content using the following format:

```converted
<generated_code>
```

```dependencies
{
    "dependencies": [OPTIONAL],
    "Libraries": [OPTIONAL],
    "Scripts": [OPTIONAL],
    "Others": [OPTIONAL]
}
```

#### 6. Documentation:
    - Include inline comments to explain major logic decisions or assumptions.
    - List any new libraries, modules, or dependencies introduced during the file generation.

#### 7. Validation:
    - Ensure the generated code is:
    - Fully functional.
    - Aligned with best practices.
    - Compatible with the given technology stack and directory structure.

#### 8. Glossary & References:
- Refer to the provided Glossary for any unclear terms or specifications.

---

### Notes for Missing Files:

When generating missing files, ensure:
    1. **Use of Target Language**:
        - Implement in ['typescript', 'python']
    
    2. **Technology Stack Integration**:
        - Utilize libraries, patterns, and conventions from `['Markdown']`.
    
    3. **Functional Assumptions**:
        - Base the logic on file summaries, if available.
        - Use placeholders or standard patterns for undefined logic.
    
    4. **Testing and Validation**:
        - Ensure the generated code can integrate seamlessly into the existing codebase.

---

### Output Format:
1. **Converted or Generated Code**:
    - Present the code in a dedicated block using the following format:
    ```
    ```converted
    <converted_code>
    ```
    ```
2. **Dependencies**:
    - Include a structured list of dependencies, libraries, scripts, or other elements:
    ```
    ```dependencies
    {
        "dependencies": [OPTIONAL],
        "Libraries": [OPTIONAL],
        "Scripts": [OPTIONAL],
        "Others": [OPTIONAL]
    }
    ```
    ```
3. **Documentation**:
    - Provide inline comments where appropriate.
    - Document significant changes or assumptions clearly.
