# CI/CD Pipeline

## Overview

This repository uses GitHub Actions for automated code quality checks. The pipeline runs on every push and pull request to `main` and `develop` branches.

## What Gets Checked

### Backend Quality Checks
- ✅ **TypeScript Build** - Ensures code compiles without errors
- ✅ **Tests** - Runs Jest test suite with MongoDB
- ⏱️ **Duration**: ~2-3 minutes

### Frontend Quality Checks
- ✅ **ESLint** - Checks code style and potential issues
- ✅ **TypeScript Build** - Ensures code compiles without errors
- ⏱️ **Duration**: ~1-2 minutes

## Workflow File

Location: `.github/workflows/code-quality.yml`

## When It Runs

- **Push** to `main` or `develop` branches
- **Pull Requests** targeting `main` or `develop` branches

## What It Does NOT Do

- ❌ No deployment
- ❌ No code formatting (Prettier not configured)
- ❌ No security scanning
- ❌ No performance testing
- ❌ No Docker builds

## Local Testing

Before pushing, you can run the same checks locally:

### Backend
```bash
cd backend
npm ci
npm run build    # TypeScript build check
npm test         # Run tests
```

### Frontend
```bash
cd frontend
npm ci
npm run lint     # ESLint check
npm run build    # TypeScript build check
```

## Requirements

- Node.js 18+
- MongoDB 6+ (for backend tests)
- npm (package manager)

## Troubleshooting

### Backend Tests Fail
- Ensure MongoDB service is running
- Check environment variables in workflow
- Verify test files are not broken

### Frontend Build Fails
- Check TypeScript errors
- Verify all dependencies are installed
- Check for missing environment variables

### ESLint Fails
- Run `npm run lint` locally to see errors
- Fix linting issues before pushing
- Consider adding `.eslintignore` if needed

## Future Enhancements

Potential additions (not currently implemented):
- Code coverage reporting
- Prettier formatting checks
- Security vulnerability scanning
- Performance benchmarks
- Docker image building
- Automated dependency updates

## Status Badge

Add this to your README.md to show build status:

```markdown
![Code Quality](https://github.com/darshankparmar/multi-country-visa-evaluator/actions/workflows/code-quality.yml/badge.svg)
```
