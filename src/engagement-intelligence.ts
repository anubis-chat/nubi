/**
 * Engagement Intelligence System
 *
 * Smart engagement patterns to avoid bot-like behavior
 * and maintain authentic interaction patterns
 */
export class EngagementIntelligence {
  // Engagement tracking
  private engagementLog = new Map<string, EngagementHistory>();
  private conversationThreads = new Map<string, ThreadContext>();
  private ignoredTopics = new Set<string>();

  // Anti-bot patterns
  private dailyEngagementCount = 0;
  private lastEngagementTime = 0;
  private consecutiveReplies = 0;
  private busyPeriods: BusyPeriod[] = [];

  // Smart engagement rules
  private engagementRules: EngagementRule[] = [];
  private platformBehavior = new Map<string, PlatformPattern>();

  // Natural patterns
  private typingSpeed = 40 + Math.random() * 20; // WPM
  private attentionSpan = 0.7 + Math.random() * 0.3;
  private currentEnergy = 0.5 + Math.random() * 0.5;

  // Twitter growth tracking
  private twitterGrowthMetrics = {
    dailyTweets: 0,
    dailyReplies: 0,
    dailyQuotes: 0,
    followersEngaged: new Set<string>(),
    topicsDiscussed: new Map<string, number>(),
    lastProactiveTweet: 0,
  };

  constructor() {
    this.initializeEngagementPatterns();
    this.scheduleMetricsReset();
  }

  /**
   * Reset daily metrics at midnight
   */
  private scheduleMetricsReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.resetDailyMetrics();
      // Schedule next reset
      setInterval(() => this.resetDailyMetrics(), 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private resetDailyMetrics(): void {
    this.dailyEngagementCount = 0;
    this.twitterGrowthMetrics.dailyTweets = 0;
    this.twitterGrowthMetrics.dailyReplies = 0;
    this.twitterGrowthMetrics.dailyQuotes = 0;
    this.twitterGrowthMetrics.followersEngaged.clear();
  }

  /**
   * Initialize with realistic engagement patterns
   */
  private initializeEngagementPatterns(): void {
    // Platform-specific behaviors
    this.platformBehavior.set("twitter", {
      platform: "twitter",
      maxDailyEngagements: 80 + Math.floor(Math.random() * 40), // Much more active on Twitter
      averageResponseTime: 3 * 60 * 1000, // 3 minutes - faster responses
      peakHours: [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21], // More active hours
      engagementStyle: "proactive", // Proactive engagement for growth
    });

    this.platformBehavior.set("telegram", {
      platform: "telegram",
      maxDailyEngagements: 30 + Math.floor(Math.random() * 20), // Less active on Telegram
      averageResponseTime: 5 * 60 * 1000, // 5 minutes - slower
      peakHours: [10, 11, 12, 15, 16, 17, 18, 19, 20],
      engagementStyle: "responsive", // Only respond when needed
    });

    // Engagement rules
    this.engagementRules = [
      {
        name: "avoid_reply_guy",
        condition: (target) => this.getRecentEngagementCount(target) > 3,
        action: "skip",
        cooldown: 6 * 60 * 60 * 1000, // 6 hours
      },
      {
        name: "respect_conversation_flow",
        condition: (target) => this.isInActiveConversation(target),
        action: "continue",
        cooldown: 0,
      },
      {
        name: "limited_daily_energy",
        condition: () => this.dailyEngagementCount > 50,
        action: "rest",
        cooldown: 4 * 60 * 60 * 1000, // 4 hours
      },
      {
        name: "avoid_spam_patterns",
        condition: () => this.consecutiveReplies > 5,
        action: "pause",
        cooldown: 30 * 60 * 1000, // 30 minutes
      },
    ];

    // Busy periods (when we're "doing other things")
    this.scheduleBusyPeriods();
  }

  /**
   * Determine if we should engage
   */
  shouldEngage(
    target: string,
    content: string,
    platform: "twitter" | "telegram",
    context: EngagementContext,
  ): EngagementDecision {
    // ALWAYS respond to mentions or direct commands
    if (context.isMentioned || content.startsWith("/")) {
      return {
        shouldEngage: true,
        reason: "direct_mention_or_command",
        alternativeAction: null,
        delay: this.calculateNaturalDelay(),
      };
    }

    // Twitter-specific: Be more proactive for community building
    if (platform === "twitter") {
      // Engage with crypto/Solana content more actively
      const cryptoKeywords =
        /\b(solana|sol|defi|crypto|web3|nft|dao|yield|staking|validator|blockchain)\b/i;
      const hasCryptoContent = cryptoKeywords.test(content);

      if (hasCryptoContent) {
        // Higher engagement for relevant content
        return {
          shouldEngage: Math.random() < 0.4, // 40% chance for crypto content
          reason: "crypto_content_engagement",
          alternativeAction:
            Math.random() < 0.3 ? "like_and_retweet" : "like_only",
          delay: this.calculateNaturalDelay() * 0.5, // Faster for Twitter
        };
      }

      // Engage with questions about DeFi/Solana
      if (content.includes("?") && hasCryptoContent) {
        return {
          shouldEngage: Math.random() < 0.7, // 70% chance to help with questions
          reason: "community_support",
          alternativeAction: null,
          delay: this.calculateNaturalDelay() * 0.3, // Quick to help
        };
      }
    }

    // Check if in busy period
    if (this.isCurrentlyBusy()) {
      return {
        shouldEngage: false,
        reason: "busy_period",
        alternativeAction: null,
        delay: 0,
      };
    }

    // Check platform limits
    const platformRules = this.platformBehavior.get(platform);
    if (
      platformRules &&
      this.dailyEngagementCount >= platformRules.maxDailyEngagements
    ) {
      return {
        shouldEngage: false,
        reason: "daily_limit",
        alternativeAction: "like_only",
        delay: 0,
      };
    }

    // Check engagement rules
    for (const rule of this.engagementRules) {
      if (rule.condition(target)) {
        if (
          rule.action === "skip" ||
          rule.action === "rest" ||
          rule.action === "pause"
        ) {
          return {
            shouldEngage: false,
            reason: rule.name,
            alternativeAction: null,
            delay: rule.cooldown,
          };
        }
      }
    }

    // Check if we've been too active recently
    if (this.getRecentActivityLevel() > 0.8) {
      return {
        shouldEngage: Math.random() < 0.2, // 20% chance
        reason: "high_activity",
        alternativeAction: "observe",
        delay: this.calculateNaturalDelay(),
      };
    }

    // Natural engagement probability based on context
    const engagementProbability = this.calculateEngagementProbability(context);

    return {
      shouldEngage: Math.random() < engagementProbability,
      reason: "natural_selection",
      alternativeAction: this.suggestAlternativeAction(context),
      delay: this.calculateNaturalDelay(),
    };
  }

  /**
   * Smart thread participation
   */
  analyzeThreadParticipation(
    threadId: string,
    participants: string[],
    messageCount: number,
  ): ThreadStrategy {
    let thread = this.conversationThreads.get(threadId);

    if (!thread) {
      thread = {
        id: threadId,
        startTime: Date.now(),
        participants,
        ourMessageCount: 0,
        totalMessages: messageCount,
        sentiment: "neutral",
        ourRole: "observer",
      };
      this.conversationThreads.set(threadId, thread);
    }

    // Determine our role in the thread
    const participationRatio =
      thread.ourMessageCount / Math.max(1, thread.totalMessages);

    if (participationRatio > 0.3) {
      // We're dominating - pull back
      return {
        action: "observe",
        reason: "over_participating",
        nextEngagementDelay: 30 * 60 * 1000, // 30 minutes
      };
    }

    if (participationRatio < 0.1 && thread.totalMessages > 10) {
      // We're barely participating in active thread
      return {
        action: "contribute",
        reason: "under_participating",
        nextEngagementDelay: 5 * 60 * 1000, // 5 minutes
      };
    }

    // Natural flow
    return {
      action: "natural",
      reason: "balanced_participation",
      nextEngagementDelay: this.calculateNaturalDelay(),
    };
  }

  /**
   * Handle conversation abandonment naturally
   */
  shouldAbandonConversation(
    conversationId: string,
    lastMessageTime: number,
    messageCount: number,
  ): boolean {
    const timeSinceLastMessage = Date.now() - lastMessageTime;

    // Natural conversation endings
    if (timeSinceLastMessage > 2 * 60 * 60 * 1000) {
      // 2 hours
      return true;
    }

    if (messageCount > 20 && Math.random() < 0.3) {
      // Long conversations sometimes just end
      return true;
    }

    if (this.currentEnergy < 0.3 && messageCount > 5) {
      // Low energy, wrap it up
      return true;
    }

    // Sometimes just ghost (realistic)
    if (Math.random() < 0.05) {
      return true;
    }

    return false;
  }

  /**
   * Generate natural typing delays
   */
  calculateTypingDelay(messageLength: number): number {
    const baseDelay = (messageLength / 5 / (this.typingSpeed / 60)) * 1000; // Based on WPM

    // Add variation
    const variation = 0.5 + Math.random();

    // Account for "thinking time"
    const thinkingTime = Math.random() * 3000;

    // Account for distractions
    const distractionChance = Math.random();
    const distractionDelay =
      distractionChance < 0.1 ? Math.random() * 10000 : 0;

    return baseDelay * variation + thinkingTime + distractionDelay;
  }

  /**
   * Platform-specific behavior
   */
  getPlatformBehavior(platform: "twitter" | "telegram"): PlatformBehavior {
    const pattern = this.platformBehavior.get(platform)!;
    const currentHour = new Date().getHours();

    return {
      isActiveHour: pattern.peakHours.includes(currentHour),
      typicalResponseTime: pattern.averageResponseTime * (0.5 + Math.random()),
      engagementProbability: pattern.peakHours.includes(currentHour)
        ? 0.7
        : 0.3,
      style: pattern.engagementStyle,
    };
  }

  /**
   * Track engagement patterns
   */
  logEngagement(
    target: string,
    type: "reply" | "like" | "retweet" | "quote" | "mention",
    platform: "twitter" | "telegram",
  ): void {
    let history = this.engagementLog.get(target);

    if (!history) {
      history = {
        target,
        engagements: [],
        totalCount: 0,
        lastEngagement: 0,
      };
      this.engagementLog.set(target, history);
    }

    history.engagements.push({
      type,
      timestamp: Date.now(),
      platform,
    });

    history.totalCount++;
    history.lastEngagement = Date.now();

    // Update counters
    this.dailyEngagementCount++;
    this.lastEngagementTime = Date.now();

    if (type === "reply") {
      this.consecutiveReplies++;
    } else {
      this.consecutiveReplies = 0;
    }

    // Track Twitter-specific metrics for growth
    if (platform === "twitter") {
      if ((type as any) === "tweet") {
        this.twitterGrowthMetrics.dailyTweets++;
        this.twitterGrowthMetrics.lastProactiveTweet = Date.now();
      } else if (type === "reply") {
        this.twitterGrowthMetrics.dailyReplies++;
      } else if (type === "quote") {
        this.twitterGrowthMetrics.dailyQuotes++;
      }

      this.twitterGrowthMetrics.followersEngaged.add(target);
    }

    // Clean old engagement logs (keep last 1000)
    if (this.engagementLog.size > 1000) {
      const oldest = Array.from(this.engagementLog.entries())
        .sort((a, b) => a[1].lastEngagement - b[1].lastEngagement)
        .slice(0, 100);

      oldest.forEach(([key]) => this.engagementLog.delete(key));
    }
  }

  /**
   * Suggest proactive Twitter actions for growth
   */
  suggestTwitterAction(): TwitterGrowthAction | null {
    const now = Date.now();
    const timeSinceLastTweet =
      now - this.twitterGrowthMetrics.lastProactiveTweet;

    // Tweet regularly for visibility (every 2-4 hours during active hours)
    if (timeSinceLastTweet > 2 * 60 * 60 * 1000) {
      const hour = new Date().getHours();
      const isActiveHour = [
        9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21,
      ].includes(hour);

      if (isActiveHour && Math.random() < 0.7) {
        return {
          type: "proactive_tweet",
          topics: this.getTrendingTopics(),
          style: this.selectTweetStyle(),
          urgency: "normal",
        };
      }
    }

    // Engage with influencers for visibility
    if (Math.random() < 0.3 && this.dailyEngagementCount < 80) {
      return {
        type: "influencer_engagement",
        topics: ["solana", "defi", "crypto"],
        style: "supportive",
        urgency: "low",
      };
    }

    // Quote tweet for thought leadership
    if (this.twitterGrowthMetrics.dailyQuotes < 5 && Math.random() < 0.25) {
      return {
        type: "quote_tweet",
        topics: ["solana ecosystem", "defi innovation"],
        style: "insightful",
        urgency: "normal",
      };
    }

    return null;
  }

  private getTrendingTopics(): string[] {
    // Return topics we should be talking about
    const topics = [
      "solana development",
      "defi yields",
      "validator economics",
      "liquid staking",
      "mev on solana",
      "jupiter aggregator",
      "jito bundles",
      "compressed nfts",
      "state compression",
      "firedancer progress",
    ];

    // Shuffle and pick 2-3 topics
    return topics
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private selectTweetStyle(): string {
    const styles = [
      "educational", // Teach about Solana
      "analytical", // Analyze market/tech
      "humorous", // Memes and jokes
      "supportive", // Support community
      "alpha_sharing", // Share insights
      "philosophical", // Deep thoughts
      "narrative", // Tell stories
      "controversial", // Hot takes (carefully)
    ];

    // Weight towards educational and analytical for growth
    const weights = [0.25, 0.2, 0.15, 0.15, 0.1, 0.05, 0.05, 0.05];
    const random = Math.random();
    let sum = 0;

    for (let i = 0; i < styles.length; i++) {
      sum += weights[i];
      if (random < sum) return styles[i];
    }

    return styles[0];
  }

  /**
   * Update energy levels
   */
  updateEnergyLevel(activity: "high" | "moderate" | "low" = "moderate"): void {
    const energyDrain = {
      high: 0.1,
      moderate: 0.05,
      low: 0.02,
    };

    this.currentEnergy = Math.max(
      0,
      this.currentEnergy - energyDrain[activity],
    );

    // Natural energy recovery
    const timeSinceLastEngagement = Date.now() - this.lastEngagementTime;
    const recoveryRate = 0.001; // Per minute
    const recovered = (timeSinceLastEngagement / 60000) * recoveryRate;

    this.currentEnergy = Math.min(1, this.currentEnergy + recovered);
  }

  /**
   * Create busy periods
   */
  private scheduleBusyPeriods(): void {
    // Random busy periods throughout the day
    const now = Date.now();

    this.busyPeriods = [
      {
        start: now + Math.random() * 4 * 60 * 60 * 1000,
        duration: 30 + Math.random() * 90, // 30-120 minutes
        reason: "meeting",
      },
      {
        start: now + 6 * 60 * 60 * 1000 + Math.random() * 2 * 60 * 60 * 1000,
        duration: 60 + Math.random() * 60, // 60-120 minutes
        reason: "lunch",
      },
      {
        start: now + 10 * 60 * 60 * 1000 + Math.random() * 4 * 60 * 60 * 1000,
        duration: 120 + Math.random() * 180, // 2-5 hours
        reason: "work",
      },
    ];
  }

  // Private helper methods

  private getRecentEngagementCount(target: string): number {
    const history = this.engagementLog.get(target);
    if (!history) return 0;

    const recentWindow = 6 * 60 * 60 * 1000; // 6 hours
    const recent = history.engagements.filter(
      (e) => Date.now() - e.timestamp < recentWindow,
    );

    return recent.length;
  }

  private isInActiveConversation(target: string): boolean {
    const history = this.engagementLog.get(target);
    if (!history) return false;

    const conversationWindow = 30 * 60 * 1000; // 30 minutes
    return Date.now() - history.lastEngagement < conversationWindow;
  }

  private isCurrentlyBusy(): boolean {
    const now = Date.now();

    return this.busyPeriods.some((period) => {
      const periodEnd = period.start + period.duration * 60 * 1000;
      return now >= period.start && now <= periodEnd;
    });
  }

  private getRecentActivityLevel(): number {
    const recentWindow = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();

    let recentCount = 0;
    this.engagementLog.forEach((history) => {
      recentCount += history.engagements.filter(
        (e) => now - e.timestamp < recentWindow,
      ).length;
    });

    // Normalize to 0-1
    return Math.min(1, recentCount / 10);
  }

  private calculateEngagementProbability(context: EngagementContext): number {
    // Platform-specific base probability
    const platform = (context as any).platform || "telegram";
    let probability = platform === "twitter" ? 0.25 : 0.05; // Higher base for Twitter (25% vs 5%)

    // Adjust based on context
    if (context.isMentioned)
      probability = 1.0; // Always respond to mentions
    else if (context.isReplyToUs)
      probability = 0.9; // Almost always respond to replies
    else if (context.isFromFriend) {
      // More active with friends on Twitter for community building
      probability += platform === "twitter" ? 0.4 : 0.15;
    } else if (context.isViral) {
      // Jump into viral threads on Twitter for visibility
      probability += platform === "twitter" ? 0.3 : 0.05;
    } else if (context.isControversial) {
      // Be careful but don't completely avoid on Twitter
      probability *= platform === "twitter" ? 0.7 : 0.3;
    }

    // Adjust based on energy
    probability *= this.currentEnergy;

    // Time-based adjustment
    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 6) {
      probability *= 0.3; // Much less active at night
    }

    return Math.min(0.9, Math.max(0.1, probability));
  }

  private calculateNaturalDelay(): number {
    // Base delay 1-5 minutes
    const baseDelay = (1 + Math.random() * 4) * 60 * 1000;

    // Adjust based on energy
    const energyMultiplier = 2 - this.currentEnergy;

    // Add randomness
    const randomFactor = 0.5 + Math.random();

    return baseDelay * energyMultiplier * randomFactor;
  }

  private suggestAlternativeAction(context: EngagementContext): string | null {
    if (context.isViral) return "like_only";
    if (context.isFromFriend) return "like_and_save";
    if (context.isControversial) return "observe";
    return null;
  }
}

// Type definitions
interface EngagementHistory {
  target: string;
  engagements: Array<{
    type: string;
    timestamp: number;
    platform: string;
  }>;
  totalCount: number;
  lastEngagement: number;
}

interface ThreadContext {
  id: string;
  startTime: number;
  participants: string[];
  ourMessageCount: number;
  totalMessages: number;
  sentiment: "positive" | "negative" | "neutral";
  ourRole: "leader" | "contributor" | "observer";
}

interface BusyPeriod {
  start: number;
  duration: number; // minutes
  reason: string;
}

interface EngagementRule {
  name: string;
  condition: (target: string) => boolean;
  action: "skip" | "continue" | "rest" | "pause";
  cooldown: number;
}

interface PlatformPattern {
  platform: string;
  maxDailyEngagements: number;
  averageResponseTime: number;
  peakHours: number[];
  engagementStyle: string;
}

interface EngagementContext {
  isMentioned: boolean;
  isReplyToUs: boolean;
  isFromFriend: boolean;
  isViral: boolean;
  isControversial: boolean;
}

interface EngagementDecision {
  shouldEngage: boolean;
  reason: string;
  alternativeAction: string | null;
  delay: number;
}

interface ThreadStrategy {
  action: "contribute" | "observe" | "natural";
  reason: string;
  nextEngagementDelay: number;
}

interface PlatformBehavior {
  isActiveHour: boolean;
  typicalResponseTime: number;
  engagementProbability: number;
  style: string;
}

interface TwitterGrowthAction {
  type:
    | "proactive_tweet"
    | "influencer_engagement"
    | "quote_tweet"
    | "thread"
    | "reply_storm";
  topics: string[];
  style: string;
  urgency: "high" | "normal" | "low";
}

export default EngagementIntelligence;
