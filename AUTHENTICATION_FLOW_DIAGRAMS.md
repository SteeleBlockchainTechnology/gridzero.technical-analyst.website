# CryptoSensei Authentication Flow Diagram

```mermaid
graph TB
    %% User Access Flow
    User[User Access] --> Check{Check Auth Status}
    Check -->|GET /api/check-verification| Backend[Express Backend]
    Backend --> Session{Session Valid?}

    %% Authentication Paths
    Session -->|No| Unauth[Show VerificationPage]
    Session -->|Yes| Verified{Role Verified?}
    Verified -->|Yes| MainApp[Show MainApp]
    Verified -->|No| Unauth

    %% Discord OAuth Flow
    Unauth --> VerifyBtn[User Clicks Verify]
    VerifyBtn --> Discord[Redirect to Discord OAuth]
    Discord --> Callback[Discord Callback]
    Callback --> RoleCheck[Check Premium Role]
    RoleCheck -->|Has Role| Success[Set Session + Redirect]
    RoleCheck -->|No Role| Failed[Show Failed Page]
    Success --> MainApp

    %% Protected API Flow
    MainApp --> APICall[API Request]
    APICall --> Middleware{ensureVerified}
    Middleware -->|Authenticated| APIHandler[API Handler]
    Middleware -->|Not Authenticated| Deny[401 Response]
    APIHandler --> Response[JSON Response]

    %% External Services
    RoleCheck --> DiscordAPI[Discord API<br/>Role Verification]
    APIHandler --> CoinGecko[CoinGecko API]
    APIHandler --> NewsData[NewsData.io API]
    MainApp --> TradingView[TradingView Widgets]

    %% Styling
    style User fill:#ff6b6b
    style MainApp fill:#4ecdc4
    style Backend fill:#45b7d1
    style Discord fill:#7289da
    style DiscordAPI fill:#7289da
    style Unauth fill:#ffa726
    style Failed fill:#ef5350
```

## Component Architecture with Authentication

```mermaid
graph LR
    subgraph "Frontend Authentication Layer"
        App[App.tsx<br/>Auth Gateway]
        AppContent[AppContent Component]
        VerifyPage[VerificationPage.tsx]
        VerifyBtn[VerifyButton.tsx]
        MainApp[MainApp.tsx<br/>Protected App]
    end

    subgraph "Protected Components"
        TradingView[TradingView.tsx]
        MarketAnalysis[MarketAnalysis.tsx]
        NewsPanel[NewsPanel.tsx]
        FeaturedCoins[FeaturedCoinsManager.tsx]
        AdvancedAnalysis[AdvancedAnalysis.tsx]
    end

    subgraph "Backend Authentication"
        PassportConfig[passport.ts<br/>Discord Strategy]
        AuthMiddleware[ensureVerified<br/>Middleware]
        SessionConfig[Express Session]
    end

    subgraph "Protected APIs"
        NewsAPI[/api/news/:crypto]
        PriceAPI[/api/crypto/price/:id]
        HistoryAPI[/api/crypto/history/:id]
    end

    subgraph "Auth Endpoints"
        AuthDiscord[/api/auth/discord]
        AuthCallback[/api/auth/discord/callback]
        CheckVerification[/api/check-verification]
        VerificationFailed[/api/verification-failed]
        AuthReset[/api/auth/reset]
    end

    %% Authentication Flow
    App --> AppContent
    AppContent --> VerifyPage
    AppContent --> MainApp
    VerifyPage --> VerifyBtn
    VerifyBtn --> AuthDiscord

    %% Protected App Flow
    MainApp --> TradingView
    MainApp --> MarketAnalysis
    MainApp --> NewsPanel
    MainApp --> FeaturedCoins
    MainApp --> AdvancedAnalysis

    %% Backend Protection
    AuthMiddleware --> NewsAPI
    AuthMiddleware --> PriceAPI
    AuthMiddleware --> HistoryAPI

    %% Authentication Backend
    PassportConfig --> AuthDiscord
    PassportConfig --> AuthCallback
    SessionConfig --> CheckVerification

    style App fill:#ff6b6b
    style MainApp fill:#4ecdc4
    style AuthMiddleware fill:#45b7d1
    style PassportConfig fill:#7289da
```

## Data Flow with Authentication

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant V as Vite Proxy
    participant E as Express Server
    participant P as Passport
    participant D as Discord API
    participant C as CoinGecko API

    %% Initial Access
    U->>F: Access Application
    F->>V: GET /api/check-verification
    V->>E: Forward Request
    E->>P: Check Session
    P->>F: { verified: false }
    F->>U: Show Verification Page

    %% OAuth Flow
    U->>F: Click "Verify Premium Access"
    F->>V: Redirect to /api/auth/discord
    V->>E: Discord OAuth Initiation
    E->>D: Redirect to Discord
    D->>U: Show OAuth Page
    U->>D: Grant Permission
    D->>E: Callback with Profile
    E->>D: Check User Roles (Bot Token)
    D->>E: Return User Roles
    E->>P: Verify Premium Role
    P->>E: Set Session (verified: true)
    E->>F: Redirect to /

    %% Verified Access
    F->>V: GET /api/check-verification
    V->>E: Forward Request
    E->>P: Check Session
    P->>F: { verified: true }
    F->>U: Show Main Application

    %% Protected API Access
    U->>F: View Bitcoin Data
    F->>V: GET /api/crypto/price/bitcoin
    V->>E: Forward Request
    E->>P: ensureVerified Middleware
    P->>E: User Verified ✓
    E->>C: Fetch Bitcoin Price
    C->>E: Return Price Data
    E->>F: JSON Response
    F->>U: Display Price Data
```
