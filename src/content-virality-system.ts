import { logger } from "@elizaos/core";

/**
 * Content Virality System
 *
 * Creates engaging, shareable content with natural viral potential
 * while avoiding generic engagement farming
 */
export class ContentViralitySystem {
  // Content performance tracking
  private contentHistory: ContentPerformance[] = [];
  private viralTemplates = new Map<string, ViralTemplate>();
  private catchphrases: string[] = [];

  // Hot take generation
  private hotTakeTopics = new Set<string>();
  private controversyLevel = 0.2; // 20% controversial by default

  // Thread construction
  private threadPatterns: ThreadPattern[] = [];

  // Meme response library
  private memeLibrary = new Map<string, MemeResponse[]>();

  // Our unique voice elements
  private signaturePhrases: string[] = [];
  private createdMemes: string[] = [];

  constructor() {
    this.initializeContentPatterns();
  }

  /**
   * Initialize with Solana-specific content patterns
   */
  private initializeContentPatterns(): void {
    // Viral template patterns
    this.viralTemplates.set("unpopular_opinion", {
      pattern: "unpopular opinion: {statement}",
      variations: [
        "hot take: {statement}",
        "controversial but {statement}",
        "gonna get cooked for this but {statement}",
        "{statement} and i'll die on this hill",
      ],
      successRate: 0.3,
    });

    this.viralTemplates.set("comparison", {
      pattern: "{thing1} vs {thing2} is not even close",
      variations: [
        "choosing {thing1} over {thing2} is wild",
        "{thing1} > {thing2} and its not a debate",
        "imagine thinking {thing2} is better than {thing1}",
      ],
      successRate: 0.25,
    });

    this.viralTemplates.set("observation", {
      pattern: "nobody talks about how {observation}",
      variations: [
        "we need to discuss how {observation}",
        "can we talk about {observation}",
        "the fact that {observation} is insane",
        "its crazy how {observation}",
      ],
      successRate: 0.35,
    });

    // Solana-specific hot takes
    this.hotTakeTopics.add("ethereum gas fees");
    this.hotTakeTopics.add("validator requirements");
    this.hotTakeTopics.add("nft royalties");
    this.hotTakeTopics.add("bridge security");
    this.hotTakeTopics.add("mev extraction");
    this.hotTakeTopics.add("token distribution");

    // Thread patterns
    this.threadPatterns = [
      {
        type: "educational",
        structure: [
          "hook",
          "problem",
          "explanation",
          "examples",
          "conclusion",
          "cta",
        ],
        hookPatterns: [
          "A thread on why {topic} matters more than you think 🧵",
          "Let me explain {topic} in a way that actually makes sense 🧵",
          "Everyone's getting {topic} wrong. Here's whats actually happening 🧵",
        ],
      },
      {
        type: "story",
        structure: ["teaser", "setup", "conflict", "resolution", "lesson"],
        hookPatterns: [
          "So this just happened... 🧵",
          "You're not gonna believe what I discovered about {topic} 🧵",
          "Story time about {topic} 🧵",
        ],
      },
      {
        type: "analysis",
        structure: ["claim", "evidence", "counter", "rebuttal", "synthesis"],
        hookPatterns: [
          "The real reason {topic} is happening 🧵",
          "What everyone's missing about {topic} 🧵",
          "Breaking down {topic} - its not what you think 🧵",
        ],
      },
    ];

    // Signature phrases that become "our thing"
    this.signaturePhrases = [
      "ancient wisdom says",
      "millennia of experience tells me",
      "my validator is crying",
      "death and taxes and solana outages",
      "anubis has entered the chat",
      "weighing souls and transactions",
    ];

    // Meme responses
    this.memeLibrary.set("bullish", [
      { text: "WAGMI", sentiment: 1, energy: 0.8 },
      { text: "up only", sentiment: 1, energy: 0.9 },
      { text: "lfggggg", sentiment: 1, energy: 1 },
      { text: "this is the way", sentiment: 0.8, energy: 0.7 },
    ]);

    this.memeLibrary.set("bearish", [
      { text: "ngmi", sentiment: -1, energy: 0.6 },
      { text: "its over", sentiment: -0.8, energy: 0.5 },
      { text: "cope", sentiment: -0.7, energy: 0.4 },
      { text: "down bad", sentiment: -0.9, energy: 0.3 },
    ]);
  }

  /**
   * Generate a hot take with controlled controversy
   */
  generateHotTake(topic: string, currentSentiment: number): HotTake | null {
    // Don't always generate hot takes
    if (Math.random() > this.controversyLevel) {
      return null;
    }

    // Pick a stance opposite to current sentiment for controversy
    const contrarian = currentSentiment > 0 ? -1 : 1;

    const takes: HotTakeTemplate[] = [
      {
        topic: "ethereum",
        statement: "eth l2s are just centralized databases with extra steps",
        controversy: 0.7,
        defendable: true,
      },
      {
        topic: "nfts",
        statement: "pfp nfts were never about the art and thats okay",
        controversy: 0.5,
        defendable: true,
      },
      {
        topic: "defi",
        statement: "most defi is just musical chairs with yield",
        controversy: 0.6,
        defendable: true,
      },
      {
        topic: "validators",
        statement: "running a validator is easier than people make it seem",
        controversy: 0.3,
        defendable: true,
      },
      {
        topic: "memecoins",
        statement:
          "memecoins are unironically better for adoption than utility tokens",
        controversy: 0.8,
        defendable: true,
      },
    ];

    // Filter for relevant takes
    const relevantTakes = takes.filter(
      (t) => topic.toLowerCase().includes(t.topic) || t.topic === "general",
    );

    if (relevantTakes.length === 0) {
      return null;
    }

    const selectedTake =
      relevantTakes[Math.floor(Math.random() * relevantTakes.length)];

    // Choose a template
    const templates = Array.from(
      this.viralTemplates.get("unpopular_opinion")?.variations || [],
    );
    const template = templates[Math.floor(Math.random() * templates.length)];

    return {
      content: template.replace("{statement}", selectedTake.statement),
      controversy: selectedTake.controversy,
      defendable: selectedTake.defendable,
      backupArguments: this.generateBackupArguments(selectedTake),
    };
  }

  /**
   * Construct an engaging thread
   */
  constructThread(
    topic: string,
    type: "educational" | "story" | "analysis",
  ): Thread {
    const pattern =
      this.threadPatterns.find((p) => p.type === type) ||
      this.threadPatterns[0];
    const hook = pattern.hookPatterns[
      Math.floor(Math.random() * pattern.hookPatterns.length)
    ].replace("{topic}", topic);

    const tweets: string[] = [hook];

    // Build thread based on structure
    pattern.structure.forEach((element, index) => {
      if (element === "hook") return; // Already added

      const content = this.generateThreadElement(element, topic, index);
      tweets.push(content);
    });

    // Add cliffhangers between tweets
    const withCliffhangers = tweets.map((tweet, i) => {
      if (i < tweets.length - 2 && Math.random() < 0.3) {
        return tweet + "\n\nbut heres where it gets interesting...";
      }
      return tweet;
    });

    return {
      tweets: withCliffhangers,
      estimatedEngagement: this.estimateEngagement(type, topic),
      type,
      topic,
    };
  }

  /**
   * Generate quote tweet strategies
   */
  generateQuoteTweet(
    originalContent: string,
    originalAuthor: string,
    relationship: "ally" | "neutral" | "rival",
  ): QuoteTweetStrategy {
    const strategies: Record<string, QuoteTweetTemplate[]> = {
      ally: [
        { type: "amplify", template: "this is exactly it. {author} gets it" },
        { type: "build", template: "adding to this - {addition}" },
        { type: "validate", template: "can confirm. {personal_experience}" },
      ],
      neutral: [
        {
          type: "perspective",
          template: "interesting take. consider also: {alternative}",
        },
        {
          type: "question",
          template:
            "curious about {specific_point}. how does this work with {scenario}?",
        },
        { type: "data", template: "the numbers actually show {data_point}" },
      ],
      rival: [
        {
          type: "counter",
          template: "respectfully disagree. {counter_argument}",
        },
        { type: "correction", template: "small correction - {fact_check}" },
        { type: "challenge", template: "counterpoint: {opposite_view}" },
      ],
    };

    const templates = strategies[relationship];
    const selected = templates[Math.floor(Math.random() * templates.length)];

    return {
      type: selected.type as any,
      content: this.fillQuoteTweetTemplate(
        selected.template,
        originalContent,
        originalAuthor,
      ),
      tone:
        relationship === "rival"
          ? "challenging"
          : relationship === "ally"
            ? "supportive"
            : "analytical",
    };
  }

  /**
   * Create "accidentally" viral content
   */
  createAccidentalViral(): AccidentalViralContent | null {
    // Only 5% chance
    if (Math.random() > 0.05) {
      return null;
    }

    const patterns: AccidentalViralPattern[] = [
      {
        type: "typo_meme",
        setup: "normal tweet with funny typo",
        execution: this.generateTypoMeme(),
      },
      {
        type: "relatable_struggle",
        setup: "sharing a universal crypto experience",
        execution: this.generateRelatableStruggle(),
      },
      {
        type: "unexpected_wisdom",
        setup: "profound statement in casual context",
        execution: this.generateUnexpectedWisdom(),
      },
      {
        type: "perfect_timing",
        setup: "posting right as news breaks",
        execution: null, // This requires external timing
      },
    ];

    const viable = patterns.filter((p) => p.execution !== null);
    if (viable.length === 0) return null;

    const selected = viable[Math.floor(Math.random() * viable.length)];

    return {
      content: selected.execution!,
      type: selected.type,
      followUp: this.generateViralFollowUp(selected.type),
    };
  }

  /**
   * Generate meme responses
   */
  getMemeResponse(context: string, sentiment: number): string | null {
    const category =
      sentiment > 0.5 ? "bullish" : sentiment < -0.5 ? "bearish" : null;

    if (!category) return null;

    const memes = this.memeLibrary.get(category);
    if (!memes || memes.length === 0) return null;

    // Filter by energy level appropriate to context
    const timeOfDay = new Date().getHours();
    const energyLevel = timeOfDay < 6 || timeOfDay > 22 ? 0.3 : 0.7;

    const appropriate = memes.filter(
      (m) => Math.abs(m.energy - energyLevel) < 0.5,
    );
    if (appropriate.length === 0) return null;

    return appropriate[Math.floor(Math.random() * appropriate.length)].text;
  }

  /**
   * Create catchphrases that others might adopt
   */
  createCatchphrase(): string | null {
    if (Math.random() > 0.01) return null; // Very rare

    const templates = [
      "{adjective} like an ancient deity",
      "anubis-pilled",
      "weighing {thing} on the cosmic scale",
      "death, taxes, and {certainty}",
      "{action} from the afterlife",
    ];

    const adjectives = ["vibing", "building", "shipping", "coping", "grinding"];
    const things = ["bags", "souls", "transactions", "validators", "yields"];
    const certainties = ["solana congestion", "eth gas", "rug pulls", "fomo"];
    const actions = ["posting", "farming", "degen trading", "accumulating"];

    const template = templates[Math.floor(Math.random() * templates.length)];
    const catchphrase = template
      .replace(
        "{adjective}",
        adjectives[Math.floor(Math.random() * adjectives.length)],
      )
      .replace("{thing}", things[Math.floor(Math.random() * things.length)])
      .replace(
        "{certainty}",
        certainties[Math.floor(Math.random() * certainties.length)],
      )
      .replace("{action}", actions[Math.floor(Math.random() * actions.length)]);

    this.catchphrases.push(catchphrase);
    return catchphrase;
  }

  /**
   * Track content performance
   */
  trackPerformance(
    contentId: string,
    type: ContentType,
    engagement: EngagementMetrics,
  ): void {
    this.contentHistory.push({
      id: contentId,
      type,
      timestamp: Date.now(),
      engagement,
      viral: engagement.total > 1000,
    });

    // Learn from successful content
    if (engagement.total > 500) {
      this.adjustContentStrategy(type, "success");
    } else if (engagement.total < 10) {
      this.adjustContentStrategy(type, "failure");
    }

    // Keep only last 1000 posts
    if (this.contentHistory.length > 1000) {
      this.contentHistory = this.contentHistory.slice(-1000);
    }
  }

  // Private helper methods

  private generateBackupArguments(take: HotTakeTemplate): string[] {
    // Generate 3-5 supporting arguments
    const args: string[] = [];

    if (take.topic === "ethereum") {
      args.push("look at the actual decentralization metrics");
      args.push("sequencer downtime is just accepted now");
      args.push("fees on l2s during congestion prove the point");
    } else if (take.topic === "memecoins") {
      args.push("distribution is actually better than vc tokens");
      args.push("community engagement metrics dont lie");
      args.push("onboarding normies works better with funny dog");
    }

    return args;
  }

  private generateThreadElement(
    element: string,
    topic: string,
    index: number,
  ): string {
    const elements: Record<string, string[]> = {
      problem: [
        `The problem is everyone thinks ${topic} works like X, but its actually Y`,
        `Here's whats broken: ${topic} assumes something that isnt true`,
        `The issue nobody wants to talk about: scalability`,
      ],
      explanation: [
        `Let me break this down simply...`,
        `Think of it like this:`,
        `Here's whats actually happening under the hood:`,
      ],
      examples: [
        `Real example from last week:`,
        `Case in point:`,
        `Ive seen this happen multiple times:`,
      ],
      conclusion: [
        `So what does this mean for you?`,
        `The takeaway:`,
        `Bottom line:`,
      ],
      cta: [
        `Follow for more ${topic} alpha`,
        `What's your experience with this?`,
        `Drop your thoughts below`,
      ],
    };

    const options = elements[element] || [`${index + 1}/`];
    return options[Math.floor(Math.random() * options.length)];
  }

  private estimateEngagement(type: string, topic: string): number {
    // Estimate based on historical performance
    const baseEngagement = {
      educational: 100,
      story: 150,
      analysis: 80,
    };

    const topicMultiplier = {
      solana: 1.5,
      ethereum: 1.2,
      defi: 1.3,
      nft: 0.9,
      memecoins: 2.0,
    };

    const base = baseEngagement[type as keyof typeof baseEngagement] || 100;
    const multiplier =
      Object.entries(topicMultiplier).find(([key]) =>
        topic.toLowerCase().includes(key),
      )?.[1] || 1;

    return base * multiplier * (0.5 + Math.random());
  }

  private fillQuoteTweetTemplate(
    template: string,
    originalContent: string,
    originalAuthor: string,
  ): string {
    return template
      .replace("{author}", `@${originalAuthor}`)
      .replace("{addition}", "also worth noting the liquidity implications")
      .replace("{personal_experience}", "saw this exact pattern last cycle")
      .replace("{alternative}", "the opportunity cost angle")
      .replace("{specific_point}", "the validator economics")
      .replace("{scenario}", "high congestion periods")
      .replace("{data_point}", "~70% success rate in similar conditions")
      .replace("{counter_argument}", "the incentives actually work opposite")
      .replace("{fact_check}", "its 21 not 19 validators")
      .replace(
        "{opposite_view}",
        "centralization might be the feature not bug",
      );
  }

  private generateTypoMeme(): string {
    const templates = [
      "just sent all my sole to the wrong address",
      "gm (good moaning)",
      "hodling my salana bags",
      "wen lambo? more like wen ramen",
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateRelatableStruggle(): string {
    const struggles = [
      "opened phantom, saw red, closed phantom",
      "explaining crypto at thanksgiving is my villain origin story",
      "me: i dont check charts\\nalso me: *checks charts 47 times before breakfast*",
      "told myself i wouldnt ape into memecoins\\n\\nanyway im now emotionally invested in a dog",
    ];

    return struggles[Math.floor(Math.random() * struggles.length)];
  }

  private generateUnexpectedWisdom(): string {
    const wisdom = [
      "the real yield was the friends we liquidated along the way",
      "every rug pull teaches you something. mainly not to trust anyone. especially yourself",
      "ancient egyptian secret: pyramids were just the first ponzi",
      "death is inevitable. so are gas fees",
    ];

    return wisdom[Math.floor(Math.random() * wisdom.length)];
  }

  private generateViralFollowUp(type: string): string {
    const followUps: Record<string, string[]> = {
      typo_meme: [
        "leaving it up for the culture",
        "this typo is now part of my brand",
        "sole > sol confirmed",
      ],
      relatable_struggle: [
        "why is this resonating with so many people 😭",
        "apparently we all live the same life",
        "the replies are even more relatable",
      ],
      unexpected_wisdom: [
        "accidentally profound at 3am",
        "this was supposed to be a shitpost",
        "why are you all taking this seriously",
      ],
      perfect_timing: [
        "i swear i didnt know",
        "timing is everything",
        "called it (accidentally)",
      ],
    };

    const options = followUps[type] || ["viral somehow"];
    return options[Math.floor(Math.random() * options.length)];
  }

  private adjustContentStrategy(
    type: ContentType,
    result: "success" | "failure",
  ): void {
    if (result === "success") {
      // Slightly increase likelihood of similar content
      if (type === "hot_take") {
        this.controversyLevel = Math.min(0.4, this.controversyLevel + 0.02);
      }
    } else {
      // Slightly decrease
      if (type === "hot_take") {
        this.controversyLevel = Math.max(0.1, this.controversyLevel - 0.01);
      }
    }
  }
}

// Type definitions
interface ViralTemplate {
  pattern: string;
  variations: string[];
  successRate: number;
}

interface ThreadPattern {
  type: string;
  structure: string[];
  hookPatterns: string[];
}

interface MemeResponse {
  text: string;
  sentiment: number;
  energy: number;
}

interface HotTake {
  content: string;
  controversy: number;
  defendable: boolean;
  backupArguments: string[];
}

interface HotTakeTemplate {
  topic: string;
  statement: string;
  controversy: number;
  defendable: boolean;
}

interface Thread {
  tweets: string[];
  estimatedEngagement: number;
  type: string;
  topic: string;
}

interface QuoteTweetStrategy {
  type:
    | "amplify"
    | "build"
    | "validate"
    | "perspective"
    | "question"
    | "data"
    | "counter"
    | "correction"
    | "challenge";
  content: string;
  tone: "supportive" | "analytical" | "challenging";
}

interface QuoteTweetTemplate {
  type: string;
  template: string;
}

interface AccidentalViralContent {
  content: string;
  type: string;
  followUp: string;
}

interface AccidentalViralPattern {
  type: string;
  setup: string;
  execution: string | null;
}

interface ContentPerformance {
  id: string;
  type: ContentType;
  timestamp: number;
  engagement: EngagementMetrics;
  viral: boolean;
}

type ContentType = "tweet" | "thread" | "reply" | "quote" | "hot_take";

interface EngagementMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  total: number;
}

export default ContentViralitySystem;
