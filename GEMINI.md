# Owlbear Gradient Codebase Overview

This document provides an overview of the Owlbear Gradient codebase for future Gemini invocations.

## Project Structure

The project is a Typescript application using Vite for bundling. It's an extension for Owlbear Rodeo.

### Key Directories

*   `src`: Contains the main source code for the extension.
    *   `background`: The background script for the extension, which is a common pattern for browser extensions. The entry point is `src/background/background.html`.
    *   `popoverSettings`: Contains the code for the settings popover, which is built with React and Material UI. The entry point is `src/popoverSettings/popoverSettings.html`.
    *   `tool`: Contains the core logic for the gradient tool itself.
*   `assets`: Contains static assets like icons and CSS.
*   `public`: Contains public assets that are not processed by Vite.
*   `docs`: Contains documentation for the project.
*   `scripts`: Contains build scripts.
*   `test`: Contains test files.
*   `worker`: Contains a Cloudflare worker.

### Key Files

*   `vite.config.ts`: The configuration file for Vite. It defines the entry points for the build process.
*   `package.json`: Defines the project's dependencies and scripts.
*   `wrangler.jsonc`: The configuration file for the Cloudflare worker.
*   `tsconfig.json`: The base Typescript configuration.
*   `eslint.config.js`: The ESLint configuration.

## Development

The main development scripts are:

*   `pnpm dev`: Starts the development server.
*   `pnpm build`: Builds the extension for production.
*   `pnpm test`: Runs the tests using Vitest.
*   `pnpm lint`: Lints the code using ESLint.

## How it Works

The extension has two main parts:

1.  A background script (`src/background`) that communicates with Owlbear Rodeo.
2.  A settings popover (`src/popoverSettings`) built with React, and Material UI  for state management. This is where users configure the gradient.

The core gradient logic is in the `src/tool` directory. The `install.ts` file likely handles the initial setup of the extension within Owlbear Rodeo.
