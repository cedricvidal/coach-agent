# Personal Coach AI Agent

An AI-powered personal coach application built with Next.js, LangChain.js, and OpenAI. Help users set goals, track progress, and stay motivated through intelligent coaching conversations.

## Features

- **AI-Powered Coaching**: Intelligent conversations using OpenAI GPT-4 and LangChain
- **Goal Management**: Set, track, and manage personal and professional goals
- **Progress Tracking**: Record and monitor progress on your goals
- **Secure Authentication**: Auth0 integration for secure user management
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

1. **Create Auth0 Account**
   - Sign up at [Auth0](https://auth0.com)

2. **Create Application**
   - Create a new "Single Page Application"
   - Note your Domain and Client ID
   - Add `http://localhost:3000` to Allowed Callback URLs
   - Add `http://localhost:3000` to Allowed Logout URLs
   - Add `http://localhost:3000` to Allowed Web Origins

3. **Create API**
   - Create a new API in Auth0
   - Set an identifier (e.g., `https://coach-agent-api`)
   - This will be your `AUTH0_AUDIENCE`

4. **Update Environment Variables**
   - Add Auth0 credentials to both frontend and backend `.env` files

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

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/conversations/:id/messages` - Get messages for a conversation
- `POST /api/chat/chat` - Send a message and get AI response

### Goals
- `GET /api/goals` - Get all goals
- `POST /api/goals` - Create a new goal
- `PUT /api/goals/:id` - Update a goal
- `POST /api/goals/:id/progress` - Add progress to a goal
- `GET /api/goals/:id/progress` - Get progress for a goal

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
