# Quick Start Guide

Get your Personal Coach AI Agent up and running in minutes!

## Prerequisites Checklist

- [ ] Node.js v20.9.0 or higher installed
- [ ] Neon PostgreSQL database created
- [ ] Auth0 account set up
- [ ] OpenAI API key obtained

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# Install all dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure Environment Variables

#### Backend Configuration

Create `backend/.env`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Get from Neon: https://neon.tech
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Get from OpenAI: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Get from Auth0: https://manage.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
```

#### Frontend Configuration

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001

# Same Auth0 credentials as backend
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your_auth0_client_id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://your-api-identifier
```

### 3. Set Up Database

```bash
cd backend
npm run db:push
```

This will create all necessary tables in your Neon database.

### 4. Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see: `🚀 Coach Agent API running on port 3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see: `▲ Next.js 16.0.1 ready on http://localhost:3000`

### 5. Open Your Browser

Navigate to `http://localhost:3000` and sign in!

## Common Issues

### "EBADENGINE" Warnings

**Issue:** You see Node.js version warnings.

**Solution:** Update to Node.js v20.9.0+
```bash
# Using nvm
nvm install 20
nvm use 20
```

### Database Connection Failed

**Issue:** Cannot connect to Neon database.

**Solution:**
- Verify `DATABASE_URL` is correct
- Ensure `?sslmode=require` is at the end
- Check your Neon database is active

### Auth0 Login Redirect Issues

**Issue:** Auth0 login fails or redirects incorrectly.

**Solution:**
1. Go to Auth0 Dashboard → Applications → Your App
2. Add these URLs:
   - Allowed Callback URLs: `http://localhost:3000`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`

### Module Not Found Errors

**Issue:** TypeScript/module errors in the backend.

**Solution:**
```bash
cd backend
npm install --legacy-peer-deps
```

## Next Steps

Once running:

1. **Sign in** with Auth0
2. **Start a conversation** with your AI coach
3. **Create a goal** in the Goals tab
4. **Track progress** on your goals
5. **Get motivated** with AI-powered coaching

## Architecture Overview

```
┌─────────────────┐
│   React UI      │ ← Next.js 16 + Tailwind CSS
│  (Frontend)     │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│  Express API    │ ← TypeScript + Auth0
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ Neon │  │ OpenAI│
│  DB  │  │  LLM  │
└──────┘  └───────┘
```

## Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Sync database schema
- `npm run db:generate` - Generate migrations
- `npm run db:studio` - Open Drizzle Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Support

Need help? Check the full [README.md](README.md) or open an issue on GitHub.

Happy coaching! 🎯
