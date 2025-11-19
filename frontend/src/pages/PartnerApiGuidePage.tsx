import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const PartnerApiGuidePage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Partner API Guide</h1>
          <p className="text-lg text-gray-600">
            Complete documentation for integrating with the Multi-Country Visa Evaluation API
          </p>
        </div>

        {/* Dashboard Link */}
        <div className="mb-8">
          <Link
            to="/partner-dashboard"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Go to Partner Dashboard
          </Link>
        </div>

        {/* Table of Contents */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 lg:top-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
          <nav className="space-y-2">
            <a 
              href="#authentication" 
              className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              1. Authentication
            </a>
            <a 
              href="#endpoints" 
              className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              2. API Endpoints
            </a>
            <a 
              href="#structured-response" 
              className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              3. Understanding Structured Responses
            </a>
            <a 
              href="#rate-limits" 
              className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              4. Rate Limits
            </a>
            <a 
              href="#errors" 
              className="block text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              5. Error Handling
            </a>
          </nav>
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          {/* Authentication Section */}
          <div id="authentication" className="scroll-mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Authentication</h2>
              
              <p className="text-gray-700 mb-4">
                All partner API requests require authentication using an API key. Include your API key in the request header to access protected endpoints.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">How to Authenticate</h3>
              <p className="text-gray-700 mb-3">
                Include your API key in the <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">x-api-key</code> header with every request:
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                <pre className="text-green-400 text-sm font-mono">
                  <code>{`curl -H "x-api-key: your-api-key-here" \\
     https://api.example.com/api/evaluations`}</code>
                </pre>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">Need an API Key?</p>
                <p className="text-blue-800">
                  Contact our support team at <a href="mailto:darshanparmar.dev@gmail.com" className="underline hover:text-blue-600">darshanparmar.dev@gmail.com</a> to request partner access and receive your API key.
                </p>
              </div>
            </div>
          </div>
          
          {/* Endpoints Section */}
          <div id="endpoints" className="scroll-mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2. API Endpoints</h2>
              
              {/* POST /api/evaluations */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-semibold text-sm">POST</span>
                  <code className="text-lg font-mono text-gray-900">/api/evaluations</code>
                </div>
                <p className="text-gray-700 mb-4">Submit a new visa evaluation request</p>
                
                <h4 className="font-semibold text-gray-900 mb-2">Request Example:</h4>
                <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    <code>{`curl -X POST https://api.example.com/api/evaluations \\
  -H "x-api-key: your-api-key-here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "country": "United States",
    "visaType": "O-1A"
  }'`}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Request Body:</h4>
                <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "name": "John Doe",
  "email": "john@example.com",
  "country": "United States",
  "visaType": "O-1A",
  "documents": [/* file uploads */]
}`}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Response (200 OK):</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "status": "success",
  "data": {
    "evaluationId": "eval_123abc",
    "score": 78,
    "summary": "Strong application with good qualifications...",
    "recommendations": [
      "Include additional evidence of achievements",
      "Provide more detailed work history"
    ],
    "conclusion": "Good chance of approval with recommended improvements",
    "criteriaAnalysis": [
      {
        "name": "Education Requirement",
        "rating": "STRONG",
        "evidence": ["Bachelor's degree in Computer Science"],
        "gaps": [],
        "isCritical": true
      }
    ],
    "prioritizedRecommendations": [
      {
        "priority": "HIGH",
        "text": "Include additional evidence of achievements",
        "relatedCriterion": "Experience"
      }
    ],
    "scoreBreakdown": {
      "baseScore": 78,
      "penalties": [],
      "totalPenalty": 0,
      "adjustedScore": 78
    },
    "approvalLikelihood": "Good"
  }
}`}</code>
                  </pre>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                  <p className="font-semibold text-blue-900 mb-2">📊 Structured Response Fields</p>
                  <p className="text-blue-800 mb-2">
                    For visa types with specific criteria (e.g., H-1B, Critical Skills), the response includes detailed structured data:
                  </p>
                  <ul className="list-disc list-inside text-blue-800 space-y-1 ml-2">
                    <li><strong>criteriaAnalysis</strong>: Detailed breakdown of each requirement with evidence and gaps</li>
                    <li><strong>prioritizedRecommendations</strong>: Actions sorted by urgency (CRITICAL, HIGH, MEDIUM, LOW)</li>
                    <li><strong>scoreBreakdown</strong>: Transparent score calculation with penalties</li>
                    <li><strong>approvalLikelihood</strong>: Realistic assessment (Strong, Good, Moderate, Low, Not Viable)</li>
                  </ul>
                </div>
              </div>

              {/* GET /api/evaluations */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">GET</span>
                  <code className="text-lg font-mono text-gray-900">/api/evaluations</code>
                </div>
                <p className="text-gray-700 mb-4">Retrieve all evaluations for your partner account</p>
                
                <h4 className="font-semibold text-gray-900 mb-2">Request Example:</h4>
                <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    <code>{`curl -X GET https://api.example.com/api/evaluations \\
  -H "x-api-key: your-api-key-here"`}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Response (200 OK):</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "status": "success",
  "data": {
    "evaluations": [
      {
        "evaluationId": "eval_123abc",
        "name": "John Doe",
        "email": "john@example.com",
        "country": "United States",
        "visaType": "O-1A",
        "score": 78,
        "createdAt": "2025-11-18T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}`}</code>
                  </pre>
                </div>
              </div>

              {/* GET /api/visa-types */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold text-sm">GET</span>
                  <code className="text-lg font-mono text-gray-900">/api/visa-types</code>
                </div>
                <p className="text-gray-700 mb-4">Get list of all available visa types and required documents</p>
                
                <h4 className="font-semibold text-gray-900 mb-2">Request Example:</h4>
                <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
                    <code>{`curl -X GET https://api.example.com/api/visa-types`}</code>
                  </pre>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">Response (200 OK):</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "status": "success",
  "data": [
    {
      "country": "United States",
      "visaTypes": ["O-1A", "O-1B", "H-1B", "EB-1A"],
      "requiredDocuments": [
        "resume",
        "personal_statement",
        "recommendation_letters"
      ]
    },
    {
      "country": "Ireland",
      "visaTypes": ["Critical Skills", "General Employment"],
      "requiredDocuments": ["resume", "job_offer"]
    }
  ]
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Response Section */}
          <div id="structured-response" className="scroll-mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Understanding Structured Responses</h2>
              
              <p className="text-gray-700 mb-4">
                For visa types with specific criteria configured (e.g., H-1B Visa, Critical Skills Employment Permit), 
                the API returns detailed structured data that provides transparency into the evaluation process.
              </p>

              {/* Criteria Analysis */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Criteria Analysis</h3>
                <p className="text-gray-700 mb-3">
                  Each requirement is analyzed individually with a rating, evidence, and gaps:
                </p>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-3 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "name": "Salary Requirement",
  "rating": "GOOD",
  "evidence": [
    "Employment contract shows $75,000 annual salary",
    "Exceeds prevailing wage for Software Engineer"
  ],
  "gaps": [],
  "recommendation": null,
  "isCritical": true
}`}</code>
                  </pre>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Rating Values:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold mr-2">STRONG</span>
                      <span className="text-gray-700">Requirement exceeded expectations</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold mr-2">GOOD</span>
                      <span className="text-gray-700">Requirement fully met</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mr-2">MODERATE</span>
                      <span className="text-gray-700">Requirement partially met</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold mr-2">WEAK</span>
                      <span className="text-gray-700">Requirement not adequately met</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mr-2">CRITICAL_GAP</span>
                      <span className="text-gray-700">Critical requirement missing (significantly impacts approval)</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Prioritized Recommendations */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Prioritized Recommendations</h3>
                <p className="text-gray-700 mb-3">
                  Recommendations are sorted by urgency to help applicants focus on the most important actions:
                </p>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-3 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "priority": "CRITICAL",
  "text": "Obtain certified LCA from employer - MANDATORY for H-1B",
  "relatedCriterion": "LCA"
}`}</code>
                  </pre>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Priority Levels:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mr-2">CRITICAL</span>
                      <span className="text-gray-700">Must be addressed for visa approval (e.g., missing LCA for H-1B)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold mr-2">HIGH</span>
                      <span className="text-gray-700">Important gaps that significantly impact approval chances</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mr-2">MEDIUM</span>
                      <span className="text-gray-700">Recommended improvements to strengthen application</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold mr-2">LOW</span>
                      <span className="text-gray-700">Optional enhancements</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Score Breakdown</h3>
                <p className="text-gray-700 mb-3">
                  Transparent score calculation showing how the final score was determined:
                </p>
                
                <div className="bg-gray-900 rounded-lg p-4 mb-3 overflow-x-auto">
                  <pre className="text-yellow-300 text-sm font-mono">
                    <code>{`{
  "baseScore": 65,
  "penalties": [
    {
      "requirement": "lca",
      "points": 40,
      "reason": "Required information not found in documents"
    },
    {
      "requirement": "sponsor",
      "points": 35,
      "reason": "Required information not found in documents"
    }
  ],
  "totalPenalty": 60,
  "adjustedScore": 5,
  "breakdown": [
    {
      "criterion": "Education Requirement",
      "points": 35,
      "maxPoints": 35,
      "percentage": 100
    }
  ]
}`}</code>
                  </pre>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                  <p className="font-semibold text-yellow-900 mb-1">Penalty System</p>
                  <p className="text-yellow-800">
                    Missing critical requirements result in significant point deductions. For example, 
                    H-1B applications without an LCA receive a 40-point penalty, and missing employer 
                    sponsorship results in a 35-point penalty. The maximum total penalty is capped at 60 points.
                  </p>
                </div>
              </div>

              {/* Approval Likelihood */}
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Approval Likelihood</h3>
                <p className="text-gray-700 mb-3">
                  A realistic assessment based on the score and critical requirements met:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold mr-2">Strong</span>
                      <span className="text-gray-700">80-100 score, all critical requirements met</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold mr-2">Good</span>
                      <span className="text-gray-700">60-79 score, all critical requirements met</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mr-2">Moderate</span>
                      <span className="text-gray-700">40-59 score, or one critical requirement missing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold mr-2">Needs Improvement</span>
                      <span className="text-gray-700">20-39 score</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold mr-2">Low</span>
                      <span className="text-gray-700">0-19 score</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold mr-2">Not Viable</span>
                      <span className="text-gray-700">Multiple critical requirements missing</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Example H-1B Response */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="font-semibold text-blue-900 mb-2">💡 Example: H-1B Visa Evaluation</p>
                <p className="text-blue-800 mb-2">
                  When evaluating an H-1B application, the system checks for:
                </p>
                <ul className="list-disc list-inside text-blue-800 space-y-1 ml-2">
                  <li><strong>Education</strong>: Bachelor's degree or equivalent</li>
                  <li><strong>LCA</strong>: Certified Labor Condition Application (CRITICAL - 40 point penalty if missing)</li>
                  <li><strong>Sponsor</strong>: U.S. employer sponsorship (CRITICAL - 35 point penalty if missing)</li>
                  <li><strong>Salary</strong>: Meets prevailing wage (CRITICAL - 30 point penalty if below threshold)</li>
                </ul>
                <p className="text-blue-800 mt-2">
                  An application missing both LCA and sponsor would receive a 60-point penalty (capped), 
                  resulting in a very low score and "Not Viable" approval likelihood.
                </p>
              </div>
            </div>
          </div>
          
          {/* Rate Limits Section */}
          <div id="rate-limits" className="scroll-mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Rate Limits</h2>
              
              <p className="text-gray-700 mb-4">
                To ensure fair usage and system stability, API requests are rate limited based on your API key.
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Endpoint Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Limit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Window
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        General API Requests
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        1000 requests
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        per hour per API key
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Evaluation Submissions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        50 submissions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        per hour per API key
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Rate Limit Headers</h3>
              <p className="text-gray-700 mb-3">
                Every API response includes headers that provide information about your current rate limit status:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-900">X-RateLimit-Limit</code>
                  <p className="text-gray-700 mt-1 ml-4">Maximum number of requests allowed in the current window</p>
                </div>
                <div>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-900">X-RateLimit-Remaining</code>
                  <p className="text-gray-700 mt-1 ml-4">Number of requests remaining in the current window</p>
                </div>
                <div>
                  <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-gray-900">X-RateLimit-Reset</code>
                  <p className="text-gray-700 mt-1 ml-4">Timestamp when the rate limit window resets (ISO 8601 format)</p>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-4">
                <p className="font-semibold text-yellow-900 mb-1">Rate Limit Exceeded</p>
                <p className="text-yellow-800">
                  When you exceed the rate limit, you'll receive a <code className="bg-yellow-100 px-1 rounded">429 Too Many Requests</code> response. 
                  Check the <code className="bg-yellow-100 px-1 rounded">Retry-After</code> header to know when you can retry.
                </p>
              </div>
            </div>
          </div>
          
          {/* Errors Section */}
          <div id="errors" className="scroll-mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Error Handling</h2>
              
              <p className="text-gray-700 mb-4">
                The API uses standard HTTP status codes to indicate the success or failure of requests.
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">200</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Success - Request completed successfully
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-semibold">400</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Bad Request - Invalid parameters or missing required fields
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">401</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Unauthorized - Invalid or missing API key
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-semibold">429</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Too Many Requests - Rate limit exceeded
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">500</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Internal Server Error - Something went wrong on our end
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Response Format</h3>
              <p className="text-gray-700 mb-3">
                All error responses follow a consistent JSON format:
              </p>

              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-yellow-300 text-sm font-mono">
                  <code>{`{
  "status": "error",
  "message": "Invalid API key",
  "code": "UNAUTHORIZED"
}`}</code>
                </pre>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mt-4">
                <p className="font-semibold text-red-900 mb-1">Best Practices</p>
                <ul className="list-disc list-inside text-red-800 space-y-1">
                  <li>Always check the HTTP status code before processing the response</li>
                  <li>Implement exponential backoff for rate limit errors (429)</li>
                  <li>Log error responses for debugging and monitoring</li>
                  <li>Handle network errors and timeouts gracefully</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
            aria-label="Scroll to top"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 10l7-7m0 0l7 7m-7-7v18" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default PartnerApiGuidePage
