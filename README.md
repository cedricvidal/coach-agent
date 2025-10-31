# Personal Coach AI Agent

An AI-powered personal coach application built with Next.js, LangChain.js, and OpenAI. Help users set goals, track progress, and stay motivated through intelligent coaching conversations.

## Features

- **AI-Powered Coaching**: Intelligent conversations using OpenAI GPT-4 and LangChain
- **Goal Management**: Set, track, and manage personal and professional goals
- **Progress Tracking**: Record and monitor progress on your goals
- **Secure Authentication**: Auth0 integration for secure user management
- **Role-Based Access Control**: User approval system using Auth0 RBAC and permissions
- **Real-time Chat**: Interactive chat interface with context-aware responses
- **Persistent Data**: PostgreSQL database with Neon for reliable data storage

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS
- **Authentication**: Auth0 React SDK
- **HTTP Client**: Axios
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js with Express
- **AI Framework**: LangChain.js
- **LLM**: OpenAI GPT-4
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Auth0 JWT Bearer
- **Language**: TypeScript

### Hosting
- **Platform**: Vercel
- **Database**: Neon Serverless PostgreSQL

## Project Structure

```
coach-agent/
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility functions and API client
│   └── public/          # Static assets
├── backend/              # Express backend API
│   ├── src/
│   │   ├── agents/      # LangChain AI agents
│   │   ├── database/    # Database schema and connection
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   └── index.ts     # Server entry point
│   └── drizzle/         # Database migrations
└── package.json         # Monorepo configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20.9.0 (recommended)
- npm or yarn
- Neon PostgreSQL database
- Auth0 account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coach-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Set up environment variables**

   **Backend** (`backend/.env`):
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Neon Database URL
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require

   # OpenAI API Key
   OPENAI_API_KEY=your_openai_api_key

   # Auth0 Configuration
   AUTH0_AUDIENCE=your_auth0_api_identifier
   AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
   ```

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001

   # Auth0 Configuration
   NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
   NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
   NEXT_PUBLIC_AUTH0_AUDIENCE=your_auth0_api_identifier
   ```

4. **Set up the database**
   ```bash
   cd backend
   npm run db:push  # Generate and push schema to database
   ```

5. **Run the development servers**

   **Terminal 1 - Backend**:
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:3000`

## Database Setup

### Neon PostgreSQL

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project
3. Copy your connection string
4. Add it to `backend/.env` as `DATABASE_URL`

### Running Migrations

```bash
cd backend
npx drizzle-kit generate  # Generate migration files
npx drizzle-kit push      # Apply migrations to database
```

## Auth0 Setup

### Step 1: Create Auth0 Account
- Sign up at [Auth0](https://auth0.com)

### Step 2: Create Application
1. Go to **Applications → Applications** in Auth0 Dashboard
2. Click **Create Application**
3. Choose **Single Page Application**
4. Note your **Domain** and **Client ID**
5. Configure Application Settings:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
6. Click **Save Changes**

### Step 3: Create API
1. Go to **Applications → APIs** in Auth0 Dashboard
2. Click **Create API**
3. Set:
   - **Name**: Coach Agent API
   - **Identifier**: `https://coach-agent-api` (this will be your `AUTH0_AUDIENCE`)
   - **Signing Algorithm**: RS256
4. Click **Create**

### Step 4: Configure RBAC and Permissions
The application uses Role-Based Access Control (RBAC) to manage user access. By default, authenticated users cannot use the chat feature until they are granted permission.

1. **Add Permission to API**:
   - Go to **Applications → APIs** → Select your API
   - Go to the **Permissions** tab
   - Click **Add Permission**
   - Add permission:
     - **Permission (Scope)**: `chat:access`
     - **Description**: `Access to chat with the AI coach`
   - Click **Add**

2. **Enable RBAC**:
   - While on your API settings, go to the **Settings** tab
   - Scroll to **RBAC Settings**
   - Enable these toggles:
     - ✅ **Enable RBAC**
     - ✅ **Add Permissions in the Access Token**
   - Click **Save**

3. **Assign Permissions to Users**:

   **Option A: Assign Directly to Users**
   - Go to **User Management → Users**
   - Select a user you want to approve
   - Go to the **Permissions** tab
   - Click **Assign Permissions**
   - Select your API and check `chat:access`
   - Click **Add Permissions**

   **Option B: Create Roles (Recommended for Multiple Users)**
   - Go to **User Management → Roles**
   - Click **Create Role**
   - Name it `Coach User` (or similar)
   - Add Description: "Users who can access the coaching chat"
   - Go to the **Permissions** tab
   - Add the `chat:access` permission from your API
   - Go to **User Management → Users**
   - Select users and assign them to the "Coach User" role

4. **Test Access Control**:
   - Users **without** the `chat:access` permission will receive a 403 error when trying to chat
   - Error message: "You do not have permission to access this resource. Please contact the administrator for approval."
   - Users **with** the permission can use the chat feature normally

### Step 5: Update Environment Variables
Add Auth0 credentials to both frontend and backend `.env` files as shown in the installation section above.

### Important Notes
- Users must **log out and log back in** after permissions are assigned to receive a new access token with the updated permissions
- Alternatively, clear browser localStorage/sessionStorage to force re-authentication
- The permission check is implemented in [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
- The `/api/chat/chat` endpoint requires the `chat:access` permission

## Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Go to your Vercel project settings
   - Add all environment variables from your `.env` files
   - Update `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` to production URLs

4. **Connect Database**
   - Ensure your Neon database is accessible from Vercel
   - Update `DATABASE_URL` in Vercel environment variables

## API Endpoints

All endpoints require authentication via Auth0 JWT tokens.

### Chat
- `GET /api/chat/conversations` - Get all conversations for authenticated user
- `GET /api/chat/conversations/:id/messages` - Get messages for a conversation
- `POST /api/chat/chat` - Send a message and get AI response (requires `chat:access` permission)

### Goals
- `GET /api/goals` - Get all goals for authenticated user
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `POST /api/goals/:id/progress` - Add progress to a goal
- `GET /api/goals/:id/progress` - Get progress for a goal

### Authentication
All API requests must include an `Authorization` header with a valid Auth0 access token:
```
Authorization: Bearer <access_token>
```

## Development

### Adding Database Tables

1. Edit `backend/src/database/schema.ts`
2. Run `npx drizzle-kit generate` to create migrations
3. Run `npx drizzle-kit push` to apply changes

### Customizing the AI Coach

Edit `backend/src/agents/coachAgent.ts` to modify:
- System prompt
- Model parameters (temperature, model name)
- Response behavior

### Adding Features

- **Frontend**: Add components in `frontend/components/`
- **Backend**: Add routes in `backend/src/routes/`
- **Database**: Update schema in `backend/src/database/schema.ts`

## Troubleshooting

### Node Version Issues
If you see engine warnings, update Node.js to version 20.9.0 or higher:
```bash
# Using nvm
nvm install 20
nvm use 20
```

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure Neon database is running
- Check SSL mode is set to `require`

### Auth0 Issues
- Verify all URLs are added to Auth0 application settings
- Check domain and client ID are correct
- Ensure API audience matches between frontend and backend

## License

ISC

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open a GitHub issue.
