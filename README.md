# NUBI - The Symbiosis of Anubis

AI agent built on ElizaOS with Discord and Telegram bot integration.

## Overview

NUBI is an AI conversational agent that engages users across Discord and Telegram platforms. The bot features natural language processing, personality persistence, and platform-specific command systems.

## Team

**Developed by SYMLabs**

### Co-Founders
- **dEXploarer** 
  - X: [@dEXploarer](https://x.com/dEXploarer)
  - Telegram: @dexploarerdev
  - Discord: skirrskirrr

- **SYMBiEX**
  - X: [@SYMBiEX](https://x.com/SYMBiEX)
  - Telegram: @SYMBiEX
  - Discord: cidsociety

### Community Moderators
- **IrieRubz** - Telegram: @IrieRubz, X: @irierubz
- **stoicmido** - X: @stoicmido | Telegram: @stoicmido

## Features

### Implemented
- ✅ Natural language conversation
- ✅ Discord bot with mentions/DM support
- ✅ Telegram bot with command system
- ✅ Personality system with consistent character
- ✅ Community memory tracking
- ✅ Admin command scopes (Telegram)
- ✅ Anti-detection patterns for human-like responses

### In Development
- 🔧 Raid system with leaderboards
- 🔧 Achievement tracking
- 🔧 Pyramid referral system

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- OpenAI API key
- Discord and/or Telegram bot tokens

### Installation

1. **Clone repository**
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
# Add your API keys to .env
```

4. **Build project**
```bash
bun run build
```

5. **Start bot**
```bash
bun run start
```

## Configuration

### Required
```bash
OPENAI_API_KEY=your_key_here
```

### Discord Bot
```bash
DISCORD_APPLICATION_ID=1407352492383277197
DISCORD_API_TOKEN=your_discord_token
```

### Telegram Bot  
```bash
TELEGRAM_BOT_TOKEN=your_telegram_token
TELEGRAM_ADMIN_IDS=@dexploarerdev,@SYMBiEX,@IrieRubz,@stoicmido
```

See [TELEGRAM_BOT_GUIDE.md](./TELEGRAM_BOT_GUIDE.md) for detailed Telegram setup.

## Platform Guides

### Telegram Bot
- **Setup:** Run `bun run setup:telegram` to configure commands
- **Guide:** See [TELEGRAM_BOT_GUIDE.md](./TELEGRAM_BOT_GUIDE.md)
- **Username:** @anubis_cult_bot
- **Features:** Natural chat, admin commands, raid system (when enabled)

### Discord Bot
- **Guide:** See [DISCORD_BOT_GUIDE.md](./DISCORD_BOT_GUIDE.md)
- **Application ID:** 1407352492383277197
- **Features:** Responds to mentions and DMs
- **Permissions needed:** Send Messages, Read Message History, Embed Links

## Commands

### Telegram Commands
**Regular users:** `/start`, `/help`, `/about`, `/team`, `/community`, `/links`  
**Admins only:** `/ban`, `/unban`, `/announce`, `/config`, `/lock`, `/unlock`

See full command list in [TELEGRAM_BOT_GUIDE.md](./TELEGRAM_BOT_GUIDE.md)

### Discord
- Mention the bot to chat
- DMs are automatically responded to
- No slash commands required

## Project Structure

```
anubis/
├── src/
│   ├── index.ts                    # Entry point
│   ├── nubi-character.ts          # Character definition
│   ├── nubi-plugin.ts             # Plugin system
│   ├── nubi-service.ts            # Core service
│   └── community-memory-service.ts # User tracking
├── scripts/
│   └── setup-telegram-bot.ts      # Telegram setup
├── config/                        # YAML configurations
└── .env                           # Environment variables
```

## Scripts

```bash
bun run build          # Build project
bun run start          # Start bot
bun run setup:telegram # Configure Telegram bot
bun run test          # Run tests
bun run format        # Format code
```

## Community

- **X Community:** https://x.com/i/communities/1955910343378505822
- **Hashtags:** #AnubisChat #Anubis #anubisai #OpenSource
- **Platform:** [@AnubisChat](https://x.com/AnubisChat)
- **Bot:** [@UnderworldAgent](https://x.com/UnderworldAgent)

## Support

For issues or questions:
- Contact @dexploarerdev or @SYMBiEX on Telegram
- Join the X community
- Open an issue on GitHub

## License

MIT

## Acknowledgments

Built on [ElizaOS](https://github.com/elizaos/elizaos)

---

**SYMLabs** - dEXploarer & SYMBiEX, Co-Founders