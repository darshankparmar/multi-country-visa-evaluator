# Multi-Country Visa Evaluation Tool - Frontend

A modern, responsive React application for evaluating visa application eligibility across multiple countries. Built with React 19, TypeScript, Vite, and Tailwind CSS.

## 🌟 Features

- **Multi-Step Form**: Intuitive 4-step evaluation process with progress tracking
- **Multiple Countries**: Support for US, Ireland, Poland, France, Netherlands, and Germany
- **Document Upload**: Drag-and-drop file upload with validation (PDF, DOC, DOCX, JPG, PNG)
- **Real-time Validation**: Instant feedback on form inputs using Zod schemas
- **Instant Results**: Immediate evaluation scores and recommendations
- **Results Search**: Retrieve previous evaluations by ID
- **Partner API Guide**: Comprehensive documentation page for API integration partners
- **Partner Dashboard**: Analytics dashboard for partners to view evaluations and usage statistics
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices (320px - 1920px)
- **Accessible UI**: WCAG-compliant components with keyboard navigation
- **Performance Optimized**: Code splitting, lazy loading, and bundle optimization
- **Error Handling**: User-friendly error messages with retry options

## 🛠️ Technology Stack

### Core
- **React 19.2** - Latest React with improved performance
- **TypeScript 5.9** - Type-safe development
- **Vite 7.2** - Fast build tool and dev server

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Headless UI 2.2** - Accessible UI components
- **Heroicons 2.2** - Beautiful SVG icons
- **@tailwindcss/forms** - Better form styling

### Form Management
- **React Hook Form 7.66** - Performant form handling
- **Zod 4.1** - Type-safe schema validation
- **@hookform/resolvers** - Zod integration for React Hook Form

### Routing & State
- **React Router 7.9** - Client-side routing
- **React Context API** - Global state management

### HTTP & File Upload
- **Axios 1.13** - HTTP client with interceptors
- **React Dropzone 14.3** - Drag-and-drop file uploads

### User Feedback
- **React Hot Toast 2.6** - Toast notifications

### Development Tools
- **ESLint 9** - Code linting
- **TypeScript ESLint 8** - TypeScript-specific linting
- **Rollup Plugin Visualizer** - Bundle size analysis

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher (or yarn/pnpm)
- **Backend API**: Running instance of the visa evaluation backend

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` and configure the API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

## 🏃 Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run build:analyze` - Build and analyze bundle size

## 🔧 Environment Variables

Create a `.env` file in the frontend directory with the following variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` | Yes |
| `VITE_APP_NAME` | Application name | `Country Visa Evaluator` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |
| `VITE_ENABLE_ANALYTICS` | Enable analytics tracking | `false` | No |
| `VITE_ENABLE_ERROR_REPORTING` | Enable error reporting | `false` | No |
| `VITE_DEV_MODE` | Development mode flag | `true` | No |

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the application.

### Partner Features

The application includes two partner-focused pages:

1. **Partner API Guide** (`/partner-api-guide`): Comprehensive API documentation with authentication, endpoints, rate limits, and code examples
2. **Partner Dashboard** (`/partner-dashboard`): Analytics dashboard showing evaluation statistics, usage metrics, and API key management

## 📦 Building for Production

### Create Production Build

```bash
npm run build
```

This will:
1. Run TypeScript compiler to check types
2. Build optimized production bundle
3. Output files to `dist/` directory

### Preview Production Build

```bash
npm run preview
```

Access the preview at `http://localhost:4173`

### Build Output

The production build creates:
- Minified JavaScript bundles with code splitting
- Optimized CSS with Tailwind purging
- Compressed assets
- Source maps for debugging

Typical bundle sizes:
- Main bundle: ~150-200 KB (gzipped)
- Vendor chunks: ~100-150 KB (gzipped)
- Total: ~250-350 KB (gzipped)

## 🚢 Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard:
   - `VITE_API_BASE_URL` - Your production API URL

### Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t visa-eval-frontend .
docker run -p 80:80 visa-eval-frontend
```

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client and service layer
│   │   ├── client.ts           # Axios configuration
│   │   ├── evaluations.ts      # Evaluation endpoints
│   │   ├── visaTypes.ts        # Visa type endpoints
│   │   └── types.ts            # API type definitions
│   ├── components/     # React components
│   │   ├── common/             # Reusable UI components
│   │   ├── evaluation/         # Evaluation form components
│   │   ├── results/            # Results display components
│   │   └── layout/             # Layout components
│   ├── context/        # React Context providers
│   │   ├── EvaluationContext.tsx
│   │   └── AppContext.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── useEvaluation.ts
│   │   ├── useVisaTypes.ts
│   │   └── useFileUpload.ts
│   ├── pages/          # Page components
│   │   ├── HomePage.tsx
│   │   ├── EvaluationPage.tsx
│   │   ├── ResultsPage.tsx
│   │   ├── SearchPage.tsx
│   │   ├── PartnerApiGuidePage.tsx
│   │   ├── PartnerDashboardPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   │   ├── validation.ts       # Zod schemas
│   │   ├── formatters.ts       # Data formatters
│   │   ├── constants.ts        # App constants
│   │   └── helpers.ts          # Helper functions
│   ├── styles/         # Global styles
│   │   └── index.css           # Tailwind imports
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry point
├── .env.example        # Environment variables template
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite configuration
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#3b82f6) - CTAs, links, active states
- **Success**: Green (#10b981) - Success messages, high scores
- **Warning**: Yellow (#f59e0b) - Warnings, moderate scores
- **Error**: Red (#ef4444) - Errors, low scores

### Typography
- **Font Family**: Inter (system fallback)
- **Headings**: Bold (700)
- **Body**: Regular (400)

### Breakpoints
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+

## 🧪 Testing

### Manual Testing Checklist

- [ ] Homepage loads and displays correctly
- [ ] Navigation to evaluation page works
- [ ] Multi-step form navigation (next/back)
- [ ] Form validation on each step
- [ ] File upload with drag-and-drop
- [ ] File upload with file browser
- [ ] File validation (size and type)
- [ ] Form submission
- [ ] Results display
- [ ] Search by evaluation ID
- [ ] Error scenarios (network, validation)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

### Running Tests (if implemented)

```bash
npm run test
```

## 🐛 Troubleshooting

### Development Server Won't Start

**Problem**: Port 5173 is already in use

**Solution**: 
```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3001
```

### API Connection Errors

**Problem**: "Unable to connect to the server"

**Solutions**:
1. Verify backend is running on the correct port
2. Check `VITE_API_BASE_URL` in `.env` file
3. Ensure no CORS issues (backend should allow frontend origin)
4. Check network/firewall settings

### Build Fails with TypeScript Errors

**Problem**: Type errors during build

**Solutions**:
1. Run `npm install` to ensure all dependencies are installed
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript version compatibility
4. Review error messages and fix type issues

### Styles Not Applying

**Problem**: Tailwind classes not working

**Solutions**:
1. Ensure `tailwind.config.js` content paths are correct
2. Verify `src/styles/index.css` imports Tailwind directives
3. Restart dev server after config changes
4. Clear browser cache

### File Upload Not Working

**Problem**: Files not uploading or validation failing

**Solutions**:
1. Check file size (must be under 5MB)
2. Verify file type (PDF, DOC, DOCX, JPG, PNG only)
3. Check browser console for errors
4. Ensure backend accepts multipart/form-data

### Environment Variables Not Loading

**Problem**: `import.meta.env.VITE_*` is undefined

**Solutions**:
1. Ensure variable names start with `VITE_`
2. Restart dev server after changing `.env`
3. Check `.env` file is in the frontend root directory
4. Verify no syntax errors in `.env` file

## 🔒 Security Considerations

- All API requests use HTTPS in production
- File uploads are validated on both client and server
- No sensitive data stored in localStorage
- CORS configured on backend
- Input sanitization via Zod validation
- XSS protection via React's built-in escaping
