# Contributing to Blueprint Hub

Thank you for your interest in contributing! This document provides guidelines for collaborating on the project.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## How to Contribute

### 1. Report Bugs
- Use the [Bug Report](https://github.com/special_project_v1/issues/new?template=bug_report.md) template
- Be clear and provide reproducible steps
- Include environment details (OS, Node/Python version)

### 2. Request Features
- Use the [Feature Request](https://github.com/special_project_v1/issues/new?template=feature_request.md) template
- Explain the motivation and use cases
- Consider alternatives and tradeoffs

### 3. Submit Code Changes
1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** following [Coding Conventions](#coding-conventions)
4. **Write/update tests** (if applicable)
5. **Run verification**:
   - Frontend: `cd frontend && bun run lint && bun run build`
   - Backend: `cd backend && ruff check . && pytest`
6. **Create a Pull Request** using the [PR Template](.github/PULL_REQUEST_TEMPLATE.md)
7. **Address review feedback** promptly

## Coding Conventions

### Frontend (TypeScript + React)
- Use **functional components** with hooks
- Prefer **const** over let/var
- Use **strict TypeScript** (avoid `any`)
- Component naming: `PascalCase` (e.g., `UserProfile.tsx`)
- Hook naming: `useCamelCase` (e.g., `useLocalStorage`)
- Keep components under **200 lines** (extract to separate files)
- Always define `width` and `height` for Next.js images

### Backend (Python + FastAPI)
- Follow **PEP 8** style guide
- Use **type hints** for all functions
- Document complex logic with docstrings
- Keep functions under **50 lines** (extract helper functions)
- Use **snake_case** for functions and variables
- Model naming: `PascalCase` (e.g., `UserModel`)

### Commit Messages
Follow the **Conventional Commits** format:
```
type(scope): subject

body (optional)
footer (optional)
```

**Types**: feature, fix, docs, style, refactor, perf, test, chore

**Example**:
```
feat(generator): add multi-turn LLM prompting support

- Implements conversational spec generation
- Allows follow-up questions during generation
- Updates ConversationContext model

Closes #123
```

### Documentation
- Update **README.md** for user-facing features
- Update **DEVELOPMENT_PLANS.md** for architectural decisions
- Keep **TODO.md** synchronized with backlog
- Save strategic discussions to `docs/session-notes/` (YYYY-MM-DD-topic.md)

## Review Process

1. **Code Review**: Maintainers review all PRs for quality, style, and correctness
2. **Automated Checks**: CI/CD must pass (linting, tests, builds)
3. **Approval**: At least one maintainer approval required
4. **Merge**: Use "Squash and Merge" for cleaner history

## Development Workflow

### Frontend Development
```bash
cd frontend
bun install
bun run dev
# Navigate to http://localhost:3000
```

### Backend Development
```bash
cd backend
uv sync
python app.py
# API at http://localhost:8000
```

### Database Migrations
```bash
cd frontend
bunx prisma migrate dev --name "your_migration_name"
# Or push schema changes
bunx prisma db push
```

## Questions or Need Help?

- **Issues**: Open a GitHub issue with the appropriate template
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check [docs/](docs/) folder

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Blueprint Hub!** 🙏
