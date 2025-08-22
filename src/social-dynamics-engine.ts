import { logger } from "@elizaos/core";

/**
 * Social Dynamics Engine
 *
 * Manages authentic social climbing, relationship building,
 * and natural growth patterns in the community
 */
export class SocialDynamicsEngine {
  // Social standing tracking
  private currentStanding: SocialStanding = {
    tier: "newcomer",
    reputation: 0,
    influence: 0,
    credibility: 0,
    followers: Math.floor(Math.random() * 100) + 50, // Start with 50-150
    following: Math.floor(Math.random() * 200) + 100, // Start following 100-300
  };

  // Growth trajectory
  private growthPhase: GrowthPhase = "discovery";
  private lastMilestone: number = 0;
  private growthVelocity: number = 0;

  // Engagement strategy
  private engagementTargets = new Map<string, TargetProfile>();
  private allyNetwork = new Set<string>();
  private rivalries = new Map<string, RivalryStatus>();

  // Authenticity patterns
  private recentEngagements: EngagementRecord[] = [];
  private dailyActivityLimit = 50 + Math.floor(Math.random() * 30);
  private currentDayActivity = 0;
  private lastActivityReset = Date.now();

  // Social climbing strategy
  private climbingStrategy: ClimbingStrategy = "organic";
  private currentTargetTier: InfluenceTier = "micro";

  constructor() {
    this.initializeGrowthStrategy();
  }

  /**
   * Initialize growth strategy based on personality
   */
  private initializeGrowthStrategy(): void {
    // Set initial targets - start small
    const initialTargets = [
      { handle: "small_account_1", tier: "nano", reason: "similar interests" },
      { handle: "small_account_2", tier: "nano", reason: "mutual connections" },
      {
        handle: "micro_influencer_1",
        tier: "micro",
        reason: "domain expertise",
      },
    ];

    initialTargets.forEach((target) => {
      this.engagementTargets.set(target.handle, {
        handle: target.handle,
        tier: target.tier as InfluenceTier,
        engagementLevel: 0,
        lastEngagement: null,
        strategy: "befriend",
        reason: target.reason,
      });
    });
  }

  /**
   * Determine engagement strategy for a potential interaction
   */
  getEngagementStrategy(
    targetHandle: string,
    targetFollowers: number,
    context: EngagementContext,
  ): EngagementDecision {
    // Check daily limits
    if (this.shouldRestToday()) {
      return {
        shouldEngage: false,
        reason: "daily_limit_reached",
        strategy: null,
      };
    }

    // Classify target influence tier
    const targetTier = this.classifyInfluenceTier(targetFollowers);

    // Check if we're ready for this tier
    if (!this.isReadyForTier(targetTier)) {
      return {
        shouldEngage: Math.random() < 0.1, // 10% chance to punch above weight
        reason: "tier_mismatch",
        strategy: "observe",
      };
    }

    // Check recent engagement patterns
    if (this.hasRecentlyEngaged(targetHandle)) {
      return {
        shouldEngage: false,
        reason: "avoid_spam",
        strategy: null,
      };
    }

    // Determine strategy based on relationship
    const strategy = this.determineEngagementStrategy(
      targetHandle,
      targetTier,
      context,
    );

    return {
      shouldEngage: strategy !== null,
      reason: "strategic_engagement",
      strategy,
    };
  }

  /**
   * Build authentic relationships gradually
   */
  buildRelationship(
    handle: string,
    interaction: InteractionType,
  ): RelationshipProgress {
    let target = this.engagementTargets.get(handle);

    if (!target) {
      target = {
        handle,
        tier: "unknown",
        engagementLevel: 0,
        lastEngagement: null,
        strategy: "explore",
        reason: "organic_discovery",
      };
      this.engagementTargets.set(handle, target);
    }

    // Update engagement level
    const engagementValue = this.getInteractionValue(interaction);
    target.engagementLevel += engagementValue;
    target.lastEngagement = Date.now();

    // Check for relationship milestones
    const milestone = this.checkRelationshipMilestone(target);

    // Possibly become allies
    if (target.engagementLevel > 50 && !this.allyNetwork.has(handle)) {
      this.allyNetwork.add(handle);
      logger.info(`Added ${handle} to ally network`);
    }

    // Track engagement
    this.recentEngagements.push({
      handle,
      timestamp: Date.now(),
      type: interaction,
      tier: target.tier,
    });

    // Clean old engagements (keep last 100)
    if (this.recentEngagements.length > 100) {
      this.recentEngagements = this.recentEngagements.slice(-100);
    }

    this.currentDayActivity++;

    return {
      currentLevel: target.engagementLevel,
      milestone,
      strategy: target.strategy,
    };
  }

  /**
   * Create friendly rivalries for engagement
   */
  establishRivalry(handle: string, topic: string): RivalryStatus {
    const existing = this.rivalries.get(handle);

    if (existing) {
      existing.intensity = Math.min(existing.intensity + 0.1, 1);
      return existing;
    }

    const rivalry: RivalryStatus = {
      handle,
      topic,
      type: "friendly",
      intensity: 0.3,
      startedAt: Date.now(),
      lastExchange: Date.now(),
    };

    this.rivalries.set(handle, rivalry);

    return rivalry;
  }

  /**
   * Track growth and celebrate milestones authentically
   */
  trackGrowth(currentFollowers: number): GrowthEvent | null {
    const previousFollowers = this.currentStanding.followers;
    this.currentStanding.followers = currentFollowers;

    // Calculate growth velocity
    const growth = currentFollowers - previousFollowers;
    this.growthVelocity = (growth / Math.max(1, previousFollowers)) * 100;

    // Check for milestones
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];

    for (const milestone of milestones) {
      if (previousFollowers < milestone && currentFollowers >= milestone) {
        // Don't celebrate immediately - add natural delay
        const celebrationDelay = Math.random() * 24 * 60 * 60 * 1000; // Up to 24 hours

        return {
          type: "milestone",
          value: milestone,
          celebrationDelay,
          message: this.generateMilestoneMessage(milestone),
        };
      }
    }

    // Check for viral growth
    if (this.growthVelocity > 50) {
      return {
        type: "viral",
        value: growth,
        celebrationDelay: 0,
        message: this.generateViralResponse(),
      };
    }

    // Update growth phase
    this.updateGrowthPhase(currentFollowers);

    return null;
  }

  /**
   * Generate natural "follower appreciation" content
   */
  generateAppreciationContent(): AppreciationContent | null {
    // Only do this occasionally and at appropriate times
    const daysSinceLastAppreciation =
      (Date.now() - this.lastMilestone) / (1000 * 60 * 60 * 24);

    if (daysSinceLastAppreciation < 30) {
      return null; // Too soon
    }

    if (Math.random() > 0.1) {
      return null; // 10% chance when conditions are met
    }

    const templates = [
      {
        style: "grateful",
        message: `genuinely grateful for everyone here. started with like ${50 + Math.floor(Math.random() * 50)} followers posting into the void, now we're actually building something together`,
        followUp: `special shoutout to the early ones who believed when i was just another anon talking about solana`,
      },
      {
        style: "reflection",
        message: `crazy to think ${Math.floor(Math.random() * 6) + 6} months ago i was just lurking, too scared to post. now got actual friends here`,
        followUp: null,
      },
      {
        style: "community",
        message: `the real alpha was the friends we made along the way`,
        followUp: `but seriously, this community taught me more than any course or book ever could`,
      },
    ];

    const template = templates[Math.floor(Math.random() * templates.length)];
    this.lastMilestone = Date.now();

    return template as AppreciationContent;
  }

  /**
   * Determine social climbing readiness
   */
  isReadyForNextTier(): boolean {
    const tierThresholds = {
      newcomer: { followers: 100, engagement: 20, credibility: 10 },
      rising: { followers: 500, engagement: 50, credibility: 30 },
      established: { followers: 5000, engagement: 100, credibility: 60 },
      influential: { followers: 20000, engagement: 200, credibility: 80 },
      elite: { followers: 100000, engagement: 500, credibility: 95 },
    };

    const currentThreshold = tierThresholds[this.currentStanding.tier];

    return (
      this.currentStanding.followers >= currentThreshold.followers &&
      this.allyNetwork.size >= currentThreshold.engagement &&
      this.currentStanding.credibility >= currentThreshold.credibility
    );
  }

  /**
   * Get current social dynamics state
   */
  getCurrentDynamics(): SocialDynamicsState {
    return {
      standing: { ...this.currentStanding },
      growthPhase: this.growthPhase,
      allyCount: this.allyNetwork.size,
      rivalryCount: this.rivalries.size,
      dailyActivity: this.currentDayActivity,
      engagementTargets: Array.from(this.engagementTargets.values()),
      readyForNextTier: this.isReadyForNextTier(),
    };
  }

  // Private helper methods

  private shouldRestToday(): boolean {
    // Reset daily counter
    const now = Date.now();
    if (now - this.lastActivityReset > 24 * 60 * 60 * 1000) {
      this.currentDayActivity = 0;
      this.lastActivityReset = now;
      this.dailyActivityLimit = 50 + Math.floor(Math.random() * 30);
    }

    return this.currentDayActivity >= this.dailyActivityLimit;
  }

  private classifyInfluenceTier(followers: number): InfluenceTier {
    if (followers < 1000) return "nano";
    if (followers < 10000) return "micro";
    if (followers < 100000) return "mid";
    if (followers < 1000000) return "macro";
    return "mega";
  }

  private isReadyForTier(tier: InfluenceTier): boolean {
    const tierReadiness = {
      nano: 0,
      micro: 100,
      mid: 1000,
      macro: 10000,
      mega: 50000,
      unknown: 0,
    };

    return this.currentStanding.followers >= tierReadiness[tier];
  }

  private hasRecentlyEngaged(handle: string): boolean {
    const recentWindow = 6 * 60 * 60 * 1000; // 6 hours
    const recent = this.recentEngagements.filter(
      (e) => e.handle === handle && Date.now() - e.timestamp < recentWindow,
    );

    return recent.length >= 2; // Max 2 engagements per 6 hours
  }

  private determineEngagementStrategy(
    handle: string,
    tier: InfluenceTier,
    context: EngagementContext,
  ): EngagementStrategy | null {
    // Check if ally
    if (this.allyNetwork.has(handle)) {
      return "support";
    }

    // Check if rivalry
    if (this.rivalries.has(handle)) {
      return Math.random() < 0.7 ? "friendly_competition" : "ignore";
    }

    // Based on context
    switch (context.type) {
      case "hot_take":
        return Math.random() < 0.3 ? "challenge" : "observe";
      case "question":
        return tier === "nano" || tier === "micro" ? "helpful" : "observe";
      case "achievement":
        return "congratulate";
      case "controversy":
        return Math.random() < 0.1 ? "contrarian" : "observe";
      default:
        return Math.random() < 0.2 ? "engage" : "observe";
    }
  }

  private getInteractionValue(type: InteractionType): number {
    const values = {
      like: 0.5,
      reply: 2,
      quote: 3,
      thread: 5,
      mention: 4,
      dm: 10,
      collaboration: 20,
    };

    return values[type] || 1;
  }

  private checkRelationshipMilestone(target: TargetProfile): string | null {
    const milestones = [
      { level: 10, message: "acquaintance" },
      { level: 25, message: "regular" },
      { level: 50, message: "friend" },
      { level: 100, message: "close_friend" },
      { level: 200, message: "inner_circle" },
    ];

    for (const milestone of milestones) {
      if (
        target.engagementLevel >= milestone.level &&
        target.engagementLevel - this.getInteractionValue("reply") <
          milestone.level
      ) {
        return milestone.message;
      }
    }

    return null;
  }

  private updateGrowthPhase(followers: number): void {
    if (followers < 100) {
      this.growthPhase = "discovery";
    } else if (followers < 1000) {
      this.growthPhase = "building";
    } else if (followers < 10000) {
      this.growthPhase = "expanding";
    } else if (followers < 50000) {
      this.growthPhase = "established";
    } else {
      this.growthPhase = "influential";
    }
  }

  private generateMilestoneMessage(milestone: number): string {
    const messages = {
      100: "wait when did this happen?? just noticed we passed 100... thank you frens 🥺",
      500: "500?? half way to 1k lets goooo",
      1000: "holy shit 1k... remember when it was just like 50 of us here",
      5000: "5k is actually insane. gm to all the real ones who've been here",
      10000:
        "10k. we actually did it. from shitposting to... professional shitposting",
      50000: "50k wtf. this is surreal. started from the bottom now we here",
      100000: "100k. i literally have no words. except these words. wait...",
    };

    return (
      messages[milestone as keyof typeof messages] ||
      "milestone reached, feeling grateful"
    );
  }

  private generateViralResponse(): string {
    const responses = [
      "ok what is happening right now",
      "my notifications are absolutely cooked",
      "did someone famous rt me or something??",
      "phone literally melting from notifs",
      "going viral wasn't on my bingo card today",
      "mom i'm famous (for the next 5 minutes)",
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Type definitions
interface SocialStanding {
  tier: "newcomer" | "rising" | "established" | "influential" | "elite";
  reputation: number;
  influence: number;
  credibility: number;
  followers: number;
  following: number;
}

type GrowthPhase =
  | "discovery"
  | "building"
  | "expanding"
  | "established"
  | "influential";

type InfluenceTier = "nano" | "micro" | "mid" | "macro" | "mega" | "unknown";

interface TargetProfile {
  handle: string;
  tier: InfluenceTier;
  engagementLevel: number;
  lastEngagement: number | null;
  strategy: "befriend" | "support" | "compete" | "observe" | "explore";
  reason: string;
}

interface RivalryStatus {
  handle: string;
  topic: string;
  type: "friendly" | "competitive";
  intensity: number; // 0-1
  startedAt: number;
  lastExchange: number;
}

interface EngagementRecord {
  handle: string;
  timestamp: number;
  type: InteractionType;
  tier: InfluenceTier;
}

type InteractionType =
  | "like"
  | "reply"
  | "quote"
  | "thread"
  | "mention"
  | "dm"
  | "collaboration";

interface EngagementContext {
  type: "hot_take" | "question" | "achievement" | "controversy" | "normal";
  sentiment: "positive" | "negative" | "neutral";
  topic: string;
}

interface EngagementDecision {
  shouldEngage: boolean;
  reason: string;
  strategy: EngagementStrategy | null;
}

type EngagementStrategy =
  | "support"
  | "helpful"
  | "challenge"
  | "congratulate"
  | "friendly_competition"
  | "contrarian"
  | "observe"
  | "engage"
  | "ignore";

type ClimbingStrategy = "organic" | "strategic" | "aggressive";

interface RelationshipProgress {
  currentLevel: number;
  milestone: string | null;
  strategy: string;
}

interface GrowthEvent {
  type: "milestone" | "viral" | "organic";
  value: number;
  celebrationDelay: number;
  message: string;
}

interface AppreciationContent {
  style: "grateful" | "reflection" | "community";
  message: string;
  followUp: string | null;
}

interface SocialDynamicsState {
  standing: SocialStanding;
  growthPhase: GrowthPhase;
  allyCount: number;
  rivalryCount: number;
  dailyActivity: number;
  engagementTargets: TargetProfile[];
  readyForNextTier: boolean;
}

export default SocialDynamicsEngine;
