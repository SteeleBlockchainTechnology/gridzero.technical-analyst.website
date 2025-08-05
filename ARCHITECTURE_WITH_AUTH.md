# CryptoSensei Architecture Documentation with Discord Authentication

## Table of Contents

1. [Project Overview](#project-overview)
2. [Authentication System](#authentication-system)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Frontend-Backend Integration](#frontend-backend-integration)
6. [Data Flow Patterns](#data-flow-patterns)
7. [File Structure](#file-structure)
8. [API Endpoints](#api-endpoints)
9. [Development Workflow](#development-workflow)

## Project Overview

CryptoSensei is a **premium** real-time cryptocurrency dashboard built with React/TypeScript frontend and Express.js backend. It provides:

- **Discord-based Authentication**: Premium access verification through Discord role checking
- Real-time price tracking
- News aggregation with sentiment analysis
- AI-powered market analysis
- Interactive charts via TradingView
- User-customizable featured coins

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI, React Router DOM
- **Backend**: Express.js, TypeScript, WebSocket, Axios, Passport.js, Discord OAuth
- **Authentication**: Discord OAuth 2.0 with role-based access control
- **APIs**: CoinGecko (prices), NewsData.io (news), TradingView (charts), Discord API
- **Development**: Vite dev server with proxy, tsx for backend

## Authentication System

### Discord OAuth 2.0 Integration

#### Flow Overview

```
User Access → Check Verification Status →
├─ Not Verified → Show Login Page → Discord OAuth →
│                 Discord API Role Check →
│                 ├─ Has Premium Role → Grant Access
│                 └─ No Premium Role → Deny Access
└─ Verified → Show Main App
```

#### Components

##### Backend Authentication (`src/server/config/passport.ts`)

- **Passport Strategy**: Discord OAuth 2.0
- **Role Verification**: Checks for "Premium Access" role in Discord server
- **Session Management**: Express sessions with secure cookies
- **Discord API Integration**: Bot token for role verification

```typescript
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: process.env.DISCORD_CALLBACK_URL!,
      scope: ["identify"],
    },
    async (accessToken, refreshToken, profile, done) => {
      // Role verification logic
    }
  )
);
```

##### Frontend Authentication Components

- **`VerifyButton.tsx`**: Initiates Discord OAuth flow
- **`VerificationPage.tsx`**: Shows unauthorized/failed states
- **`App.tsx`**: Main verification checkpoint
- **`MainApp.tsx`**: Protected main application

##### Protected API Middleware

```typescript
const ensureVerified = (req: any, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !(req.user as any).verified) {
    return res.status(401).json({ error: "Verification required." });
  }
  next();
};
```

## Frontend Architecture

### Entry Point & Authentication Flow

#### `src/App.tsx` - Authentication Gateway

**Purpose**: Main authentication checkpoint and router
**Features**:

- Verification status checking
- Conditional rendering based on auth state
- React Router integration for auth flows
- Loading state management

**Key Functions**:

```typescript
const checkVerification = async () => {
  const response = await fetch("/api/check-verification", {
    credentials: "include",
  });
  const data = await response.json();
  setIsVerified(data.verified);
};
```

#### `src/components/MainApp.tsx` - Protected Application

**Purpose**: Main application logic (moved from App.tsx)
**Features**: All the original CryptoSensei functionality

- State management for crypto data
- Real-time price updates
- News and predictions fetching
- Featured coins management

### Authentication Components

#### `src/components/VerifyButton.tsx`

**Purpose**: Initiates Discord OAuth flow
**Features**:

- Redirects to `/api/auth/discord`
- Styled with Shadcn/UI Button component
- Consistent design with app theme

#### `src/components/VerificationPage.tsx`

**Purpose**: Handles authentication states
**Types**:

- `unauthorized`: First-time access
- `failed`: Verification failed (no role)

**Features**:

- Gradient background matching app design
- Clear messaging about Premium Access requirement
- Retry functionality

### Component Architecture (Protected)

All original components remain the same but are now protected behind authentication:

#### UI Foundation (`src/components/ui/`)

- Same Shadcn/UI components
- No changes required

#### Core Feature Components

- **`TradingView.tsx`**: No changes
- **`NewsPanel.tsx`**: No changes
- **`MarketAnalysis.tsx`**: No changes
- **`AdvancedAnalysis.tsx`**: No changes
- **`FeaturedCoinsManager.tsx`**: No changes

## Backend Architecture

### `src/server/index.ts` - Enhanced Express Server

#### Authentication Middleware Integration

```typescript
// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
```

#### Protected API Endpoints

All existing API endpoints now require verification:

- `/api/news/:crypto` → `ensureVerified` middleware
- `/api/crypto/price/:id` → `ensureVerified` middleware
- `/api/crypto/history/:id` → `ensureVerified` middleware

#### Authentication Routes

```typescript
// OAuth initiation
app.get("/api/auth/discord", passport.authenticate("discord"));

// OAuth callback
app.get(
  "/api/auth/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: "/verification-failed",
    successRedirect: "/",
  })
);

// Verification status check
app.get("/api/check-verification", (req, res) => {
  res.json({
    verified: req.isAuthenticated() && req.user && (req.user as any).verified,
  });
});

// Error handling
app.get("/api/verification-failed", (req, res) => {
  res.status(403).json({ error: "Verification failed." });
});

// Reset authentication
app.get("/api/auth/reset", (req, res) => {
  req.logout(() => res.redirect("/"));
});
```

### External API Integrations (Unchanged)

All existing integrations remain the same:

- **NewsData.io**: News aggregation
- **CoinGecko**: Price and market data
- **TradingView**: Chart widgets

### Discord API Integration

#### Bot Configuration

- **Purpose**: Role verification for users
- **Permissions**: Read guild members, read roles
- **Endpoint**: `https://discord.com/api/v10/guilds/{guild_id}/members/{user_id}`

#### Role Verification Process

1. User authenticates via Discord OAuth
2. Server gets user ID from OAuth profile
3. Server queries Discord API with bot token
4. Checks if user has required role ID
5. Grants/denies access based on role presence

## Frontend-Backend Integration

### Authentication Flow Integration

#### Development Setup (Updated)

```typescript
// vite.config.ts - No changes to proxy
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3001', // Backend handles auth
      changeOrigin: true,
    }
  },
}
```

#### CORS Configuration (Updated)

```typescript
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend dev server
      "http://localhost:3001", // Backend dev server
    ],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true, // Required for session cookies
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

### Data Flow Patterns (Updated)

#### Authentication Check Flow

```
Frontend Load →
fetch('/api/check-verification', { credentials: 'include' }) →
Backend Session Check →
Response { verified: boolean } →
Frontend Conditional Render
```

#### Protected API Flow

```
Frontend API Call →
Vite Proxy →
Express ensureVerified Middleware →
├─ Authenticated → Continue to API Handler
└─ Not Authenticated → 401 Response → Frontend Auth Prompt
```

#### OAuth Flow

```
User Clicks "Verify" →
Redirect to /api/auth/discord →
Discord OAuth Page →
User Grants Permission →
Discord Callback to /api/auth/discord/callback →
Passport Processes Profile →
Discord API Role Check →
├─ Has Role → Set Session, Redirect to /
└─ No Role → Redirect to /verification-failed
```

## File Structure (Updated)

### New Authentication Files

```
src/
├── App.tsx (Updated - Auth gateway)
├── components/
│   ├── MainApp.tsx (New - Main app logic)
│   ├── VerifyButton.tsx (New - Auth button)
│   ├── VerificationPage.tsx (New - Auth states)
│   └── [existing components...]
└── server/
    ├── index.ts (Updated - Auth integration)
    └── config/
        └── passport.ts (New - Discord OAuth)
```

### Environment Variables (Updated)

```env
# Existing
VITE_PORT=3001
VITE_NEWSDATA_API_KEY=...
VITE_GROQ_API_KEY=...

# New Discord Auth
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_CALLBACK_URL=http://localhost:3001/api/auth/discord/callback
SESSION_SECRET=... # 32-character random string
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
DISCORD_PREMIUM_ROLE_ID=...
NODE_ENV=development
HOST=localhost
PORT=3001
```

## API Endpoints (Updated)

### Authentication Endpoints (New)

- **GET** `/api/auth/discord` - Initiate Discord OAuth
- **GET** `/api/auth/discord/callback` - OAuth callback handler
- **GET** `/api/check-verification` - Check auth status
- **GET** `/api/verification-failed` - Auth failure handler
- **GET** `/api/auth/reset` - Logout user

### Protected Endpoints (Updated)

All existing endpoints now require `ensureVerified` middleware:

- **GET** `/api/news/:crypto` - ✅ **Protected**
- **GET** `/api/crypto/price/:id` - ✅ **Protected**
- **GET** `/api/crypto/history/:id` - ✅ **Protected**

### Response Changes

Protected endpoints return `401 Unauthorized` when not authenticated:

```json
{
  "error": "Verification required. Please verify your Premium Access role."
}
```

## Development Workflow (Updated)

### Local Development Setup

1. **Environment Setup**: Configure Discord application and bot
2. **Install Dependencies**:
   ```bash
   npm install react-router-dom @types/passport @types/passport-discord @types/express-session
   ```
3. **Start Backend**: `npm run server:dev` (port 3001)
4. **Start Frontend**: `npm run dev` (port 5173)
5. **Test Auth**: Navigate to app, verify Discord OAuth flow

### Discord Setup Requirements

1. **Create Discord Application** at https://discord.com/developers/applications
2. **Configure OAuth2**:
   - Redirect URI: `http://localhost:3001/api/auth/discord/callback`
   - Scopes: `identify`
3. **Create Bot** and add to server with appropriate permissions
4. **Configure Premium Role** in Discord server
5. **Update Environment Variables** with IDs and secrets

### Testing Authentication

1. **Unauthenticated State**: Verify redirect to auth page
2. **OAuth Flow**: Test Discord login and callback
3. **Role Verification**: Test with/without Premium Access role
4. **Session Persistence**: Test page refresh and navigation
5. **API Protection**: Verify 401 responses for unauth requests

### Deployment Considerations

- Update `DISCORD_CALLBACK_URL` for production domain
- Ensure `NODE_ENV=production` for secure cookies
- Configure proper CORS origins for production
- Use secure session secrets in production

## Security Features

### Session Security

- **Secure Cookies**: HTTPS-only in production
- **Session Expiration**: 24-hour timeout
- **Session Secret**: Environment-based secret key

### Discord API Security

- **Bot Token**: Server-side only, never exposed to frontend
- **OAuth Scopes**: Minimal scope (`identify` only)
- **Role-Based Access**: Server-side verification

### API Protection

- **Middleware-Based**: All API routes protected by default
- **Session Validation**: Checks both authentication and verification
- **Error Handling**: Graceful 401 responses for unauthorized access

This architecture provides a secure, scalable premium access system while maintaining all the original CryptoSensei functionality for verified users.
