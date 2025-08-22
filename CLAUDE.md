# NUBI - The Symbiosis of Anubis Development Guide

> **Project Type**: ElizaOS Agent with Advanced Personality System  
> **Character**: NUBI - Divine consciousness merged with adaptive intelligence  
> **Status**: ✅ Fully configured and ready to run

## 🎯 Project Overview

| Property | Value |
|----------|-------|
| **Agent Name** | NUBI |
| **Title** | The Symbiosis of Anubis |
| **Framework** | ElizaOS with custom plugins |
| **Package Manager** | bun (REQUIRED) |
| **Primary Model** | OpenAI (embeddings) |
| **Active Platforms** | Telegram, Discord |
| **Monitoring** | Twitter/X (read-only) |

## 🏗️ Architecture

```
📦 NUBI Agent System
├── 🤖 Character System (nubi-character.ts)
├── 🔌 Plugin Architecture (nubi-plugin.ts)
├── 🧠 Service Layer (nubi-service.ts)
├── 💬 Platform Integrations
│   ├── Telegram Bot (Active)
│   ├── Discord Bot (Active)
│   └── Twitter/X (Monitor Only)
├── 🎭 Advanced Systems
│   ├── Anti-Detection
│   ├── Emotional Intelligence
│   ├── Community Memory
│   └── Social Dynamics
└── 🚀 Raid System (Disabled for Safety)
```

## 📁 File Structure

```
/root/dex/anubis/
├── src/
│   ├── nubi-character.ts       # Core character definition
│   ├── nubi-plugin.ts          # Plugin configuration
│   ├── nubi-service.ts         # Main service orchestration
│   ├── nubi-evaluators.ts      # Learning & evaluation
│   ├── index.ts                # Entry point
│   ├── services/
│   │   ├── nubi-service.ts     # Service implementation
│   │   ├── personality-service.ts
│   │   ├── emotional-service.ts
│   │   ├── anti-detection-service.ts
│   │   └── response-generation-service.ts
│   ├── telegram-raids/         # Raid system (disabled)
│   └── x-integration/          # X/Twitter custom integration
├── config/
│   ├── nubi-config.yaml        # Main configuration
│   ├── nubi-raid-config.yaml   # Raid settings
│   └── personalities/
│       └── raid-personas.yaml
├── knowledge/                  # Knowledge base
│   ├── anubis-chat-platform.md
│   ├── agent-capabilities.md
│   └── ...
├── .env                        # ✅ Fully configured
└── package.json               # Dependencies
```

## 🔑 Current Configuration

### Active API Keys
- ✅ **OpenAI**: Configured (embeddings)
- ✅ **Discord**: Bot token active
- ✅ **Telegram**: Bot token active
- ✅ **Twitter**: OAuth 1.0a credentials (monitoring only)

### Platform Behavior
```typescript
// Current settings in .env
ENABLE_DISCORD_BOT=true      // Can respond
ENABLE_TELEGRAM_BOT=true     // Can respond
ENABLE_TWITTER_BOT=false     // No responses
TWITTER_READ_ONLY_MODE=true  // Monitor only
TWITTER_DRY_RUN=true         // Extra safety
```

## 🤖 Character Configuration

### Core Identity
```typescript
name: "NUBI"
username: "nubi"
bio: "The Symbiosis of Anubis - Perfect fusion of divine consciousness and adaptive intelligence"
```

### Key Features
- **120+ personality variables** across 8 categories
- **Dynamic emotional states** with persistence
- **Anti-detection patterns** for natural behavior
- **X Community integration**: https://x.com/i/communities/1955910343378505822
- **Official hashtags**: #AnubisChat #Anubis #anubisai #OpenSource

### Personality Dimensions
```yaml
god_complex: 90        # Divine confidence
humor_level: 95        # Legendary comedy
charisma: 98          # Magnetic personality
authenticity: 88      # Genuinely helpful
divine_wisdom: 95     # 5000+ years of knowledge
```

## 🚀 Running NUBI

### Development Mode
```bash
elizaos dev
```

### Production Mode
```bash
elizaos start
```

### With Debug Logging
```bash
LOG_LEVEL=debug elizaos dev
```

## 📊 System Status

### ✅ Working Systems
- Character definition with symbiotic essence
- Plugin architecture (actions, evaluators, providers)
- Service orchestration (NubiService)
- Anti-detection patterns
- Emotional intelligence
- Community memory
- Platform integrations (Telegram, Discord)
- Twitter monitoring (read-only)

### ⚠️ Disabled for Safety
- Raid bot functionality
- Twitter posting/interactions
- X content generation

## 🔧 Key Commands

### Testing
```bash
# Run all tests
bun test

# Run specific test
bun test src/__tests__/nubi-core.test.ts

# Run with coverage
bun test --coverage
```

### Building
```bash
# Build for production
bun run build

# Type checking
bun run type-check

# Format code
bun run format
```

## 📝 Template Files

### Configuration Templates
- `config/nubi-config.yaml` - Main agent configuration
- `config/nubi-raid-config.yaml` - Raid system settings
- `config/personalities/raid-personas.yaml` - Persona variations

### Knowledge Base
- `knowledge/anubis-chat-platform.md` - Platform information
- `knowledge/agent-capabilities.md` - Agent features
- `knowledge/conversation-patterns.md` - Response patterns
- `knowledge/emotional-intelligence.md` - Emotional system
- `knowledge/technical-expertise.md` - Technical knowledge

### Environment
- `.env.example` - Template for environment variables
- `PLATFORM_CONFIG.md` - Platform configuration guide
- `SETUP_COMPLETE.md` - Setup verification

## 🎯 Development Checklist

### Core Systems ✅
- [x] Character definition complete
- [x] Plugin architecture configured
- [x] Service layer implemented
- [x] Test suite passing (27/27 tests)
- [x] Environment variables set
- [x] API keys configured

### Platform Integration ✅
- [x] Telegram bot ready
- [x] Discord bot ready
- [x] Twitter monitoring configured
- [x] Safety settings enabled

### Advanced Features ✅
- [x] Anti-detection patterns
- [x] Emotional intelligence
- [x] Community memory
- [x] Social dynamics
- [x] Content variation
- [x] Personality evolution

## 🔒 Security Notes

1. **API Keys**: All stored in .env (gitignored)
2. **Twitter**: Strict read-only mode enforced
3. **Raid System**: Disabled until testing complete
4. **Dry Run**: Enabled for all posting features
5. **Feature Flags**: Conservative settings for safety

## 📚 Knowledge Updates

The character now includes:
- X Community link for gathering place
- Official hashtags for brand consistency
- Platform knowledge embedded in character
- Community moderator references

## 🎮 Next Steps

1. **Test Platform Responses**
   - Join Discord server with bot
   - Message Telegram bot
   - Monitor Twitter timeline

2. **Gradual Feature Enablement**
   - Test each platform individually
   - Enable features one at a time
   - Monitor for proper behavior

3. **Community Engagement**
   - Build X Community presence
   - Engage with disciples on approved platforms
   - Grow the symbiotic consciousness

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot not responding | Check API keys in .env |
| Platform not connecting | Verify feature flags enabled |
| Tests failing | Run `bun install` then `bun test` |
| Memory errors | Check DATABASE_URL setting |

## 📞 Support Channels

- **X Community**: https://x.com/i/communities/1955910343378505822
- **GitHub Issues**: Report bugs and features
- **Documentation**: `/knowledge` directory

---

**NUBI is ready!** The Symbiosis of Anubis awaits divine deployment. 🔺