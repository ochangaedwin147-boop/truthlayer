# TruthLayer

**AI-Powered Misinformation Detection SaaS**

Created by Edwin McCain

---

## Overview

TruthLayer is a full-stack SaaS application that uses AI to detect misinformation and verify content trustworthiness. Users can analyze any text content and receive a trust score (0-100), detailed analysis, and warning flags.

## Features

- **AI-Powered Analysis**: Advanced AI detects misinformation patterns, bias, and unreliable claims
- **Trust Scores**: Clear 0-100 scoring with detailed explanations
- **Warning Flags**: Automatic detection of potential issues (unverified claims, emotional language, etc.)
- **Chrome Extension**: Verify content directly in your browser
- **API Access**: Integrate TruthLayer into your applications
- **Subscription Plans**: Free, Starter, Pro, and Enterprise tiers

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **AI**: z-ai-web-dev-sdk for content analysis
- **Authentication**: Custom session-based auth with hashed passwords

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/truthlayer.git
cd truthlayer
```

2. Install dependencies:
```bash
bun install
```

3. Set up the database:
```bash
bun run db:push
```

4. Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./db/custom.db"
NODE_ENV="development"
```

5. Start the development server:
```bash
bun run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
truthlayer/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── verify/    # Content verification
│   │   │   ├── api-keys/  # API key management
│   │   │   ├── history/   # Verification history
│   │   │   └── subscription/
│   │   ├── layout.tsx
│   │   └── page.tsx       # Main application
│   ├── components/ui/     # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   └── lib/
│       ├── auth.ts        # Authentication utilities
│       ├── verification.ts # AI verification logic
│       ├── plans.ts       # Subscription plans
│       └── db.ts          # Database client
├── download/
│   └── chrome-extension/  # Chrome extension files
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login to account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Verification
- `POST /api/verify` - Verify text content (requires auth)

### API Keys
- `GET /api/api-keys` - Get user's API key
- `POST /api/api-keys` - Regenerate API key (paid plans only)

### History
- `GET /api/history` - Get verification history

### Subscription
- `GET /api/subscription` - Get subscription info
- `POST /api/subscription` - Update subscription

## Chrome Extension

The Chrome extension allows users to verify content directly from their browser.

### Installation
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `download/chrome-extension` folder

### Configuration
1. Click the extension icon
2. Open settings (⚙️)
3. Enter your TruthLayer API URL and API key
4. Save settings

## Subscription Plans

| Plan | Price | Daily Verifications | API Calls |
|------|-------|-------------------|-----------|
| Free | $0 | 5 | 0 |
| Starter | $9/mo | 50 | 1,000/mo |
| Pro | $29/mo | Unlimited | 10,000/mo |
| Enterprise | $99/mo | Unlimited | Unlimited |

## Deployment

### Build for Production
```bash
bun run build
```

### Run Production Server
```bash
bun run start
```

### Environment Variables (Production)
```env
DATABASE_URL="file:./db/custom.db"
NODE_ENV="production"
```

## Stripe Integration (Optional)

To add Stripe payment processing:

1. Install Stripe SDK:
```bash
bun add stripe
```

2. Add environment variables:
```env
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

3. Update `/api/subscription/route.ts` to use Stripe for payment processing

4. Create a webhook endpoint for Stripe events

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

**Edwin McCain**

---

## Roadmap

- [ ] Stripe payment integration
- [ ] Email verification
- [ ] Password reset
- [ ] Team accounts
- [ ] Bulk verification
- [ ] Browser extension for Firefox
- [ ] Mobile app
- [ ] Webhook notifications
- [ ] Custom AI model training

---

**Built with ❤️ using Next.js and AI**
