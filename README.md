# Multi-Country Visa Evaluator

![Code Quality](https://github.com/darshankparmar/multi-country-visa-evaluator/actions/workflows/code-quality.yml/badge.svg)

A lightweight full-stack system that collects visa applicant data, validates required documents, generates a transparent 0–100 eligibility score with explanations, stores results, and provides optional partner API access for multi-country visa evaluation.

## 🚀 Quick Start

- **Backend**: See [README.md](backend/README.md)
- **Frontend**: See [README.md](frontend/README.md)
- **CI/CD**: See [README.md](.github/README.md)

## 📋 Project Structure

```
├── backend/          # Node.js + Express API
├── frontend/         # React + TypeScript UI
└── .github/          # CI/CD workflows
```

## 🏗️ Technology Stack

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- OpenAI API
- Jest for testing

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS
- Vite
- React Router

## 📚 Documentation

- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [API Documentation](backend/docs/API.md)
- [CI/CD Pipeline](.github/README.md)
- [Architecture Guide](backend/docs/ARCHITECTURE.md)

## 🔧 Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend lint
cd frontend
npm run lint
```

## 📝 License

ISC
