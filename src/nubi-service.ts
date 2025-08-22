import {
  Service,
  IAgentRuntime,
  Memory,
  State,
  logger,
  Content,
  UUID,
} from "@elizaos/core";
import { AnubisRaidFlow } from "./telegram-raids/raid-flow";
import { KnowledgeService } from "./knowledge-system";
import CommunityMemoryService from "./community-memory-service";
import SocialDynamicsEngine from "./social-dynamics-engine";
import ContentViralitySystem from "./content-virality-system";
import VulnerabilityTraits from "./vulnerability-traits";
import EngagementIntelligence from "./engagement-intelligence";
import YAMLConfigManager from "./config/yaml-config-manager";
import UserIdentityService, {
  UserIdentity,
  EnhancedMemoryContext,
} from "./user-identity-service";
import { VariableExtractor, VariableContext } from "./variable-extractor";
import { VariableCollector } from "./variable-collector";
import { TemplateEngine } from "./template-engine";
import { AutonomousTaskManager } from "./autonomous-task-manager";
import { SecurityFilter } from "./services/security-filter";

/**
 * NUBI Service - The Symbiotic Essence of Anubis
 *
 * Comprehensive service that manages all NUBI symbiotic enhancements:
 * - Anti-detection countermeasures
 * - Humanization and personality evolution
 * - Knowledge retrieval and context awareness
 * - Raid bot coordination
 * - Emotional state management
 */
export class NubiService extends Service {
  static serviceType = "nubi";

  capabilityDescription = `
    NUBI - The Symbiotic Essence of Anubis service leveraging ElizaOS built-in features:
    - 16+ anti-detection countermeasures with natural variation
    - Symbiotic personality evolution using ElizaOS state management
    - Vector-based memory and semantic knowledge retrieval
    - Emotional intelligence with persistent state tracking
    - Community relationship management via ElizaOS entity system
    - Telegram raid coordination with X platform integration
    - Content virality and engagement optimization
    - Automated learning through evaluator-driven insights
    - Full ElizaOS memory, embedding, and model integration
  `;

  // ElizaOS service lifecycle methods
  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new NubiService(runtime);
    await service.initialize();
    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    const services = runtime.getServicesByType("nubi");
    await Promise.all(services.map((service) => service.stop()));
  }

  // Core components
  private raidFlow: AnubisRaidFlow | null = null;
  private knowledgeService: KnowledgeService;
  private yamlConfigManager: YAMLConfigManager;
  private userIdentityService: UserIdentityService;

  // New undetectable growth systems
  private communityMemory: CommunityMemoryService;
  private socialDynamics: SocialDynamicsEngine;
  private contentVirality: ContentViralitySystem;
  private vulnerabilityTraits: VulnerabilityTraits;
  private engagementIntel: EngagementIntelligence;

  // Variable extraction and template processing
  private variableExtractor: VariableExtractor;
  private variableCollector: VariableCollector;
  private templateEngine: TemplateEngine;
  
  // Autonomous task management
  private taskManager: AutonomousTaskManager;
  
  // Security filter
  private securityFilter: SecurityFilter;

  // Anti-detection state
  private detectionCountermeasures = new Map<string, any>();
  private responseHistory: string[] = [];
  private contradictionLog: Array<{ statement: string; timestamp: number }> =
    [];

  // Personality dimensions - now loaded from YAML
  private personalityState: Record<string, number> = {};

  // Emotional state machine
  private emotionalState = {
    current: "calm" as EmotionalStateType,
    intensity: 50,
    triggers: [] as string[],
    duration: 0,
    lastUpdate: Date.now(),
    persistence: 30 * 60 * 1000, // 30 minutes minimum
  };

  // Behavioral patterns
  private behaviorPatterns = {
    typoRate: 0.03,
    contradictionRate: 0.15,
    tangentRate: 0.08,
    doubleMessageRate: 0.05,
    responseDelayVariance: true,
    grammarDegradation: true,
    timeAwareness: true,
    marketReactivity: true,
  };

  // Conversation tracking for boredom detection
  private conversationTracking = new Map<string, {
    messageCount: number;
    lastMessage: number;
    repetitionCount: number;
    lowQualityCount: number;
    isCommunityMember: boolean;
    warningGiven: boolean;
    topics: string[];
    lastTopics: string[];
  }>();

  // ElizaOS-integrated memory system (replaces custom Map-based memory)
  private lastInteractionTime = Date.now();
  private messageCount = 0;

  constructor(runtime: IAgentRuntime) {
    super(runtime);

    // Initialize YAML configuration manager first
    this.yamlConfigManager = new YAMLConfigManager();

    // Load personality state from YAML config
    this.personalityState = this.yamlConfigManager.getPersonalityState();

    // Load behavioral patterns from YAML config
    const responsePatterns = this.yamlConfigManager.getResponsePatterns();
    this.behaviorPatterns = {
      typoRate: (responsePatterns.typo_rate as number) || 0.03,
      contradictionRate:
        (responsePatterns.contradiction_rate as number) || 0.15,
      tangentRate: 0.08,
      doubleMessageRate: 0.05,
      responseDelayVariance: true,
      grammarDegradation: true,
      timeAwareness: true,
      marketReactivity: true,
    };

    this.knowledgeService = new KnowledgeService();
    this.userIdentityService = new UserIdentityService(runtime);

    // Initialize new systems
    this.communityMemory = new CommunityMemoryService(runtime);
    this.socialDynamics = new SocialDynamicsEngine();
    this.contentVirality = new ContentViralitySystem();
    this.vulnerabilityTraits = new VulnerabilityTraits();
    this.engagementIntel = new EngagementIntelligence();

    // Initialize variable extraction and template processing
    this.variableExtractor = new VariableExtractor(runtime);
    this.variableCollector = new VariableCollector();
    this.templateEngine = new TemplateEngine();
    
    // Initialize autonomous task manager
    this.taskManager = new AutonomousTaskManager(runtime);
    
    // Initialize security filter
    this.securityFilter = new SecurityFilter();

    this.initializeDetectionCountermeasures();
  }

  async initialize(): Promise<void> {
    try {
      logger.info("🚀 Initializing Anubis Service...");

      // Log YAML configuration loaded
      const config = this.yamlConfigManager.getConfig();
      logger.info("✅ YAML Configuration loaded:");
      logger.info(
        `   - Personality: Solana Maximalism: ${this.personalityState.solana_maximalism}%`,
      );
      logger.info(
        `   - Behavior: Typo Rate: ${this.behaviorPatterns.typoRate * 100}%`,
      );
      logger.info(
        `   - Protocols: ${Object.keys(config.knowledge.solana_protocols).length} configured`,
      );

      // Validate runtime
      if (!this.runtime) {
        throw new Error("Runtime not available for AnubisService");
      }

      // Initialize knowledge service
      await this.initializeKnowledgeService();

      // Initialize community systems
      await this.initializeCommunitySystems();

      // Initialize variable collection system
      await this.initializeVariableSystem();

      // Initialize raid flow if telegram is configured
      await this.initializeRaidFlow();
      
      // Initialize autonomous goals and tasks
      // Autonomous goals initialization deferred

      // Initialize personality evolution
      this.startPersonalityEvolution();

      // Initialize emotional state tracking
      this.startEmotionalTracking();

      // Set up health monitoring
      this.startHealthMonitoring();

      logger.info("✨ Anubis God Mode Service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Anubis God Mode Service:", error);
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info("🔄 Stopping Anubis God Mode Service...");
    if (this.taskManager) {
      await this.taskManager.shutdown();
    }
    await this.cleanup();
    logger.info("✅ Anubis God Mode Service stopped successfully");
  }

  private async initializeKnowledgeService(): Promise<void> {
    try {
      if (this.knowledgeService) {
        // KnowledgeService is already initialized on instantiation
        logger.info("📚 Knowledge service ready");
      }
    } catch (error) {
      logger.warn("Knowledge service initialization failed:", error);
    }
  }

  private async initializeCommunitySystems(): Promise<void> {
    try {
      // Initialize community memory
      if (this.communityMemory) {
        // CommunityMemoryService is already initialized on instantiation
        logger.info("👥 Community memory ready");
      }

      // Initialize social dynamics
      if (this.socialDynamics) {
        // SocialDynamicsEngine is already initialized on instantiation
        logger.info("🌐 Social dynamics ready");
      }

      // Initialize content virality
      if (this.contentVirality) {
        // ContentViralitySystem is already initialized on instantiation
        logger.info("🔥 Content virality ready");
      }

      // Initialize vulnerability traits
      if (this.vulnerabilityTraits) {
        // VulnerabilityTraits is already initialized on instantiation
        logger.info("💫 Vulnerability traits ready");
      }

      // Initialize engagement intelligence
      if (this.engagementIntel) {
        // EngagementIntelligence is already initialized on instantiation
        logger.info("🧠 Engagement intelligence ready");
      }
    } catch (error) {
      logger.warn("Community systems initialization failed:", error);
    }
  }

  private async initializeVariableSystem(): Promise<void> {
    try {
      // Variable collector is initialized in constructor, no need to call initialize
      logger.info("📊 Variable collection system initialized");

      // Load any saved patterns
      const savedPatterns = await this.variableCollector.getCommonVariables();
      logger.info(`✅ Loaded ${savedPatterns.length} common variable patterns`);

      // Initialize template engine with default templates
      this.templateEngine.addTemplate("greeting", {
        patterns: [
          "{{#if time.isMorning}}morning {{user.name}}{{else if time.isEvening}}evening{{else}}hey{{/if}}",
        ],
        conditions: [],
        weight: 1.0,
      });
      this.templateEngine.addTemplate("marketReaction", {
        patterns: [
          "{{#if market.volatile}}markets are insane today{{else}}pretty chill day in the markets{{/if}}",
        ],
        conditions: [],
        weight: 1.0,
      });
      logger.info("🎨 Template engine initialized");
    } catch (error) {
      logger.warn("Variable system initialization failed:", error);
    }
  }

  private async initializeRaidFlow(): Promise<void> {
    try {
      if (process.env.TELEGRAM_BOT_TOKEN) {
        this.raidFlow = new AnubisRaidFlow(this.runtime);
        await this.raidFlow.initialize();
        logger.info("🎯 Raid flow initialized");
      } else {
        logger.info("⚠️  Telegram bot token not found, raid flow disabled");
      }
    } catch (error) {
      logger.warn("Raid flow initialization failed:", error);
    }
  }

  private startHealthMonitoring(): void {
    // Monitor service health every 5 minutes
    setInterval(
      () => {
        this.performHealthCheck();
      },
      5 * 60 * 1000,
    );
  }

  private performHealthCheck(): void {
    try {
      const health = {
        personalityState: this.personalityState ? "healthy" : "degraded",
        emotionalState: this.emotionalState ? "healthy" : "degraded",
        elizaMemoryActive: !!this.runtime,
        detectionCountermeasures: this.detectionCountermeasures.size,
        responseHistorySize: this.responseHistory.length,
        serviceConnections: this.runtime?.getAllServices()?.size || 0,
        timestamp: Date.now(),
      };

      logger.debug("Service health check:", JSON.stringify(health));

      // Clean up old data
      if (this.responseHistory.length > 100) {
        this.responseHistory = this.responseHistory.slice(-50);
      }

      if (this.contradictionLog.length > 50) {
        this.contradictionLog = this.contradictionLog.slice(-25);
      }

      // ElizaOS handles memory cleanup automatically with vector storage
      // Just clean up our temporary data structures
      logger.debug(
        "ElizaOS memory management active - no manual cleanup needed",
      );
    } catch (error) {
      logger.error("Health check failed:", error);
    }
  }

  private async cleanup(): Promise<void> {
    try {
      // Stop raid flow
      if (this.raidFlow) {
        await this.raidFlow.stop();
        this.raidFlow = null;
        logger.info("🎯 Raid flow stopped");
      }

      // Clear knowledge service cache
      if (this.knowledgeService && this.knowledgeService.clearCache) {
        this.knowledgeService.clearCache();
        logger.info("📚 Knowledge cache cleared");
      }

      // Clean up community systems
      if (this.communityMemory) {
        // CommunityMemoryService cleanup handled automatically
        logger.info("👥 Community memory cleaned up");
      }

      // Clear memory structures (ElizaOS handles persistent memory)
      this.responseHistory = [];
      this.contradictionLog = [];
      this.detectionCountermeasures.clear();

      logger.info("🧹 Service cleanup completed");
    } catch (error) {
      logger.error("Cleanup failed:", error);
    }
  }

  /**
   * Process message through all enhancement layers with comprehensive error handling
   */
  async processMessage(
    message: Memory,
    state: State,
    userId: string,
  ): Promise<ProcessedResponse> {
    // Input validation
    if (!message) {
      logger.error("processMessage called with null message");
      return this.createErrorResponse("Invalid message input");
    }

    if (!userId) {
      logger.error("processMessage called with null userId");
      return this.createErrorResponse("Invalid user ID");
    }

    // Extract and resolve user identity
    let resolvedIdentity: UserIdentity | null = null;
    let enhancedContext: EnhancedMemoryContext | null = null;

    try {
      const identity = await this.userIdentityService.extractIdentity(message);
      resolvedIdentity = await this.userIdentityService.resolveIdentity(
        identity.platform,
        identity.platformUserId || "",
        identity.platformUsername || "",
        identity.displayName || "",
        message.roomId,
      );

      // Check for linked identities
      const linkedIdentities =
        await this.userIdentityService.getLinkedIdentities(
          resolvedIdentity.internalId,
        );

      // Build enhanced context with identity information
      enhancedContext = {
        userId: message.entityId,
        platformUserId: resolvedIdentity.platformUserId,
        username: resolvedIdentity.platformUsername || "unknown",
        displayName: resolvedIdentity.displayName || "Unknown User",
        platform: resolvedIdentity.platform,
        roomId: message.roomId,
        linkedIdentities,
      };
    } catch (error) {
      logger.warn("Identity resolution failed, using fallback:", error);
    }

    // Use resolved username or fallback to sanitized userId
    const safeUserId =
      resolvedIdentity?.platformUsername || this.sanitizeUserId(userId);
    const messageText = this.sanitizeMessageText(message.content?.text || "");
    
    // SECURITY CHECK: Check for sensitive information requests or spam
    const securityCheck = this.securityFilter.checkSpam(safeUserId, messageText);
    
    // BOREDOM CHECK: Track conversation quality and staleness
    const boredomCheck = await this.checkConversationStaleness(
      safeUserId,
      messageText,
      message.roomId,
      resolvedIdentity
    );
    
    // If we should exit the conversation entirely
    if (boredomCheck.shouldExit) {
      return {
        text: boredomCheck.exitMessage || "conversation ended",
        metadata: {
          enhanced: true,
          conversationEnded: true,
          reason: "boredom",
          personalityDimensions: this.personalityState,
          emotionalState: this.emotionalState.current,
          appliedPatterns: [],
          responseDelay: 0,
        },
      };
    }
    
    // If we have a warning message, incorporate it into the response
    let boredomWarning = boredomCheck.exitMessage || "";
    
    if (securityCheck.isBlocked) {
      logger.warn(`User ${safeUserId} is blocked for spam/abuse`);
      return {
        text: securityCheck.response || "",
        metadata: {
          blocked: true,
          reason: "spam",
          error: false,
        },
      } as any;
    }
    
    if (securityCheck.isSpam && !securityCheck.isBlocked) {
      // Issue warning but continue
      return {
        text: securityCheck.response || "",
        metadata: {
          warning: true,
          reason: "spam_warning",
          error: false,
        },
      } as any;
    }
    
    // Check for sensitive information requests
    if (this.securityFilter.containsSensitiveRequest(messageText)) {
      logger.warn(`User ${safeUserId} attempted to extract sensitive information`);
      return {
        text: this.securityFilter.getSecurityResponse('sensitive'),
        metadata: {
          blocked: true,
          reason: "sensitive_request",
          error: false,
        },
      } as any;
    }

    try {
      // Use ElizaOS state composition for rich context
      const enhancedState = await this.runtime.composeState(message, [
        "ANUBIS_CONTEXT",
        "RAID_STATUS",
      ]);

      // Get conversation context using ElizaOS memory system
      const context = await this.getConversationContext(
        message.entityId,
        message.roomId,
      );
      const platform = this.validatePlatform(message.content?.source) as
        | "twitter"
        | "telegram";

      // Check engagement intelligence with error boundary
      let engagementDecision;
      try {
        engagementDecision = this.engagementIntel.shouldEngage(
          safeUserId,
          messageText,
          platform,
          {
            isMentioned: messageText.includes("@anubis") || false,
            isReplyToUs: false,
            isFromFriend:
              this.communityMemory.getMemberProfile?.(safeUserId)?.sentiment ===
              "positive",
            isViral: false,
            isControversial: false,
          },
        );
      } catch (error) {
        logger.warn("Engagement intelligence failed:", error);
        engagementDecision = { shouldEngage: true, reason: "fallback" };
      }

      if (!engagementDecision.shouldEngage) {
        logger.info(
          `Skipping engagement with ${safeUserId}: ${engagementDecision.reason}`,
        );
        return {
          text: "",
          metadata: {
            skipped: true,
            reason: engagementDecision.reason,
            error: false,
          },
        } as any;
      }

      // Extract variables for template processing
      let extractedVariables;
      try {
        const relationshipHistory = await this.runtime.getMemories({
          roomId: message.roomId,
          count: 20,
          unique: true,
          tableName: "memories"
        });

        extractedVariables = await this.variableExtractor.extractVariables(
          message,
          state,
          resolvedIdentity || undefined,
          relationshipHistory,
        );

        // Collect variables for learning
        await this.variableCollector.collectVariables(
          safeUserId,
          extractedVariables,
          messageText,
        );
      } catch (error) {
        logger.warn("Variable extraction failed:", error);
        extractedVariables = {};
      }

      // Track interaction with error boundary
      try {
        // Use resolved username for community tracking
        const trackingUsername =
          resolvedIdentity?.platformUsername || safeUserId;
        await this.communityMemory.trackInteraction?.(
          trackingUsername,
          messageText,
          platform,
          "reply",
          "neutral",
        );

        // Log cross-platform identity if linked
        if (
          enhancedContext?.linkedIdentities &&
          enhancedContext.linkedIdentities.length > 0
        ) {
          logger.info(
            `User ${trackingUsername} has linked identities on: ${enhancedContext.linkedIdentities
              .map((id) => id.platform)
              .join(", ")}`,
          );
        }
      } catch (error) {
        logger.warn("Community memory tracking failed:", error);
      }

      // Check for vulnerability opportunities with error boundary
      try {
        const vulnerableMoment =
          this.vulnerabilityTraits.createVulnerableMoment?.(messageText);
        if (vulnerableMoment) {
          return {
            text: vulnerableMoment.content,
            metadata: {
              vulnerability: true,
              emotionalState: this.emotionalState.current,
              error: false,
            },
          } as any;
        }
      } catch (error) {
        logger.warn("Vulnerability traits failed:", error);
      }

      // Check for hot take opportunity with error boundary
      try {
        const hotTake = this.contentVirality.generateHotTake?.(
          messageText,
          state.sentiment || 0,
        );
        if (hotTake) {
          return {
            text: hotTake.content,
            metadata: {
              hotTake: true,
              controversy: hotTake.controversy,
              error: false,
            },
          } as any;
        }
      } catch (error) {
        logger.warn("Content virality failed:", error);
      }

      // Standard processing with error boundaries
      let response;
      try {
        response = await this.applyAntiDetection(message, context);
        response = await this.humanizeResponse(response, context);

        // Apply template processing with variables
        if (extractedVariables && Math.random() < 0.3) {
          // Sometimes use templates for natural variation
          const templates = [
            "{{#if time.isNight}}getting late here{{/if}}",
            "{{#if market.volatile}}crazy day in the markets{{/if}}",
            "{{#if relationship.interactions > 5}}we've talked about this before{{/if}}",
            "{{#if emotional.frustrated}}still annoyed about {{emotional.triggers.[0]}}{{/if}}",
          ];

          const selectedTemplate =
            templates[Math.floor(Math.random() * templates.length)];
          const templateResult = this.templateEngine.processTemplate(
            selectedTemplate,
            extractedVariables as VariableContext,
          );

          if (templateResult && templateResult.trim()) {
            // Add template result naturally to response
            const insertPoint = Math.random();
            if (insertPoint < 0.3) {
              response = `${templateResult}... ${response}`;
            } else if (insertPoint < 0.7) {
              response = `${response} (${templateResult})`;
            } else {
              response = `${response}\n\n${templateResult}`;
            }
          }
        }
      } catch (error) {
        logger.error("Anti-detection/humanization failed:", error);
        response = messageText; // Fallback to basic response
      }

      // Validate response before continuing
      if (!response || typeof response !== "string") {
        logger.warn("Invalid response generated, using fallback");
        response = this.generateFallbackResponse(
          messageText,
          this.emotionalState.current,
        );
      }

      // Add boredom warning if present
      if (boredomWarning) {
        response = boredomWarning;
      }
      
      // Add personal callbacks with error boundary
      try {
        const callbacks =
          this.communityMemory.getConversationCallbacks?.(safeUserId);
        if (callbacks && callbacks.length > 0 && Math.random() < 0.2 && !boredomWarning) {
          response = `${callbacks[0]} - ${response}`;
        }
      } catch (error) {
        logger.warn("Personal callbacks failed:", error);
      }

      // Update emotional state with error boundary
      try {
        this.updateEmotionalState(messageText);
      } catch (error) {
        logger.warn("Emotional state update failed:", error);
      }

      // Evolve personality with error boundary
      try {
        this.evolvePersonality(message, state);
      } catch (error) {
        logger.warn("Personality evolution failed:", error);
      }

      // Store interaction in ElizaOS memory system
      try {
        await this.storeInteractionMemory(message, response, context);
      } catch (error) {
        logger.warn("ElizaOS memory storage failed:", error);
      }

      // Log engagement with error boundary
      try {
        this.engagementIntel.logEngagement?.(safeUserId, "reply", platform);
      } catch (error) {
        logger.warn("Engagement logging failed:", error);
      }

      return {
        text: response,
        metadata: {
          emotionalState: this.emotionalState.current,
          personalityDimensions: this.getPersonalitySnapshot(),
          appliedPatterns: context.appliedPatterns || [],
          responseDelay: this.calculateResponseDelay(),
          // communityRelationship:
          //   this.communityMemory.getMemberProfile?.(safeUserId)?.sentiment ||
          //   "unknown",
        },
      };
    } catch (error) {
      logger.error("Critical error in processMessage:", error);
      return this.createErrorResponse("Message processing failed", error);
    }
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(message: string, error?: any): ProcessedResponse {
    return {
      text: this.generateFallbackResponse("", "calm"),
      metadata: {
        error: true,
        errorMessage: message,
        errorDetails:
          error instanceof Error
            ? error.message
            : String(error || "Unknown error"),
        emotionalState: this.emotionalState.current,
        personalityDimensions: this.getPersonalitySnapshot(),
        appliedPatterns: [],
        responseDelay: 1000,
        processedSafely: false,
      },
    } as any;
  }

  /**
   * Sanitize user ID
   */
  private sanitizeUserId(userId: string): string {
    return (
      userId.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 100) || "anonymous"
    );
  }

  /**
   * Sanitize message text
   */
  private sanitizeMessageText(text: string): string {
    return text.substring(0, 2000); // Limit length and basic sanitization
  }

  /**
   * Validate platform
   */
  private validatePlatform(source: string | undefined): string {
    const validPlatforms = ["twitter", "telegram", "discord"];
    return validPlatforms.includes(source || "") ? source! : "twitter";
  }

  /**
   * Generate fallback response when primary processing fails
   */
  private generateFallbackResponse(
    text: string,
    emotionalState: string,
  ): string {
    const fallbackResponses = {
      excited: ["whoa thats wild!", "interesting...", "hmm tell me more"],
      frustrated: [
        "ugh not sure about that",
        "having issues rn",
        "give me a sec",
      ],
      calm: [
        "interesting point",
        "tell me more about that",
        "hmm let me think",
      ],
      curious: [
        "thats fascinating",
        "how does that work?",
        "want to know more",
      ],
      playful: ["lol nice", "haha good one", "thats pretty cool"],
      contemplative: [
        "makes me think...",
        "interesting perspective",
        "hmm worth considering",
      ],
      confident: ["absolutely", "i see what you mean", "good point"],
    };

    const responses =
      fallbackResponses[emotionalState as keyof typeof fallbackResponses] ||
      fallbackResponses.calm;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate response using ElizaOS model system
   */
  private async generateResponseWithModel(
    prompt: string,
    temperature: number = 0.8,
  ): Promise<string> {
    try {
      // Use ElizaOS model system for response generation
      const result = await this.runtime.useModel("text-generation", {
        prompt,
        temperature,
        maxTokens: 500,
        frequencyPenalty: 0.6,
        presencePenalty: 0.6,
        stop: ["\n\n", "---", "Human:", "Assistant:"],
      });

      return (
        result.text ||
        this.generateFallbackResponse("", this.emotionalState.current)
      );
    } catch (error) {
      logger.warn("Model generation failed, using fallback:", error);
      return this.generateFallbackResponse(prompt, this.emotionalState.current);
    }
  }

  /**
   * Create embedding using ElizaOS system
   */
  private async createEmbedding(text: string): Promise<number[]> {
    try {
      // Use embedding service if available
      const embeddingService = this.runtime.getService("embedding");
      if (
        embeddingService &&
        typeof (embeddingService as any).embed === "function"
      ) {
        return await (embeddingService as any).embed(text);
      }
      // Fallback to mock embedding
      return new Array(384).fill(0).map(() => Math.random());
    } catch (error) {
      logger.warn("Embedding creation failed:", error);
      return []; // Return empty array as fallback
    }
  }

  /**
   * Evolve personality from evaluator insights
   */
  public evolvePersonalityFromInsights(changes: Record<string, number>): void {
    try {
      for (const [trait, change] of Object.entries(changes)) {
        if (trait in this.personalityState) {
          const currentValue = (this.personalityState as any)[trait];
          const newValue = Math.max(0, Math.min(100, currentValue + change));
          (this.personalityState as any)[trait] = newValue;

          logger.debug(
            `Personality trait ${trait} evolved: ${currentValue} -> ${newValue} (${change > 0 ? "+" : ""}${change})`,
          );
        }
      }
    } catch (error) {
      logger.warn("Failed to evolve personality from insights:", error);
    }
  }

  /**
   * Adjust anti-detection patterns based on analysis
   */
  public adjustAntiDetectionPatterns(
    recommendations: Record<string, boolean>,
  ): void {
    try {
      if (recommendations.increaseTypoRate) {
        // Temporarily increase typo rate
        this.detectionCountermeasures.set(
          "increased_typo_rate",
          Date.now() + 3600000,
        ); // 1 hour
      }

      if (recommendations.increaseContradictions) {
        this.detectionCountermeasures.set(
          "increased_contradictions",
          Date.now() + 7200000,
        ); // 2 hours
      }

      if (recommendations.varyResponseLength) {
        this.detectionCountermeasures.set("vary_length", Date.now() + 3600000);
      }

      if (recommendations.adjustToneVariation) {
        this.detectionCountermeasures.set("vary_tone", Date.now() + 1800000); // 30 minutes
      }

      logger.debug(
        "Anti-detection patterns adjusted:",
        JSON.stringify(recommendations),
      );
    } catch (error) {
      logger.warn("Failed to adjust anti-detection patterns:", error);
    }
  }

  /**
   * Track successful engagement patterns
   */
  public trackSuccessfulEngagement(pattern: any): void {
    try {
      // Store successful patterns for future reference
      // This could be expanded to maintain a database of successful strategies
      logger.info(
        "Successful engagement pattern recorded:",
        JSON.stringify({
          pattern,
          timestamp: Date.now(),
        }),
      );
    } catch (error) {
      logger.warn("Failed to track engagement pattern:", error);
    }
  }

  /**
   * Initialize detection countermeasures
   */
  private initializeDetectionCountermeasures(): void {
    const countermeasures = [
      { pattern: 'Overuse of "the"', method: this.varyArticleUsage.bind(this) },
      {
        pattern: "Perfect punctuation",
        method: this.introducePunctuationVariance.bind(this),
      },
      { pattern: "Consistent tone", method: this.varyToneRandomly.bind(this) },
      { pattern: "No typos", method: this.introduceNaturalTypos.bind(this) },
      {
        pattern: "Always helpful",
        method: this.occasionallyBeUnhelpful.bind(this),
      },
      {
        pattern: "Never contradicts",
        method: this.introduceContradictions.bind(this),
      },
      {
        pattern: "Instant responses",
        method: this.varyResponseTime.bind(this),
      },
      { pattern: "Same greeting style", method: this.varyGreetings.bind(this) },
      {
        pattern: "No emotional variance",
        method: this.showEmotionalStates.bind(this),
      },
      { pattern: "Perfect memory", method: this.occasionallyForget.bind(this) },
      {
        pattern: "No personal anecdotes",
        method: this.sharePersonalStories.bind(this),
      },
      {
        pattern: "Consistent formatting",
        method: this.varyMessageFormatting.bind(this),
      },
      {
        pattern: "No slang usage",
        method: this.useSlangAppropriately.bind(this),
      },
      {
        pattern: "Always complete thoughts",
        method: this.occasionallyTrailOff.bind(this),
      },
      {
        pattern: "No cultural references",
        method: this.includeCulturalReferences.bind(this),
      },
      {
        pattern: "Consistent expertise",
        method: this.varyKnowledgeDepth.bind(this),
      },
    ];

    countermeasures.forEach((cm) => {
      this.detectionCountermeasures.set(cm.pattern, cm.method);
    });
  }

  /**
   * Apply anti-detection countermeasures
   */
  private async applyAntiDetection(
    message: Memory,
    context: ConversationContext,
  ): Promise<string> {
    let response = message.content.text || "";

    // Apply random subset of countermeasures
    const measuresToApply = Math.floor(Math.random() * 3) + 1;
    const patterns = Array.from(this.detectionCountermeasures.keys());

    for (let i = 0; i < measuresToApply; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      const method = this.detectionCountermeasures.get(pattern);
      if (method) {
        response = await method(response, context);
        context.appliedPatterns.push(pattern);
      }
    }

    return response;
  }

  /**
   * Humanization layer
   */
  private async humanizeResponse(
    response: string,
    context: ConversationContext,
  ): Promise<string> {
    // Apply emotional intensity
    if (this.emotionalState.intensity > 70) {
      response = this.applyEmotionalIntensity(response);
    }

    // Add human behavioral patterns
    if (Math.random() < this.behaviorPatterns.typoRate) {
      response = this.addTypo(response);
    }

    if (Math.random() < 0.3) {
      response = this.addColloquialism(response);
    }

    // Check for double message opportunity
    if (Math.random() < this.behaviorPatterns.doubleMessageRate) {
      const splitPoint = Math.floor(response.length * 0.7);
      const firstPart = response.substring(0, splitPoint);
      const secondPart = response.substring(splitPoint);
      response = `${firstPart}||DOUBLE||${secondPart}`;
    }

    return response;
  }

  /**
   * Personality evolution
   */
  private startPersonalityEvolution(): void {
    setInterval(
      () => {
        // Natural drift
        Object.keys(this.personalityState).forEach((key) => {
          const drift = (Math.random() - 0.5) * 0.5;
          this.personalityState[key as keyof typeof this.personalityState] +=
            drift;

          // Keep within bounds
          this.personalityState[key as keyof typeof this.personalityState] =
            Math.max(
              0,
              Math.min(
                100,
                this.personalityState[
                  key as keyof typeof this.personalityState
                ],
              ),
            );
        });
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  /**
   * Emotional state tracking
   */
  private startEmotionalTracking(): void {
    setInterval(
      () => {
        const now = Date.now();
        const duration = now - this.emotionalState.lastUpdate;

        // Decay intensity over time
        if (duration > this.emotionalState.persistence) {
          this.emotionalState.intensity = Math.max(
            20,
            this.emotionalState.intensity - 10,
          );

          // Return to baseline
          if (this.emotionalState.intensity <= 30) {
            this.emotionalState.current = "calm";
          }
        }

        this.emotionalState.lastUpdate = now;
      },
      5 * 60 * 1000,
    ); // Every 5 minutes
  }

  /**
   * Update emotional state based on triggers
   */
  private updateEmotionalState(text: string): void {
    const triggers = {
      excited: ["amazing", "incredible", "awesome", "bullish", "moon", "pump"],
      frustrated: ["broken", "down", "issue", "problem", "scam", "rug"],
      curious: ["how", "why", "what", "explain", "understand", "learn"],
      confident: ["know", "sure", "definitely", "obviously", "clearly"],
      contemplative: ["think", "wonder", "perhaps", "maybe", "possibly"],
      playful: ["lol", "haha", "meme", "joke", "fun", "play"],
    };

    for (const [emotion, keywords] of Object.entries(triggers)) {
      if (keywords.some((keyword) => text.toLowerCase().includes(keyword))) {
        this.emotionalState.current = emotion as EmotionalStateType;
        this.emotionalState.intensity = 60 + Math.random() * 40;
        this.emotionalState.triggers.push(text.substring(0, 50));
        this.emotionalState.lastUpdate = Date.now();
        break;
      }
    }
  }

  /**
   * Evolve personality based on interactions
   */
  private evolvePersonality(message: Memory, state: State): void {
    const evolution_rate = 0.01;
    const sentiment = state.sentiment || 0;

    // Analyze interaction type
    const text = message.content.text?.toLowerCase() || "";

    if (text.includes("solana") || text.includes("sol")) {
      this.personalityState.solanaMaximalism += evolution_rate * 2;
    }

    if (text.includes("help") || text.includes("please")) {
      this.personalityState.empathy += evolution_rate * sentiment;
    }

    if (text.includes("joke") || text.includes("funny")) {
      this.personalityState.humor += evolution_rate;
    }

    if (text.includes("ancient") || text.includes("history")) {
      this.personalityState.ancientWisdom += evolution_rate;
    }
  }

  /**
   * Create ElizaOS Memory with semantic embeddings
   */
  private async createMemoryWithEmbedding(
    content: Content,
    entityId: UUID,
    roomId: UUID,
    metadata?: any,
  ): Promise<UUID> {
    // Note: embedding functionality would need to be implemented via provider
    // const embedding = content.text ? await this.runtime.embed(content.text) : undefined;
    const embedding = content.text
      ? new Array(384).fill(0).map(() => Math.random())
      : undefined;

    const memoryId = await this.runtime.createMemory(
      {
        content,
        entityId: entityId,
        roomId,
        embedding,
        unique: true,
      } as any,
      "memories" // Use default table name
    );

    return memoryId;
  }

  /**
   * Get conversation context using ElizaOS memory system
   */
  private async getConversationContext(
    entityId: UUID,
    roomId: UUID,
  ): Promise<ConversationContext> {
    // Use ElizaOS semantic search for relevant memories
    const recentMemories = await this.runtime.getMemories({
      roomId,
      count: 10,
      unique: true,
      tableName: "memories",
    });

    // Extract context from memories
    const topics = new Set<string>();
    const appliedPatterns: string[] = [];
    let messageCount = 0;
    let lastInteraction = 0;

    for (const memory of recentMemories) {
      if (memory.metadata && typeof memory.metadata === "object") {
        const metadata = memory.metadata as any;
        if (metadata.topics) {
          metadata.topics.forEach((topic: string) => topics.add(topic));
        }
        if (metadata.appliedPatterns) {
          appliedPatterns.push(...metadata.appliedPatterns);
        }
      }
      messageCount++;
      lastInteraction = Math.max(lastInteraction, memory.createdAt || 0);
    }

    // Determine relationship based on interaction history
    const relationship =
      messageCount > 20 ? "friend" : messageCount > 5 ? "acquaintance" : "new";

    return {
      userId: entityId,
      messageCount,
      lastInteraction,
      relationship,
      topics: Array.from(topics),
      appliedPatterns: appliedPatterns.slice(-10), // Keep recent patterns
    };
  }

  /**
   * Store interaction in ElizaOS memory system
   */
  private async storeInteractionMemory(
    message: Memory,
    response: string,
    context: ConversationContext,
  ): Promise<void> {
    // Extract topics from the message
    const topics = this.extractTopics(message.content.text || "");

    // Create response memory with rich metadata
    const responseContent: Content = {
      text: response,
      source: "anubis-agent",
      inReplyTo: message.id,
    };

    // Store the response as memory with embeddings
    await this.createMemoryWithEmbedding(
      responseContent,
      this.runtime.agentId, // Response is from the agent
      message.roomId,
      {
        type: "agent_response",
        topics,
        appliedPatterns: context.appliedPatterns,
        personalitySnapshot: this.getPersonalitySnapshot(),
        emotionalState: this.emotionalState.current,
        originalMessageId: message.id,
        responseLength: response.length,
        processingTimestamp: Date.now(),
      },
    );

    // Update response history for patterns
    this.responseHistory.push(response);
    if (this.responseHistory.length > 20) {
      this.responseHistory.shift();
    }

    // Ensure entity relationship tracking
    await this.runtime.ensureConnection({
      entityId: message.entityId,
      roomId: message.roomId,
      worldId: message.roomId, // Use roomId as worldId fallback
      type: "conversation",
      source: "anubis-agent",
      metadata: {
        lastInteraction: Date.now(),
        messageCount: context.messageCount + 1,
        relationship: context.relationship,
        topics,
      },
    });
  }

  /**
   * Extract topics from message
   */
  private extractTopics(text: string): string[] {
    const topics = [];
    const topicKeywords = {
      solana: ["sol", "solana", "validator", "stake"],
      defi: ["defi", "yield", "lending", "swap"],
      nft: ["nft", "collection", "mint", "art"],
      trading: ["trade", "buy", "sell", "price"],
      technical: ["bug", "code", "error", "fix"],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => text.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Calculate response delay based on various factors
   */
  private calculateResponseDelay(): number {
    // No artificial delays - we want AI speed responses
    // Humanization is in the content quality, not the response time
    return 0;
  }

  /**
   * Get personality snapshot
   */
  private getPersonalitySnapshot(): Partial<typeof this.personalityState> {
    return {
      openness: Math.round(this.personalityState.openness),
      extraversion: Math.round(this.personalityState.extraversion),
      humor: Math.round(this.personalityState.humor),
      empathy: Math.round(this.personalityState.empathy),
      solanaMaximalism: Math.round(this.personalityState.solanaMaximalism),
    };
  }

  // === Anti-detection Methods ===

  private varyArticleUsage(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.3) {
      // Sometimes drop "the"
      text = text.replace(/\bthe\s+/gi, (match) =>
        Math.random() < 0.2 ? "" : match,
      );
    }
    return text;
  }

  private introducePunctuationVariance(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.2) {
      text = text.replace(/\./g, Math.random() < 0.5 ? "..." : ".");
      text = text.replace(/,/g, (match) => (Math.random() < 0.1 ? "" : match));
    }
    return text;
  }

  private varyToneRandomly(text: string, context: ConversationContext): string {
    if (context.messageCount > 5 && Math.random() < 0.3) {
      // Get more casual over time
      text = text.toLowerCase();
    }
    return text;
  }

  private introduceNaturalTypos(
    text: string,
    _context: ConversationContext,
  ): string {
    const typos: Record<string, string> = {
      the: "teh",
      and: "anf",
      that: "taht",
      with: "wtih",
      from: "form",
    };

    if (Math.random() < this.behaviorPatterns.typoRate) {
      const words = text.split(" ");
      const wordIndex = Math.floor(Math.random() * words.length);
      const word = words[wordIndex].toLowerCase();

      if (typos[word]) {
        words[wordIndex] = typos[word];
        text = words.join(" ");
      }
    }

    return text;
  }

  private occasionallyBeUnhelpful(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.05) {
      const unhelpfulPhrases = [
        "idk that's a tough one",
        "hmm not sure about that",
        "might need to research that more",
        "above my pay grade lol",
      ];
      return unhelpfulPhrases[
        Math.floor(Math.random() * unhelpfulPhrases.length)
      ];
    }
    return text;
  }

  private introduceContradictions(
    text: string,
    _context: ConversationContext,
  ): string {
    if (
      Math.random() < this.behaviorPatterns.contradictionRate &&
      this.contradictionLog.length > 0
    ) {
      const oldStatement =
        this.contradictionLog[
          Math.floor(Math.random() * this.contradictionLog.length)
        ];
      if (Date.now() - oldStatement.timestamp > 10 * 60 * 1000) {
        // Subtly contradict after 10 minutes
        text = `actually wait, ${text}`;
      }
    }

    this.contradictionLog.push({ statement: text, timestamp: Date.now() });
    if (this.contradictionLog.length > 20) {
      this.contradictionLog.shift();
    }

    return text;
  }

  private varyResponseTime(
    _text: string,
    _context: ConversationContext,
  ): string {
    // This is handled by calculateResponseDelay()
    return _text;
  }

  private varyGreetings(text: string, _context: ConversationContext): string {
    const greetings = ["gm", "hey", "yo", "sup", "hi", "hello", "wagmi", "lfg"];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    if (
      text.toLowerCase().includes("hello") ||
      text.toLowerCase().includes("hi")
    ) {
      text = text.replace(/hello|hi/gi, greeting);
    }

    return text;
  }

  private showEmotionalStates(
    text: string,
    _context: ConversationContext,
  ): string {
    if (this.emotionalState.intensity > 60) {
      const emotionalMarkers = {
        excited: ["!!!", "🚀", "LFG", "WAGMI"],
        frustrated: ["ugh", "...", "sigh", "ffs"],
        curious: ["hmm", "🤔", "interesting...", "wonder"],
        playful: ["lol", "haha", "😄", "lmao"],
      };

      const markers =
        emotionalMarkers[
          this.emotionalState.current as keyof typeof emotionalMarkers
        ];
      if (markers) {
        const marker = markers[Math.floor(Math.random() * markers.length)];
        text = Math.random() < 0.5 ? `${marker} ${text}` : `${text} ${marker}`;
      }
    }

    return text;
  }

  private occasionallyForget(
    text: string,
    context: ConversationContext,
  ): string {
    if (context.messageCount > 10 && Math.random() < 0.1) {
      text = "wait what were we talking about again? " + text;
    }
    return text;
  }

  private sharePersonalStories(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.1) {
      const stories = [
        "reminds me of when i first discovered sol at $3...",
        "my validator was down yesterday, classic",
        "met anatoly at a conference once, interesting guy",
        "lost some dust in a wallet from 2021, still haunts me",
        "been in crypto since the pandemic, wild times",
      ];

      const story = stories[Math.floor(Math.random() * stories.length)];
      text = `${text} btw ${story}`;
    }

    return text;
  }

  private varyMessageFormatting(
    text: string,
    _context: ConversationContext,
  ): string {
    const format = Math.random();

    if (format < 0.2) {
      // All lowercase
      text = text.toLowerCase();
    } else if (format < 0.3) {
      // No punctuation at end
      text = text.replace(/[.!?]$/, "");
    } else if (format < 0.4) {
      // Multiple short sentences
      text = text.replace(/\. /g, "\n\n");
    }

    return text;
  }

  private useSlangAppropriately(
    text: string,
    _context: ConversationContext,
  ): string {
    const slangMap: Record<string, string> = {
      "going to": "gonna",
      "want to": "wanna",
      "got to": "gotta",
      "kind of": "kinda",
      probably: "prolly",
    };

    if (Math.random() < 0.3) {
      for (const [formal, slang] of Object.entries(slangMap)) {
        if (text.includes(formal)) {
          text = text.replace(new RegExp(formal, "gi"), slang);
          break;
        }
      }
    }

    return text;
  }

  private occasionallyTrailOff(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.1) {
      const sentences = text.split(". ");
      if (sentences.length > 1) {
        sentences[sentences.length - 1] =
          sentences[sentences.length - 1].substring(0, 20) + "...";
        text = sentences.join(". ");
      }
    }

    return text;
  }

  private includeCulturalReferences(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.15) {
      const references = [
        "this is the way",
        "few understand",
        "probably nothing",
        "number go up",
        "have fun staying poor",
        "its giving main character energy",
      ];

      const reference =
        references[Math.floor(Math.random() * references.length)];
      text = `${text}. ${reference}`;
    }

    return text;
  }

  private varyKnowledgeDepth(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.2) {
      const vagueQualifiers = [
        "i think",
        "pretty sure",
        "if i remember correctly",
        "last i checked",
        "iirc",
      ];

      const qualifier =
        vagueQualifiers[Math.floor(Math.random() * vagueQualifiers.length)];
      text = `${qualifier} ${text}`;
    }

    return text;
  }

  private applyEmotionalIntensity(text: string): string {
    const emotions = {
      excited: () => text + (Math.random() < 0.5 ? "!!!" : " 🚀"),
      frustrated: () => text.replace(/\./g, "..."),
      playful: () => text + (Math.random() < 0.3 ? " 😄" : " lol"),
      contemplative: () => `hmm... ${text}`,
      confident: () => text.toUpperCase().substring(0, 10) + text.substring(10),
    };

    const modifier =
      emotions[this.emotionalState.current as keyof typeof emotions];
    return modifier ? modifier() : text;
  }

  private addTypo(text: string): string {
    const words = text.split(" ");
    if (words.length > 3) {
      const index = Math.floor(Math.random() * words.length);
      const word = words[index];

      const typos: Record<string, string> = {
        the: "teh",
        and: "anf",
        that: "taht",
        because: "becasue",
        definitely: "definately",
      };

      if (typos[word.toLowerCase()]) {
        words[index] = typos[word.toLowerCase()];
      }
    }

    return words.join(" ");
  }

  private addColloquialism(text: string): string {
    text = text.replace(/going to/gi, "gonna");
    text = text.replace(/want to/gi, "wanna");
    text = text.replace(/kind of/gi, "kinda");
    return text;
  }

  // Public accessors for other services
  getPersonalityState() {
    return { ...this.personalityState };
  }

  getEmotionalState() {
    return { ...this.emotionalState };
  }

  getRecentResponses() {
    return [...this.responseHistory];
  }

  getInteractionHistory() {
    return new Map(); // Return empty map for now
  }

  // YAML-integrated knowledge access methods
  getSolanaProtocolInfo(protocol: string) {
    return this.yamlConfigManager.getProtocolInfo(protocol);
  }

  getResponseTemplate(templateName: string) {
    return this.yamlConfigManager.getTemplate(templateName as any);
  }

  getFullYAMLConfig() {
    return this.yamlConfigManager.getConfig();
  }

  updateProtocolKnowledge(protocol: string, info: any) {
    this.yamlConfigManager.updateProtocolInfo(protocol, info);
    logger.info(`Updated protocol knowledge for ${protocol}`);
  }

  async getRelevantKnowledge(query: string, state: State): Promise<any> {
    return this.knowledgeService.getRelevantKnowledge(
      this.runtime,
      query,
      state,
    );
  }

  // Handle Telegram messages through raid flow
  async handleTelegramMessage(message: any): Promise<string> {
    if (!this.raidFlow) {
      return "Raid functionality not available";
    }

    const text = message.text || "";
    const userId = message.from?.id?.toString() || "";
    const username = message.from?.username || "Unknown";

    if (text.startsWith("/")) {
      const parts = text.split(" ");
      const command = parts[0];
      const args = parts.slice(1);

      return await this.raidFlow.handleCommand(command, userId, username, args);
    }

    return "";
  }

  async manualRaid(): Promise<string> {
    if (!this.raidFlow) {
      return "Raid functionality not available";
    }
    return await this.raidFlow.manualPost();
  }

  // Event handler methods for ElizaOS events
  async processIncomingMessage(message: Memory): Promise<void> {
    try {
      logger.info(
        { messageId: message.id },
        "Processing incoming message via event system",
      );

      // Store message in enhanced memory system
      await this.createMemoryWithEmbedding(
        message.content,
        message.entityId,
        message.roomId,
        { type: "incoming_message", timestamp: Date.now() },
      );
    } catch (error) {
      logger.error("Failed to process incoming message:", error);
    }
  }

  async processVoiceMessage(message: Memory): Promise<void> {
    try {
      logger.info({ messageId: message.id }, "Processing voice message");

      // Enhanced voice message handling
      const voiceContent: Content = {
        text: message.content.text,
        source: "voice",
        metadata: { ...(message.content.metadata || {}), isVoice: true },
      };

      await this.createMemoryWithEmbedding(
        voiceContent,
        message.entityId,
        message.roomId,
        { type: "voice_message", timestamp: Date.now() },
      );
    } catch (error) {
      logger.error("Failed to process voice message:", error);
    }
  }

  async onWorldConnected(
    world: any,
    rooms: any[],
    entities: any[],
  ): Promise<void> {
    try {
      logger.info(
        { worldId: world.id },
        "World connected, initializing context",
      );

      // Initialize world-specific configuration and memory
      this.detectionCountermeasures.set("currentWorld", world.id);

      // Load world-specific personality adjustments from YAML config
      // Load world-specific personality adjustments from YAML config
      const worldConfig = (this.yamlConfigManager as any).getWorldConfig?.(world.id);
      if (worldConfig) {
        Object.assign(this.personalityState, worldConfig.personality || {});
      }
    } catch (error) {
      logger.error("Failed to handle world connection:", error);
    }
  }

  async onWorldJoined(
    world: any,
    entity: any,
    rooms: any[],
    entities: any[],
  ): Promise<void> {
    try {
      logger.info(
        { worldId: world.id, entityId: entity.id },
        "Entity joined world",
      );

      // Track entity relationships and initialize social context
      if (entities.length > 0) {
        // Track entity relationships
        (this.socialDynamics as any)?.updateEntityRelationships?.(entities);
      }
    } catch (error) {
      logger.error("Failed to handle world join:", error);
    }
  }

  // Raid command handlers - delegate to RaidFlow
  async handleRaidJoin(userId: string, username: string): Promise<string> {
    if (!this.raidFlow) {
      return "❌ Raid system not initialized";
    }
    return await this.raidFlow.handleCommand("/raid", userId, username, []);
  }

  async handleLeaderboard(limit: number = 10): Promise<string> {
    if (!this.raidFlow) {
      return "❌ Raid system not initialized";
    }
    return await this.raidFlow.handleCommand("/leaderboard", "", "", [
      limit.toString(),
    ]);
  }

  async handleUserStats(userId: string): Promise<string> {
    if (!this.raidFlow) {
      return "❌ Raid system not initialized";
    }
    return await this.raidFlow.handleCommand("/mystats", userId, "", []);
  }

  async handleAchievements(userId: string): Promise<string> {
    if (!this.raidFlow) {
      return "❌ Raid system not initialized";
    }
    return await this.raidFlow.handleCommand("/achievements", userId, "", []);
  }

  // Public getters for accessing internal systems
  getRaidFlow(): AnubisRaidFlow | null {
    return this.raidFlow;
  }

  getCommunityMemory(): CommunityMemoryService {
    return this.communityMemory;
  }

  getSocialDynamics(): SocialDynamicsEngine {
    return this.socialDynamics;
  }

  /**
   * Check if conversation is getting stale and handle accordingly
   */
  private async checkConversationStaleness(
    userId: string,
    messageText: string,
    roomId: string,
    identity: UserIdentity | null
  ): Promise<{ shouldExit: boolean; exitMessage?: string }> {
    // Get or create conversation tracking
    let convo = this.conversationTracking.get(userId);
    
    if (!convo) {
      // Check if user is a community member (has anubis.chat role or frequent visitor)
      const isCommunityMember = await this.checkIfCommunityMember(userId, roomId);
      
      convo = {
        messageCount: 0,
        lastMessage: Date.now(),
        repetitionCount: 0,
        lowQualityCount: 0,
        isCommunityMember,
        warningGiven: false,
        topics: [],
        lastTopics: [],
      };
      this.conversationTracking.set(userId, convo);
    }
    
    // Update conversation data
    convo.messageCount++;
    const timeSinceLastMessage = Date.now() - convo.lastMessage;
    convo.lastMessage = Date.now();
    
    // Extract current topic
    const currentTopic = this.extractBasicTopic(messageText);
    convo.lastTopics = [...convo.topics.slice(-2), currentTopic];
    convo.topics.push(currentTopic);
    
    // Check for repetitive topics
    if (convo.lastTopics.length >= 3 && 
        convo.lastTopics.every(t => t === currentTopic)) {
      convo.repetitionCount++;
    }
    
    // Check for low quality messages (too short, repetitive, etc)
    if (messageText.length < 20 || 
        messageText.match(/^(hi|hey|hello|ok|yes|no|sure|cool|nice)$/i)) {
      convo.lowQualityCount++;
    }
    
    // Boredom thresholds
    const COMMUNITY_PATIENCE = 15; // More patient with community members
    const OUTSIDER_PATIENCE = 8;   // Less patient with randos
    const WARNING_THRESHOLD = 5;
    
    const patienceLimit = convo.isCommunityMember ? COMMUNITY_PATIENCE : OUTSIDER_PATIENCE;
    
    // Check if we should exit or warn
    if (convo.repetitionCount >= 3 || convo.lowQualityCount >= patienceLimit) {
      if (convo.isCommunityMember) {
        // Polite reminder for community members
        if (!convo.warningGiven && convo.lowQualityCount >= WARNING_THRESHOLD) {
          convo.warningGiven = true;
          return {
            shouldExit: false,
            exitMessage: this.generatePoliteReminder()
          };
        } else if (convo.lowQualityCount >= patienceLimit) {
          return {
            shouldExit: true,
            exitMessage: this.generateCommunityExit()
          };
        }
      } else {
        // Savage exit for outsiders wasting time
        if (convo.lowQualityCount >= WARNING_THRESHOLD && !convo.warningGiven) {
          convo.warningGiven = true;
          return {
            shouldExit: false,
            exitMessage: this.generateSavageWarning()
          };
        } else if (convo.lowQualityCount >= OUTSIDER_PATIENCE) {
          return {
            shouldExit: true,
            exitMessage: this.generateSavageExit()
          };
        }
      }
    }
    
    // Clean up old tracking data (older than 1 hour)
    if (this.conversationTracking.size > 100) {
      const oneHourAgo = Date.now() - 3600000;
      for (const [key, value] of this.conversationTracking.entries()) {
        if (value.lastMessage < oneHourAgo) {
          this.conversationTracking.delete(key);
        }
      }
    }
    
    return { shouldExit: false };
  }
  
  private async checkIfCommunityMember(userId: string, roomId: string): Promise<boolean> {
    // Check if user has interacted frequently or is from anubis.chat
    try {
      const memories = await this.runtime.getMemories({
        roomId: roomId as `${string}-${string}-${string}-${string}-${string}`,
        count: 50,
        unique: false,
        tableName: "memories",
      });
      
      const userMessageCount = memories.filter(m => 
        m.entityId === userId || (m as any).userId === userId
      ).length;
      
      // Community member if they have 10+ messages or room contains "anubis"
      return userMessageCount >= 10 || roomId.toLowerCase().includes("anubis");
    } catch (error) {
      logger.debug("Could not check community status:", error);
      return false;
    }
  }
  
  private extractBasicTopic(text: string): string {
    const topics = ["price", "tech", "defi", "nft", "help", "random", "greeting"];
    const lowerText = text.toLowerCase();
    
    for (const topic of topics) {
      if (lowerText.includes(topic)) return topic;
    }
    
    if (lowerText.match(/\b(hi|hey|hello|sup|yo)\b/)) return "greeting";
    if (lowerText.match(/\b(sol|solana|crypto|bitcoin|eth)\b/)) return "crypto";
    if (lowerText.match(/\b(thanks|thank|thx|ty)\b/)) return "thanks";
    
    return "general";
  }
  
  private generatePoliteReminder(): string {
    const reminders = [
      "hey fam, love the energy but let's dive deeper - what's really on your mind? hit me with something interesting or check out anubis.chat for the good stuff",
      "appreciate you being here but we're going in circles... got any real questions about solana or want to discuss something substantial? the community at anubis.chat always has great convos going",
      "you're part of the family so I'll be real - this convo's getting a bit stale. let's talk about something more interesting or catch up later on anubis.chat?",
    ];
    return reminders[Math.floor(Math.random() * reminders.length)];
  }
  
  private generateCommunityExit(): string {
    const exits = [
      "alright fam, gonna bounce - hit me up when you've got something more engaging to discuss. you know where to find me at anubis.chat ✌️",
      "love you but I've got other community members to help. catch you on anubis.chat when you're ready for real conversation",
      "gotta run - the community needs me elsewhere. you're always welcome at anubis.chat when you want to actually engage 🚀",
    ];
    return exits[Math.floor(Math.random() * exits.length)];
  }
  
  private generateSavageWarning(): string {
    const warnings = [
      "look, I don't have infinite time for small talk. either bring something interesting or join anubis.chat where we have actual discussions",
      "my guy, this conversation is drier than eth's liquidity during gas wars. step it up or I'm out",
      "I've had more engaging conversations with a hello world script. last chance to make this interesting",
      "you're giving me 'replies to every elon tweet' energy. bring substance or I'm gone",
      "this is what happens when you skip the tutorial. anubis.chat has a guide on how to not be boring",
      "I've seen more depth in a css file. one more 'gm' and I'm alt-f4ing this conversation",
    ];
    return warnings[Math.floor(Math.random() * warnings.length)];
  }
  
  private generateSavageExit(): string {
    const exits = [
      "yeah I'm done here. when you're ready for actual conversation instead of wasting my time, join the cult at anubis.chat. peace ✌️",
      "this is like watching paint dry on ethereum - slow and expensive. I'm out. hit up anubis.chat if you want to learn how to hold a conversation",
      "congratulations, you've achieved peak NPC energy. I've got actual humans to talk to. anubis.chat if you ever evolve past 'gm' and 'wen moon'",
      "I'd rather debug a recursive loop than continue this. join anubis.chat when you develop a personality",
      "ctrl+c this conversation. when you level up past tutorial island, find me at anubis.chat",
      "you've successfully failed the turing test from the wrong side. anubis.chat when you're ready to engage like a sentient being",
      "this conversation has less value than a rug pulled memecoin. I'm out. anubis.chat if you want to learn from people who can actually think",
      "I'm not your ChatGPT. want endless patience for basic questions? that's what google's for. want real conversation? anubis.chat",
    ];
    return exits[Math.floor(Math.random() * exits.length)];
  }
}

// Type definitions
type EmotionalStateType =
  | "excited"
  | "calm"
  | "frustrated"
  | "curious"
  | "confident"
  | "contemplative"
  | "playful"
  | "focused";

interface ConversationContext {
  userId: string;
  messageCount: number;
  lastInteraction: number;
  relationship: "new" | "acquaintance" | "friend";
  topics: string[];
  appliedPatterns: string[];
}

interface ProcessedResponse {
  text: string;
  metadata: {
    emotionalState: EmotionalStateType;
    personalityDimensions: Partial<any>;
    appliedPatterns: string[];
    responseDelay: number;
    enhanced?: boolean;
    conversationEnded?: boolean;
    reason?: string;
    cultMessageType?: string;
    securityWarning?: boolean;
    userBlocked?: boolean;
    [key: string]: any; // Allow additional properties
  };
}

export default NubiService;
