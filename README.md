# Multi-Country Visa Evaluator

![Code Quality](https://github.com/darshankparmar/multi-country-visa-evaluator/actions/workflows/code-quality.yml/badge.svg)

A production-ready full-stack system that collects visa applicant data, validates required documents, generates AI-powered or rule-based eligibility scores (0–100) with detailed explanations, stores results in MongoDB, and provides comprehensive partner API access with analytics dashboard for multi-country visa evaluation.

## 🌐 Live Demo

**Application**: https://multi-country-visa-evaluator.vercel.app

Try the live application to:
- ✅ Submit visa evaluations for 6 countries
- ✅ View instant AI-powered results with recommendations
- ✅ Search previous evaluations by ID
- ✅ Explore partner API documentation
- ✅ Access partner dashboard (requires API key)

## ✨ Key Features

- 🌍 **Multi-Country Support**: 6 countries, 13 visa types (Ireland, Poland, France, Netherlands, Germany, USA)
- 🤖 **AI-Powered Evaluation**: OpenAI GPT-4 integration with document content analysis
- 📊 **Partner Dashboard**: Full-featured analytics dashboard with charts, filters, and CSV export
- 🔐 **Secure API**: API key authentication with rate limiting
- 📧 **Email Notifications**: Automated result delivery with HTML templates
- 📄 **Document Parsing**: Extract and analyze text from PDF, DOCX, and TXT files
- 🎯 **Weighted Scoring**: 5-category evaluation system with configurable weights
- 🚀 **Production-Ready**: Comprehensive error handling, logging, and monitoring

## 🚀 Quick Start

### Try Live Demo
Visit **https://multi-country-visa-evaluator.vercel.app** to try the application immediately.

### Local Development
- **Backend**: See [README.md](backend/README.md)
- **Frontend**: See [README.md](frontend/README.md)
- **CI/CD**: See [CI_CD.md](.github/CI_CD.md)

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

### Getting Started
- [Backend Setup & API Guide](backend/README.md) - Complete backend documentation
- [Frontend Setup Guide](frontend/README.md) - Frontend installation and development
- [📸 Application Screenshots](docs/SCREENSHOTS.md) - Visual walkthrough of all features

### Technical Documentation
- [API Documentation](backend/docs/API.md) - REST API endpoints with examples
- [Architecture Guide](backend/docs/ARCHITECTURE.md) - System design and data flow
- [AI Evaluation Guide](backend/docs/AI_EVALUATION_GUIDE.md) - AI features and configuration
- [Partner API Key Guide](backend/docs/PARTNER_API_KEY_GUIDE.md) - Partner onboarding
- [Deployment Guide](backend/docs/DEPLOYMENT.md) - Production deployment
- [Future Enhancements](backend/docs/FUTURE_ENHANCEMENTS.md) - Roadmap and planned features
- [CI/CD Pipeline](.github/CI_CD.md) - Automated workflows

## 🔧 Development

### Prerequisites
- Node.js 18+
- MongoDB 6+
- OpenAI API Key (for AI evaluation)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed  # Seed database with visa types
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with API URL
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
