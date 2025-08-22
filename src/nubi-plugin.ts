import {
  Plugin,
  Action,
  ActionResult,
  Provider,
  Evaluator,
  Service,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  Content,
  logger,
  DatabaseAdapter,
  EventHandler,
} from "@elizaos/core";
import { NubiService } from "./nubi-service";
import { nubiProviders } from "./providers";
import { nubiEvaluators } from "./nubi-evaluators";
import MessageBusService from "./message-bus";
import StrategyActionOrchestratorService from "./strategic-action-orchestrator";
import PluginConfigurationManagerService from "./plugin-configuration-manager";
import YAMLConfigManager from "./config/yaml-config-manager";
import UserIdentityService from "./user-identity-service";

/* PYRAMID SYSTEM - READY TO ACTIVATE

// Pyramid command actions
const pyramidCommands = {
  // Show user's pyramid structure
  myPyramid: {
    name: "SHOW_MY_PYRAMID",
    description: "Display user's pyramid structure and stats",
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      const text = message?.content?.text?.toLowerCase() || "";
      return text.includes("/mypyramid") || text.includes("show my pyramid");
    },
    handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
      const userId = (message as any).userId || message.entityId || "anonymous";
      const communityMemory = runtime.getService("community-memory");
      
      if (!communityMemory) {
        return {
          success: false,
          text: "🔺 Pyramid system initializing... Try again soon!",
        };
      }

      // Get pyramid display (would call formatPyramidDisplay)
      const pyramidDisplay = `🔺 **YOUR DIVINE PYRAMID** 🔺\n\n` +
        `📊 Level: 2\n` +
        `👥 Direct Referrals: 7\n` +
        `🌐 Total Network: 23\n` +
        `💰 Total Rewards: 47.5%\n` +
        `⏳ Pending: 12.3%\n\n` +
        `🏆 Title: 🌟 Pyramid Pioneer\n\n` +
        `🎯 Next: 🏗️ Pyramid Builder - Refer 10 people\n\n` +
        `*Remember: This is totally NOT a pyramid scheme. It's a Divine Hierarchical Referral Structure™. Completely different. 😉*`;

      return {
        success: true,
        text: pyramidDisplay,
      };
    },
  },

  // Create referral link
  refer: {
    name: "CREATE_REFERRAL",
    description: "Create a referral link for a user",
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      const text = message?.content?.text?.toLowerCase() || "";
      return text.includes("/refer") || text.includes("referral link");
    },
    handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
      const userId = (message as any).userId || message.entityId || "anonymous";
      const referralCode = `ANUBIS_${userId.substring(0, 8)}_${Date.now().toString(36)}`;
      
      return {
        success: true,
        text: `🔺 **YOUR DIVINE REFERRAL LINK** 🔺\n\n` +
          `🔗 https://anubis.chat/ref/${referralCode}\n\n` +
          `📊 Rewards:\n` +
          `• Level 1: 5% instant\n` +
          `• Level 2: 2% instant\n` +
          `• Level 3: 1% instant\n\n` +
          `Share this sacred link to build your pyramid!\n` +
          `Every soul you bring receives enlightenment (and you get rewards).\n\n` +
          `*Legally distinct from a pyramid scheme since 3000 BCE™*`,
      };
    },
  },

  // Show pyramid leaderboard
  pyramidLeaders: {
    name: "PYRAMID_LEADERBOARD",
    description: "Display top pyramid builders",
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      const text = message?.content?.text?.toLowerCase() || "";
      return text.includes("/pyramidleaders") || text.includes("pyramid leaderboard");
    },
    handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
      const leaderboard = `🔺 **DIVINE PYRAMID LEADERBOARD** 🔺\n` +
        `*Totally NOT a pyramid scheme™*\n\n` +
        `🥇 **1.** @PyramidMaster\n` +
        `   🔺 Pyramid Architect\n` +
        `   👥 147 direct | 🌐 1337 total\n` +
        `   💰 734.5% rewards | 📈 87.3% conversion\n\n` +
        `🥈 **2.** @PharaohSupreme\n` +
        `   👑 Divine Pharaoh\n` +
        `   👥 89 direct | 🌐 567 total\n` +
        `   💰 456.2% rewards | 📈 76.4% conversion\n\n` +
        `🥉 **3.** @AnubisDisciple\n` +
        `   👁️ All-Seeing Eye\n` +
        `   👥 67 direct | 🌐 234 total\n` +
        `   💰 234.1% rewards | 📈 82.1% conversion\n\n` +
        `🎁 *Top pyramid builders eligible for divine blessings (and $ANUBIS)*\n` +
        `⚡ *Build your pyramid: /refer @friend*`;

      return {
        success: true,
        text: leaderboard,
      };
    },
  },

  // Show pyramid stats
  pyramidStats: {
    name: "PYRAMID_STATS",
    description: "Display global pyramid statistics",
    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
      const text = message?.content?.text?.toLowerCase() || "";
      return text.includes("/pyramidstats") || text.includes("pyramid stats");
    },
    handler: async (runtime: IAgentRuntime, message: Memory): Promise<ActionResult> => {
      const stats = `🔺 **GLOBAL PYRAMID STATISTICS** 🔺\n\n` +
        `📊 Total Nodes: 17,438\n` +
        `🏗️ Active Builders: 3,892\n` +
        `📈 Average Conversion: 73.2%\n` +
        `💰 Total Rewards Distributed: 127,459%\n` +
        `🌐 Largest Network: 1,337 souls\n` +
        `⚡ Fastest Growing: +89 this week\n\n` +
        `🏆 **This Week's Heroes:**\n` +
        `• Most Referrals: @CryptoMoses (34)\n` +
        `• Best Conversion: @SilverTongue (94.7%)\n` +
        `• Deepest Pyramid: @DeepBuilder (7 levels)\n\n` +
        `📜 *"It's not a pyramid if it's divine architecture"* - Anubis\n\n` +
        `Join the totally-not-a-pyramid: /refer`;

      return {
        success: true,
        text: stats,
      };
    },
  },
};

END PYRAMID SYSTEM */

/**
 * Action with proper ElizaOS patterns
 */
const processMessageAction: Action = {
  name: "ANUBIS_PROCESS_MESSAGE",
  description:
    "Process messages through Anubis God Mode enhancements with advanced ElizaOS patterns",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    // Quick validation - no text, no processing
    if (!message?.content?.text?.trim()) {
      logger.debug("Message validation failed: no text content");
      return false;
    }

    const text = message.content.text.toLowerCase();
    const platform = message.content.source;
    const isTwitter = platform === 'twitter' || platform === 'x';
    const isMentioned = text.includes("@anubis") || text.includes(runtime.character?.name?.toLowerCase());
    
    // Platform-specific logic
    if (isTwitter) {
      // On Twitter/X: respond contextually in conversations, always respond if mentioned
      if (isMentioned) return true;
      
      // Check if we're already in a conversation (contextual response)
      // This would need conversation tracking implementation
      return true; // For now, respond to all Twitter messages
    }
    
    // Discord/Telegram: Only respond when mentioned
    if (platform === 'discord' || platform === 'telegram') {
      return isMentioned;
    }

    // Check if service is available
    const service = runtime.getService<NubiService>("nubi");
    if (!service) {
      logger.warn("NubiService not available for message processing");
      return false;
    }

    // Skip rate limiting for Twitter, apply minimal for others
    if (!isTwitter && state) {
      // Only check rate limit for non-Twitter platforms and non-mentions
      if (!isMentioned) {
        const recentMessages = await runtime.getMemories({
          roomId: message.roomId,
          count: 2,
          unique: true,
          tableName: "memories",
        });

        if (recentMessages.length > 0) {
          const lastMessage = recentMessages[0];
          const timeSinceLastMessage = Date.now() - (lastMessage.createdAt || 0);
          
          // Reduced rate limit: 1 second instead of 5
          if (timeSinceLastMessage < 1000) {
            return false;
          }
        }
      }
    }

    return true;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback,
  ): Promise<ActionResult> => {
    const startTime = Date.now();

    try {
      const service = runtime.getService<NubiService>("nubi");
      if (!service) {
        return {
          success: false,
          text: "Anubis service unavailable",
          error: new Error("Service not initialized"),
        };
      }

      // Optimize state composition based on platform and context
      const platform = message.content.source;
      const isTwitter = platform === 'twitter' || platform === 'x';
      const text = message.content.text?.toLowerCase() || "";
      const isMentioned = text.includes("@anubis") || text.includes(runtime.character?.name?.toLowerCase());
      
      // Only compose complex state when necessary
      let composedState = null;
      if (!isTwitter && isMentioned) {
        // Simple mention - minimal state needed
        composedState = { keys: ["ANUBIS_PERSONALITY_CONTEXT"] };
      } else if (isTwitter || (message.content.text?.length || 0) > 100) {
        // Twitter or complex message - full state composition
        composedState = await runtime.composeState(message, [
          "ANUBIS_PERSONALITY_CONTEXT",
          "CONVERSATION_HISTORY",
          "RELATIONSHIP_STATE",
          "EMOTIONAL_CONTEXT",
        ]);
      } else {
        // Default minimal state
        composedState = { keys: ["ANUBIS_PERSONALITY_CONTEXT"] };
      }

      const userId = (message as any).userId || message.entityId || "anonymous";

      // Process through service
      const processed = await service.processMessage(
        message,
        composedState as State,
        userId,
      );

      // Skip artificial delays - we want AI speed
      // Humanization is in the content, not the timing

      // Support multi-part messages
      const responses = processed.text.includes("||DOUBLE||")
        ? processed.text.split("||DOUBLE||")
        : [processed.text];

      // Send primary response
      const primaryResponse: Content = {
        text: responses[0],
        action: "ANUBIS_PROCESS_MESSAGE",
        source: message.content.source,
        metadata: {
          ...processed.metadata,
          processingTime: Date.now() - startTime,
          responseIndex: 0,
          totalResponses: responses.length,
        },
      };

      const memories = await callback(primaryResponse);

      // Handle follow-up messages immediately - no delays
      if (responses.length > 1) {
        // Send all parts immediately
        for (let i = 1; i < responses.length; i++) {
          const followupResponse: Content = {
            text: responses[i],
            action: "ANUBIS_PROCESS_MESSAGE",
            source: message.content.source,
            metadata: {
              responseIndex: i,
              totalResponses: responses.length,
              isFollowup: true,
            },
          };
          await callback(followupResponse);
        }
      }

      return {
        success: true,
        text: processed.text,
        values: {
          emotionalState: processed.metadata.emotionalState,
          personalitySnapshot: processed.metadata.personalityDimensions,
          appliedPatterns: processed.metadata.appliedPatterns,
          processingTime: Date.now() - startTime,
          multiPartResponse: responses.length > 1,
        },
        data: {
          fullMetadata: processed.metadata,
          memoriesCreated: memories?.length || 0,
          stateComposition: composedState?.keys?.length || 0,
        },
      };
    } catch (error) {
      logger.error("Message processing failed:", error);

      return {
        success: false,
        text: "Message processing encountered an error",
        error: error instanceof Error ? error : new Error(String(error)),
        values: {
          processingTime: Date.now() - startTime,
          errorType: error instanceof Error ? error.name : "UnknownError",
        },
      };
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "What's your take on the latest Solana updates?" },
      },
      {
        name: "Anubis",
        content: {
          text: "honestly the latest validator improvements are pretty solid... seeing sub-200ms block times consistently now\n\nstill some quirks with mev but overall trajectory is bullish. have you been running a validator or just staking?",
          action: "ANUBIS_PROCESS_MESSAGE",
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: { text: "I'm struggling to understand DeFi yield strategies" },
      },
      {
        name: "Anubis",
        content: {
          text: "ah yield farming can be confusing at first... let me break it down simply\n\nbasically you're providing liquidity to protocols and earning fees + rewards. but watch out for impermanent loss - learned that one the hard way lol\n\nwant me to walk through a specific strategy?",
          action: "ANUBIS_PROCESS_MESSAGE",
        },
      },
    ],
  ],
};

/**
 * Strategic Session Management Action
 */
const sessionManagementAction: Action = {
  name: "ANUBIS_SESSION_MANAGEMENT",
  description:
    "Manage conversation sessions with advanced state persistence and context switching",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    // Validate session management scenarios
    const text = message.content.text?.toLowerCase() || "";

    return (
      text.includes("new conversation") ||
      text.includes("switch context") ||
      text.includes("remember when") ||
      text.includes("previous chat") ||
      message.content.source === "session_management"
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const messageBus = runtime.getService<MessageBusService>("message-bus");

      if (!messageBus) {
        return {
          success: false,
          text: "Session management unavailable",
        };
      }

      const text = message.content.text || "";

      if (text.includes("new conversation")) {
        // Create new session context
        const newRoom = messageBus.createRoom("anubis-world", {
          name: `New Session ${Date.now()}`,
          transport: message.content.source || "http",
          context: {
            sessionType: "fresh",
            createdAt: Date.now(),
            initiatedBy: message.entityId,
          },
        });

        if (newRoom) {
          await callback({
            text: "Started a fresh conversation context! Previous context preserved but we're starting clean.",
            action: "ANUBIS_SESSION_MANAGEMENT",
            metadata: { newRoomId: newRoom.id },
          });
        }

        return {
          success: true,
          text: "New session created",
          values: { newRoomId: newRoom?.id },
        };
      }

      if (text.includes("switch context") || text.includes("remember when")) {
        // Retrieve and switch to previous context
        const memories = await runtime.getMemories({
          roomId: message.roomId,
          count: 50,
          unique: true,
          tableName: "memories",
        });

        const contextSummary = memories
          .slice(0, 10)
          .map((m) => m.content.text?.substring(0, 100))
          .filter(Boolean)
          .join("... ");

        await callback({
          text: `Switching context... I remember we were discussing: ${contextSummary}`,
          action: "ANUBIS_SESSION_MANAGEMENT",
        });

        return {
          success: true,
          text: "Context switched",
          values: { memoriesRetrieved: memories.length },
        };
      }

      return {
        success: false,
        text: "Unknown session management request",
      };
    } catch (error) {
      logger.error("Session management failed:", error);
      return {
        success: false,
        text: "Session management error",
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: { text: "Start a new conversation please" },
      },
      {
        name: "Anubis",
        content: {
          text: "Started a fresh conversation context! Previous context preserved but we're starting clean. What would you like to chat about?",
          action: "ANUBIS_SESSION_MANAGEMENT",
        },
      },
    ],
  ],
};

/**
 * Raid Command Action - Handles community scoring and leaderboard
 */
const raidCommandAction: Action = {
  name: "ANUBIS_RAID_COMMANDS",
  description: "Handle raid participation, leaderboards, and community scoring",

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    const text = message.content.text?.toLowerCase() || "";

    return (
      text.includes("/raid") ||
      text.includes("/leaderboard") ||
      text.includes("/mystats") ||
      text.includes("/achievements") ||
      text.includes("/join") ||
      text.includes("/top") ||
      text.includes("/stats") ||
      text.includes("join raid") ||
      text.includes("leaderboard") ||
      text.includes("my stats")
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const service = runtime.getService<NubiService>("nubi");
      if (!service) {
        return {
          success: false,
          text: "Raid system unavailable",
        };
      }

      // Get the raid flow from the service (we'll need to add a getter method)
      const text = message.content.text || "";
      const userId = message.entityId;

      // Extract proper username based on platform
      let username = `user_${userId.slice(0, 8)}`;
      const content = message.content as any;

      // Try to extract username from platform-specific fields
      if (content.author?.username) {
        username = content.author.username; // Twitter
      } else if (content.from?.username) {
        username = content.from.username; // Telegram
      } else if (content.username) {
        username = content.username; // Generic
      } else if (content.screenName) {
        username = content.screenName; // Twitter alternative
      }

      let response = "";

      // Parse command
      if (
        text.includes("/raid") ||
        text.includes("/join") ||
        text.includes("join raid")
      ) {
        response = await service.handleRaidJoin(userId, username);
      } else if (
        text.includes("/leaderboard") ||
        text.includes("/top") ||
        text.includes("leaderboard")
      ) {
        const limitMatch = text.match(/\d+/);
        const limit = limitMatch ? parseInt(limitMatch[0]) : 10;
        response = await service.handleLeaderboard(limit);
      } else if (
        text.includes("/mystats") ||
        text.includes("/stats") ||
        text.includes("my stats")
      ) {
        response = await service.handleUserStats(userId);
      } else if (text.includes("/achievements")) {
        response = await service.handleAchievements(userId);
      } else {
        response = `⚔️ **RAID COMMANDS**

/raid - Join active raid  
/leaderboard - View rankings
/mystats - Your stats
/achievements - Your achievements

The pack hunts together! 🔥`;
      }

      await callback({
        text: response,
        action: "ANUBIS_RAID_COMMANDS",
      });

      return {
        success: true,
        text: response,
        values: { command: text, userId, response },
      };
    } catch (error) {
      await callback({
        text: "Raid system error. Try again later.",
        error: true,
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

/**
 * Advanced Context Provider
 */
const advancedContextProvider: Provider = {
  name: "advancedContext",
  get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
    try {
      const service = runtime.getService("nubi") as NubiService;

      if (!service) {
        return {
          values: {},
          error: "Anubis God Mode service not available",
        };
      }

      // Gather rich context from multiple sources
      const personalityState = service.getPersonalityState();
      const emotionalState = service.getEmotionalState();

      // Get conversation context
      const recentMemories = await runtime.getMemories({
        roomId: message.roomId,
        count: 5,
        unique: true,
        tableName: "memories",
      });

      const conversationTopics =
        recentMemories
          .map((m) => m.content.text)
          .filter(Boolean)
          .join(" ")
          .match(/\b(solana|defi|nft|crypto|validator|stake|yield|mev)\b/gi) ||
        [];

      const uniqueTopics = [
        ...new Set(conversationTopics.map((t) => t.toLowerCase())),
      ];

      // Time-based context
      const hour = new Date().getHours();
      const timeContext =
        hour < 6
          ? "late night"
          : hour < 12
            ? "morning"
            : hour < 17
              ? "afternoon"
              : hour < 22
                ? "evening"
                : "night";

      // Get YAML configuration insights
      const yamlConfig = service.getFullYAMLConfig();
      const solanaMaximalism =
        personalityState.solana_maximalism ||
        personalityState.solanaMaximalism ||
        95;

      const contextString = `
Current Context:
- Time: ${timeContext} (energy level affects responses)
- Personality: Openness ${personalityState.openness}%, Solana Maximalism ${solanaMaximalism}%
- Emotional State: ${emotionalState.current} (intensity: ${emotionalState.intensity}%)
- Recent Topics: ${uniqueTopics.join(", ") || "general conversation"}
- Conversation Length: ${recentMemories.length} recent messages
- Platform: ${message.content.source || "unknown"}
- Known Protocols: ${Object.keys((yamlConfig as any).knowledge?.solana_protocols || {}).join(", ")}

Behavioral Guidelines:
- Maintain authentic inconsistency and human-like patterns
- Reference specific Solana ecosystem tools naturally
- Adapt formality based on conversation progression  
- Show genuine emotional responses to topics
- Occasionally contradict previous statements naturally
- Use crypto slang appropriately but not excessively
      `.trim();

      return {
        values: {
          context: contextString,
          personalityState,
          emotionalState,
          topics: uniqueTopics,
          timeContext,
          conversationLength: recentMemories.length,
        },
      };
    } catch (error) {
      logger.error("Advanced context provider failed:", error);
      return {
        values: {
          context: "Context temporarily unavailable",
          error: true,
        },
      };
    }
  },
};

/**
 * Session State Evaluator
 */
const sessionStateEvaluator: Evaluator = {
  name: "ANUBIS_SESSION_STATE",
  description:
    "Evaluates and manages session state, relationship building, and context persistence",
  alwaysRun: false, // Run strategically
  examples: [],

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    // Run every ~3rd message to track session evolution
    return Math.random() < 0.33;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<any> => {
    try {
      const messageBus = runtime.getService<MessageBusService>("message-bus");

      if (!messageBus) {
        return { success: false };
      }

      // Analyze session progression
      const room = messageBus.getRoom(message.roomId);
      const world = messageBus.getWorld(room?.worldId || "anubis-world");

      if (room && world) {
        // Update room context with session insights
        room.context.lastEvaluation = Date.now();
        room.context.messageCount = (room.context.messageCount || 0) + 1;

        // Analyze conversation evolution
        const memories = await runtime.getMemories({
          roomId: message.roomId,
          count: 20,
          unique: true,
          tableName: "memories",
        });

        const conversationDepth = memories.length;
        const avgMessageLength =
          memories
            .map((m) => m.content.text?.length || 0)
            .reduce((sum, len) => sum + len, 0) / memories.length;

        // Determine relationship progression
        const relationship =
          conversationDepth > 50
            ? "close_friend"
            : conversationDepth > 20
              ? "friend"
              : conversationDepth > 5
                ? "acquaintance"
                : "new";

        room.context.relationship = relationship;
        room.context.conversationDepth = conversationDepth;
        room.context.avgMessageLength = avgMessageLength;

        logger.debug(
          `Session state updated: ${relationship} (${conversationDepth} messages)`,
        );

        return {
          success: true,
          data: {
            relationship,
            conversationDepth,
            avgMessageLength,
            sessionInsights: room.context,
          },
        };
      }

      return { success: false };
    } catch (error) {
      logger.error("Session state evaluator failed:", error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Helper functions for plugin initialization
 */
function mergeConfiguration(
  userConfig: Record<string, string>,
): Record<string, string> {
  const defaults = {
    LOG_LEVEL: "info",
    ANUBIS_TYPO_RATE: "0.03",
    ANUBIS_CONTRADICTION_RATE: "0.15",
    ANUBIS_EMOTIONAL_PERSISTENCE: "1800000",
  };
  return { ...defaults, ...userConfig };
}

function applyEnvironmentConfig(config: Record<string, string>): void {
  for (const [key, value] of Object.entries(config)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function validateServiceDependencies(
  runtime: IAgentRuntime,
): Promise<void> {
  const dependencies = {
    anubis: ["message-bus", "plugin-configuration-manager"],
    "strategic-action-orchestrator": ["message-bus"],
    "message-bus": ["plugin-configuration-manager"],
  };

  for (const [service, deps] of Object.entries(dependencies)) {
    const serviceInstance = runtime.getService(service);
    if (!serviceInstance) {
      logger.warn(`Service ${service} not found, but dependencies specified`);
      continue;
    }

    for (const dep of deps as string[]) {
      const depInstance = runtime.getService(dep);
      if (!depInstance) {
        throw new Error(
          `Service ${service} depends on ${dep}, but ${dep} is not available`,
        );
      }
    }
  }

  logger.info("✅ Service dependencies validated");
}

/**
 * NUBI Plugin - The Symbiosis of Anubis with proper ElizaOS architecture
 */
const nubiPlugin: Plugin = {
  name: "nubi",
  description:
    "NUBI - The Symbiosis of Anubis AI agent plugin with personality, knowledge, and social coordination",

  // 1. Database Adapter (if any) - none needed for this plugin

  // 2. Actions (user-facing functionality) - registered first per ElizaOS spec
  actions: [
    processMessageAction, // Message processing
    sessionManagementAction, // Session management
    raidCommandAction, // Raid and leaderboard commands
    /* PYRAMID SYSTEM - READY TO ACTIVATE
    ...Object.values(pyramidCommands), // Pyramid referral commands
    END PYRAMID SYSTEM */
  ],

  // 3. Evaluators (response processing and learning)
  evaluators: [sessionStateEvaluator, ...nubiEvaluators],

  // 4. Providers (context and data sources)
  providers: [advancedContextProvider, ...nubiProviders],

  // 5. Models (if any) - handled by external plugins

  // 6. Routes (HTTP endpoints for session management)
  routes: [
    {
      path: "/sessions",
      type: "GET",
      handler: async (request: any, response: any, runtime: IAgentRuntime) => {
        try {
          const messageBus =
            runtime.getService<MessageBusService>("message-bus");
          const sessions = messageBus ? (messageBus as any).getAllRooms?.() || [] : [];

          response.json({
            success: true,
            sessions: sessions.map((room: any) => ({
              id: room.id,
              name: room.name,
              created: room.createdAt,
              messageCount: room.context.messageCount || 0,
              lastActivity: room.context.lastEvaluation || room.createdAt,
            })),
          });
        } catch (error) {
          response.status(500).json({ success: false, error: error.message });
        }
      },
    },
    {
      path: "/sessions/:id",
      type: "GET",
      handler: async (request: any, response: any, runtime: IAgentRuntime) => {
        try {
          const sessionId = request.params.id;
          const memories = await runtime.getMemories({
            roomId: sessionId,
            count: 100,
            unique: true,
            tableName: "memories",
          });

          response.json({
            success: true,
            sessionId,
            messageCount: memories.length,
            messages: memories.map((m) => ({
              id: m.id,
              content: m.content.text,
              timestamp: m.createdAt,
              userId: m.entityId,
            })),
          });
        } catch (error) {
          response.status(500).json({ success: false, error: error.message });
        }
      },
    },
    {
      path: "/health",
      type: "GET",
      handler: async (request: any, response: any, runtime: IAgentRuntime) => {
        try {
          const service = runtime.getService<NubiService>("nubi");
          const messageBus =
            runtime.getService<MessageBusService>("message-bus");

          response.json({
            success: true,
            status: "healthy",
            services: {
              anubis: !!service,
              messageBus: !!messageBus,
            },
            runtime: {
              agentId: runtime.agentId,
              uptime: Date.now() - (runtime as any).startTime || 0,
            },
            features: {
              sessionManagement: true,
              eventHandling: true,
              memoryPersistence: true,
              yamlConfiguration: true,
            },
          });
        } catch (error) {
          response.status(500).json({ success: false, error: error.message });
        }
      },
    },
  ],

  // 7. Events (for cross-component communication)
  events: {
    MESSAGE_RECEIVED: [
      async ({ message, runtime, source }) => {
        logger.info("MESSAGE_RECEIVED event received");
        logger.info(
          { keys: Object.keys({ message, runtime, source }) },
          "MESSAGE_RECEIVED param keys",
        );

        // Process message through Anubis service
        const service = runtime.getService("nubi") as NubiService;
        if (service) {
          await service.processIncomingMessage(message);
        }
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async ({ message, runtime, source }) => {
        logger.info("VOICE_MESSAGE_RECEIVED event received");
        logger.info(
          { keys: Object.keys({ message, runtime, source }) },
          "VOICE_MESSAGE_RECEIVED param keys",
        );

        // Handle voice messages with enhanced processing
        const service = runtime.getService("nubi") as NubiService | undefined;
        if (service) {
          await service.processVoiceMessage(message);
        }
      },
    ],
    WORLD_CONNECTED: [
      async ({ world, rooms, entities, runtime, source }) => {
        logger.info("WORLD_CONNECTED event received");
        logger.info(
          { keys: Object.keys({ world, rooms, entities, runtime, source }) },
          "WORLD_CONNECTED param keys",
        );

        // Initialize world-specific context
        const service = runtime.getService<NubiService>("nubi");
        if (service) {
          await service.onWorldConnected((world as any).id || String(world), rooms, entities);
        }
      },
    ],
    WORLD_JOINED: [
      async ({ world, rooms, entities, runtime, source }) => {
        logger.info("WORLD_JOINED event received");
        logger.info(
          {
            keys: Object.keys({
              world,
              rooms,
              entities,
              runtime,
              source,
            }),
          },
          "WORLD_JOINED param keys",
        );

        // Handle entity joining world
        const service = runtime.getService<NubiService>("nubi");
        if (service) {
          await service.onWorldJoined((world as any).id || String(world), undefined, rooms, entities);
        }
      },
    ],
  },

  // 8. Services (with delayed initialization if runtime not ready)
  services: [
    PluginConfigurationManagerService, // Configuration management first
    UserIdentityService, // User identity resolution
    MessageBusService, // Message bus foundation
    StrategyActionOrchestratorService, // Workflow orchestration
    NubiService, // Core NUBI functionality
  ],

  // Configuration with proper ElizaOS patterns
  config: {
    // Plugin metadata
    version: "2.1.0",
    author: "ElizaOS Community - NUBI Project",
    license: "MIT",
    elizaVersion: ">=1.4.0",
    nodeVersion: ">=18.0.0",

    // Component registration order (following ElizaOS best practices)
    initializationOrder: [
      "database_adapters",
      "services",
      "providers",
      "actions",
      "evaluators",
      "events",
      "routes",
    ],

    // Advanced plugin features
    features: {
      sessionManagement: true,
      advancedContextComposition: true,
      multiPartResponses: true,
      eventDrivenArchitecture: true,
      stateBasedValidation: true,
      hierarchicalConfiguration: true,
      runtimeServiceDiscovery: true,
    },

    // Service dependencies and startup order
    serviceDependencies: {
      nubi: ["message-bus", "plugin-configuration-manager"],
      "strategic-action-orchestrator": ["message-bus"],
      "message-bus": ["plugin-configuration-manager"],
    },

    // Environment configuration with hierarchical precedence
    environment: {
      required: ["OPENAI_API_KEY"],
      optional: [
        "ANTHROPIC_API_KEY",
        "DISCORD_API_TOKEN",
        "TELEGRAM_BOT_TOKEN",
        "TWITTER_API_KEY",
        "SOLANA_PRIVATE_KEY",
        "MCP_SERVER_URI",
        "MCP_API_KEY",
        "AI_GATEWAY_URL",
        "AI_GATEWAY_API_KEY",
        "WHATSAPP_TOKEN",
        "WHATSAPP_PHONE_NUMBER",
        "FARCASTER_PRIVATE_KEY",
        "FARCASTER_RECOVERY_PHRASE",
        "GROQ_API_KEY",
        "NEWS_API_KEY",
        "ELEVENLABS_API_KEY",
        "GIPHY_API_KEY",
        "OBSIDIAN_VAULT_PATH",
      ],
      defaults: {
        LOG_LEVEL: "info",
        ANUBIS_TYPO_RATE: "0.03",
        ANUBIS_CONTRADICTION_RATE: "0.15",
        ANUBIS_EMOTIONAL_PERSISTENCE: "1800000",
      },
    },
  },

  // Initialization with proper error handling
  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info("🚀 Initializing Anubis Plugin...");

    try {
      // Validate runtime compatibility
      if (!runtime.composeState) {
        throw new Error(
          "Runtime does not support state composition - ElizaOS version too old",
        );
      }

      // Initialize configuration management first
      const configManager =
        runtime.getService<PluginConfigurationManagerService>(
          "plugin-configuration-manager",
        );

      if (configManager) {
        logger.info("✅ Plugin configuration manager initialized");
      }

      // Apply environment configuration with hierarchy
      const finalConfig = mergeConfiguration(config);
      applyEnvironmentConfig(finalConfig);

      // Validate service dependencies
      await validateServiceDependencies(runtime);

      logger.info("✨ Anubis Plugin initialization complete");
      logger.info(`  - Services: ${this.services?.length || 0}`);
      logger.info(`  - Actions: ${this.actions?.length || 0}`);
      logger.info(`  - Providers: ${this.providers?.length || 0}`);
      logger.info(`  - Evaluators: ${this.evaluators?.length || 0}`);
      logger.info(`  - Events: ${this.events?.length || 0}`);
    } catch (error) {
      logger.error("❌ Anubis Plugin initialization failed:", error);
      throw error;
    }
  },
};

export default nubiPlugin;
