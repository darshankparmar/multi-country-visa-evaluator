// Jest setup file to configure environment variables for tests

// Set required environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/visa-eval-test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASSWORD = 'test-password';
process.env.EMAIL_FROM = 'noreply@test.com';
process.env.EVALUATOR_TYPE = 'ai';
process.env.USE_MOCK_AI = 'true';
process.env.ENABLE_DOCUMENT_PARSING = 'true';
process.env.MAX_DOCUMENT_TEXT_LENGTH = '10000';
process.env.PARSING_TIMEOUT = '30000';
process.env.AI_TEMPERATURE = '0.7';
process.env.AI_MAX_TOKENS = '2000';
process.env.AI_RETRY_ATTEMPTS = '2';
process.env.AI_MODEL = 'gpt-4';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.SUCCESS_CAP = '95';
