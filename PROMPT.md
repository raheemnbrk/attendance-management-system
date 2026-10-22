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

FOLDER STRUCTURE (follow exactly)
backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts                  (only file at the src root: loads env, starts the server)
│   ├── features/
│   │   └── user/
│   │       ├── user.routes.ts
│   │       ├── user.controller.ts
│   │       ├── user.service.ts
│   │       └── user.schema.ts    (zod validation)
│   └── shared/
│       ├── app.ts                (creates the Express app, middleware, mounts routes)
│       ├── config/env.ts         (reads and validates env variables)
│       ├── lib/prisma.ts         (single PrismaClient instance)
│       ├── middleware/
│       │   ├── error.middleware.ts
│       │   └── validate.middleware.ts
│       └── utils/
│           ├── jwt.ts
│           ├── password.ts
│           ├── async-handler.ts
│           └── app-error.ts      (custom error class with status code)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json

PRISMA MODELS
enum Role { ADMIN EMPLOYEE }

model User {
  id            String         @id @default(cuid())
  name          String
  email         String         @unique
  passwordHash  String
  role          Role           @default(EMPLOYEE)
  department    String?
  isActive      Boolean        @default(true)
  refreshTokens RefreshToken[]
  createdAt     DateTime       @default(now())
}

model RefreshToken {
  id         String    @id @default(cuid())
  tokenHash  String    @unique        // SHA-256 hash of the token, never store the raw token
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())

  @@index([userId])
}

TOKEN DESIGN
- Access token: JWT signed with JWT_ACCESS_SECRET, payload { id, role }, expires in 15 minutes
- Refresh token: JWT signed with a DIFFERENT secret (JWT_REFRESH_SECRET), payload { id }, expires in 7 days
- Only the SHA-256 hash of the refresh token is stored in the RefreshToken table
- Both tokens are returned in the JSON body (the mobile app cannot rely on cookies)
- Refresh uses ROTATION: every refresh revokes the old token and issues a new access + refresh pair
- If a revoked refresh token is used again, revoke ALL refresh tokens of that user (token reuse detection)

ENDPOINTS
1. POST /api/users/login
   - Body: { email, password }, validated with zod (valid email, password min 8 chars)
   - Find user by email. If not found or password mismatch -> 401 "Invalid email or password" (same message for both)
   - If isActive is false -> 403 "Account is deactivated"
   - Create access + refresh tokens, save the refresh token hash
   - Response: { success: true, data: { accessToken, refreshToken, user } } (user WITHOUT passwordHash)

2. POST /api/users/refresh
   - Body: { refreshToken }
   - Verify signature and expiry, find the hash in the DB, check it is not revoked or expired
   - Check the user still exists and isActive
   - Rotate: revoke the old token, issue a new pair
   - Response: { success: true, data: { accessToken, refreshToken } }
   - Invalid, expired or revoked token -> 401 "Invalid refresh token"

3. POST /api/users/logout
   - Body: { refreshToken }
   - Revoke that refresh token (succeed silently even if it is unknown)
   - Response: { success: true }

ARCHITECTURE RULES
- Routes only define paths and attach middleware, then call the controller
- Controllers only handle req/res and call the service (no business logic, no Prisma)
- Services contain the business logic and all Prisma calls
- Errors are thrown as AppError and handled in one central error middleware
- Use the asyncHandler wrapper so there is no try/catch repetition in controllers

ENVIRONMENT VARIABLES (validated with zod in shared/config/env.ts)
DATABASE_URL, PORT, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
- Create .env.example with placeholder values only
- Create the real .env with:
  SEED_ADMIN_EMAIL=dicou930@gmail.com
  SEED_ADMIN_PASSWORD=12121212
  (plus generated random secrets for the two JWT variables)
- .env MUST be listed in .gitignore and MUST NOT be committed

SEED
- prisma/seed.ts reads SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from the env (never hardcode the credentials in code)
- Creates one ADMIN user (name "Admin") with that email and password, hashed with bcrypt
- Also creates one EMPLOYEE user (employee@example.com, password Employee123!)
- Use upsert so running the seed twice does not fail
- Add "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json

SCRIPTS
- dev (tsx watch), build, start

GIT
Run `git init` first, add a proper .gitignore (node_modules, dist, .env), then make these commits in order, using conventional commit messages:
1. chore: initialize project with TypeScript and Express
2. feat: add Prisma schema for User and RefreshToken
3. feat: add shared config, utils and middleware
4. feat: add user login with access and refresh tokens
5. feat: add refresh token rotation and logout
6. chore: add seed script for admin and employee users
Before each commit, make sure the project compiles. Never commit .env.

OUTPUT
- Create all files with working code
- List the install commands and the commands to run the migration and seed
- Give curl examples for login, refresh and logout