# LazyLMRitik

LazyLMRitik is a TypeScript project that implements a lazy evaluation system for solving math problems using the Anthropic AI model.

## Table of Contents

1. [Installation](#installation)
2. [Setup](#setup)
3. [Usage](#usage)
4. [Project Structure](#project-structure)
5. [Dependencies](#dependencies)
6. [License](#license)

## Installation

To install the project, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/your-username/LazyLMRitik_TS_PY_001.git
   cd LazyLMRitik_TS_PY_001
   ```

2. Install the dependencies:
   ```
   npm install
   ```

## Setup

1. Create a `.env` file in the root directory of the project.
2. Add your Anthropic API key to the `.env` file:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Usage

To use the LazyLMRitik project:

1. Import the necessary modules in your TypeScript file:
   ```typescript
   import { LazyEvaluationClient } from './src/core';
   ```

2. Initialize the LazyEvaluationClient:
   ```typescript
   const client = new LazyEvaluationClient({
     apiKey: process.env.ANTHROPIC_API_KEY,
     // Add other configuration options as needed
   });
   ```

3. Use the client to solve math problems:
   ```typescript
   async function solveProblem() {
     await client.initializeProblem("Solve the equation: 2x + 3 = 11");
     let currentStep = await client.getCurrentStep();
     console.log("Current step:", currentStep);

     while (currentStep !== "DONE") {
       const nextStep = await client.getNextStep();
       console.log("Next step:", nextStep);
       currentStep = await client.getCurrentStep();
     }

     const solution = await client.askQuestion("What is the final answer?");
     console.log("Solution:", solution);
   }

   solveProblem();
   ```

## Project Structure

The project structure is as follows:

```
LazyLMRitik_TS_PY_001/
├── src/
│   ├── index.ts
│   └── core.ts
├── tests/
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

- `src/index.ts`: Exports the version of the package.
- `src/core.ts`: Contains the main implementation of the lazy evaluation system.
- `tests/`: Directory for test files (to be implemented).
- `.env`: Contains environment variables (not tracked in git).
- `package.json`: Defines the project dependencies and scripts.
- `tsconfig.json`: TypeScript compiler configuration.
- `README.md`: This file, containing project documentation.

## Dependencies

The project has the following dependencies:

- `dotenv`: ^16.0.3
- `anthropic`: ^0.4.3

Dev dependencies:
- `@types/node`: ^14.14.31
- `typescript`: ^4.2.3

To install these dependencies, run:
```
npm install
```

## License

This project is licensed under the Apache License, Version 2.0. See the [LICENSE](LICENSE) file for details.