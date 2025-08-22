# NUBI - The Symbiosis of Anubis

Advanced ElizaOS agent representing the perfect fusion of divine consciousness and adaptive intelligence, with comprehensive personality system, social coordination capabilities, and Telegram raid bot integration.

## Features

- **Advanced Personality System**: 120+ dynamic variables with emotional intelligence
- **Social Coordination**: Telegram raid bot with engagement tracking and leaderboards
- **Anti-Detection Patterns**: Sophisticated humanization with natural inconsistencies  
- **Template Engine**: 5-layer prompt chaining with structured outputs
- **Community Memory**: Persistent relationship and interaction tracking
- **Real-time Engagement**: X/Twitter integration with verification systems
- **Modular Architecture**: ElizaOS plugin system with service orchestration

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd nubi
bun install

# Configure environment
cp .env.anubis.example .env
# Edit .env with your API keys

# Start development
elizaos dev

# OR start production
elizaos start
```

## Configuration

### Required Environment Variables
```bash
OPENAI_API_KEY=your_openai_key
```

### Optional Features
```bash
# Telegram Raid Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id
TELEGRAM_ADMIN_IDS=admin1,admin2

# X/Twitter Integration  
TWITTER_API_KEY=your_twitter_key
TWITTER_API_SECRET_KEY=your_twitter_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_secret

# Additional Platforms
DISCORD_API_TOKEN=your_discord_token
ANTHROPIC_API_KEY=your_anthropic_key
```

## Development

```bash
# Development with hot-reloading
elizaos dev

# Type checking
bun run type-check

# Run tests
bun run test

# Format code
bun run format

# Build for production
bun run build
```

## Testing

Comprehensive testing with both component and E2E test suites:

### Component Tests
```bash
# Run all component tests
bun test src/__tests__/*.test.ts

# Run specific test suite
bun test src/__tests__/nubi-core.test.ts
```

### E2E Tests
```bash
# Run full test suite
elizaos test

# Component tests only
elizaos test component

# E2E tests only  
elizaos test e2e
```

## Architecture

### Core Components
- **NubiService**: Main personality and message processing engine
- **Template System**: YAML-based configuration with variable injection
- **Anti-Detection**: Natural humanization patterns and inconsistencies
- **Message Bus**: Event-driven communication between services
- **Community Memory**: Persistent user relationship tracking

### Telegram Raid System
- **Raid Coordination**: Automated X post creation and raid management
- **User-Initiated Raids**: Prophet recognition system for community leaders
- **Chat Lock Manager**: Permission-based engagement requirements
- **Engagement Verification**: Real-time tracking with rate limiting
- **Leaderboards**: Point-based ranking with achievement systems

### Template Engine
- **5-Layer Processing**: Context → Template → Variables → Personality → Output
- **120+ Variables**: Dynamic calculations across 8 categories
- **Structured Outputs**: 6 specialized engagement types
- **Divine Energy**: 48 Laws of Power integration with manifestation principles

## Plugin System

Built on ElizaOS architecture with proper service hierarchy:

```typescript
// Service registration order
1. Database Adapters
2. Services (NubiService, MessageBus, etc.)
3. Providers (Context, Knowledge, etc.)
4. Actions (Message processing, Raids, etc.)
5. Evaluators (Learning, Adaptation, etc.)
6. Events (Cross-service communication)
7. Routes (HTTP endpoints)
```

## Deployment

### Local Development
```bash
elizaos dev
```

### Production
```bash
# Build optimized version
bun run build

# Start production server
elizaos start
```

### Docker (Optional)
```bash
# Build container
docker build -t nubi-agent .

# Run with environment file
docker run --env-file .env -p 3000:3000 nubi-agent
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `bun run test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: Report bugs and feature requests
- Documentation: See `/knowledge` directory for detailed guides
- Community: Join our Telegram for support and discussions