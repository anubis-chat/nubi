# NUBI Discord Bot Guide

## Bot Information
- **Application ID:** 1407352492383277197
- **Username:** NUBI
- **Status:** Active ✅

## For Regular Users

### Getting Started
1. **In servers:** Mention @NUBI to start a conversation
2. **Direct messages:** Send any message to the bot
3. **Natural conversation:** No commands needed - just chat naturally

### How to Chat
- **Mention the bot:** @NUBI followed by your message
- **Direct messages:** Bot responds to all DMs automatically
- **Natural language:** Ask about Web3, DeFi, Solana, or general topics
- **Personality:** Witty, engaging, knowledgeable about crypto and technology

### Features
- ✅ Natural language conversation
- ✅ Context-aware responses
- ✅ Web3 and DeFi knowledge
- ✅ Personality persistence
- ✅ Multi-turn conversations

## For Server Administrators

### Adding NUBI to Your Server

#### Option 1: OAuth2 Link
Use the following link with your Application ID:
```
https://discord.com/api/oauth2/authorize?client_id=1407352492383277197&permissions=274877958144&scope=bot
```

#### Option 2: Manual Addition
1. Go to Discord Developer Portal
2. Use Application ID: 1407352492383277197
3. Generate invite link with required permissions
4. Add to your server

### Required Permissions
- **Send Messages** - Core functionality
- **Read Message History** - Context understanding
- **Embed Links** - Rich responses
- **Attach Files** - Media sharing (when applicable)
- **View Channels** - Access to channels
- **Read Messages/View Channels** - Monitor mentions

### Recommended Permissions
```
- Send Messages
- Send Messages in Threads
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Use External Emojis
- View Channels
```

### Bot Configuration
The bot responds to:
- Direct mentions (@NUBI)
- Direct messages
- No slash commands required
- No prefix needed

## For Moderators

### Your Role
Discord moderators help maintain community standards and assist users with bot interactions.

### Key Responsibilities
- Guide new users on how to interact with NUBI
- Report technical issues to administrators
- Help maintain positive community atmosphere
- Ensure bot usage follows server rules

### Bot Behavior
- Responds only when mentioned or in DMs
- Maintains conversation context
- Follows server rules and guidelines
- No moderation commands (uses Discord's built-in moderation)

## Technical Information

### Integration Details
- **Framework:** ElizaOS with Discord plugin
- **Language Model:** OpenAI GPT
- **Response Time:** Typically 1-3 seconds
- **Context Window:** Maintains conversation history

### Environment Configuration
```bash
DISCORD_APPLICATION_ID=1407352492383277197
DISCORD_API_TOKEN=your_bot_token_here
```

### Current Features
- ✅ Natural language processing
- ✅ Mention-based activation
- ✅ DM support
- ✅ Multi-server support
- ✅ Conversation memory
- ✅ Personality system

### Planned Features
- 🔧 Voice channel support
- 🔧 Slash commands
- 🔧 Server-specific configurations
- 🔧 Integration with raid system

## Troubleshooting

### Bot Not Responding
1. **Check permissions:** Ensure bot has Send Messages permission
2. **Verify mention:** Use @NUBI (exact username)
3. **Server outages:** Bot may be restarting
4. **Rate limits:** Wait a few seconds between messages

### Common Issues
- **No response to messages:** Make sure to mention the bot with @
- **Can't see bot online:** Check bot status in member list
- **DMs not working:** Ensure your DMs are open for server members
- **Delayed responses:** High load may cause slight delays

### Getting Help
- **Technical issues:** Contact @dexploarerdev on Telegram
- **General questions:** Ask in the X community
- **Server-specific:** Contact your server administrators

## Community & Support

### Official Links
- **X Platform:** [@AnubisChat](https://x.com/AnubisChat)
- **X Bot Account:** [@UnderworldAgent](https://x.com/UnderworldAgent)
- **X Community:** https://x.com/i/communities/1955910343378505822
- **Hashtags:** #AnubisChat #Anubis #anubisai #OpenSource

### Team Contacts
- **dEXploarer** (Co-Founder)
  - Discord: skirrskirrr
  - X: [@dEXploarer](https://x.com/dEXploarer)
  - Telegram: @dexploarerdev

- **SYMBiEX** (Co-Founder)
  - Discord: cidsociety
  - X: [@SYMBiEX](https://x.com/SYMBiEX)
  - Telegram: @SYMBiEX

## Best Practices

### For Users
- Be patient - complex questions may take a moment
- Provide context for better responses
- Use mentions in busy channels
- Keep conversations respectful

### For Server Owners
- Create a dedicated bot channel for testing
- Set appropriate channel permissions
- Inform users about bot capabilities
- Monitor bot usage for server health

### For Optimal Performance
- Avoid spam mentioning
- Allow bot to complete responses
- Use clear, specific questions
- Respect rate limits

---

**Developed by SYMLabs**  
dEXploarer & SYMBiEX - Co-Founders