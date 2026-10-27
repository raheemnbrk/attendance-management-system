Build the backend foundation for an employee attendance app. For now, implement ONLY the User table and the AUTH feature (login, refresh, logout). Do not build attendance, registration, leave requests, or anything else.

STACK (use exactly these packages)
Runtime and language
- Node.js (v20+), TypeScript, Express

Database
- PostgreSQL with Prisma (prisma + @prisma/client)

Auth and security
- bcrypt for password hashing
- jsonwebtoken for access and refresh tokens
- helmet for security headers
- cors for cross-origin requests (the admin website and the mobile app will call this API)
- Node's built-in crypto module for SHA-256 hashing of refresh tokens (no extra package)

Validation and config
- zod for request and env validation
- dotenv for environment variables

Logging
- morgan for HTTP request logging (dev format)

Dev tooling
- tsx for running TypeScript, using "tsx watch" for the dev server (this replaces nodemon and ts-node, so do NOT install nodemon or ts-node)
- Type packages: @types/node, @types/express, @types/bcrypt, @types/jsonwebtoken, @types/cors, @types/morgan

