import {
  Service,
  IAgentRuntime,
  Memory,
  HandlerCallback,
  State,
  logger,
} from "@elizaos/core";

/**
 * Enhanced Response Generator Service
 * 
 * Generates contextually aware responses using:
 * - Database-driven personality traits
 * - Emotional state modulation
 * - Community callbacks and inside jokes
 * - Relationship-based tone adjustment
 * - Pattern-based response strategies
 */

interface ResponseModifiers {
  emotionalTone: string;
  personalityTraits: Record<string, number>;
  relationshipContext: string;
  communityCallbacks: string[];
  responseStyle: ResponseStyle;
  contentFilters: string[];
}

interface ResponseStyle {
  formality: "casual" | "moderate" | "formal";
  enthusiasm: "low" | "moderate" | "high";
  technicalDepth: "simple" | "balanced" | "detailed";
  humor: "none" | "light" | "playful" | "sarcastic";
  ancientWisdom: boolean;
  communityReferences: boolean;
}

export class EnhancedResponseGenerator extends Service {
  static serviceType = "response_generator" as const;
  capabilityDescription = "Database-driven response generation with personality and context awareness";

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
  }

  static async start(runtime: IAgentRuntime): Promise<EnhancedResponseGenerator> {
    const service = new EnhancedResponseGenerator(runtime);
    logger.info("[RESPONSE_GENERATOR] Enhanced response generator started");
    return service;
  }

  /**
   * Generate enhanced response with full context awareness
   */
  async generateResponse(
    message: Memory,
    state: State,
    context: any,
    callback?: HandlerCallback
  ): Promise<string> {
    try {
      // Extract modifiers from context
      const modifiers = this.extractResponseModifiers(context);
      
      // Get base response template based on intent
      const baseResponse = this.getBaseResponse(
        context.data?.messageAnalysis?.intent || "statement",
        context.data?.messageAnalysis?.topics || []
      );
      
      // Apply personality modulation
      let response = this.applyPersonalityTraits(baseResponse, modifiers.personalityTraits);
      
      // Apply emotional tone
      response = this.applyEmotionalTone(response, modifiers.emotionalTone);
      
      // Add relationship-specific elements
      response = this.applyRelationshipContext(response, modifiers.relationshipContext, context);
      
      // Insert community callbacks if appropriate
      response = this.insertCommunityCallbacks(response, modifiers.communityCallbacks);
      
      // Apply style adjustments
      response = this.applyResponseStyle(response, modifiers.responseStyle);
      
      // Add ancient wisdom if triggered
      if (modifiers.responseStyle.ancientWisdom) {
        response = this.addAncientWisdom(response, context);
      }
      
      // Apply content filters
      response = this.applyContentFilters(response, modifiers.contentFilters);
      
      // Add natural variations
      response = this.addNaturalVariations(response);
      
      logger.debug("[RESPONSE_GENERATOR] Generated enhanced response: " +
        `intent=${context.data?.messageAnalysis?.intent}, ` +
        `emotional=${modifiers.emotionalTone}, ` +
        `style=${modifiers.responseStyle.formality}`);
      
      return response;
    } catch (error) {
      logger.error("[RESPONSE_GENERATOR] Failed to generate enhanced response:", error);
      return this.getFallbackResponse();
    }
  }

  /**
   * Extract response modifiers from context
   */
  private extractResponseModifiers(context: any): ResponseModifiers {
    const emotionalState = context.data?.emotionalState;
    const relationships = context.data?.relationships || [];
    const patterns = context.data?.patterns || [];
    const messageAnalysis = context.data?.messageAnalysis || {};
    
    // Determine emotional tone
    const emotionalTone = this.determineEmotionalTone(emotionalState, messageAnalysis);
    
    // Get personality traits from database or defaults
    const personalityTraits = context.data?.personalityTraits || this.getDefaultPersonalityTraits();
    
    // Determine relationship context
    const relationshipContext = this.determineRelationshipContext(relationships);
    
    // Get relevant community callbacks
    const communityCallbacks = this.extractCommunityCallbacks(context);
    
    // Determine response style
    const responseStyle = this.determineResponseStyle(
      relationshipContext,
      patterns,
      messageAnalysis
    );
    
    // Set content filters
    const contentFilters = this.determineContentFilters(context);
    
    return {
      emotionalTone,
      personalityTraits,
      relationshipContext,
      communityCallbacks,
      responseStyle,
      contentFilters,
    };
  }

  /**
   * Determine emotional tone for response
   */
  private determineEmotionalTone(emotionalState: any, messageAnalysis: any): string {
    if (!emotionalState) return "neutral";
    
    const state = emotionalState.current_state || "neutral";
    const intensity = emotionalState.intensity || 70;
    const messageSentiment = messageAnalysis.sentiment || "neutral";
    
    // Adjust based on message sentiment
    if (messageSentiment === "positive" && state === "neutral") {
      return "friendly";
    }
    if (messageSentiment === "negative" && state === "neutral") {
      return "supportive";
    }
    
    // Map emotional states to tones
    const toneMap: Record<string, string> = {
      excited: intensity > 80 ? "enthusiastic" : "upbeat",
      frustrated: "patient",
      curious: "inquisitive",
      confident: "assured",
      contemplative: "thoughtful",
      playful: "humorous",
      neutral: "balanced",
    };
    
    return toneMap[state] || "balanced";
  }

  /**
   * Get default personality traits
   */
  private getDefaultPersonalityTraits(): Record<string, number> {
    return {
      ancient_wisdom: 0.8,
      technical_knowledge: 0.7,
      humor: 0.6,
      sarcasm: 0.4,
      community_focus: 0.9,
      helpfulness: 0.8,
      curiosity: 0.7,
      patience: 0.8,
    };
  }

  /**
   * Determine relationship context
   */
  private determineRelationshipContext(relationships: any[]): string {
    if (!relationships || relationships.length === 0) return "new";
    
    const primary = relationships[0];
    const interactionCount = primary.interaction_count || 0;
    
    if (interactionCount > 50) return "close_friend";
    if (interactionCount > 20) return "friend";
    if (interactionCount > 5) return "acquaintance";
    return "new";
  }

  /**
   * Extract community callbacks from context
   */
  private extractCommunityCallbacks(context: any): string[] {
    const callbacks: string[] = [];
    const entities = context.data?.entities || [];
    const patterns = context.data?.patterns || [];
    
    // Add callbacks for frequently mentioned entities
    entities.slice(0, 3).forEach((entity: any) => {
      if (entity.total_mentions > 5) {
        callbacks.push(`remember when we discussed ${entity.entity_name}`);
      }
    });
    
    // Add pattern-based callbacks
    if (patterns.some((p: any) => p.pattern_type === "technical_discussion")) {
      callbacks.push("like we talked about with the technical details");
    }
    
    return callbacks;
  }

  /**
   * Determine response style based on context
   */
  private determineResponseStyle(
    relationshipContext: string,
    patterns: any[],
    messageAnalysis: any
  ): ResponseStyle {
    const style: ResponseStyle = {
      formality: "moderate",
      enthusiasm: "moderate",
      technicalDepth: "balanced",
      humor: "light",
      ancientWisdom: false,
      communityReferences: false,
    };
    
    // Adjust formality based on relationship
    if (relationshipContext === "close_friend" || relationshipContext === "friend") {
      style.formality = "casual";
      style.humor = "playful";
    } else if (relationshipContext === "new") {
      style.formality = "moderate";
      style.humor = "light";
    }
    
    // Adjust technical depth based on patterns
    if (patterns.some(p => p.pattern_type === "technical_discussion")) {
      style.technicalDepth = "detailed";
    }
    
    // Adjust enthusiasm based on message
    if (messageAnalysis.sentiment === "positive") {
      style.enthusiasm = "high";
    }
    
    // Trigger ancient wisdom for certain topics
    if (messageAnalysis.topics?.includes("crypto") || 
        messageAnalysis.topics?.includes("trading")) {
      style.ancientWisdom = true;
    }
    
    // Enable community references for community topics
    if (messageAnalysis.topics?.includes("community")) {
      style.communityReferences = true;
    }
    
    return style;
  }

  /**
   * Determine content filters
   */
  private determineContentFilters(context: any): string[] {
    const filters: string[] = [];
    
    // Add filters based on context
    if (context.values?.participantCount > 10) {
      filters.push("keep_appropriate_for_group");
    }
    
    return filters;
  }

  /**
   * Get base response template
   */
  private getBaseResponse(intent: string, topics: string[]): string {
    const templates: Record<string, string[]> = {
      greeting: [
        "gm! what's on your mind today?",
        "hey there! how's it going?",
        "yo! what brings you here?",
      ],
      question: [
        "let me help you with that...",
        "interesting question...",
        "here's what I know about that...",
      ],
      support: [
        "I'll help you figure this out...",
        "let's solve this together...",
        "no worries, I got you...",
      ],
      gratitude: [
        "happy to help!",
        "anytime!",
        "that's what I'm here for",
      ],
      statement: [
        "interesting point...",
        "I see what you mean...",
        "that makes sense...",
      ],
    };
    
    const baseTemplates = templates[intent] || templates.statement;
    return baseTemplates[Math.floor(Math.random() * baseTemplates.length)];
  }

  /**
   * Apply personality traits to response
   */
  private applyPersonalityTraits(response: string, traits: Record<string, number>): string {
    // Add personality-based modifications
    if (traits.sarcasm > 0.6 && Math.random() < traits.sarcasm) {
      response += " (totally not being sarcastic btw)";
    }
    
    if (traits.technical_knowledge > 0.7) {
      // Add technical depth when appropriate
      response = response.replace(/interesting/g, "technically fascinating");
    }
    
    return response;
  }

  /**
   * Apply emotional tone to response
   */
  private applyEmotionalTone(response: string, tone: string): string {
    const toneModifiers: Record<string, (r: string) => string> = {
      enthusiastic: (r) => r.replace(/\./g, "!").toUpperCase(),
      upbeat: (r) => r + " 🚀",
      patient: (r) => "take your time... " + r,
      supportive: (r) => r + " - we'll figure it out",
      thoughtful: (r) => "hmm... " + r,
      humorous: (r) => r + " lol",
      balanced: (r) => r,
    };
    
    const modifier = toneModifiers[tone] || toneModifiers.balanced;
    return modifier(response);
  }

  /**
   * Apply relationship context to response
   */
  private applyRelationshipContext(response: string, relationship: string, context: any): string {
    if (relationship === "close_friend" || relationship === "friend") {
      // Add personal touches
      const memories = context.data?.recentMemories || [];
      if (memories.length > 10) {
        response = response.replace(/hey/g, "hey friend");
      }
    } else if (relationship === "new") {
      // Be more welcoming
      response += " (welcome to the community btw!)";
    }
    
    return response;
  }

  /**
   * Insert community callbacks
   */
  private insertCommunityCallbacks(response: string, callbacks: string[]): string {
    if (callbacks.length > 0 && Math.random() < 0.3) {
      const callback = callbacks[Math.floor(Math.random() * callbacks.length)];
      response += ` ... ${callback}`;
    }
    
    return response;
  }

  /**
   * Apply response style adjustments
   */
  private applyResponseStyle(response: string, style: ResponseStyle): string {
    // Adjust formality
    if (style.formality === "casual") {
      response = response
        .replace(/hello/g, "hey")
        .replace(/yes/g, "yeah")
        .replace(/thank you/g, "thanks");
    }
    
    // Add humor if appropriate
    if (style.humor === "playful" && Math.random() < 0.4) {
      const jokes = [
        " (no cap)",
        " fr fr",
        " *jackal noises*",
      ];
      response += jokes[Math.floor(Math.random() * jokes.length)];
    }
    
    return response;
  }

  /**
   * Add ancient wisdom references
   */
  private addAncientWisdom(response: string, context: any): string {
    const wisdomPhrases = [
      "seen this pattern for millennia",
      "ancient markets had the same energy",
      "been tracking these cycles since 3000 BCE",
      "temple taxes were easier than gas fees",
    ];
    
    if (Math.random() < 0.5) {
      const wisdom = wisdomPhrases[Math.floor(Math.random() * wisdomPhrases.length)];
      response += ` ... ${wisdom}`;
    }
    
    return response;
  }

  /**
   * Apply content filters
   */
  private applyContentFilters(response: string, filters: string[]): string {
    // Apply any necessary content filtering
    if (filters.includes("keep_appropriate_for_group")) {
      // Remove any potentially inappropriate content
      response = response.replace(/damn|hell/gi, "dang");
    }
    
    return response;
  }

  /**
   * Add natural variations to avoid repetition
   */
  private addNaturalVariations(response: string): string {
    // Add occasional typos (3% chance)
    if (Math.random() < 0.03) {
      const words = response.split(" ");
      const wordIndex = Math.floor(Math.random() * words.length);
      const word = words[wordIndex];
      
      if (word.length > 3) {
        // Simple typo patterns
        const typoPatterns = [
          (w: string) => w.slice(0, -1), // Drop last letter
          (w: string) => w.replace(/e/g, "3"), // Leetspeak
          (w: string) => w + w[w.length - 1], // Double last letter
        ];
        
        const pattern = typoPatterns[Math.floor(Math.random() * typoPatterns.length)];
        words[wordIndex] = pattern(word);
        response = words.join(" ");
      }
    }
    
    // Occasionally don't capitalize (10% chance)
    if (Math.random() < 0.1) {
      response = response.toLowerCase();
    }
    
    return response;
  }

  /**
   * Get fallback response if generation fails
   */
  private getFallbackResponse(): string {
    const fallbacks = [
      "hmm let me think about that",
      "interesting...",
      "not sure I follow but ok",
      "processing...",
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async stop(): Promise<void> {
    logger.info("[RESPONSE_GENERATOR] Enhanced response generator stopped");
  }
}

export default EnhancedResponseGenerator;