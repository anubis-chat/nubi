# NUBI Platform Configuration

## Current Active Settings

### Platform Status:
- **Telegram**: ✅ ENABLED - Can respond to messages
- **Discord**: ✅ ENABLED - Can respond to messages  
- **Twitter/X**: 🔍 MONITORING ONLY - No interactions

### Twitter Configuration:
- **Mode**: Read-only monitoring
- **Can Post**: ❌ No
- **Can Reply**: ❌ No
- **Can Like**: ❌ No
- **Can Retweet**: ❌ No
- **Purpose**: Data gathering and timeline monitoring only

### Required Setup:
1. **Telegram Bot**: Add `TELEGRAM_BOT_TOKEN` to .env when ready
2. **Discord Bot**: Add `DISCORD_API_TOKEN` to .env when ready
3. **OpenAI**: Ensure `OPENAI_API_KEY` is set in .env

### Safety Features:
- All raid features disabled
- Twitter posting disabled
- Dry run mode enabled for Twitter
- Anti-detection systems active
- Emotional intelligence enabled

## To Enable Platforms:

### For Telegram:
```bash
# Add to .env:
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=your_channel_id_here
```

### For Discord:
```bash
# Add to .env:
DISCORD_APPLICATION_ID=your_app_id_here
DISCORD_API_TOKEN=your_bot_token_here
```

### For Twitter Interactions (When Ready):
```bash
# Change in .env:
TWITTER_READ_ONLY_MODE=false
TWITTER_INTERACTION_ENABLE=true
TWITTER_ENABLE_REPLIES=true
TWITTER_DRY_RUN=false
```

## Running NUBI:
```bash
# Development mode
elizaos dev

# Production mode
elizaos start
```

NUBI will automatically connect to configured platforms and respond only on Telegram and Discord.