# Spec-Driven Development (SDD) - Agent Methodology 2026

## Objective
Establish a high-standard, automated development environment in VS Code using AI agents for the "Red Social NovaGob" project.

## Core Requirements
1.  **Strict Methodology**: All complex tasks must follow a "Plan-First" approach (Plan Mode).
2.  **Configuration**:
    -   `agent.md`: Define identity, tech stack, and rules.
    -   `requirements.md`: Used for Spec-Driven Development (SDD) of each feature.
3.  **Tech Stack Integration**:
    -   **Frontend**: React, TypeScript, Vite.
    -   **Backend/Database**: Supabase (PostgreSQL).
    -   **Styling**: Modern, premium CSS/Tailwind (as seen in existing code).
4.  **Database Precision**:
    -   Utilize MCP (Model Context Protocol) to sync with Supabase schema.
    -   Zero-hallucination policy for database tables and columns.
5.  **Quality Assurance**:
    -   Automated Unit and Integration Testing for all new logic.
    -   CI/CD via GitHub Actions.
    -   AI-driven Security Reviews.

## Specific Social Network Tasks
-   Table relationships management.
-   Awarding "Novas" (points/rewards system).
-   **Daily Login Bonus**: Automated reward for consecutive daily logins.
-   **Login & Security Enhancement**:
    -   Secrets Management: Zero hardcoded keys in the codebase.
    -   Auth Best Practices: Rely on Supabase Auth session persistence instead of storing passwords in `localStorage`.
    -   Encryption: Use strong, rotated secret keys for any sensitive data encryption.

## Quality Standards (Verification)
-   **Test Coverage**: Minimum 80% coverage for business logic and services.
-   **Unit Testing**: Mandatory for utilities (e.g., encryption) and hooks.
-   **Integration Testing**: End-to-end login flow verification.
-   **Security Audit**: Automated scanning for hardcoded secrets and vulnerable dependencies.

## Security Rules
-   Always check RLS (Row Level Security) policies in Supabase.
-   Environment variables must be handled via `.env` (never hardcoded).
-   Validate all user inputs on both frontend and database level.
