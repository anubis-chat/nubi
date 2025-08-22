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
// Legacy imports removed - using only clean ElizaOS-compliant components
import { nubiProviders } from "./providers";
import MessageBusService from "./message-bus";
import StrategyActionOrchestratorService from "./strategic-action-orchestrator";
import PluginConfigurationManagerService from "./plugin-configuration-manager";
import YAMLConfigManager from "./config/yaml-config-manager";
import UserIdentityService from "./user-identity-service";

// ElizaOS Sessions API Routes
import sessionsRoutes from "./routes/sessions-routes";

// New ElizaOS-compliant evaluators and providers
import { personalityEvolutionEvaluator } from "./evaluators/personality-evolution";
import { emotionalStateProvider } from "./providers/emotional-state-provider";
import { knowledgeBaseProvider } from "./providers/knowledge-base-provider";
import enhancedContextProvider from "./providers/enhanced-context-provider";
import { antiDetectionPostProcessor } from "./evaluators/anti-detection-post-processor";
import { communityTrackingEvaluator } from "./evaluators/community-tracking-evaluator";

// New ElizaOS Services
import PersonalityEvolutionService from "./services/personality-evolution-service";
import EmotionalStateService from "./services/emotional-state-service";
import CommunityManagementService from "./services/community-management-service";
import { DatabaseMemoryService } from "./services/database-memory-service";
import { EnhancedResponseGenerator } from "./services/enhanced-response-generator";
import SessionsService from "./services/sessions-service";
import ComposeStateService from "./services/compose-state-service";
import SocketIOEventsService from "./services/socket-io-events-service";

// REMOVED: Pyramid system to reduce codebase complexity

// REMOVED: Broken processMessageAction that echoed user input
// Let ElizaOS handle message processing natively through character definition

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
// REMOVED: Raid command action - depends on broken NubiService
// Will rebuild as proper ElizaOS action later

// REMOVED: Advanced context provider - depends on broken NubiService
// Using simpler providers until we rebuild personality system

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
    LOG_LEVEL: "warn",
    OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
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

  actions: [sessionManagementAction],

  evaluators: [
    sessionStateEvaluator,
    personalityEvolutionEvaluator,
    antiDetectionPostProcessor,
    communityTrackingEvaluator,
  ],

  providers: [
    enhancedContextProvider, // Primary database-driven context
    ...nubiProviders,
    emotionalStateProvider,
    knowledgeBaseProvider,
  ],

  routes: [
    // ElizaOS Sessions API compliance routes
    ...sessionsRoutes,
    
    // Legacy health endpoint
    {
      path: "/health",
      type: "GET",
      handler: async (request: any, response: any, runtime: IAgentRuntime) => {
        try {
          const messageBus = runtime.getService<MessageBusService>("message-bus");
          const sessionsService = runtime.getService<SessionsService>("sessions");

          response.json({
            success: true,
            status: "healthy",
            services: {
              messageBus: !!messageBus,
              sessionsService: !!sessionsService,
              databaseMemoryService: !!runtime.getService("database_memory"),
              enhancedResponseGenerator: !!runtime.getService("enhanced_response"),
              composeStateService: !!runtime.getService("compose_state"),
              socketEventsService: !!runtime.getService("socket_events"),
            },
            runtime: {
              agentId: runtime.agentId,
              uptime: Date.now() - (runtime as any).startTime || 0,
            },
            features: {
              elizaSessionsAPI: true,
              composeStateIntegration: true,
              supabaseBackend: true,
              realTimeMessaging: true,
              memoryPersistence: true,
              personalityEvolution: true,
              communityManagement: true,
              yamlConfiguration: true,
            },
            compliance: {
              sessionsAPI: "✅ Full ElizaOS Sessions API",
              composeState: "✅ Enhanced implementation with caching",
              socketIO: "✅ Real-time events with custom NUBI features", 
            }
          });
        } catch (error) {
          response.status(500).json({ success: false, error: error.message });
        }
      },
    },
  ],

  events: {},

  services: [
    // Core database services (initialize first)
    DatabaseMemoryService,
    EnhancedResponseGenerator,
    
    // ElizaOS compliance services
    SessionsService, // Sessions API with Supabase
    ComposeStateService, // Enhanced state composition
    SocketIOEventsService, // Real-time Socket.IO events
    
    // Personality and emotional systems
    EmotionalStateService,
    PersonalityEvolutionService,
    CommunityManagementService,
    
    // Supporting services
    PluginConfigurationManagerService,
    UserIdentityService,
    MessageBusService,
    StrategyActionOrchestratorService,
  ],

  config: {
    version: "2.1.0",
    author: "ElizaOS Community - NUBI Project",
    license: "MIT",
    elizaVersion: ">=1.4.0",
    nodeVersion: ">=18.0.0",

    initializationOrder: [
      "database_adapters",
      "services",
      "providers",
      "actions",
      "evaluators",
      "events",
      "routes",
    ],

    features: {
      sessionManagement: true,
      advancedContextComposition: true,
      multiPartResponses: true,
      eventDrivenArchitecture: true,
      stateBasedValidation: true,
      hierarchicalConfiguration: true,
      runtimeServiceDiscovery: true,
    },

    serviceDependencies: {
      nubi: ["message-bus", "plugin-configuration-manager"],
      "strategic-action-orchestrator": ["message-bus"],
      "message-bus": ["plugin-configuration-manager"],
    },

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
        LOG_LEVEL: "warn",
        OPENAI_EMBEDDING_MODEL: "text-embedding-3-small",
        ANUBIS_TYPO_RATE: "0.03",
        ANUBIS_CONTRADICTION_RATE: "0.15",
        ANUBIS_EMOTIONAL_PERSISTENCE: "1800000",
      },
    },
  },

  async init(config: Record<string, string>, runtime: IAgentRuntime) {
    logger.info("🚀 Initializing Anubis Plugin...");

    try {
      if (!runtime.composeState) {
        throw new Error(
          "Runtime does not support state composition - ElizaOS version too old",
        );
      }

      const configManager =
        runtime.getService<PluginConfigurationManagerService>(
          "plugin-configuration-manager",
        );

      if (configManager) {
        logger.info("✅ Plugin configuration manager initialized");
      }

      // Initialize YAML Configuration Manager
      const yamlConfigManager = new YAMLConfigManager("./config");
      const yamlConfig = yamlConfigManager.getConfig();
      
      // Store YAML config manager in runtime for Services to access
      (runtime as any).yamlConfigManager = yamlConfigManager;
      
      logger.info("✅ YAML configuration loaded");
      logger.info(`  - Agent: ${yamlConfig.agent.name}`);
      logger.info(`  - Personality traits: ${Object.keys(yamlConfig.agent.personality).length}`);
      logger.info(`  - Known protocols: ${Object.keys(yamlConfig.knowledge.solana_protocols).length}`);
      logger.info(`  - Response templates: ${Object.keys(yamlConfig.templates).length}`);

      const finalConfig = mergeConfiguration(config);
      applyEnvironmentConfig(finalConfig);

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
