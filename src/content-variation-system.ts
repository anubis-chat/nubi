/**
 * Content Variation System for Human-Like Social Media Posts
 *
 * This system provides extensive variation in posting styles, formats,
 * and content patterns to avoid AI detection and create authentic
 * human-like social media presence.
 */

export interface PostStyle {
  name: string;
  description: string;
  characteristics: string[];
  examples: string[];
  probability: number; // 0-1, how often this style should be used
}

export interface ContentTemplate {
  type:
    | "thought"
    | "observation"
    | "question"
    | "story"
    | "reaction"
    | "tip"
    | "humor"
    | "personal";
  formats: string[];
  hooks: string[];
  conclusions: string[];
}

export interface VariationStrategy {
  sentenceStructure: "simple" | "complex" | "mixed";
  formalityLevel: "casual" | "semi-formal" | "formal";
  emotionalTone: "excited" | "calm" | "thoughtful" | "playful" | "serious";
  personalityFactor: number; // 0-1, how much personality to inject
}

// Diverse posting styles with realistic probabilities
export const POST_STYLES: PostStyle[] = [
  {
    name: "casual_stream_of_consciousness",
    description: "Natural, unfiltered thoughts as they come",
    characteristics: [
      "run-on sentences",
      "multiple topics",
      "informal language",
      'lots of "and" connectors',
    ],
    examples: [
      "just had the weirdest thought about how we call it 'rush hour' when nobody's moving and honestly why do we do this to ourselves every day lol",
      "coffee tastes different when you're stressed and i can't decide if that's psychological or if stress actually changes your taste buds... anyone else notice this?",
      "been thinking about how social media is basically just humans trying to figure out how to be human together digitally and it's kinda beautiful and terrifying at the same time",
    ],
    probability: 0.25,
  },
  {
    name: "thoughtful_observation",
    description: "Reflective, insightful commentary",
    characteristics: [
      "deeper insights",
      "philosophical undertones",
      "measured language",
    ],
    examples: [
      "There's something profound about how the same sunset looks completely different depending on what kind of day you've had.",
      "The most interesting conversations happen when people feel safe enough to change their minds.",
      "We've become so good at documenting moments that we sometimes forget to actually experience them.",
    ],
    probability: 0.2,
  },
  {
    name: "excited_sharing",
    description: "Enthusiastic about discoveries or experiences",
    characteristics: ["exclamation points", "caps", "emojis", "sharing energy"],
    examples: [
      "GUYS. I just discovered this tiny bookstore that has cats wandering around and I might never leave 📚🐱",
      "Ok but why did nobody tell me that adding cinnamon to coffee would literally change my life??",
      "Just finished this book and I'm SHOOK. My entire worldview has shifted and I need someone to talk about this with immediately!",
    ],
    probability: 0.15,
  },
  {
    name: "relatable_struggle",
    description: "Sharing common human experiences and challenges",
    characteristics: [
      "self-deprecating",
      "universal experiences",
      "humor in pain",
    ],
    examples: [
      "me: i should go to bed early tonight. also me at 2am: let's research the history of staplers",
      "why is 'what do you want for dinner' the hardest question in the english language when you're in a relationship",
      "that moment when you're an adult but you still feel like you're pretending and everyone's gonna figure out you have no idea what you're doing",
    ],
    probability: 0.2,
  },
  {
    name: "helpful_tip",
    description: "Sharing useful knowledge or life hacks",
    characteristics: [
      "actionable advice",
      "personal experience",
      "casual expertise",
    ],
    examples: [
      "pro tip: if you put a wooden spoon across a pot of boiling water, it won't boil over. learned this from my grandmother and it's literally never failed me",
      "discovered that reading fiction actually makes you more empathetic according to science, which explains why book people are usually the kindest humans",
      "for anyone struggling with motivation: start with just 2 minutes. seriously. most of the time you'll keep going, but even if you don't, 2 minutes is better than zero",
    ],
    probability: 0.1,
  },
  {
    name: "random_humor",
    description: "Jokes, memes, and funny observations",
    characteristics: ["unexpected connections", "absurd humor", "wordplay"],
    examples: [
      "conspiracy theory: the person who named 'walkie talkies' was just having the best day and nobody could stop them",
      "why do we say 'after dark' when it's actually 'during dark'? i demand answers",
      "my brain: remember that embarrassing thing from 2015? me: why? my brain: no reason, just thought you should suffer",
    ],
    probability: 0.1,
  },
];

// Content templates for different post types
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    type: "thought",
    formats: [
      "been thinking about {topic} and {insight}",
      "random thought: {observation}",
      "does anyone else {question} or is it just me?",
      "shower thought: {realization}",
      "weird how {comparison} but we just accept it",
    ],
    hooks: [
      "been mulling this over...",
      "ok hear me out...",
      "random brain dump incoming...",
      "thought experiment time...",
      "this might be obvious but...",
    ],
    conclusions: [
      "anyway, just me?",
      "or maybe i'm overthinking it",
      "thoughts?",
      "am i making sense?",
      "probably just me being weird again",
    ],
  },
  {
    type: "observation",
    formats: [
      "noticed that {behavior} and now i can't unsee it",
      "funny how {phenomenon} when {context}",
      "there's something {emotion} about {situation}",
      "watched {event} happen and realized {insight}",
      "the way {group} {action} says a lot about {conclusion}",
    ],
    hooks: [
      "people watching led to this realization...",
      "small thing that caught my attention...",
      "pattern i've been noticing...",
      "detail that struck me...",
      "moment that made me think...",
    ],
    conclusions: [
      "might just be my perspective though",
      "curious if others see this too",
      "probably reading too much into it",
      "or maybe everyone notices this",
      "just an observation",
    ],
  },
  {
    type: "story",
    formats: [
      "so this {adjective} thing happened today...",
      "quick story: {event} and {outcome}",
      "yesterday i {action} and learned {lesson}",
      "overheard {conversation} and now i'm {emotion}",
      "went to {place} and had the most {descriptor} experience",
    ],
    hooks: [
      "story time...",
      "this just happened...",
      "had to share this...",
      "couldn't make this up...",
      "real life plot twist...",
    ],
    conclusions: [
      "anyway, that's my day",
      "life is weird sometimes",
      "still processing this",
      "what even is reality",
      "just thought i'd share",
    ],
  },
];

// Variation strategies for different contexts
export const VARIATION_STRATEGIES = {
  morning_post: {
    sentenceStructure: "simple" as const,
    formalityLevel: "casual" as const,
    emotionalTone: "calm" as const,
    personalityFactor: 0.6,
  },

  excited_share: {
    sentenceStructure: "mixed" as const,
    formalityLevel: "casual" as const,
    emotionalTone: "excited" as const,
    personalityFactor: 0.9,
  },

  thoughtful_reflection: {
    sentenceStructure: "complex" as const,
    formalityLevel: "semi-formal" as const,
    emotionalTone: "thoughtful" as const,
    personalityFactor: 0.7,
  },

  casual_interaction: {
    sentenceStructure: "simple" as const,
    formalityLevel: "casual" as const,
    emotionalTone: "playful" as const,
    personalityFactor: 0.8,
  },
};

// Text transformation utilities
export class ContentVariationEngine {
  private recentStyles: string[] = [];
  private recentTemplates: string[] = [];
  private usageStats: Map<string, number> = new Map();

  /**
   * Generate a varied social media post based on input content
   */
  generateVariedPost(
    baseContent: string,
    context: {
      platform?: string;
      timeOfDay?: "morning" | "afternoon" | "evening" | "night";
      mood?: "excited" | "calm" | "thoughtful" | "playful";
      topic?: string;
    } = {},
  ): string {
    // Select post style based on probability and recent usage
    const style = this.selectPostStyle();
    const template = this.selectContentTemplate();
    const strategy = this.selectVariationStrategy(context);

    // Apply transformations
    let variedContent = this.applyStyleTransformation(baseContent, style);
    variedContent = this.applyTemplateStructure(variedContent, template);
    variedContent = this.applyVariationStrategy(variedContent, strategy);
    variedContent = this.addHumanTouches(variedContent, context);

    // Track usage for future variation
    this.updateUsageStats(style.name, template.type);

    return variedContent;
  }

  /**
   * Select post style with weighted randomness and anti-repetition
   */
  private selectPostStyle(): PostStyle {
    // Filter out recently used styles
    const availableStyles = POST_STYLES.filter(
      (style) =>
        !this.recentStyles.includes(style.name) ||
        this.recentStyles.length >= POST_STYLES.length,
    );

    // Weighted selection based on probability
    const totalWeight = availableStyles.reduce(
      (sum, style) => sum + style.probability,
      0,
    );
    let random = Math.random() * totalWeight;

    for (const style of availableStyles) {
      random -= style.probability;
      if (random <= 0) {
        this.recentStyles.push(style.name);
        if (this.recentStyles.length > 3) {
          this.recentStyles.shift();
        }
        return style;
      }
    }

    return availableStyles[0]; // fallback
  }

  /**
   * Select content template with variation
   */
  private selectContentTemplate(): ContentTemplate {
    const availableTemplates = CONTENT_TEMPLATES.filter(
      (template) =>
        !this.recentTemplates.includes(template.type) ||
        this.recentTemplates.length >= CONTENT_TEMPLATES.length,
    );

    const selected =
      availableTemplates[Math.floor(Math.random() * availableTemplates.length)];

    this.recentTemplates.push(selected.type);
    if (this.recentTemplates.length > 2) {
      this.recentTemplates.shift();
    }

    return selected;
  }

  /**
   * Select variation strategy based on context
   */
  private selectVariationStrategy(context: any): VariationStrategy {
    if (context.mood === "excited") {
      return VARIATION_STRATEGIES.excited_share;
    } else if (context.timeOfDay === "morning") {
      return VARIATION_STRATEGIES.morning_post;
    } else if (context.mood === "thoughtful") {
      return VARIATION_STRATEGIES.thoughtful_reflection;
    } else {
      return VARIATION_STRATEGIES.casual_interaction;
    }
  }

  /**
   * Apply style-specific transformations
   */
  private applyStyleTransformation(content: string, style: PostStyle): string {
    let transformed = content;

    switch (style.name) {
      case "casual_stream_of_consciousness":
        transformed = this.makeStreamOfConsciousness(transformed);
        break;
      case "excited_sharing":
        transformed = this.makeExcited(transformed);
        break;
      case "relatable_struggle":
        transformed = this.makeRelatable(transformed);
        break;
      case "thoughtful_observation":
        transformed = this.makeThoughtful(transformed);
        break;
      case "random_humor":
        transformed = this.addHumor(transformed);
        break;
    }

    return transformed;
  }

  /**
   * Apply template structure
   */
  private applyTemplateStructure(
    content: string,
    template: ContentTemplate,
  ): string {
    // Randomly select a format from the template
    const format =
      template.formats[Math.floor(Math.random() * template.formats.length)];

    // Sometimes add a hook or conclusion
    let structured = content;

    if (Math.random() < 0.3) {
      // 30% chance of hook
      const hook =
        template.hooks[Math.floor(Math.random() * template.hooks.length)];
      structured = hook + " " + structured;
    }

    if (Math.random() < 0.2) {
      // 20% chance of conclusion
      const conclusion =
        template.conclusions[
          Math.floor(Math.random() * template.conclusions.length)
        ];
      structured = structured + " " + conclusion;
    }

    return structured;
  }

  /**
   * Apply variation strategy
   */
  private applyVariationStrategy(
    content: string,
    strategy: VariationStrategy,
  ): string {
    let varied = content;

    // Adjust sentence structure
    if (strategy.sentenceStructure === "simple") {
      varied = this.simplifysentences(varied);
    } else if (strategy.sentenceStructure === "complex") {
      varied = this.complexifysentences(varied);
    }

    // Adjust formality
    if (strategy.formalityLevel === "casual") {
      varied = this.makeCasual(varied);
    } else if (strategy.formalityLevel === "formal") {
      varied = this.makeFormal(varied);
    }

    return varied;
  }

  /**
   * Add human touches based on context
   */
  private addHumanTouches(content: string, context: any): string {
    let humanized = content;

    // Add time-based elements
    if (context.timeOfDay === "morning") {
      if (Math.random() < 0.3) {
        humanized = "morning thoughts: " + humanized;
      }
    } else if (context.timeOfDay === "late") {
      if (Math.random() < 0.2) {
        humanized = humanized + " (yes i'm still awake)";
      }
    }

    // Add platform-specific elements
    if (context.platform === "twitter" && humanized.length > 240) {
      humanized = this.createThread(humanized);
    }

    // Add random human elements
    if (Math.random() < 0.1) {
      humanized = this.addTypo(humanized);
    }

    if (Math.random() < 0.15) {
      humanized = this.addFillerWords(humanized);
    }

    return humanized;
  }

  // Style transformation methods
  private makeStreamOfConsciousness(text: string): string {
    return (
      text.replace(/\. /g, " and ").replace(/\,/g, " and").toLowerCase() +
      (Math.random() < 0.5 ? " lol" : "")
    );
  }

  private makeExcited(text: string): string {
    let excited = text;
    if (!excited.includes("!")) {
      excited = excited.replace(/\./g, "!");
    }
    if (Math.random() < 0.3) {
      excited = excited.toUpperCase();
    }
    return excited;
  }

  private makeRelatable(text: string): string {
    const relatablePrefixes = [
      "me:",
      "anyone else:",
      "that feeling when",
      "when you",
      "why is it that",
    ];

    const prefix =
      relatablePrefixes[Math.floor(Math.random() * relatablePrefixes.length)];
    return prefix + " " + text.toLowerCase();
  }

  private makeThoughtful(text: string): string {
    const thoughtfulPrefixes = [
      "There's something beautiful about",
      "I've been reflecting on",
      "It occurs to me that",
      "The more I think about it,",
    ];

    if (Math.random() < 0.4) {
      const prefix =
        thoughtfulPrefixes[
          Math.floor(Math.random() * thoughtfulPrefixes.length)
        ];
      return prefix + " " + text.toLowerCase();
    }

    return text;
  }

  private addHumor(text: string): string {
    const humorSuffixes = [
      "(don't @ me)",
      "...or maybe that's just me",
      "*nervous laughter*",
      "¯\\_(ツ)_/¯",
    ];

    if (Math.random() < 0.5) {
      const suffix =
        humorSuffixes[Math.floor(Math.random() * humorSuffixes.length)];
      return text + " " + suffix;
    }

    return text;
  }

  // Utility methods
  private simplifysentences(text: string): string {
    return text.replace(/,.*,/g, ".").replace(/;\s*/g, ". ");
  }

  private complexifysentences(text: string): string {
    return text.replace(/\. /g, ", which ").replace(/\.$/, ".");
  }

  private makeCasual(text: string): string {
    return text
      .replace(/\bgoing to\b/g, "gonna")
      .replace(/\bwant to\b/g, "wanna")
      .replace(/\bkind of\b/g, "kinda")
      .replace(/\bdid not\b/g, "didn't")
      .replace(/\bdo not\b/g, "don't");
  }

  private makeFormal(text: string): string {
    return text
      .replace(/\bgonna\b/g, "going to")
      .replace(/\bwanna\b/g, "want to")
      .replace(/\bkinda\b/g, "kind of")
      .replace(/\bdidn\'t\b/g, "did not")
      .replace(/\bdon\'t\b/g, "do not");
  }

  private createThread(text: string): string {
    const chunks = text.match(/.{1,200}(\s|$)/g) || [text];
    return chunks
      .map((chunk, i) => `${i + 1}/${chunks.length} ${chunk.trim()}`)
      .join("\n\n");
  }

  private addTypo(text: string): string {
    const typos = {
      the: "teh",
      and: "nad",
      you: "yuo",
      that: "taht",
      with: "wiht",
    };

    let result = text;
    Object.entries(typos).forEach(([correct, typo]) => {
      if (Math.random() < 0.1) {
        result = result.replace(new RegExp(`\\b${correct}\\b`, "g"), typo);
      }
    });

    return result;
  }

  private addFillerWords(text: string): string {
    const fillers = ["like", "you know", "um", "actually", "basically"];
    const filler = fillers[Math.floor(Math.random() * fillers.length)];

    const sentences = text.split(". ");
    if (sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      sentences[randomIndex] = filler + ", " + sentences[randomIndex];
    }

    return sentences.join(". ");
  }

  private updateUsageStats(styleName: string, templateType: string): void {
    this.usageStats.set(styleName, (this.usageStats.get(styleName) || 0) + 1);
    this.usageStats.set(
      templateType,
      (this.usageStats.get(templateType) || 0) + 1,
    );
  }

  /**
   * Get usage statistics for monitoring
   */
  getUsageStats(): Map<string, number> {
    return new Map(this.usageStats);
  }
}

// Export singleton instance
export const contentVariationEngine = new ContentVariationEngine();
