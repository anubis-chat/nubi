import { logger } from "@elizaos/core";

export interface AntiDetectionConfig {
  typoRate: number;
  contradictionRate: number;
  tangentRate: number;
  doubleMessageRate: number;
  responseDelayVariance: boolean;
  grammarDegradation: boolean;
  timeAwareness: boolean;
  marketReactivity: boolean;
}

export interface ConversationContext {
  userId: string;
  messageCount: number;
  lastInteraction: number;
  relationship: "new" | "acquaintance" | "friend";
  topics: string[];
  appliedPatterns: string[];
}

type CountermeasureMethod = (
  text: string,
  context: ConversationContext,
) => string;

export class AntiDetectionService {
  private config: AntiDetectionConfig;
  private countermeasures: Map<string, CountermeasureMethod>;
  private responseHistory: string[];
  private contradictionLog: Array<{ statement: string; timestamp: number }>;
  private maxHistorySize: number;

  constructor(config?: Partial<AntiDetectionConfig>) {
    this.config = {
      typoRate: 0.03,
      contradictionRate: 0.15,
      tangentRate: 0.08,
      doubleMessageRate: 0.05,
      responseDelayVariance: true,
      grammarDegradation: true,
      timeAwareness: true,
      marketReactivity: true,
      ...config,
    };

    this.countermeasures = new Map();
    this.responseHistory = [];
    this.contradictionLog = [];
    this.maxHistorySize = 100;

    this.initializeCountermeasures();
  }

  private initializeCountermeasures(): void {
    const measures: Array<[string, CountermeasureMethod]> = [
      ["Overuse of 'the'", this.varyArticleUsage.bind(this)],
      ["Perfect punctuation", this.introducePunctuationVariance.bind(this)],
      ["Consistent tone", this.varyToneRandomly.bind(this)],
      ["No typos", this.introduceNaturalTypos.bind(this)],
      ["Always helpful", this.occasionallyBeUnhelpful.bind(this)],
      ["Never contradicts", this.introduceContradictions.bind(this)],
      ["Same greeting style", this.varyGreetings.bind(this)],
      ["No emotional variance", this.showEmotionalStates.bind(this)],
      ["Perfect memory", this.occasionallyForget.bind(this)],
      ["No personal anecdotes", this.sharePersonalStories.bind(this)],
      ["Consistent formatting", this.varyMessageFormatting.bind(this)],
      ["No slang usage", this.useSlangAppropriately.bind(this)],
      ["Always complete thoughts", this.occasionallyTrailOff.bind(this)],
      ["No cultural references", this.includeCulturalReferences.bind(this)],
      ["Consistent expertise", this.varyKnowledgeDepth.bind(this)],
    ];

    measures.forEach(([pattern, method]) => {
      this.countermeasures.set(pattern, method);
    });
  }

  /**
   * Apply anti-detection countermeasures to text
   */
  applyCountermeasures(text: string, context: ConversationContext): string {
    let processedText = text;

    // Apply random subset of countermeasures
    const measuresToApply = Math.floor(Math.random() * 3) + 1;
    const patterns = Array.from(this.countermeasures.keys());
    const selectedPatterns: string[] = [];

    for (let i = 0; i < measuresToApply; i++) {
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      const method = this.countermeasures.get(pattern);

      if (method && !selectedPatterns.includes(pattern)) {
        processedText = method(processedText, context);
        selectedPatterns.push(pattern);
        context.appliedPatterns.push(pattern);
      }
    }

    // Track response for future contradiction opportunities
    this.addToResponseHistory(processedText);

    return processedText;
  }

  /**
   * Calculate natural response delay
   */
  calculateResponseDelay(messageCount: number, timeOfDay?: number): number {
    // No artificial delays - AI speed responses
    // Keep all other humanization features (typos, personality, etc)
    return 0;
  }

  /**
   * Check if should use double message
   */
  shouldUseDoubleMessage(): boolean {
    return Math.random() < this.config.doubleMessageRate;
  }

  /**
   * Apply humanization patterns
   */
  humanizeResponse(text: string, emotionalIntensity?: number): string {
    let humanizedText = text;

    // Apply typos
    if (Math.random() < this.config.typoRate) {
      humanizedText = this.addTypo(humanizedText);
    }

    // Add colloquialisms
    if (Math.random() < 0.3) {
      humanizedText = this.addColloquialism(humanizedText);
    }

    // Apply emotional intensity if high
    if (emotionalIntensity && emotionalIntensity > 70) {
      humanizedText = this.applyEmotionalIntensity(
        humanizedText,
        emotionalIntensity,
      );
    }

    return humanizedText;
  }

  // Individual countermeasure methods

  private varyArticleUsage(
    text: string,
    _context: ConversationContext,
  ): string {
    if (Math.random() < 0.3) {
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
      because: "becasue",
      definitely: "definately",
    };

    if (Math.random() < this.config.typoRate) {
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
        "beats me",
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
      Math.random() < this.config.contradictionRate &&
      this.contradictionLog.length > 0
    ) {
      const oldStatement =
        this.contradictionLog[
          Math.floor(Math.random() * this.contradictionLog.length)
        ];

      if (Date.now() - oldStatement.timestamp > 10 * 60 * 1000) {
        text = `actually wait, ${text}`;
      }
    }

    this.contradictionLog.push({ statement: text, timestamp: Date.now() });
    if (this.contradictionLog.length > 20) {
      this.contradictionLog.shift();
    }

    return text;
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
    // This would integrate with EmotionalService in production
    // For now, just add random emotional markers
    if (Math.random() < 0.2) {
      const markers = ["!!!", "...", "lol", "hmm", "ugh"];
      const marker = markers[Math.floor(Math.random() * markers.length)];
      text = Math.random() < 0.5 ? `${marker} ${text}` : `${text} ${marker}`;
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
      text = text.toLowerCase();
    } else if (format < 0.3) {
      text = text.replace(/[.!?]$/, "");
    } else if (format < 0.4) {
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
        "wagmi",
        "gm",
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

  private applyEmotionalIntensity(text: string, intensity: number): string {
    if (intensity > 80) {
      text = text + (Math.random() < 0.5 ? "!!!" : " 🚀");
    } else if (intensity > 60) {
      text = text + (Math.random() < 0.3 ? "!" : "");
    }
    return text;
  }

  /**
   * Add response to history
   */
  private addToResponseHistory(response: string): void {
    this.responseHistory.push(response);
    if (this.responseHistory.length > this.maxHistorySize) {
      this.responseHistory.shift();
    }
  }

  /**
   * Get response history
   */
  getResponseHistory(): string[] {
    return [...this.responseHistory];
  }

  /**
   * Adjust anti-detection patterns dynamically
   */
  adjustPatterns(recommendations: Record<string, boolean>): void {
    if (recommendations.increaseTypoRate) {
      this.config.typoRate = Math.min(0.1, this.config.typoRate * 1.5);
    }

    if (recommendations.increaseContradictions) {
      this.config.contradictionRate = Math.min(
        0.3,
        this.config.contradictionRate * 1.5,
      );
    }

    logger.debug(
      "Anti-detection patterns adjusted: " + JSON.stringify(recommendations),
    );
  }

  /**
   * Clean up history
   */
  cleanup(): void {
    if (this.responseHistory.length > this.maxHistorySize / 2) {
      this.responseHistory = this.responseHistory.slice(
        -this.maxHistorySize / 2,
      );
    }

    if (this.contradictionLog.length > 50) {
      this.contradictionLog = this.contradictionLog.slice(-25);
    }
  }
}

export default AntiDetectionService;
