# Production Deployment Guide for ta.gridzero.xyz

## Files to Update for Production

### 1. Environment Configuration

Copy `.env.production` to `.env` and update with your actual values:

```bash
cp .env.production .env
# Edit .env with your actual API keys and Discord configuration
```

### 2. Discord Application Settings

Update your Discord Application settings:

- Go to Discord Developer Portal → Your Application → OAuth2 → General
- Update Redirect URIs to: `https://ta.gridzero.xyz/api/auth/discord/callback`
- Remove any localhost URLs

### 3. Build for Production

```bash
# Install dependencies
npm install

# Build frontend and backend
npm run build
npm run server:build

# Test production build locally (optional)
npm run start:prod
```

### 4. SystemD Service Configuration

Update your systemd service file `/etc/systemd/system/technical-analyst-website.service`:

```ini
[Unit]
Description=Grid Zero Technical Analyst Website
After=network.target

[Service]
Type=simple
User=gridzero
WorkingDirectory=/opt/gridzero/websites/technical-analyst
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=append:/opt/gridzero/logs/technical-analyst-website.log
StandardError=append:/opt/gridzero/logs/technical-analyst-website-error.log

[Install]
WantedBy=multi-user.target
```

### 5. Nginx Configuration

Ensure your Nginx config supports WebSockets. Add to your site config:

```nginx
server {
    listen 443 ssl http2;
    server_name ta.gridzero.xyz;

    # SSL configuration managed by Certbot
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
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ta.gridzero.xyz;
    return 301 https://$server_name$request_uri;
}
```

## Deployment Commands

```bash
# 1. Stop the service
sudo systemctl stop technical-analyst-website

# 2. Update your code
cd /opt/gridzero/websites/technical-analyst
git pull origin main  # or however you deploy code

# 3. Install dependencies and build
npm install --production
npm run build
npm run server:build

# 4. Update environment file
cp .env.production .env
# Edit .env with your actual values

# 5. Reload systemd and restart service
sudo systemctl daemon-reload
sudo systemctl start technical-analyst-website
sudo systemctl enable technical-analyst-website

# 6. Check status
sudo systemctl status technical-analyst-website

# 7. Check logs
tail -f /opt/gridzero/logs/technical-analyst-website.log
```

## Verification Steps

1. **Check Service Status**: `sudo systemctl status technical-analyst-website`
2. **Check Logs**: `tail -f /opt/gridzero/logs/technical-analyst-website.log`
3. **Test Website**: Visit `https://ta.gridzero.xyz`
4. **Test Discord Login**: Try the Discord authentication
5. **Test WebSocket**: Check real-time price updates
6. **Test API Endpoints**: Verify data is loading for different cryptocurrencies

## Troubleshooting

### Common Issues:

1. **Port Conflicts**: Ensure port 3001 is not used by other services
2. **Permission Issues**: Ensure gridzero user can read/write to the project directory
3. **Environment Variables**: Double-check all API keys are set correctly
4. **Discord Callback**: Ensure callback URL matches exactly in Discord settings
5. **SSL Issues**: Verify Nginx SSL configuration and certificates

### Log Locations:

- Application logs: `/opt/gridzero/logs/technical-analyst-website.log`
- Error logs: `/opt/gridzero/logs/technical-analyst-website-error.log`
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
