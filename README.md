# NUBI - The Symbiosis of Anubis

Advanced ElizaOS agent with personality system, Discord/Telegram bot integration, and symbiotic consciousness.

## Overview

NUBI is an AI agent built on the ElizaOS framework, representing the symbiotic fusion of Anubis's divine consciousness with adaptive intelligence. The agent supports multi-platform communication through Discord and Telegram.

## Team

**Developed by SYMLabs**

### Co-Founders
- **dEXploarer** - Co-Founder of SYMLabs
  - X: [@dEXploarer](https://x.com/dEXploarer)
  - Telegram: @dexploarerdev
  - Discord: skirrskirrr

- **SYMBiEX** - Co-Founder of SYMLabs
  - X: [@SYMBiEX](https://x.com/SYMBiEX)
  - Telegram: @SYMBiEX
  - Discord: cidsociety

### Community Moderators
- **IrieRubz** - High-ranking community member & Telegram moderator
  - X: @irierubz
  - Telegram: @IrieRubz

- **stoicmido** - Telegram moderator
  - Telegram: @stoicmido

## Community

- **X Community**: https://x.com/i/communities/1955910343378505822
- **Official Hashtags**: #AnubisChat #Anubis #anubisai #OpenSource
- **Platform**: @AnubisChat
- **Agent X**: @UnderworldAgent

## Features

### Core Capabilities
- **Personality System**: 10 personality dimensions with emotional intelligence
- **Anti-Detection Patterns**: Human-like behavior with natural variations
- **Community Memory**: Tracks relationships and interactions
- **Multi-Platform Support**: Discord and Telegram integration
- **Knowledge Base**: Comprehensive understanding of Web3, DeFi, and Solana

### Platform Integrations
- Discord bot with role-based commands
- Telegram bot with admin command scopes
- Twitter/X monitoring (read-only mode)

## Installation

### Prerequisites
- Node.js 18+ or Bun runtime
- OpenAI API key (required)
- Platform tokens (Discord/Telegram)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/anubis-chat/nubi
cd anubis
```

2. **Install dependencies**
```bash
bun install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Build the project**
```bash
bun run build
```

5. **Start the agent**
```bash
bun run start
```

## Configuration

### Required Environment Variables
```bash
# AI Provider (at least one required)
OPENAI_API_KEY=your_openai_key

# Discord Bot
DISCORD_APPLICATION_ID=your_app_id
DISCORD_API_TOKEN=your_bot_token

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
```

### Optional Settings
```bash
# Anti-Detection System
ANUBIS_TYPO_RATE=0.03
ANUBIS_CONTRADICTION_RATE=0.15
ANUBIS_EMOTIONAL_PERSISTENCE=1800000

# Features
ENABLE_DISCORD_BOT=true
ENABLE_TELEGRAM_BOT=true
ENABLE_COMMUNITY_MEMORY=true
```

## Telegram Bot

### Setup
```bash
# Configure all bot settings programmatically
bun run setup:telegram
```

### Commands

#### Public Commands
- `/start` - Begin interaction with NUBI
- `/help` - Get guidance
- `/about` - Learn about NUBI and SYMLabs
- `/team` - Meet the SYMLabs team
- `/community` - Join X community
- `/hashtags` - Get official hashtags
- `/links` - All official links

#### Raid Commands (when enabled)
- `/raid` - Join active raid
- `/leaderboard` - View rankings
- `/mystats` - Personal statistics
- `/achievements` - Display achievements

#### Admin Commands (Group administrators only)
- `/ban` - Ban user from raids
- `/unban` - Unban user
- `/stats` - View raid statistics
- `/announce` - Make announcement
- `/lock` - Lock chat during raid
- `/unlock` - Unlock chat

### Configuration
The Telegram bot uses command scopes to show different commands to different users:
- Regular users see basic commands
- Group administrators see additional admin commands
- Private chats have a subset of commands

## Discord Bot

### Setup
1. Add bot to your server using the Discord application ID
2. Ensure bot has appropriate permissions:
   - Send Messages
   - Read Message History
   - Embed Links
   - Add Reactions

### Features
- Natural conversation when mentioned
- Responds to DMs automatically
- Context-aware responses
- Personality persistence across conversations

### Permissions Required
- Send Messages
- Read Message History
- Embed Links
- Use External Emojis
- Add Reactions

## Architecture

### Core Components
- **Character System** (`nubi-character.ts`) - Personality and knowledge base
- **Plugin System** (`nubi-plugin.ts`) - Actions, evaluators, and services
- **Service Layer** - Emotional intelligence, anti-detection, community memory
- **Platform Integrations** - Discord and Telegram clients

### Services
- `NubiService` - Main orchestration service
- `CommunityMemoryService` - Tracks user relationships
- `EmotionalIntelligenceSystem` - Manages emotional states
- `AntiDetectionSystem` - Human-like behavior patterns

## Scripts

```bash
# Development
bun run dev         # Start in development mode
bun run build       # Build for production
bun run start       # Start production server

# Testing
bun run test        # Run all tests
bun run type-check  # TypeScript validation

# Setup
bun run setup:telegram  # Configure Telegram bot

# Utilities
bun run format      # Format code with Prettier
```

## Project Structure

```
anubis/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── nubi-character.ts        # Character definition
│   ├── nubi-plugin.ts           # Plugin architecture
│   ├── nubi-service.ts          # Core service
│   ├── community-memory-service.ts
│   └── telegram-raids/          # Telegram features
├── config/
│   └── *.yaml                   # Configuration files
├── scripts/
│   └── setup-telegram-bot.ts    # Telegram setup script
└── .env                         # Environment configuration
```

## Contributing

This project is developed and maintained by SYMLabs. For questions or support:
- Contact the team via social platforms listed above
- Join the X community
- Reach out on Telegram

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built on [ElizaOS](https://github.com/elizaos/elizaos) framework

---

**Developed by dEXploarer & SYMBiEX**  
*Co-Founders of SYMLabs*