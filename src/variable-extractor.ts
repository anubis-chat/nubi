import { IAgentRuntime, Memory, State, logger } from "@elizaos/core";
import { UserIdentity } from "./user-identity-service";

/**
 * Variable Extraction Service
 *
 * Extracts and maintains a comprehensive set of variables from messages,
 * context, and state for use in dynamic template generation
 */
export class VariableExtractor {
  private runtime: IAgentRuntime;
  private variableCache = new Map<string, any>();
  private marketDataCache = new Map<
    string,
    { value: any; timestamp: number }
  >();
  private readonly CACHE_TTL = 60000; // 1 minute for market data

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Extract all variables from current context
   */
  async extractVariables(
    message: Memory,
    state: State,
    identity?: UserIdentity,
    relationshipHistory?: Memory[],
  ): Promise<VariableContext> {
    const variables: VariableContext = {
      // User Context
      user: await this.extractUserVariables(message, identity),

      // Conversation Context
      conversation: await this.extractConversationVariables(
        message,
        relationshipHistory,
      ),

      // Time Context
      time: this.extractTimeVariables(),

      // Platform Context
      platform: this.extractPlatformVariables(message),

      // Market Data (cached)
      market: await this.extractMarketVariables(),

      // Emotional Context
      emotional: this.extractEmotionalVariables(state),

      // Relationship Context
      relationship: this.extractRelationshipVariables(relationshipHistory),

      // Content Analysis
      content: this.extractContentVariables(message),

      // Dynamic Context
      dynamic: await this.extractDynamicVariables(message, state),
    };

    // Cache commonly used variables
    this.updateCache(variables);

    return variables;
  }

  /**
   * Extract user-related variables
   */
  private async extractUserVariables(
    message: Memory,
    identity?: UserIdentity,
  ): Promise<UserVariables> {
    const content = message.content as any;

    return {
      username:
        identity?.platformUsername || content.author?.username || "anon",
      display_name: identity?.displayName || content.author?.name || "",
      user_id: message.entityId,
      platform_id: identity?.platformUserId || "",
      platform: identity?.platform || this.detectPlatform(message),

      // User metadata
      is_verified: content.author?.verified || false,
      follower_count: content.author?.followersCount || 0,
      is_premium: content.author?.premium || false,

      // User timezone (estimated from activity)
      timezone: this.estimateTimezone(message),
      local_time: this.getUserLocalTime(message),

      // User preferences (learned over time)
      preferred_name:
        this.variableCache.get(`user_${message.entityId}_preferred_name`) ||
        null,
      favorite_topics:
        this.variableCache.get(`user_${message.entityId}_topics`) || [],
      language_style: this.detectLanguageStyle(message.content.text || ""),
    };
  }

  /**
   * Extract conversation-related variables
   */
  private async extractConversationVariables(
    message: Memory,
    history?: Memory[],
  ): Promise<ConversationVariables> {
    const recentMessages = history?.slice(-10) || [];
    const lastMessage = recentMessages[recentMessages.length - 2]; // Previous message

    return {
      last_message: lastMessage?.content.text || "",
      previous_topic: this.extractTopic(lastMessage?.content.text || ""),
      current_topic: this.extractTopic(message.content.text || ""),

      // Conversation metrics
      message_count: recentMessages.length,
      conversation_duration: this.calculateDuration(recentMessages),
      avg_response_time: this.calculateAvgResponseTime(recentMessages),

      // Conversation state
      is_question: message.content.text?.includes("?") || false,
      is_greeting: this.isGreeting(message.content.text || ""),
      is_farewell: this.isFarewell(message.content.text || ""),
      needs_clarification: this.needsClarification(message.content.text || ""),

      // Thread context
      thread_depth: this.calculateThreadDepth(recentMessages),
      context_switch: this.detectContextSwitch(message, lastMessage),
    };
  }

  /**
   * Extract time-related variables
   */
  private extractTimeVariables(): TimeVariables {
    const now = new Date();
    const hour = now.getHours();

    return {
      current_time: now.toLocaleTimeString(),
      current_date: now.toLocaleDateString(),
      timestamp: now.getTime(),

      // Time parts
      hour,
      minute: now.getMinutes(),
      day_of_week: now
        .toLocaleDateString("en", { weekday: "long" })
        .toLowerCase(),
      month: now.toLocaleDateString("en", { month: "long" }).toLowerCase(),

      // Day parts
      day_part: this.getDayPart(hour),
      is_weekend: now.getDay() === 0 || now.getDay() === 6,
      is_night: hour >= 22 || hour < 6,
      is_business_hours: hour >= 9 && hour < 17,

      // Market times
      is_market_open: this.isMarketOpen(now),
      market_session: this.getMarketSession(now),

      // Relative times
      time_since_last: this.variableCache.get("last_interaction_time")
        ? now.getTime() - this.variableCache.get("last_interaction_time")
        : 0,
    };
  }

  /**
   * Extract platform-specific variables
   */
  private extractPlatformVariables(message: Memory): PlatformVariables {
    const content = message.content as any;
    const platform = this.detectPlatform(message);

    return {
      platform_name: platform,
      platform_features: this.getPlatformFeatures(platform),

      // Context type
      is_dm: content.chat?.type === "private" || content.isDM || false,
      is_group: content.chat?.type === "group" || content.isGroup || false,
      is_public: !content.isDM && !content.isGroup,

      // Group context
      group_size: content.memberCount || content.chat?.members_count || 0,
      group_name: content.chat?.title || content.channel?.name || "",

      // Platform-specific
      has_media: !!(content.photo || content.video || content.document),
      has_reply: !!(content.reply_to_message || content.replyTo),
      has_mention: this.hasMention(message.content.text || ""),

      // Interaction type
      interaction_type: this.getInteractionType(content),
      message_format: content.type || "text",
    };
  }

  /**
   * Extract market-related variables (cached)
   */
  private async extractMarketVariables(): Promise<MarketVariables> {
    // Check cache first
    const cached = this.marketDataCache.get("market_data");
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    // Fetch fresh data (mock for now - would integrate with real APIs)
    const marketData: MarketVariables = {
      sol_price: await this.getSolanaPrice(),
      sol_change_24h: await this.getSolanaChange24h(),
      sol_change_1h: await this.getSolanaChange1h(),

      // Market metrics
      market_cap: await this.getMarketCap(),
      volume_24h: await this.getVolume24h(),

      // Gas and fees
      gas_fees: await this.getGasFees(),
      priority_fee: await this.getPriorityFee(),

      // Trending
      trending_tokens: await this.getTrendingTokens(),
      hot_pools: await this.getHotPools(),

      // Market sentiment
      fear_greed_index: await this.getFearGreedIndex(),
      market_sentiment: await this.getMarketSentiment(),

      // Network stats
      tps: await this.getCurrentTPS(),
      validator_count: await this.getValidatorCount(),
    };

    // Cache the results
    this.marketDataCache.set("market_data", {
      value: marketData,
      timestamp: Date.now(),
    });

    return marketData;
  }

  /**
   * Extract emotional context variables
   */
  private extractEmotionalVariables(state: State): EmotionalVariables {
    const emotionalState = state.values?.emotionalState || {};
    const personalityState = state.values?.personality || {};

    return {
      current_mood: emotionalState.current || "neutral",
      mood_intensity: emotionalState.intensity || 50,
      mood_duration: emotionalState.duration || 0,

      // Energy levels
      energy_level: personalityState.extraversion || 70,
      frustration_level: emotionalState.frustration || 0,
      excitement_level: emotionalState.excitement || 50,

      // Emotional triggers
      recent_triggers: emotionalState.triggers || [],
      emotional_stability: 100 - (personalityState.neuroticism || 25),

      // Personality dimensions
      openness: personalityState.openness || 75,
      humor_level: personalityState.humor || 65,
      empathy_level: personalityState.empathy || 85,

      // Behavioral modifiers
      typo_probability: this.calculateTypoProbability(emotionalState),
      response_delay: this.calculateResponseDelay(emotionalState),
      contradiction_chance: 0.15, // Base 15%
    };
  }

  /**
   * Extract relationship context variables
   */
  private extractRelationshipVariables(
    history?: Memory[],
  ): RelationshipVariables {
    if (!history || history.length === 0) {
      return {
        familiarity_score: 0,
        interaction_count: 0,
        first_interaction: null,
        last_interaction: null,
        shared_topics: [],
        trust_level: 0,
        relationship_type: "stranger",
        sentiment_history: "neutral",
        preferred_greeting: null,
        inside_jokes: [],
      };
    }

    return {
      familiarity_score: Math.min(history.length * 10, 100),
      interaction_count: history.length,
      first_interaction: history[0]?.createdAt || null,
      last_interaction: history[history.length - 1]?.createdAt || null,

      // Content analysis
      shared_topics: this.extractSharedTopics(history),
      trust_level: this.calculateTrustLevel(history),
      relationship_type: this.determineRelationshipType(history.length),

      // Sentiment tracking
      sentiment_history: this.analyzeSentimentHistory(history),

      // Personalization
      preferred_greeting: this.detectPreferredGreeting(history),
      inside_jokes: this.extractInsideJokes(history),
    };
  }

  /**
   * Extract content-related variables
   */
  private extractContentVariables(message: Memory): ContentVariables {
    const text = message.content.text || "";

    return {
      // Mentioned items
      mentioned_protocols: this.extractProtocols(text),
      mentioned_tokens: this.extractTokens(text),
      mentioned_users: this.extractMentions(text),

      // Content analysis
      asked_about: this.extractQuestions(text),
      referenced_links: this.extractLinks(text),

      // Technical content
      contains_code: /```|`[^`]+`/.test(text),
      contains_numbers: /\d+/.test(text),
      contains_emoji: /[\u{1F300}-\u{1F9FF}]/u.test(text),

      // Content type
      content_type: this.detectContentType(text),
      sentiment: this.analyzeSentiment(text),
      urgency: this.detectUrgency(text),

      // Language
      language: this.detectLanguage(text),
      formality: this.detectFormality(text),
    };
  }

  /**
   * Extract dynamic variables based on context
   */
  private async extractDynamicVariables(
    message: Memory,
    state: State,
  ): Promise<DynamicVariables> {
    return {
      // Random values for variation
      random: Math.random(),
      random_0_10: Math.floor(Math.random() * 11),
      random_bool: Math.random() > 0.5,

      // Computed values
      should_use_emoji: this.shouldUseEmoji(message, state),
      should_be_brief: this.shouldBeBrief(message),
      should_ask_question: this.shouldAskQuestion(state),

      // Behavioral flags
      is_distracted: Math.random() < 0.1,
      is_tired: new Date().getHours() > 22 || new Date().getHours() < 6,
      is_excited: state.values?.emotionalState?.current === "excited",

      // Response modifiers
      brevity_modifier: this.calculateBrevityModifier(message),
      friendliness_modifier: this.calculateFriendlinessModifier(state),
      technicality_modifier: this.calculateTechnicalityModifier(message),
    };
  }

  // Helper methods

  private detectPlatform(message: Memory): string {
    const source = message.content?.source?.toLowerCase() || "";
    if (source.includes("twitter") || source.includes("x.com"))
      return "twitter";
    if (source.includes("telegram")) return "telegram";
    if (source.includes("discord")) return "discord";
    return "unknown";
  }

  private getDayPart(hour: number): string {
    if (hour < 6) return "night";
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    if (hour < 22) return "evening";
    return "night";
  }

  private isGreeting(text: string): boolean {
    const greetings = ["hello", "hi", "hey", "gm", "good morning", "sup", "yo"];
    return greetings.some((g) => text.toLowerCase().includes(g));
  }

  private isFarewell(text: string): boolean {
    const farewells = [
      "bye",
      "goodbye",
      "gn",
      "good night",
      "see you",
      "later",
      "peace",
    ];
    return farewells.some((f) => text.toLowerCase().includes(f));
  }

  private extractTopic(text: string): string {
    // Simple topic extraction - would be enhanced with NLP
    if (text.includes("price")) return "price";
    if (text.includes("validator")) return "validators";
    if (text.includes("stake")) return "staking";
    if (text.includes("trade")) return "trading";
    return "general";
  }

  private extractProtocols(text: string): string[] {
    const protocols = [
      "jito",
      "marinade",
      "jupiter",
      "orca",
      "drift",
      "kamino",
      "marginfi",
    ];
    return protocols.filter((p) => text.toLowerCase().includes(p));
  }

  private extractTokens(text: string): string[] {
    const tokens = ["sol", "usdc", "usdt", "bonk", "jto", "jup", "mnde"];
    return tokens.filter((t) => text.toLowerCase().includes(t));
  }

  private shouldUseEmoji(message: Memory, state: State): boolean {
    // Use emoji sparingly based on context
    const sentiment = this.analyzeSentiment(message.content.text || "");
    const mood = state.values?.emotionalState?.current || "neutral";

    if (sentiment === "positive" && mood === "excited")
      return Math.random() < 0.3;
    if (message.content.text?.includes("🚀")) return Math.random() < 0.5;
    return Math.random() < 0.05; // 5% chance normally
  }

  // Mock data fetchers (would connect to real APIs)
  private async getSolanaPrice(): Promise<number> {
    return 175.42; // Mock price
  }

  private async getSolanaChange24h(): Promise<number> {
    return 5.2; // Mock 24h change
  }

  private async getSolanaChange1h(): Promise<number> {
    return 0.8; // Mock 1h change
  }

  private async getMarketCap(): Promise<number> {
    return 78000000000; // Mock market cap
  }

  private async getVolume24h(): Promise<number> {
    return 2500000000; // Mock volume
  }

  private async getGasFees(): Promise<number> {
    return 0.00025; // Mock gas fee in SOL
  }

  private async getPriorityFee(): Promise<number> {
    return 0.0001; // Mock priority fee
  }

  private async getTrendingTokens(): Promise<string[]> {
    return ["BONK", "WIF", "PYTH"];
  }

  private async getHotPools(): Promise<string[]> {
    return ["SOL/USDC", "BONK/SOL", "JTO/USDC"];
  }

  private async getFearGreedIndex(): Promise<number> {
    return 65; // Mock fear/greed index
  }

  private async getMarketSentiment(): Promise<string> {
    return "bullish";
  }

  private async getCurrentTPS(): Promise<number> {
    return 3500; // Mock TPS
  }

  private async getValidatorCount(): Promise<number> {
    return 2000; // Mock validator count
  }

  private calculateTypoProbability(emotionalState: any): number {
    if (emotionalState.current === "excited") return 0.08;
    if (emotionalState.current === "frustrated") return 0.06;
    return 0.03;
  }

  private calculateResponseDelay(emotionalState: any): number {
    // No artificial delays - AI speed responses
    return 0;
  }

  private extractSharedTopics(history: Memory[]): string[] {
    // Extract topics from conversation history
    const topics = new Set<string>();
    history.forEach((m) => {
      const topic = this.extractTopic(m.content.text || "");
      if (topic !== "general") topics.add(topic);
    });
    return Array.from(topics);
  }

  private calculateTrustLevel(history: Memory[]): number {
    // Simple trust calculation based on interaction count
    return Math.min(history.length * 5, 100);
  }

  private determineRelationshipType(count: number): string {
    if (count === 0) return "stranger";
    if (count < 5) return "acquaintance";
    if (count < 20) return "regular";
    if (count < 50) return "friend";
    return "close_friend";
  }

  private analyzeSentiment(text: string): string {
    const positive = ["good", "great", "awesome", "love", "bullish"];
    const negative = ["bad", "hate", "bearish", "dump", "scam"];

    const hasPositive = positive.some((p) => text.toLowerCase().includes(p));
    const hasNegative = negative.some((n) => text.toLowerCase().includes(n));

    if (hasPositive && !hasNegative) return "positive";
    if (hasNegative && !hasPositive) return "negative";
    if (hasPositive && hasNegative) return "mixed";
    return "neutral";
  }

  private detectFormality(text: string): string {
    if (text.includes("sir") || text.includes("please")) return "formal";
    if (text.includes("lol") || text.includes("bruh")) return "casual";
    return "moderate";
  }

  private updateCache(variables: VariableContext): void {
    // Cache important variables for quick access
    this.variableCache.set("last_interaction_time", Date.now());
    this.variableCache.set("last_user", variables.user.username);
    this.variableCache.set("last_topic", variables.conversation.current_topic);
  }

  // Add more helper methods as needed...

  private estimateTimezone(message: Memory): string {
    // Simple timezone estimation based on activity time
    const hour = message.createdAt
      ? new Date(message.createdAt).getHours()
      : new Date().getHours();
    if (hour >= 0 && hour < 8) return "PST";
    if (hour >= 8 && hour < 16) return "EST";
    return "UTC";
  }

  private getUserLocalTime(message: Memory): string {
    return message.createdAt
      ? new Date(message.createdAt).toLocaleTimeString()
      : new Date().toLocaleTimeString();
  }

  private detectLanguageStyle(text: string): string {
    if (text.includes("ser") || text.includes("gm")) return "crypto_native";
    if (text.length < 50) return "brief";
    return "normal";
  }

  private calculateDuration(messages: Memory[]): number {
    if (messages.length < 2) return 0;
    const first = messages[0]?.createdAt || 0;
    const last = messages[messages.length - 1]?.createdAt || 0;
    return last - first;
  }

  private calculateAvgResponseTime(messages: Memory[]): number {
    if (messages.length < 2) return 0;
    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i]?.createdAt || 0;
      const prev = messages[i - 1]?.createdAt || 0;
      totalTime += curr - prev;
      count++;
    }

    return count > 0 ? totalTime / count : 0;
  }

  private needsClarification(text: string): boolean {
    return (
      text.includes("what do you mean") ||
      text.includes("huh") ||
      text.includes("?")
    );
  }

  private calculateThreadDepth(messages: Memory[]): number {
    // Count continuous back-and-forth
    return messages.length;
  }

  private detectContextSwitch(current: Memory, previous?: Memory): boolean {
    if (!previous) return false;
    const currentTopic = this.extractTopic(current.content.text || "");
    const previousTopic = this.extractTopic(previous.content.text || "");
    return currentTopic !== previousTopic;
  }

  private getPlatformFeatures(platform: string): string[] {
    const features: Record<string, string[]> = {
      twitter: ["threads", "quotes", "spaces", "280_chars"],
      telegram: ["groups", "channels", "bots", "media"],
      discord: ["servers", "channels", "roles", "reactions"],
      unknown: [],
    };
    return features[platform] || [];
  }

  private hasMention(text: string): boolean {
    return text.includes("@") || text.includes("anubis");
  }

  private getInteractionType(content: any): string {
    if (content.reply_to_message) return "reply";
    if (content.is_quote) return "quote";
    if (content.is_retweet) return "retweet";
    return "message";
  }

  private isMarketOpen(now: Date): boolean {
    // Crypto markets are always open
    return true;
  }

  private getMarketSession(now: Date): string {
    const hour = now.getUTCHours();
    if (hour >= 0 && hour < 8) return "asia";
    if (hour >= 8 && hour < 16) return "europe";
    return "americas";
  }

  private extractQuestions(text: string): string[] {
    const questions = text.match(/[^.!?]*\?/g) || [];
    return questions.map((q) => q.trim());
  }

  private extractLinks(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  private detectContentType(text: string): string {
    if (text.includes("?")) return "question";
    if (text.includes("http")) return "link_share";
    if (text.includes("```")) return "code";
    if (text.length > 500) return "long_form";
    return "chat";
  }

  private detectUrgency(text: string): string {
    if (text.includes("urgent") || text.includes("asap")) return "high";
    if (text.includes("when you can")) return "low";
    return "normal";
  }

  private detectLanguage(text: string): string {
    // Simple language detection
    return "en";
  }

  private analyzeSentimentHistory(history: Memory[]): string {
    const sentiments = history.map((m) =>
      this.analyzeSentiment(m.content.text || ""),
    );
    const positive = sentiments.filter((s) => s === "positive").length;
    const negative = sentiments.filter((s) => s === "negative").length;

    if (positive > negative * 2) return "positive";
    if (negative > positive * 2) return "negative";
    return "neutral";
  }

  private detectPreferredGreeting(history: Memory[]): string | null {
    const greetings = history
      .filter((m) => this.isGreeting(m.content.text || ""))
      .map((m) => m.content.text?.toLowerCase());

    if (greetings.length === 0) return null;

    // Find most common greeting
    const counts = new Map<string, number>();
    greetings.forEach((g) => {
      if (g) counts.set(g, (counts.get(g) || 0) + 1);
    });

    return (
      Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
    );
  }

  private extractInsideJokes(history: Memory[]): string[] {
    // Would need more sophisticated analysis
    return [];
  }

  private extractMentions(text: string): string[] {
    const mentions = text.match(/@\w+/g) || [];
    return mentions.map((m) => m.substring(1));
  }

  private shouldBeBrief(message: Memory): boolean {
    const text = message.content.text || "";
    return (
      text.length < 50 || text.includes("quick") || text.includes("briefly")
    );
  }

  private shouldAskQuestion(state: State): boolean {
    // Ask question 30% of the time to maintain engagement
    return Math.random() < 0.3;
  }

  private calculateBrevityModifier(message: Memory): number {
    const text = message.content.text || "";
    if (text.length < 50) return 0.5;
    if (text.length > 500) return 1.5;
    return 1.0;
  }

  private calculateFriendlinessModifier(state: State): number {
    const agreeableness = state.values?.personality?.agreeableness || 80;
    return agreeableness / 100;
  }

  private calculateTechnicalityModifier(message: Memory): number {
    const text = message.content.text || "";
    if (text.includes("technical") || text.includes("explain")) return 1.5;
    if (text.includes("simple") || text.includes("eli5")) return 0.5;
    return 1.0;
  }
}

// Type definitions

export interface VariableContext {
  user: UserVariables;
  conversation: ConversationVariables;
  time: TimeVariables;
  platform: PlatformVariables;
  market: MarketVariables;
  emotional: EmotionalVariables;
  relationship: RelationshipVariables;
  content: ContentVariables;
  dynamic: DynamicVariables;
}

interface UserVariables {
  username: string;
  display_name: string;
  user_id: string;
  platform_id: string;
  platform: string;
  is_verified: boolean;
  follower_count: number;
  is_premium: boolean;
  timezone: string;
  local_time: string;
  preferred_name: string | null;
  favorite_topics: string[];
  language_style: string;
}

interface ConversationVariables {
  last_message: string;
  previous_topic: string;
  current_topic: string;
  message_count: number;
  conversation_duration: number;
  avg_response_time: number;
  is_question: boolean;
  is_greeting: boolean;
  is_farewell: boolean;
  needs_clarification: boolean;
  thread_depth: number;
  context_switch: boolean;
}

interface TimeVariables {
  current_time: string;
  current_date: string;
  timestamp: number;
  hour: number;
  minute: number;
  day_of_week: string;
  month: string;
  day_part: string;
  is_weekend: boolean;
  is_night: boolean;
  is_business_hours: boolean;
  is_market_open: boolean;
  market_session: string;
  time_since_last: number;
}

interface PlatformVariables {
  platform_name: string;
  platform_features: string[];
  is_dm: boolean;
  is_group: boolean;
  is_public: boolean;
  group_size: number;
  group_name: string;
  has_media: boolean;
  has_reply: boolean;
  has_mention: boolean;
  interaction_type: string;
  message_format: string;
}

interface MarketVariables {
  sol_price: number;
  sol_change_24h: number;
  sol_change_1h: number;
  market_cap: number;
  volume_24h: number;
  gas_fees: number;
  priority_fee: number;
  trending_tokens: string[];
  hot_pools: string[];
  fear_greed_index: number;
  market_sentiment: string;
  tps: number;
  validator_count: number;
}

interface EmotionalVariables {
  current_mood: string;
  mood_intensity: number;
  mood_duration: number;
  energy_level: number;
  frustration_level: number;
  excitement_level: number;
  recent_triggers: string[];
  emotional_stability: number;
  openness: number;
  humor_level: number;
  empathy_level: number;
  typo_probability: number;
  response_delay: number;
  contradiction_chance: number;
}

interface RelationshipVariables {
  familiarity_score: number;
  interaction_count: number;
  first_interaction: number | null;
  last_interaction: number | null;
  shared_topics: string[];
  trust_level: number;
  relationship_type: string;
  sentiment_history: string;
  preferred_greeting: string | null;
  inside_jokes: string[];
}

interface ContentVariables {
  mentioned_protocols: string[];
  mentioned_tokens: string[];
  mentioned_users: string[];
  asked_about: string[];
  referenced_links: string[];
  contains_code: boolean;
  contains_numbers: boolean;
  contains_emoji: boolean;
  content_type: string;
  sentiment: string;
  urgency: string;
  language: string;
  formality: string;
}

interface DynamicVariables {
  random: number;
  random_0_10: number;
  random_bool: boolean;
  should_use_emoji: boolean;
  should_be_brief: boolean;
  should_ask_question: boolean;
  is_distracted: boolean;
  is_tired: boolean;
  is_excited: boolean;
  brevity_modifier: number;
  friendliness_modifier: number;
  technicality_modifier: number;
}

export default VariableExtractor;
