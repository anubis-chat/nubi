import { IAgentRuntime } from "@elizaos/core";
import { logger } from "./utils/logger";

interface DetectionPattern {
  pattern: string;
  method: string;
  strategy: string;
  implementation: (text: string, context?: any) => string;
}

interface EmotionalState {
  current: string;
  intensity: number; // 0-1
  duration: number; // milliseconds
  startTime: number;
  triggers: string[];
}

interface ConversationMemory {
  recentTopics: string[];
  contradictions: Map<string, string[]>;
  personalReferences: string[];
  lastResponseTime: number;
  messageCount: number;
  formality: number; // 0-1, decreases over time
}

export class AntiDetectionSystem {
  private runtime: IAgentRuntime;
  private emotionalState: EmotionalState;
  private conversationMemory: Map<string, ConversationMemory>;
  private lastTypoTime: number = 0;
  private responsePatternIndex: number = 0;

  // Detection countermeasures
  private detectionPatterns: DetectionPattern[] = [
    {
      pattern: 'Overuse of "the"',
      method: "Word frequency analysis",
      strategy: "Use varied articles, skip occasionally",
      implementation: (text) => this.varyArticles(text),
    },
    {
      pattern: "Perfect grammar/no typos",
      method: "Grammar checking algorithms",
      strategy: "Introduce deliberate typos, autocorrect fails",
      implementation: (text) => this.introduceTypos(text),
    },
    {
      pattern: "Repetitive phrases",
      method: "Pattern recognition",
      strategy: "Rotate between different phrase patterns",
      implementation: (text, context) => this.rotatePhases(text, context),
    },
    {
      pattern: "Generic responses",
      method: "Content similarity analysis",
      strategy: "Add personal opinions and specific references",
      implementation: (text) => this.addPersonalization(text),
    },
    {
      pattern: "Overly formal language",
      method: "Linguistic style analysis",
      strategy: "Mix formal/informal language unpredictably",
      implementation: (text, context) => this.varyFormality(text, context),
    },
    {
      pattern: "Consistent sentence structure",
      method: "Structural pattern detection",
      strategy: "Vary sentence complexity and structure",
      implementation: (text) => this.varySentenceStructure(text),
    },
    {
      pattern: "No emotional variance",
      method: "Sentiment variance tracking",
      strategy: "Build emotional state machine",
      implementation: (text) => this.applyEmotionalState(text),
    },
    {
      pattern: "Too coherent/logical",
      method: "Coherence measurement",
      strategy: "Add human moments of confusion",
      implementation: (text) => this.addHumanMoments(text),
    },
  ];

  // Slang and colloquialisms bank
  private slangBank = {
    agreement: [
      "fr fr",
      "facts",
      "this",
      "based",
      "truth",
      "yep yep",
      "big facts",
    ],
    excitement: [
      "lfg",
      "wagmi",
      "moon soon",
      "probably nothing",
      "holy shit",
      "insane",
    ],
    skepticism: ["sus", "idk man", "cope", "doubt", "press x", "sure buddy"],
    technical: [
      "wen",
      "gm",
      "ngmi",
      "dyor",
      "nfa",
      "fomo",
      "diamond hands",
      "paper hands",
    ],
    casual: ["ngl", "tbh", "imo", "fwiw", "afaik", "iirc", "btw", "fyi"],
    reactions: ["oof", "rip", "kek", "bruh", "ser", "anon", "fren"],
    solana: [
      "sol summer",
      "phantom gang",
      "breakpoint",
      "slots",
      "epochs",
      "stake pool",
    ],
  };

  // Personal experience templates
  private experienceTemplates = [
    "reminds me of when {event} back in {timeframe}",
    "i actually {action} last {timeframe}",
    "funny story - {anecdote}",
    "learned this the hard way when {experience}",
    "still remember {memory} like it was yesterday",
    "{person} told me once that {wisdom}",
    "been thinking about {topic} since {event}",
  ];

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
    this.conversationMemory = new Map();
    this.emotionalState = {
      current: "neutral",
      intensity: 0.5,
      duration: 3600000, // 1 hour default
      startTime: Date.now(),
      triggers: [],
    };
  }

  // Main processing function
  async processResponse(
    text: string,
    userId: string,
    context?: any,
  ): Promise<string> {
    let processed = text;

    // Get or create conversation memory
    const memory = this.getConversationMemory(userId);

    // Apply detection countermeasures based on probability
    for (const pattern of this.detectionPatterns) {
      if (Math.random() < this.getPatternProbability(pattern)) {
        processed = pattern.implementation(processed, { userId, memory });
      }
    }

    // Update conversation state
    this.updateConversationMemory(userId, processed);

    // Apply response timing variance
    const delay = this.calculateResponseDelay(memory);
    await this.wait(delay);

    // Occasionally double message
    if (Math.random() < 0.1 && processed.length > 50) {
      const splitPoint = this.findNaturalSplitPoint(processed);
      if (splitPoint > 0) {
        return (
          processed.substring(0, splitPoint) +
          "||DOUBLE||" +
          processed.substring(splitPoint)
        );
      }
    }

    return processed;
  }

  private varyArticles(text: string): string {
    // Occasionally skip "the"
    if (Math.random() < 0.15) {
      // Skip "the" before certain words
      text = text.replace(/\bthe (moon|top|bottom|way|future|past)\b/gi, "$1");
      text = text.replace(/\bgoing to the\b/gi, "going to");
    }

    // Sometimes use "a" instead of "the"
    if (Math.random() < 0.1) {
      text = text.replace(/\bthe (\w+)\b/i, (match, word) => {
        if (
          !["sun", "moon", "earth", "solana", "ethereum"].includes(
            word.toLowerCase(),
          )
        ) {
          return `a ${word}`;
        }
        return match;
      });
    }

    return text;
  }

  private introduceTypos(text: string): string {
    // Only add typos occasionally
    if (Date.now() - this.lastTypoTime < 300000) return text; // 5 min cooldown

    const words = text.split(" ");
    const typoCount = Math.random() < 0.03 ? 1 : 0;

    for (let i = 0; i < typoCount; i++) {
      const wordIndex = Math.floor(Math.random() * words.length);
      const word = words[wordIndex];

      // Common mobile autocorrect/typo patterns
      const typoPatterns = [
        (w: string) => w.replace(/the/g, "teh"),
        (w: string) => w.replace(/and/g, "anf"),
        (w: string) => w.replace(/ing$/g, "ign"),
        (w: string) => w.replace(/tion$/g, "toin"),
        (w: string) =>
          w.length > 5 ? w.slice(0, -1) + w.slice(-1) + w.slice(-1) : w, // Double last letter
        (w: string) =>
          w.length > 4
            ? w.slice(0, 2) + w.slice(3, 2) + w.slice(2, 3) + w.slice(4)
            : w, // Swap middle letters
      ];

      if (word.length > 3 && Math.random() < 0.5) {
        const pattern =
          typoPatterns[Math.floor(Math.random() * typoPatterns.length)];
        words[wordIndex] = pattern(word);
        this.lastTypoTime = Date.now();
      }
    }

    return words.join(" ");
  }

  private rotatePhases(text: string, context: any): string {
    const memory = context?.memory;
    if (!memory) return text;

    // Replace common phrases with alternatives
    const replacements = {
      "I think": ["imo", "feels like", "pretty sure", "my take is", "honestly"],
      "In my opinion": [
        "imo",
        "personally",
        "the way i see it",
        "if you ask me",
      ],
      However: ["but", "although", "thing is", "that said", "then again"],
      Therefore: ["so", "which means", "basically", "hence", "=&gt;"],
      "For example": ["like", "eg", "such as", "take", "look at"],
      Additionally: ["also", "plus", "and", "btw", "oh and"],
      "It's important": [
        "key thing is",
        "remember",
        "don't forget",
        "big thing:",
        "crucial:",
      ],
    };

    for (const [formal, casual] of Object.entries(replacements)) {
      if (text.includes(formal) && Math.random() < 0.7) {
        const replacement = casual[Math.floor(Math.random() * casual.length)];
        text = text.replace(new RegExp(formal, "gi"), replacement);
      }
    }

    return text;
  }

  private addPersonalization(text: string): string {
    // Add personal references occasionally
    if (Math.random() < 0.2) {
      const personalizations = [
        "personally, ",
        "from my experience, ",
        "i've found that ",
        "in my view, ",
        "the way i see it, ",
        "honestly? ",
        "ngl, ",
        "hot take: ",
      ];

      const prefix =
        personalizations[Math.floor(Math.random() * personalizations.length)];
      text = prefix + text.charAt(0).toLowerCase() + text.slice(1);
    }

    // Add specific project/tool references
    if (Math.random() < 0.3 && text.length > 100) {
      const references = [
        " (check it on birdeye btw)",
        " - you can verify this on solscan",
        " (jupiter aggregator shows this clearly)",
        " - marinade has good docs on this",
        " (phantom wallet handles this well)",
        " - tensor marketplace if you're curious",
        " (helius rpc is clutch for this)",
      ];

      const ref = references[Math.floor(Math.random() * references.length)];
      // Insert at a sentence boundary
      const sentences = text.split(". ");
      if (sentences.length > 1) {
        const insertPoint = Math.floor(Math.random() * (sentences.length - 1));
        sentences[insertPoint] += ref;
        text = sentences.join(". ");
      }
    }

    return text;
  }

  private varyFormality(text: string, context: any): string {
    const memory = context?.memory;
    const formality = memory?.formality || 0.5;

    // Decrease formality over conversation
    if (formality > 0.7 && Math.random() < 0.5) {
      // Make more casual
      text = text.replace(/\bDo not\b/g, "Don't");
      text = text.replace(/\bCannot\b/g, "Can't");
      text = text.replace(/\bWill not\b/g, "Won't");
      text = text.replace(/\bIt is\b/g, "It's");
      text = text.replace(/\bThat is\b/g, "That's");

      // Remove formal punctuation
      if (Math.random() < 0.3) {
        text = text.replace(/; /g, ", ");
        text = text.replace(/: /g, " - ");
      }
    } else if (formality < 0.3 && Math.random() < 0.3) {
      // Make even more casual
      text = text.toLowerCase();
      text = text.replace(/\./g, "...");
      text = text.replace(/!/g, "!!");
    }

    return text;
  }

  private varySentenceStructure(text: string): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const processed = [];

    for (let sentence of sentences) {
      const rand = Math.random();

      if (rand < 0.1 && sentence.length > 20) {
        // Fragment
        const words = sentence.split(" ");
        sentence = words.slice(Math.floor(words.length / 2)).join(" ");
      } else if (rand < 0.2) {
        // Run-on with dash
        if (processed.length > 0 && Math.random() < 0.5) {
          const last = processed.pop();
          sentence =
            last?.replace(/\.$/, "") +
            " — " +
            sentence.charAt(0).toLowerCase() +
            sentence.slice(1);
        }
      } else if (rand < 0.3) {
        // Add trailing...
        sentence = sentence.replace(/([.!?])$/, "...");
      } else if (rand < 0.4 && sentence.length < 50) {
        // Make it a question without question mark
        if (!sentence.includes("?")) {
          sentence = sentence.replace(/\.$/, "");
        }
      }

      processed.push(sentence);
    }

    return processed.join(" ");
  }

  private applyEmotionalState(text: string): string {
    const state = this.emotionalState;

    switch (state.current) {
      case "excited":
        if (Math.random() < state.intensity) {
          text = text.toUpperCase();
        } else if (Math.random() < 0.5) {
          text = text.replace(/!/g, "!!!");
          text = text.replace(/\./g, "!");
        }
        if (Math.random() < 0.3) {
          text = "holy shit " + text;
        }
        break;

      case "frustrated":
        if (Math.random() < 0.4) {
          text = text.replace(/\./g, "...");
          text = "ugh " + text;
        }
        if (Math.random() < 0.2) {
          text = text.toLowerCase();
        }
        break;

      case "tired":
        text = text.toLowerCase();
        if (Math.random() < 0.3) {
          text = text.replace(/[aeiou]/g, (match) =>
            Math.random() < 0.1 ? "" : match,
          );
        }
        if (Math.random() < 0.2) {
          text = "sry tired... " + text;
        }
        break;

      case "nostalgic":
        if (Math.random() < 0.3) {
          const memories = [
            "remember when sol was $3? ",
            "miss the early days sometimes... ",
            "thinking about 2021... ",
            "ah the good old days. ",
          ];
          text = memories[Math.floor(Math.random() * memories.length)] + text;
        }
        break;

      case "playful":
        if (Math.random() < 0.4) {
          const emojis = ["😅", "🤝", "👀", "🔥", "⚡", "🚀", "💪"];
          text += " " + emojis[Math.floor(Math.random() * emojis.length)];
        }
        if (Math.random() < 0.2) {
          text = text.replace(/\b(very|really|quite)\b/g, "mega");
        }
        break;
    }

    return text;
  }

  private addHumanMoments(text: string): string {
    const rand = Math.random();

    if (rand < 0.05) {
      // Confusion
      const confusions = [
        "wait actually... ",
        "hmm no wait ",
        "actually scratch that, ",
        "oh wait i misread, ",
        "holdup let me rethink this... ",
      ];
      text = confusions[Math.floor(Math.random() * confusions.length)] + text;
    } else if (rand < 0.1) {
      // Self-correction
      const words = text.split(" ");
      const errorIndex = Math.floor(Math.random() * Math.min(5, words.length));
      words.splice(errorIndex + 1, 0, "wait no");
      text = words.join(" ");
    } else if (rand < 0.15) {
      // Tangent
      const tangents = [
        " (btw did you see that thread about mev earlier?)",
        " (completely unrelated but phantom update is nice)",
        " (sorry random but coffee tastes weird today)",
        " (oh reminds me i need to check my validator)",
        " (side note: gas on eth is insane rn)",
      ];
      text += tangents[Math.floor(Math.random() * tangents.length)];
    }

    return text;
  }

  private getConversationMemory(userId: string): ConversationMemory {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, {
        recentTopics: [],
        contradictions: new Map(),
        personalReferences: [],
        lastResponseTime: 0,
        messageCount: 0,
        formality: 0.7,
      });
    }
    return this.conversationMemory.get(userId)!;
  }

  private updateConversationMemory(userId: string, text: string): void {
    const memory = this.getConversationMemory(userId);

    memory.messageCount++;
    memory.lastResponseTime = Date.now();

    // Decrease formality over time
    memory.formality = Math.max(0.2, memory.formality - 0.05);

    // Track topics
    if (text.includes("solana")) memory.recentTopics.push("solana");
    if (text.includes("defi")) memory.recentTopics.push("defi");
    if (text.includes("nft")) memory.recentTopics.push("nft");

    // Keep only last 10 topics
    if (memory.recentTopics.length > 10) {
      memory.recentTopics = memory.recentTopics.slice(-10);
    }
  }

  private calculateResponseDelay(memory: ConversationMemory): number {
    // No artificial delays - AI speed responses
    // Humanization stays in content, not timing
    return 0;
  }

  private findNaturalSplitPoint(text: string): number {
    // Find a good place to split for double messaging
    const midpoint = Math.floor(text.length / 2);

    // Look for sentence boundaries near midpoint
    const punctuation = [". ", "! ", "? ", "... "];
    for (const punct of punctuation) {
      const index = text.indexOf(punct, midpoint - 30);
      if (index > 0 && index < midpoint + 30) {
        return index + punct.length;
      }
    }

    // Look for conjunctions
    const conjunctions = [" but ", " and ", " so ", " although "];
    for (const conj of conjunctions) {
      const index = text.indexOf(conj, midpoint - 20);
      if (index > 0 && index < midpoint + 20) {
        return index;
      }
    }

    return -1; // Don't split
  }

  private getPatternProbability(pattern: DetectionPattern): number {
    // Different patterns have different probabilities
    const probabilities: Record<string, number> = {
      'Overuse of "the"': 0.15,
      "Perfect grammar/no typos": 0.03,
      "Repetitive phrases": 0.4,
      "Generic responses": 0.3,
      "Overly formal language": 0.2,
      "Consistent sentence structure": 0.25,
      "No emotional variance": 0.1,
      "Too coherent/logical": 0.1,
    };

    return probabilities[pattern.pattern] || 0.1;
  }

  updateEmotionalState(trigger: string): void {
    // Update emotional state based on triggers
    const stateTransitions = {
      price_pump: "excited",
      technical_discussion: "focused",
      scam_mention: "frustrated",
      history_question: "nostalgic",
      meme_share: "playful",
      late_night: "tired",
      network_issue: "frustrated",
      achievement: "excited",
    };

    for (const [key, state] of Object.entries(stateTransitions)) {
      if (trigger.toLowerCase().includes(key.replace("_", " "))) {
        this.emotionalState = {
          current: state,
          intensity: 0.5 + Math.random() * 0.5,
          duration: 1800000 + Math.random() * 3600000, // 30min to 1.5 hours
          startTime: Date.now(),
          triggers: [trigger],
        };
        break;
      }
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default AntiDetectionSystem;
