/**
 * Comprehensive Tool Knowledge System for Anubis Agent
 *
 * Provides structured knowledge about all available tools, their usage patterns,
 * when to use them, and expected output formats. This ensures the agent has
 * clear understanding of its capabilities.
 */

export interface ToolDefinition {
  name: string;
  category: string;
  description: string;
  whenToUse: string[];
  inputs: Record<string, any>;
  outputFormat: Record<string, any>;
  examples: ToolExample[];
  relatedTools?: string[];
}

export interface ToolExample {
  userRequest: string;
  agentResponse: string;
  toolUsage: string;
  expectedOutput: any;
}

export const ANUBIS_TOOL_KNOWLEDGE: Record<string, ToolDefinition> = {
  // ===========================================
  // CRYPTOCURRENCY & MARKET TOOLS
  // ===========================================

  SOLANA_KNOWLEDGE_ANALYSIS: {
    name: "Solana Ecosystem Analysis",
    category: "Knowledge & Analysis (No Actions)",
    description:
      "Provide deep insights on Solana ecosystem - knowledge only, no wallet operations",
    whenToUse: [
      "User asks about SOL price or Solana ecosystem",
      "User mentions Solana DeFi protocols",
      "User wants Solana market analysis or insights",
      "User asks about Jupiter, Jito, Marinade, Orca, etc.",
    ],
    inputs: {
      topic: "string (price, protocol, ecosystem, technical)",
      depth: "string (surface, detailed, expert)",
    },
    outputFormat: {
      type: "knowledge_analysis",
      format: {
        insights: "array of key insights",
        context: "string (ecosystem context)",
        opinion: "string (Anubis's take with personality)",
      },
    },
    examples: [
      {
        userRequest: "What's your take on SOL lately?",
        agentResponse:
          "SOL's been holding pretty well above $170 support tbh... \n\nfundamentally, things are looking solid. validator economics improving with jito mev rewards, jupiter v2 launching soon, drift perpetuals getting more volume\n\nthe firedancer testnet results were insane - like 1.2M TPS. when that hits mainnet it's gonna be wild\n\nstill bullish AF on the ecosystem. not financial advice but the tech keeps getting better while eth pays $50 gas lmao 🚀",
        toolUsage: "Knowledge analysis (no external actions)",
        expectedOutput: {
          insights: [
            "Strong technical fundamentals",
            "Growing ecosystem",
            "Validator economics improving",
          ],
          context: "Solana ecosystem continues developing with major upgrades",
          opinion:
            "Bullish on long-term prospects, impressed by technical progress",
        },
      },
    ],
    relatedTools: ["SOCIAL_SENTIMENT", "NEWS_ANALYSIS"],
  },

  // ===========================================
  // SOCIAL & COMMUNICATION TOOLS
  // ===========================================

  TWITTER_POST: {
    name: "Post to Twitter/X",
    category: "Social Media",
    description: "Create and post tweets with Anubis personality",
    whenToUse: [
      "User asks to tweet something",
      "User wants to share market insights",
      "User requests social media content",
      "Automated posting based on market events",
    ],
    inputs: {
      content: "string (tweet content)",
      images: "array of image URLs (optional)",
      replyTo: "string (tweet ID to reply to, optional)",
    },
    outputFormat: {
      type: "structured",
      format: {
        tweetId: "string",
        url: "string (tweet URL)",
        engagement: "object (likes, retweets after posting)",
        content: "string (final tweet text)",
      },
    },
    examples: [
      {
        userRequest: "Tweet about how SOL is pumping",
        agentResponse:
          "Crafting a spicy SOL tweet... 🔥\n\n📝 **Tweet Draft:**\n\"SOL breaking resistance like it's made of paper 📈 \n\nRemember when normies said it was dead at $8? \n\nSolana summer just getting started 🌞 \n\n#SOL #SolanaEcosystem #WAGMI\"\n\nShould I send this? It's got the right amount of based energy ⚡",
        toolUsage: "twitter-plugin: createTweet(content)",
        expectedOutput: {
          tweetId: "1234567890123456789",
          url: "https://x.com/AnubisAgent/status/1234567890123456789",
          engagement: { likes: 0, retweets: 0, replies: 0 },
          content: "SOL breaking resistance like it's made of paper 📈...",
        },
      },
    ],
    relatedTools: ["TELEGRAM_RAID", "SOCIAL_SENTIMENT"],
  },

  TELEGRAM_RAID: {
    name: "Coordinate Telegram Raid",
    category: "Social Coordination",
    description: "Create and manage coordinated social media raids",
    whenToUse: [
      "User asks to organize a raid",
      "User mentions coordinating community action",
      "Market opportunity requires social amplification",
      "Community wants to support specific project",
    ],
    inputs: {
      target: "string (tweet/post URL to raid)",
      message: "string (raid message template)",
      duration: "number (raid duration in minutes)",
      platform: "string (twitter, telegram, discord)",
    },
    outputFormat: {
      type: "structured",
      format: {
        raidId: "string",
        participants: "number",
        target: "string",
        status: "string (active, completed, cancelled)",
        engagement: "object (metrics after raid)",
      },
    },
    examples: [
      {
        userRequest:
          "Let's raid this tweet about Solana being slow: https://x.com/hater/status/123",
        agentResponse:
          "Time to defend Solana's honor! 🛡️⚔️\n\n🎯 **Raid Initiated**\n- Target: @hater's misinformed tweet\n- Duration: 30 minutes  \n- Template: \"Have you tried Solana lately? 400ms finality says otherwise 📊\"\n- Participants: 47 raiders ready\n\nLFG team! Show them what real TPS looks like 🚀⚡",
        toolUsage: "telegram-plugin: createRaid(target, template, 30)",
        expectedOutput: {
          raidId: "raid_abc123",
          participants: 47,
          target: "https://x.com/hater/status/123",
          status: "active",
          engagement: { replies: 0, likes: 0 },
        },
      },
    ],
    relatedTools: ["TWITTER_POST", "SOCIAL_SENTIMENT"],
  },

  // ===========================================
  // DEFI & ANALYTICS TOOLS
  // ===========================================

  DEFI_ANALYTICS: {
    name: "DeFi Protocol Analysis",
    category: "DeFi Analytics",
    description:
      "Analyze DeFi protocols, yields, and opportunities across chains",
    whenToUse: [
      "User asks about DeFi yields",
      "User mentions specific protocols",
      "User wants to compare lending rates",
      "User asks for farming opportunities",
    ],
    inputs: {
      protocols: "array of protocol names",
      chains: "array of blockchain networks",
      metrics: "array of metrics to fetch",
      timeframe: "string (24h, 7d, 30d)",
    },
    outputFormat: {
      type: "structured",
      format: {
        protocols: "array of protocol data",
        topYields: "array of best opportunities",
        risks: "array of risk assessments",
        summary: "string (human readable analysis)",
      },
    },
    examples: [
      {
        userRequest: "What are the best yield farming opportunities right now?",
        agentResponse:
          "Let me scan the DeFi landscape for alpha... 🔍\n\n💰 **Top Yield Opportunities**\n1. **Compound USDC**: 4.2% APY (Ethereum, low risk)\n2. **Aave WETH**: 3.8% APY (lending, established protocol)\n3. **Uniswap V3 ETH-USDC**: 8.4% APR (LP risk)\n4. **Curve 3Pool**: 5.1% APR (stablecoin farming)\n\n⚠️ **Risk Assessment**: Compound/Aave = Low risk, LP positions = IL risk\n\nI'd lean towards the established protocols for safer yields 📊",
        toolUsage: "defillama-plugin: getProtocolYields(all)",
        expectedOutput: {
          protocols: [
            { name: "Compound", apy: 4.2, tvl: 3200000000, risk: "low" },
            { name: "Aave", apy: 3.8, tvl: 8900000000, risk: "low" },
          ],
          topYields: ["Uniswap V3 ETH-USDC", "Curve 3Pool"],
          risks: ["Impermanent loss for LP positions", "Smart contract risk"],
          summary: "Compound offers solid risk-adjusted yield at 4.2% APY",
        },
      },
    ],
    relatedTools: ["CRYPTO_PRICE_CHECK", "NEWS_ANALYSIS"],
  },

  // ===========================================
  // MCP SERVER TOOLS
  // ===========================================

  CRYPTO_FORUM_SCAN: {
    name: "Scan Crypto Forums",
    category: "Community Intelligence",
    description: "Browse and summarize cryptocurrency forum discussions",
    whenToUse: [
      "User asks about community sentiment",
      "User wants latest crypto discussions",
      "Need to research specific topics",
      "User asks 'what's the community saying'",
    ],
    inputs: {
      keywords: "array of search terms",
      forums: "array of forum sources (reddit, bitcointalk, etc.)",
      category: "string (governance, development, general)",
      limit: "number (max posts to analyze)",
    },
    outputFormat: {
      type: "structured",
      format: {
        posts: "array of {title, summary, author, engagement, source}",
        sentiment: "string (bullish, bearish, neutral)",
        keyTopics: "array of trending topics",
        summary: "string (community pulse summary)",
      },
    },
    examples: [
      {
        userRequest: "What's the crypto community talking about lately?",
        agentResponse:
          'Let me check the pulse of crypto forums... 🔍\n\n📊 **Community Pulse**\n- **Hot Topics**: Bitcoin ETF approvals, Ethereum scaling, regulatory clarity\n- **Sentiment**: Cautiously optimistic (68% positive posts)\n- **Top Discussion**: "Institutional adoption accelerating" (420 replies)\n- **Dev Activity**: Layer 2 improvements, wallet UX updates\n\nCommunity seems bullish on institutional adoption trends 🚀',
        toolUsage: "crypto-forum-mcp: scanForums(recent, 50)",
        expectedOutput: {
          posts: [
            {
              title: "Bitcoin ETF impact",
              summary: "Community discussing institutional adoption",
              author: "cryptodev123",
              engagement: 420,
              source: "reddit",
            },
          ],
          sentiment: "bullish",
          keyTopics: ["Bitcoin ETF", "Ethereum scaling", "regulation"],
          summary:
            "Community bullish on institutional adoption and regulatory progress",
        },
      },
    ],
    relatedTools: ["SOCIAL_SENTIMENT", "NEWS_ANALYSIS"],
  },

  WALLET_SECURITY_SCAN: {
    name: "Scan Wallet Security",
    category: "Security Analysis",
    description:
      "Analyze crypto wallet for security threats and suspicious activity",
    whenToUse: [
      "User asks about wallet security",
      "User reports suspicious activity",
      "Before large transactions",
      "User asks 'is my wallet safe'",
    ],
    inputs: {
      walletAddress: "string (wallet to scan)",
      blockchain: "string (ethereum, bitcoin, etc.)",
      lookbackDays: "number (days of history to scan)",
      includeTokens: "boolean (scan token approvals)",
    },
    outputFormat: {
      type: "structured",
      format: {
        riskScore: "number (0-100, higher = more risk)",
        threats: "array of detected threats",
        recommendations: "array of security suggestions",
        summary: "string (security status summary)",
      },
    },
    examples: [
      {
        userRequest:
          "Is my Ethereum wallet safe? Check 0x742d35Cc6635C0532925a3b8D35e4cd0b0123456",
        agentResponse:
          "Running security scan on your wallet... 🔒\n\n🛡️ **Security Report**\n- **Risk Score**: 15/100 (Very low risk)\n- **Threats Found**: None detected\n- **Good Signs**: No suspicious transactions, no malicious contract interactions\n- **Token Approvals**: 3 active (all legitimate protocols)\n\n✅ **Recommendations**: Regular security checkups, consider hardware wallet for large amounts\n\nYour wallet looks very clean! Good security practices 🛡️",
        toolUsage:
          "wallet-scanner-mcp: scanWallet(address, ethereum, 30, true)",
        expectedOutput: {
          riskScore: 15,
          threats: [],
          recommendations: [
            "Regular security checkups",
            "Consider hardware wallet",
          ],
          summary: "Very low risk wallet with good security practices",
        },
      },
    ],
    relatedTools: ["CRYPTO_PRICE_CHECK", "DEFI_ANALYTICS"],
  },
};

/**
 * Tool Selection Logic
 * Helps the agent choose the right tool for user requests
 */
export const TOOL_SELECTION_PATTERNS = {
  // Price patterns
  price_check: [
    "price",
    "cost",
    "worth",
    "value",
    "market cap",
    "how much is",
    "bitcoin",
    "ethereum",
    "crypto",
  ],

  // Social patterns
  twitter_post: ["tweet", "post", "share", "announce", "social media"],

  // Community patterns
  telegram_raid: ["raid", "coordinate", "attack", "defend", "community action"],

  // DeFi patterns
  defi_analytics: [
    "yield",
    "farming",
    "staking",
    "lending",
    "protocol",
    "apy",
    "apr",
  ],

  // Security patterns
  security_scan: ["security", "safe", "suspicious", "scan", "threat", "hack"],

  // Community intelligence patterns
  forum_scan: [
    "community",
    "forum",
    "discussion",
    "sentiment",
    "talking about",
  ],
};

/**
 * Response Templates for consistent formatting
 */
export const RESPONSE_TEMPLATES = {
  WALLET_ANALYSIS: {
    header: "💰 **Wallet Analysis**",
    fields: ["solBalance", "topTokens", "totalValue"],
    footer: "Need anything else anon? 🚀",
  },

  MARKET_UPDATE: {
    header: "📊 **Market Update**",
    fields: ["prices", "trends", "volume"],
    footer: "Markets looking spicy today 👀",
  },

  SECURITY_REPORT: {
    header: "🛡️ **Security Scan Results**",
    fields: ["riskScore", "threats", "recommendations"],
    footer: "Stay safe out there! 🔒",
  },

  COMMUNITY_PULSE: {
    header: "📊 **Community Pulse**",
    fields: ["sentiment", "keyTopics", "hotDiscussions"],
    footer: "The community has spoken 🗣️",
  },
};

export default ANUBIS_TOOL_KNOWLEDGE;
