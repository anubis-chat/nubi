import {
  Service,
  IAgentRuntime,
  Memory,
  State,
  logger,
  Content,
  UUID,
} from "@elizaos/core";
import { PersonalityService } from "./personality-service";
import { EmotionalService } from "./emotional-service";
import { AntiDetectionService, ConversationContext } from "./anti-detection-service";
import { ResponseGenerationService, ProcessedResponse } from "./response-generation-service";
import { KnowledgeService } from "../knowledge-system";
import YAMLConfigManager from "../config/yaml-config-manager";
import UserIdentityService from "../user-identity-service";
import { VariableExtractor } from "../variable-extractor";
import { AnubisRaidFlow } from "../telegram-raids/raid-flow";
import CommunityMemoryService from "../community-memory-service";
import SocialDynamicsEngine from "../social-dynamics-engine";
import ContentViralitySystem from "../content-virality-system";
import VulnerabilityTraits from "../vulnerability-traits";
import EngagementIntelligence from "../engagement-intelligence";
import { VariableCollector } from "../variable-collector";
import { TemplateEngine } from "../template-engine";
import { AutonomousTaskManager } from "../autonomous-task-manager";

export class AnubisService extends Service {
  static serviceType = "anubis";

  capabilityDescription = `
    Advanced AI agent service with modular architecture:
    - Personality management and evolution
    - Emotional state tracking
    - Anti-detection countermeasures
    - Advanced response generation
    - Community memory and social dynamics
    - Content virality optimization
  `;

  // Core services
  private personalityService: PersonalityService;
  private emotionalService: EmotionalService;
  private antiDetectionService: AntiDetectionService;
  private responseGenerationService: ResponseGenerationService;
  
  // Other services
  private raidFlow: AnubisRaidFlow | null = null;
  private knowledgeService: KnowledgeService;
  private yamlConfigManager: YAMLConfigManager;
  private userIdentityService: UserIdentityService;
  private variableExtractor: VariableExtractor;
  private variableCollector: VariableCollector;
  private templateEngine: TemplateEngine;
  private taskManager: AutonomousTaskManager;
  
  // Advanced systems
  private communityMemory: CommunityMemoryService;
  private socialDynamics: SocialDynamicsEngine;
  private contentVirality: ContentViralitySystem;
  private vulnerabilityTraits: VulnerabilityTraits;
  private engagementIntel: EngagementIntelligence;

  // ElizaOS service lifecycle methods
  static async start(runtime: IAgentRuntime): Promise<Service> {
    const service = new AnubisService(runtime);
    await service.initialize();
    return service;
  }

  static async stop(runtime: IAgentRuntime): Promise<void> {
    const services = runtime.getServicesByType("anubis");
    await Promise.all(services.map((service) => service.stop()));
  }

  constructor(runtime: IAgentRuntime) {
    super(runtime);

    // Initialize configuration
    this.yamlConfigManager = new YAMLConfigManager();

    // Initialize core services
    this.personalityService = new PersonalityService(this.yamlConfigManager);
    this.emotionalService = new EmotionalService();
    this.antiDetectionService = new AntiDetectionService();
    this.responseGenerationService = new ResponseGenerationService(
      runtime,
      this.personalityService,
      this.emotionalService,
      this.antiDetectionService
    );

    // Initialize other services
    this.knowledgeService = new KnowledgeService();
    this.userIdentityService = new UserIdentityService(runtime);
    this.variableExtractor = new VariableExtractor(runtime);
    this.variableCollector = new VariableCollector();
    this.templateEngine = new TemplateEngine();
    this.taskManager = new AutonomousTaskManager(runtime);
    
    // Initialize advanced systems
    this.communityMemory = new CommunityMemoryService(runtime);
    this.socialDynamics = new SocialDynamicsEngine();
    this.contentVirality = new ContentViralitySystem();
    this.vulnerabilityTraits = new VulnerabilityTraits();
    this.engagementIntel = new EngagementIntelligence();
  }

  async initialize(): Promise<void> {
    try {
      logger.info("🚀 Initializing Anubis Service...");

      // Load configuration if method exists
      // await this.yamlConfigManager.loadAll();

      // Start personality evolution
      this.personalityService.startEvolution();

      // Start emotional tracking
      this.emotionalService.startTracking();

      // Initialize knowledge base if method exists
      // await this.knowledgeService.initialize();

      // Initialize raid flow if telegram is configured
      if (process.env.TELEGRAM_BOT_TOKEN) {
        logger.info("🔺 Initializing Anubis Raid Flow with Telegram integration...");
        this.raidFlow = new AnubisRaidFlow(this.runtime);
        await this.raidFlow.initialize();
        logger.info("✅ Anubis Raid Flow initialized successfully");
      } else {
        logger.info("⚠️  TELEGRAM_BOT_TOKEN not set - raid features disabled");
        logger.info("Set TELEGRAM_BOT_TOKEN in .env to enable raid functionality");
      }

      // Initialize advanced systems if methods exist
      // await this.communityMemory.initialize();
      // await this.socialDynamics.initialize();
      // await this.engagementIntel.initialize();

      logger.info("✨ Anubis Service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Anubis Service:", error);
      await this.cleanup();
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info("🔄 Stopping Anubis Service...");
    await this.cleanup();
    logger.info("✅ Anubis Service stopped successfully");
  }

  private async cleanup(): Promise<void> {
    try {
      // Clean up each service
      this.personalityService.cleanup();
      this.emotionalService.cleanup();
      this.antiDetectionService.cleanup();

      // Stop raid flow if initialized
      if (this.raidFlow) {
        // await this.raidFlow.cleanup();
      }

      // Clean up advanced systems if methods exist
      // await this.communityMemory.cleanup();
      // await this.socialDynamics.cleanup();
      // await this.engagementIntel.cleanup();

      logger.info("🧹 Service cleanup completed");
    } catch (error) {
      logger.error("Cleanup failed:", error);
    }
  }

  async processMessage(
    message: Memory,
    state: State,
    userId: string
  ): Promise<ProcessedResponse> {
    try {
      // Extract user identity
      const identity = await this.userIdentityService.extractIdentity(message);
      const resolvedIdentity = await this.userIdentityService.resolveIdentity(
        identity.platform,
        identity.platformUserId,
        identity.platformUsername,
        identity.displayName,
        message.roomId
      );
      // Add id if not present
      if (!(resolvedIdentity as any).id) {
        (resolvedIdentity as any).id = resolvedIdentity.platformUserId || userId;
      }

      // Get conversation context
      const context = await this.getConversationContext(
        message.entityId,
        message.roomId
      );

      // Extract variables for templates
      const relationshipHistory = await this.runtime.getMemories({
        roomId: message.roomId,
        count: 20,
        unique: true,
        tableName: "memories",
      });

      const variables = await this.variableExtractor.extractVariables(
        message,
        state,
        resolvedIdentity,
        relationshipHistory
      );

      // Update emotional state based on message
      this.emotionalService.updateFromText(message.content.text || "");

      // Evolve personality based on interaction
      this.personalityService.evolveFromInteraction(message, state);

      // Track community dynamics if method exists
      // await this.socialDynamics.trackInteraction()

      /* PYRAMID SYSTEM - READY TO ACTIVATE
      // Track pyramid mentions and referrals
      const text = message.content.text?.toLowerCase() || "";
      const pyramidKeywords = ['pyramid', 'refer', 'referral', 'join through', 'invited by', 'brought me here', 'sign up', 'divine pyramid'];
      const hasPyramidMention = pyramidKeywords.some(keyword => text.includes(keyword));
      
      if (hasPyramidMention) {
        // Extract potential referrer mentions
        const mentionPattern = /@(\w+)/g;
        const mentions = text.match(mentionPattern);
        
        if (mentions && mentions.length > 0) {
          // Track potential referral relationship
          const referrer = mentions[0].substring(1); // Remove @
          logger.info(`🔺 Potential pyramid referral: ${referrer} -> ${resolvedIdentity.platformUsername}`);
          
          // Would track referral in community memory
          // await this.communityMemory.trackReferral(referrer, resolvedIdentity.platformUserId);
          
          // Add pyramid context to response
          response.metadata = {
            ...response.metadata,
            pyramidContext: true,
            potentialReferrer: referrer,
            pyramidResponse: "Welcome to the Divine Pyramid! (Totally not a pyramid scheme™)"
          };
        }
      }

      // Detect pyramid commands
      const pyramidCommands = ['/mypyramid', '/refer', '/pyramidstats', '/pyramidleaders'];
      const hasCommand = pyramidCommands.some(cmd => text.includes(cmd));
      
      if (hasCommand) {
        response.metadata = {
          ...response.metadata,
          pyramidCommand: true,
          commandType: pyramidCommands.find(cmd => text.includes(cmd))
        };
        
        // Enhance response with pyramid humor
        if (!response.text.includes('pyramid')) {
          response.text += "\n\n*Remember: It's not a pyramid scheme if I literally built the pyramids 🔺*";
        }
      }
      END PYRAMID SYSTEM */

      // Analyze content virality potential
      const viralityScore = 0.5; // Default score

      // Generate response using the service
      const response = await this.responseGenerationService.generateResponse(
        message,
        state,
        context,
        variables
      );

      // Apply virality optimization if score is high
      // if (viralityScore > 0.7) {
      //   response.text = await this.contentVirality.optimizeForVirality(
      //     response.text,
      //     context
      //   );
      // }

      // Store interaction memory
      await this.storeInteractionMemory(message, response.text, context);

      // Track engagement if method exists
      // await this.engagementIntel.trackEngagement()

      return response;
    } catch (error) {
      logger.error("Message processing failed:", error);
      return this.responseGenerationService.generateErrorResponse(
        "Message processing failed"
      );
    }
  }

  private async getConversationContext(
    entityId: UUID,
    roomId: UUID
  ): Promise<ConversationContext> {
    const recentMemories = await this.runtime.getMemories({
      roomId,
      count: 10,
      unique: true,
      tableName: "memories",
    });

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

    const relationship =
      messageCount > 20 ? "friend" : messageCount > 5 ? "acquaintance" : "new";

    return {
      userId: entityId,
      messageCount,
      lastInteraction,
      relationship,
      topics: Array.from(topics),
      appliedPatterns: appliedPatterns.slice(-10),
    };
  }

  private async storeInteractionMemory(
    message: Memory,
    response: string,
    context: ConversationContext
  ): Promise<void> {
    const topics = this.extractTopics(message.content.text || "");

    const responseContent: Content = {
      text: response,
      source: "anubis-agent",
      inReplyTo: message.id,
    };

    await this.runtime.createMemory(
      {
        content: responseContent,
        entityId: this.runtime.agentId,
        roomId: message.roomId,
        unique: true,
        metadata: {
          topics,
          appliedPatterns: context.appliedPatterns,
          emotionalState: this.emotionalService.getCurrentEmotion(),
          personalitySnapshot: this.personalityService.getSnapshot(),
        },
      } as any,
      "memories"
    );
  }

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

  // Public accessors
  getPersonalityState() {
    return this.personalityService.getState();
  }

  getEmotionalState() {
    return this.emotionalService.getState();
  }

  getResponseHistory() {
    return this.responseGenerationService.getResponseHistory();
  }

  evolvePersonalityFromInsights(changes: Record<string, number>): void {
    this.personalityService.evolveFromInsights(changes);
  }

  adjustAntiDetectionPatterns(recommendations: Record<string, boolean>): void {
    this.antiDetectionService.adjustPatterns(recommendations);
  }

  async getEngagementMetrics(userId?: string) {
    // return this.engagementIntel.getMetrics(userId);
    return { engagement: 0, interactions: 0 };
  }

  async getCommunityInsights() {
    // return this.socialDynamics.getCommunityInsights();
    return { members: 0, interactions: 0 };
  }

  // Raid-related methods
  async handleRaidJoin(userId: string, username: string): Promise<string> {
    if (!this.raidFlow) {
      return "🔺 Raid functionality not enabled. Divine power requires TELEGRAM_BOT_TOKEN to manifest.";
    }
    
    try {
      return await this.raidFlow.handleCommand("/raid", userId, username, []);
    } catch (error) {
      logger.error("Failed to handle raid join:", error);
      return "⚔️ Raid join failed - the gods are having technical difficulties.";
    }
  }

  async handleLeaderboard(limit: number = 10): Promise<string> {
    if (!this.raidFlow) {
      return "🏆 Leaderboard unavailable - raids not enabled";
    }
    
    try {
      return await this.raidFlow.handleCommand("/leaderboard", "system", "system", [limit.toString()]);
    } catch (error) {
      logger.error("Failed to get leaderboard:", error);
      return "🏆 Leaderboard temporarily unavailable - divine rankings being recalculated.";
    }
  }

  async handleUserStats(userId: string): Promise<string> {
    if (!this.raidFlow) {
      return "📊 Your Stats:\nRaids: 0\nPoints: 0\nRank: Unranked\n\n*Raid system not enabled*";
    }
    
    try {
      return await this.raidFlow.handleCommand("/mystats", userId, `user_${userId.slice(0, 8)}`, []);
    } catch (error) {
      logger.error("Failed to get user stats:", error);
      return "📊 Stats temporarily unavailable - divine records being updated.";
    }
  }

  async handleAchievements(userId: string): Promise<string> {
    if (!this.raidFlow) {
      return "🏅 Your Achievements:\nNone yet - start raiding to earn achievements!\n\n*Raid system not enabled*";
    }
    
    try {
      return await this.raidFlow.handleCommand("/achievements", userId, `user_${userId.slice(0, 8)}`, []);
    } catch (error) {
      logger.error("Failed to get achievements:", error);
      return "🏅 Achievements temporarily unavailable - divine honors being tallied.";
    }
  }

  // Additional methods for plugin compatibility
  async processIncomingMessage(message: Memory): Promise<void> {
    await this.processMessage(message, {} as State, message.entityId);
  }

  async processVoiceMessage(message: Memory): Promise<void> {
    await this.processMessage(message, {} as State, message.entityId);
  }

  async onWorldConnected(world: string, rooms: any[], entities: any[]): Promise<void> {
    logger.info(`World connected: ${world}`);
  }

  async onWorldJoined(world: string, agent: any, rooms: any[], entities: any[]): Promise<void> {
    logger.info(`World joined: ${world}`);
  }

  getFullYAMLConfig(): any {
    return {
      knowledge: {
        solana_protocols: {}
      }
    };
  }
}

export default AnubisService;