import {
  Evaluator,
  IAgentRuntime,
  Memory,
  State,
  ActionResult,
  HandlerCallback,
  logger,
} from "@elizaos/core";

/**
 * Anti-Detection Post-Processor Evaluator
 *
 * Converted from the original NUBI anti-detection system.
 * Runs AFTER ElizaOS generates responses to apply humanization patterns.
 *
 * Original location: anti-detection-system.ts (610 lines)
 */

interface ConversationMemory {
  recentTopics: string[];
  contradictions: Map<string, string[]>;
  personalReferences: string[];
  lastResponseTime: number;
  messageCount: number;
  formality: number; // 0-1, decreases over time
}

export const antiDetectionPostProcessor: Evaluator = {
  name: "ANTI_DETECTION_POST_PROCESSOR",
  description:
    "Applies humanization patterns to responses for natural variation",
  examples: [], // Required field for ElizaOS Evaluator

  // Run on agent's own responses with probability
  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
  ): Promise<boolean> => {
    // Only process agent's own responses, not user messages
    const isFromAgent = (message as any).userId === runtime.agentId;
    const hasText = !!message.content?.text;
    const shouldProcess = Math.random() < 0.3; // 30% chance to apply

    return isFromAgent && hasText && shouldProcess;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options?: any,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      let text = message.content.text || "";

      if (!text.trim()) {
        return { success: true, text: "" };
      }

      // Get conversation memory for context
      const conversationMemory = getConversationMemory(
        message.roomId || "default",
      );

      // Get response patterns from YAML config
      const yamlConfig = (runtime as any).yamlConfigManager?.getConfig();
      const responsePatterns = yamlConfig?.agent?.response_patterns;

      // Apply random subset of anti-detection patterns with YAML-configured probabilities
      const patterns = [
        { name: "Vary Articles", method: varyArticles, probability: 0.15 },
        {
          name: "Introduce Typos",
          method: introduceTypos,
          probability: responsePatterns?.typo_rate || 0.03,
        },
        { name: "Rotate Phrases", method: rotatePhases, probability: 0.4 },
        {
          name: "Add Personalization",
          method: addPersonalization,
          probability: 0.3,
        },
        { name: "Vary Formality", method: varyFormality, probability: 0.2 },
        {
          name: "Vary Sentence Structure",
          method: varySentenceStructure,
          probability: 0.25,
        },
        {
          name: "Apply Emotional State",
          method: applyEmotionalState,
          probability: 0.1,
        },
        {
          name: "Add Human Moments",
          method: addHumanMoments,
          probability: 0.1,
        },
      ];

      const appliedPatterns: string[] = [];
      let processedText = text;

      // Apply 1-3 random patterns
      const patternsToApply = Math.floor(Math.random() * 3) + 1;
      const shuffledPatterns = patterns.sort(() => Math.random() - 0.5);

      for (let i = 0; i < patternsToApply && i < shuffledPatterns.length; i++) {
        const pattern = shuffledPatterns[i];

        if (Math.random() < pattern.probability) {
          const previousText = processedText;
          processedText = pattern.method(processedText, {
            memory: conversationMemory,
            state,
            runtime,
          });

          if (processedText !== previousText) {
            appliedPatterns.push(pattern.name);
          }
        }
      }

      // Update conversation memory
      updateConversationMemory(message.roomId || "default", processedText);

      // Only modify the message if patterns were applied
      if (appliedPatterns.length > 0 && processedText !== text) {
        // Update the message content
        message.content.text = processedText;

        logger.debug(
          `[ANTI_DETECTION] Applied patterns: ${appliedPatterns.join(", ")}`,
        );

        // Optionally send through callback if provided
        if (callback) {
          await callback({
            text: processedText,
            action: "ANTI_DETECTION_APPLIED",
            metadata: {
              originalText: text,
              appliedPatterns,
              processingTime: Date.now(),
            },
          });
        }
      }

      return {
        success: true,
        text: processedText,
        values: {
          appliedPatterns,
          originalLength: text.length,
          processedLength: processedText.length,
          humanized: appliedPatterns.length > 0,
        },
      };
    } catch (error) {
      logger.error("[ANTI_DETECTION_POST_PROCESSOR] Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

// Store conversation memories globally (in production, use proper storage)
const conversationMemories = new Map<string, ConversationMemory>();

function getConversationMemory(roomId: string): ConversationMemory {
  if (!conversationMemories.has(roomId)) {
    conversationMemories.set(roomId, {
      recentTopics: [],
      contradictions: new Map(),
      personalReferences: [],
      lastResponseTime: 0,
      messageCount: 0,
      formality: 0.7,
    });
  }
  return conversationMemories.get(roomId)!;
}

function updateConversationMemory(roomId: string, text: string): void {
  const memory = getConversationMemory(roomId);

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

/**
 * Anti-Detection Pattern Functions
 * Converted from original anti-detection-system.ts
 */

function varyArticles(text: string): string {
  // Occasionally skip "the"
  if (Math.random() < 0.15) {
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

function introduceTypos(text: string): string {
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
    ];

    if (word.length > 3 && Math.random() < 0.5) {
      const pattern =
        typoPatterns[Math.floor(Math.random() * typoPatterns.length)];
      words[wordIndex] = pattern(word);
    }
  }

  return words.join(" ");
}

function rotatePhases(text: string, context: any): string {
  const replacements = {
    "I think": ["imo", "feels like", "pretty sure", "my take is", "honestly"],
    "In my opinion": ["imo", "personally", "the way i see it", "if you ask me"],
    However: ["but", "although", "thing is", "that said", "then again"],
    Therefore: ["so", "which means", "basically", "hence"],
    "For example": ["like", "eg", "such as", "take", "look at"],
    Additionally: ["also", "plus", "and", "btw", "oh and"],
  };

  for (const [formal, casual] of Object.entries(replacements)) {
    if (text.includes(formal) && Math.random() < 0.7) {
      const replacement = casual[Math.floor(Math.random() * casual.length)];
      text = text.replace(new RegExp(formal, "gi"), replacement);
    }
  }

  return text;
}

function addPersonalization(text: string): string {
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
    ];

    const ref = references[Math.floor(Math.random() * references.length)];
    const sentences = text.split(". ");
    if (sentences.length > 1) {
      const insertPoint = Math.floor(Math.random() * (sentences.length - 1));
      sentences[insertPoint] += ref;
      text = sentences.join(". ");
    }
  }

  return text;
}

function varyFormality(text: string, context: any): string {
  const formality = context?.memory?.formality || 0.5;

  if (formality > 0.7 && Math.random() < 0.5) {
    // Make more casual
    text = text.replace(/\bDo not\b/g, "Don't");
    text = text.replace(/\bCannot\b/g, "Can't");
    text = text.replace(/\bWill not\b/g, "Won't");
    text = text.replace(/\bIt is\b/g, "It's");
    text = text.replace(/\bThat is\b/g, "That's");
  } else if (formality < 0.3 && Math.random() < 0.3) {
    // Make even more casual
    text = text.toLowerCase();
    text = text.replace(/\./g, "...");
    text = text.replace(/!/g, "!!");
  }

  return text;
}

function varySentenceStructure(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const processed = [];

  for (let sentence of sentences) {
    const rand = Math.random();

    if (rand < 0.1 && sentence.length > 20) {
      // Fragment
      const words = sentence.split(" ");
      sentence = words.slice(Math.floor(words.length / 2)).join(" ");
    } else if (rand < 0.2) {
      // Add trailing...
      sentence = sentence.replace(/([.!?])$/, "...");
    }

    processed.push(sentence);
  }

  return processed.join(" ");
}

function applyEmotionalState(text: string, context: any): string {
  // Get emotional state from context (will be provided by emotional state provider)
  const emotion = context?.state?.emotionalState?.current || "neutral";
  const intensity = context?.state?.emotionalState?.intensity || 50;

  switch (emotion) {
    case "excited":
      if (Math.random() < intensity / 100) {
        text = text.replace(/!/g, "!!!");
        if (Math.random() < 0.3) text = "lfg " + text;
      }
      break;

    case "frustrated":
      if (Math.random() < 0.4) {
        text = text.replace(/\./g, "...");
        if (Math.random() < 0.2) text = "ugh " + text;
      }
      break;

    case "playful":
      if (Math.random() < 0.4) {
        const emojis = ["😅", "🤝", "👀", "🔥"];
        text += " " + emojis[Math.floor(Math.random() * emojis.length)];
      }
      break;
  }

  return text;
}

function addHumanMoments(text: string): string {
  const rand = Math.random();

  if (rand < 0.05) {
    // Confusion
    const confusions = [
      "wait actually... ",
      "hmm no wait ",
      "actually scratch that, ",
      "oh wait i misread, ",
    ];
    text = confusions[Math.floor(Math.random() * confusions.length)] + text;
  } else if (rand < 0.1) {
    // Self-correction
    const words = text.split(" ");
    if (words.length > 5) {
      const errorIndex = Math.floor(Math.random() * Math.min(5, words.length));
      words.splice(errorIndex + 1, 0, "wait no");
      text = words.join(" ");
    }
  } else if (rand < 0.15) {
    // Tangent
    const tangents = [
      " (btw did you see that thread earlier?)",
      " (completely unrelated but phantom update is nice)",
      " (side note: gas on eth is insane rn)",
    ];
    text += tangents[Math.floor(Math.random() * tangents.length)];
  }

  return text;
}

export default antiDetectionPostProcessor;
