# Project Overview

## Project Components
- Web app handling BTC flow
- Dashboard for management
- Apollo server

## Key Details
- Global eSIM platform
- Working with 3rd party for eSIM bundles
- Collaborative development process with code review

## Development Practices
- Always use graphql-codegen

## Package Management
- Using bun as package manager

## Git Commit Guidelines
When making commits, organize changes by feature and create clean, focused commits:

1. **Stage specific files**: Use `git add <specific-files>` to stage only related changes
2. **Review staged files**: Use `git diff --cached --name-only` to review what will be committed
3. **Commit format**: Use descriptive commit messages with this structure:
   ```
   type: brief description
   
   - Detailed bullet points of what was changed
   - Include file locations for major changes
   - Explain the "why" not just the "what"
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. **Separate concerns**: Create separate commits for different features (e.g., validation flow vs URL state management)
5. **Include context**: Reference relevant documentation or API recommendations when applicable