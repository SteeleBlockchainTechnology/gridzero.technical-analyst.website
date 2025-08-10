<div align="center">

# Grid Zero Technical Analyst (TA) Website

Real-time crypto analysis for the Grid Zero community — technical indicators, AI/ML insights, risk, and premium Discord role gating.

<br />

![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=061b2c)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/Components-shadcn%2Fui-000000)
![Framer Motion](https://img.shields.io/badge/Animations-Framer%20Motion-FF008A)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express)
![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-3EAAAF?logo=socket.io&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/AI-TensorFlow.js-FF6F00?logo=tensorflow&logoColor=white)

</div>

## Project Overview

Grid Zero TA is a full‑stack web application that provides real‑time cryptocurrency analysis. It combines on‑chart technical indicators (RSI, MACD, MAs), news sentiment, risk assessment, and AI/ML‑driven predictions to help traders make better decisions. Premium access is gated via Discord OAuth with server role verification for Grid Zero’s “Premium Access” role.

This project aligns with Grid Zero’s mission to empower traders through AI education, hands‑on analytics, and custom programming tools.

## Features

- Real‑time prices and updates via WebSockets (wss) with graceful fallbacks
- Technical analysis: RSI, MACD, MAs (20/50/200), StochRSI, volatility, OBV, support/resistance, market phase
- Advanced analysis engine that fuses technicals, sentiment, risk, and ML predictions into strategies
- News aggregation and sentiment classification (NewsData API)
- AI‑generated analysis (Groq LLM) and TensorFlow.js models (trend/price/levels)
- Premium verification via Discord OAuth (passport‑discord) with guild role check
- Responsive UI with TailwindCSS, shadcn/ui, Radix primitives, and Framer Motion
- Caching and rate limiting to respect CoinGecko and NewsData free tiers

## Tech Stack

- Frontend: React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui, Radix UI, Framer Motion, lightweight‑charts
- Backend: Express.js, passport‑discord (OAuth), express‑session, ws (WebSocket server)
- AI/ML: TensorFlow.js (tfjs), custom models (trend/price/levels), Groq SDK for LLM analysis
- Data: CoinGecko (prices/history), NewsData.io (news)
- Dev tooling: tsx, concurrently, ESLint, TypeScript project refs, Vite proxy

## Architecture (high level)

- React/Vite app calls backend via relative routes (/api/*); Vite proxies to the backend in dev
- WebSocket server is mounted on the same HTTP server instance; dev clients connect via /ws (proxied)
- Backend layers:
  - OAuth and role verification (Discord): ensures “Premium Access” role in configured guild
  - REST endpoints: /api/crypto/price, /api/crypto/history, /api/news, and auth/session checks
  - Caching + rate limiting for CoinGecko and NewsData (in‑memory)
  - Analysis services: technical indicators, sentiment synthesis, ML predictions, risk, strategy

## Project Structure (selected)

```
src/
  components/            # UI + analysis views (MarketAnalysis, AdvancedAnalysis, NewsPanel, etc.)
  services/              # api, priceStore, websocket, analysis engines, ML models, risk, strategy
  server/                # Express server, passport config, routes, WebSocket wiring
```

## Environment Variables

Create .env from .env.example and fill in values.

- Core (dev defaults)
  - FRONTEND_PORT=3000
  - BACKEND_PORT=5000
  - HOST=localhost
  - NODE_ENV=development
  - SESSION_SECRET=your_random_string
  - DISCORD_CALLBACK_URL=http://localhost:5000/api/auth/discord/callback
- Discord (required)
  - DISCORD_CLIENT_ID=...
  - DISCORD_CLIENT_SECRET=...
  - DISCORD_BOT_TOKEN=...
  - DISCORD_GUILD_ID=...
  - DISCORD_PREMIUM_ROLE_ID=...
- Data/APIs
  - VITE_NEWSDATA_API_KEY=...
  - VITE_GROQ_API_KEY=...
  - VITE_COINGECKO_API_KEY=... (optional; CoinGecko public endpoints used)

Notes:
- For production, set NODE_ENV=production, HOST=ta.gridzero.xyz, and DISCORD_CALLBACK_URL=https://ta.gridzero.xyz/api/auth/discord/callback.
- You can also use PORT or VITE_PORT to override backend port; the server reads BACKEND_PORT | PORT | VITE_PORT.
- .gitignore excludes .env files by default. Never commit secrets.

## Scripts

- npm run start — starts both frontend and backend in dev mode
  - Frontend: http://localhost:3000 (Vite)
  - Backend: http://localhost:5000 (Express)
- npm run dev — Vite dev server only (honors FRONTEND_PORT/BACKEND_PORT for proxy)
- npm run server:dev — Backend only with tsx watch
- npm run build — Type check and build frontend (Vite)
- npm run server:build — Compile backend to dist/server
- npm run server:start — Run compiled backend
- npm run start:prod — Build frontend + backend, then run compiled backend (production)

## Local Development

1) Install prerequisites

```bash
npm install
cp .env.example .env
# Fill in Discord keys and API keys in .env
```

2) Start the full stack (dev):

```bash
npm run start
```

3) Access the app

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

Auth flow notes (dev):
- Clicking “Verify with Discord” redirects to Discord OAuth.
- On success, you must belong to the configured guild and hold the Premium role.
- The server uses sessions + cookies; ensure you access via localhost (not 127.0.0.1 or a different host) for consistency.

## Production Deployment

See PRODUCTION_DEPLOYMENT.md for full details (systemd + Nginx).

Quick overview:

1) Build and start

```bash
npm ci --omit=dev
npm run build
npm run server:build
npm run server:start
```

2) systemd service (example)

```ini
[Unit]
Description=Grid Zero Technical Analyst Website
After=network.target

[Service]
Type=simple
User=gridzero
WorkingDirectory=/opt/gridzero/websites/technical-analyst
Environment=NODE_ENV=production
Environment=HOST=ta.gridzero.xyz
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=append:/opt/gridzero/logs/technical-analyst-website.log
StandardError=append:/opt/gridzero/logs/technical-analyst-website-error.log

[Install]
WantedBy=multi-user.target
```

3) Nginx (TLS + proxy + WebSockets)

```nginx
server {
  listen 443 ssl http2;
  server_name ta.gridzero.xyz;

  # SSL managed by Certbot
  ssl_certificate /etc/letsencrypt/live/ta.gridzero.xyz/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/ta.gridzero.xyz/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  # Security headers
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header X-XSS-Protection "1; mode=block";
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location / {
    proxy_pass http://localhost:5000; # or 3001 if you prefer
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
  }
}

server {
  listen 80;
  server_name ta.gridzero.xyz;
  return 301 https://$server_name$request_uri;
}
```

Environment (prod):
- NODE_ENV=production
- HOST=ta.gridzero.xyz
- DISCORD_CALLBACK_URL=https://ta.gridzero.xyz/api/auth/discord/callback
- BACKEND_PORT/PORT per your server (e.g., 5000 or 3001)

## Endpoints (selected)

- Auth: /api/auth/discord, /api/auth/discord/callback, /api/check-verification, /api/auth/reset
- Prices: /api/crypto/price/:id, /api/crypto/prices
- History: /api/crypto/history/:id
- News: /api/news/:crypto
- WebSocket: /ws (subscribe with { type: 'subscribe', crypto: 'bitcoin' })

## Troubleshooting

Auth loops / verification fails:
- Ensure the Discord application Redirect URI matches your DISCORD_CALLBACK_URL exactly.
- Confirm the bot is in the guild and has permissions; DISCORD_GUILD_ID and DISCORD_PREMIUM_ROLE_ID must be correct.
- In production, cookies require https and sameSite=none; ensure you serve via TLS and set HOST properly.
- Check Nginx forwarding headers (Host, X-Forwarded-Proto) and that your session secret is set.

WebSocket not connecting:
- Confirm Nginx includes Upgrade/Connection headers.
- Backend must use server.listen (already wired) so upgrade requests are handled.
- In dev, client connects to /ws through Vite proxy; verify FRONTEND_PORT/BACKEND_PORT.

Port conflicts:
- Adjust BACKEND_PORT/FRONTEND_PORT or stop processes using the ports.

Rate limiting (429s):
- CoinGecko/NewsData requests are rate‑limited; backend caches results and falls back to cache when available.

TradingView/widget warnings:
- Third‑party scripts may log benign warnings; ensure network access is allowed and CSP permits required domains.

## Contributing

We welcome improvements and bug fixes.

- Create a feature branch from main
- Keep changes focused and add tests where applicable
- Follow TypeScript/ESLint rules; prefer small, composable components/services
- For auth‑related changes, test the full Discord role verification flow
- Open a PR with a clear description and reproduction steps

## License

MIT — see LICENSE (or contact maintainers if absent).

## Acknowledgments

- Grid Zero community and contributors
- TensorFlow.js, CoinGecko, NewsData.io, Groq
- Radix UI, shadcn/ui, Vite, Express
