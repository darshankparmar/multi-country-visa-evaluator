# Requirements Summary

This document provides a concise overview of the 10 core requirements for the Multi-Country Visa Evaluation Tool backend system.

## Overview

The Backend_API_System is a Node.js Express server that processes visa evaluation requests, manages data storage, and provides REST API endpoints for visa applicants and immigration law partners.

---

## Requirement 1: Visa Application Submission

**User Story:** As a visa applicant, I want to submit my information and documents for evaluation, so that I can assess my likelihood of obtaining a specific visa.

**Summary:** The system must accept and validate visa evaluation submissions including user information (name, email), visa details (country, visa type), and document uploads. All required fields must be validated, and documents must match the required document types for the selected visa.

**Key Acceptance Criteria:**
- Validate all required fields (name, email, country, visa type, documents)
- Verify documents match required document types for selected visa
- Return HTTP 400 with specific validation errors if invalid
- Store uploaded documents with unique identifiers
- Create Visa_Evaluation record in MongoDB upon successful validation

---

## Requirement 2: Evaluation Score and Summary Generation

**User Story:** As a visa applicant, I want to receive an evaluation score and summary, so that I can understand my visa approval chances.

**Summary:** The system must generate an evaluation score (0-100) with a configurable success cap and provide a text summary explaining the reasoning and suggestions for improvement.

**Key Acceptance Criteria:**
- Generate Evaluation_Score between 0 and 100
- Apply configured Success_Cap to ensure no score exceeds maximum threshold
- Generate text summary with reasoning and suggestions
- Return HTTP 200 response with score, summary, and evaluation ID
- Update Visa_Evaluation record with final score and summary

---

## Requirement 3: Multi-Country Visa Type Configuration

**User Story:** As a system administrator, I want to configure multiple countries and visa types, so that the system can support diverse visa evaluation scenarios.

**Summary:** The system must provide endpoints to retrieve available countries and visa types, load configurations from the database, and seed initial data for at least 6 countries and 10 visa types.

**Key Acceptance Criteria:**
- Provide GET endpoint returning all available countries and visa types
- Return JSON array with country names, visa category names, and required document types
- Load Visa_Type_Configuration from MongoDB or configuration file
- Seed database on startup with 6+ countries and 10+ visa types (Ireland, Poland, France, Netherlands, Germany, United States)
- Support adding new visa type configurations through administrative API

---

## Requirement 4: Partner API Integration

**User Story:** As an immigration law partner, I want to access evaluations submitted through my integration, so that I can follow up with potential clients.

**Summary:** The system must authenticate partners using API keys, associate evaluations with partners, and provide filtered access to partner-specific evaluation data.

**Key Acceptance Criteria:**
- Authenticate partners using valid Partner_API_Key in x-api-key header
- Return HTTP 401 if x-api-key header is missing or invalid
- Return only Visa_Evaluation records associated with partner's API key
- Associate evaluations with Partner_API_Key when provided in request header
- Provide GET endpoint with paginated evaluation results filtered by Partner_API_Key

---

## Requirement 5: Email Notification System

**User Story:** As a visa applicant, I want to receive evaluation results via email, so that I can review them later.

**Summary:** The system must send email notifications with evaluation results when enabled, including score, summary, and a link to view full results. Email failures should be logged but not block the evaluation response.

**Key Acceptance Criteria:**
- Send email to user's provided address when email notification is enabled
- Include Evaluation_Score, summary, and link to view full results in email
- Log error but still return evaluation results if email sending fails
- Use environment configuration to enable/disable email notifications
- Use SMTP settings from environment variables when email is configured

---

## Requirement 6: Data Persistence and Storage

**User Story:** As a system administrator, I want all evaluation data persisted, so that we can analyze trends and maintain records.

**Summary:** The system must connect to MongoDB on startup, store all evaluation data with proper indexing, and provide fallback to local JSON file storage if database connection fails.

**Key Acceptance Criteria:**
- Connect to MongoDB_Database on startup using connection string from environment
- Store complete evaluation data (user info, visa details, documents, timestamps, scores, partner association)
- Generate unique identifier for each Visa_Evaluation
- Create database indexes on email, Partner_API_Key, and timestamp fields
- Fall back to local JSON file storage if MongoDB connection fails

---

## Requirement 7: Configurable Evaluation Logic

**User Story:** As a developer, I want the evaluation logic to be configurable, so that we can use rule-based or AI-powered scoring.

**Summary:** The system must implement a pluggable evaluation service interface supporting multiple implementations (rule-based and AI-powered), with configuration through environment variables and automatic success cap application.

**Key Acceptance Criteria:**
- Implement AI_Evaluation_Service interface accepting documents and visa type as input
- Support multiple implementations (rule-based and external API-based evaluators)
- Read API credentials from environment variables when using external AI API
- Configure which AI_Evaluation_Service implementation to use via environment variables
- Reduce score to Success_Cap value when AI_Evaluation_Service generates score above cap

---

## Requirement 8: Error Handling and Logging

**User Story:** As a system administrator, I want proper error handling and logging, so that I can troubleshoot issues and monitor system health.

**Summary:** The system must implement comprehensive error logging with context, return appropriate HTTP status codes with user-friendly messages, log all requests, and enforce request timeout limits.

**Key Acceptance Criteria:**
- Log all errors with timestamp, request ID, and stack trace
- Return appropriate HTTP status codes and user-friendly error messages
- Log all incoming requests with method, path, and response status code
- Implement 30-second request timeout limits for evaluation endpoints
- Return HTTP 408 timeout error if request exceeds timeout limit

---

## Requirement 9: REST API Conventions

**User Story:** As a developer, I want the API to follow REST conventions, so that it is easy to integrate and maintain.

**Summary:** The system must implement standard REST practices including CORS support, JSON parsing with size limits, consistent response structures, proper HTTP status codes, and API documentation.

**Key Acceptance Criteria:**
- Implement CORS middleware allowing cross-origin requests from configured frontend domains
- Parse JSON request bodies with 10MB maximum size limit
- Return consistent JSON response structures with status, data, and error fields
- Implement proper HTTP status codes (200/201 for success, 400/401/404 for client errors, 500 for server errors)
- Provide API documentation through GET endpoint returning OpenAPI specification

---

## Requirement 10: Partner API Key Management

**User Story:** As a system administrator, I want to manage partner API keys, so that I can onboard new immigration law firms.

**Summary:** The system must provide administrative endpoints to create, list, activate, and deactivate partner API keys with cryptographically secure key generation.

**Key Acceptance Criteria:**
- Provide POST endpoint to create Partner_API_Key entries with partner name and contact information
- Generate cryptographically secure random key when creating Partner_API_Key
- Store Partner_API_Key entries in MongoDB with creation timestamp and active status
- Provide endpoints to list, activate, and deactivate Partner_API_Key entries
- Return HTTP 401 unauthorized error when deactivated Partner_API_Key is used

---

## Reference

For design and architecture details, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
