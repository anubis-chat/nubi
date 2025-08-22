import { logger } from "@elizaos/core";

export type EmotionalStateType =
  | "excited"
  | "calm"
  | "frustrated"
  | "curious"
  | "confident"
  | "contemplative"
  | "playful"
  | "focused";

export interface EmotionalState {
  current: EmotionalStateType;
  intensity: number;
  triggers: string[];
  duration: number;
  lastUpdate: number;
  persistence: number;
}

export interface EmotionalConfig {
  defaultState: EmotionalStateType;
  defaultIntensity: number;
  minIntensity: number;
  maxIntensity: number;
  decayRate: number;
  persistenceTime: number;
  trackingInterval: number;
}

export interface EmotionalTriggers {
  [key: string]: string[];
}

export class EmotionalService {
  private emotionalState: EmotionalState;
  private config: EmotionalConfig;
  private trackingInterval: NodeJS.Timeout | null = null;
  private triggers: EmotionalTriggers;

  constructor(config?: Partial<EmotionalConfig>) {
    this.config = {
      defaultState: "calm",
      defaultIntensity: 50,
      minIntensity: 20,
      maxIntensity: 100,
      decayRate: 10,
      persistenceTime: 30 * 60 * 1000, // 30 minutes
      trackingInterval: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.emotionalState = {
      current: this.config.defaultState,
      intensity: this.config.defaultIntensity,
      triggers: [],
      duration: 0,
      lastUpdate: Date.now(),
      persistence: this.config.persistenceTime,
    };

    this.triggers = this.initializeTriggers();
  }

  private initializeTriggers(): EmotionalTriggers {
    return {
      excited: [
        "amazing",
        "incredible",
        "awesome",
        "bullish",
        "moon",
        "pump",
        "wow",
        "fantastic",
      ],
      frustrated: [
        "broken",
        "down",
        "issue",
        "problem",
        "scam",
        "rug",
        "fail",
        "error",
        "bug",
      ],
      curious: [
        "how",
        "why",
        "what",
        "explain",
        "understand",
        "learn",
        "wonder",
        "interesting",
      ],
      confident: [
        "know",
        "sure",
        "definitely",
        "obviously",
        "clearly",
        "certain",
        "absolutely",
      ],
      contemplative: [
        "think",
        "wonder",
        "perhaps",
        "maybe",
        "possibly",
        "consider",
        "hmm",
      ],
      playful: ["lol", "haha", "meme", "joke", "fun", "play", "lmao", "rofl"],
      focused: [
        "important",
        "critical",
        "essential",
        "focus",
        "concentrate",
        "attention",
      ],
    };
  }

  /**
   * Start emotional state tracking
   */
  startTracking(): void {
    if (this.trackingInterval) {
      return; // Already running
    }

    this.trackingInterval = setInterval(() => {
      this.decayEmotionalState();
    }, this.config.trackingInterval);

    logger.info("Emotional state tracking started");
  }

  /**
   * Stop emotional state tracking
   */
  stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      logger.info("Emotional state tracking stopped");
    }
  }

  /**
   * Decay emotional intensity over time
   */
  private decayEmotionalState(): void {
    const now = Date.now();
    const duration = now - this.emotionalState.lastUpdate;

    if (duration > this.emotionalState.persistence) {
      // Decay intensity
      this.emotionalState.intensity = Math.max(
        this.config.minIntensity,
        this.emotionalState.intensity - this.config.decayRate,
      );

      // Return to baseline if intensity is low
      if (this.emotionalState.intensity <= 30) {
        this.emotionalState.current = this.config.defaultState;
        this.emotionalState.triggers = [];
      }

      this.emotionalState.duration += duration;
      this.emotionalState.lastUpdate = now;

      logger.debug(
        "Emotional state decayed: " +
          JSON.stringify({
            state: this.emotionalState.current,
            intensity: this.emotionalState.intensity,
          }),
      );
    }
  }

  /**
   * Update emotional state based on text triggers
   */
  updateFromText(text: string): void {
    const lowerText = text.toLowerCase();
    let highestMatch = { emotion: this.emotionalState.current, count: 0 };

    // Check for emotional triggers
    for (const [emotion, keywords] of Object.entries(this.triggers)) {
      const matchCount = keywords.filter((keyword) =>
        lowerText.includes(keyword),
      ).length;

      if (matchCount > highestMatch.count) {
        highestMatch = {
          emotion: emotion as EmotionalStateType,
          count: matchCount,
        };
      }
    }

    // Update state if we found triggers
    if (highestMatch.count > 0) {
      this.setState(
        highestMatch.emotion,
        Math.min(this.config.maxIntensity, 60 + highestMatch.count * 10),
      );

      // Add trigger text (truncated)
      this.emotionalState.triggers.push(text.substring(0, 50));
      if (this.emotionalState.triggers.length > 10) {
        this.emotionalState.triggers.shift();
      }
    }
  }

  /**
   * Set emotional state directly
   */
  setState(state: EmotionalStateType, intensity?: number): void {
    this.emotionalState.current = state;
    this.emotionalState.intensity = intensity || this.config.defaultIntensity;
    this.emotionalState.lastUpdate = Date.now();
    this.emotionalState.duration = 0;

    logger.debug(
      "Emotional state updated: " +
        JSON.stringify({
          state: this.emotionalState.current,
          intensity: this.emotionalState.intensity,
        }),
    );
  }

  /**
   * Get current emotional state
   */
  getState(): EmotionalState {
    return { ...this.emotionalState };
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): EmotionalStateType {
    return this.emotionalState.current;
  }

  /**
   * Get emotional intensity
   */
  getIntensity(): number {
    return this.emotionalState.intensity;
  }

  /**
   * Check if emotion is intense
   */
  isIntense(): boolean {
    return this.emotionalState.intensity > 60;
  }

  /**
   * Get emotional response markers
   */
  getEmotionalMarkers(): string[] {
    const markers: Record<EmotionalStateType, string[]> = {
      excited: ["!!!", "🚀", "LFG", "WAGMI", "wow"],
      frustrated: ["ugh", "...", "sigh", "ffs", "seriously"],
      curious: ["hmm", "🤔", "interesting...", "wonder", "really?"],
      playful: ["lol", "haha", "😄", "lmao", "XD"],
      confident: ["definitely", "absolutely", "100%", "for sure"],
      contemplative: ["perhaps", "possibly", "I think", "maybe"],
      calm: ["", "well", "alright", "okay"],
      focused: ["importantly", "note that", "key point", "remember"],
    };

    return markers[this.emotionalState.current] || markers.calm;
  }

  /**
   * Apply emotional intensity to text
   */
  applyEmotionalIntensity(text: string): string {
    if (!this.isIntense()) {
      return text;
    }

    const emotions: Record<EmotionalStateType, (text: string) => string> = {
      excited: (t) => t + (Math.random() < 0.5 ? "!!!" : " 🚀"),
      frustrated: (t) => t.replace(/\./g, "..."),
      playful: (t) => t + (Math.random() < 0.3 ? " 😄" : " lol"),
      contemplative: (t) => `hmm... ${t}`,
      confident: (t) => t.toUpperCase().substring(0, 10) + t.substring(10),
      curious: (t) => `${t}?`,
      calm: (t) => t,
      focused: (t) => `[Important] ${t}`,
    };

    const modifier = emotions[this.emotionalState.current];
    return modifier ? modifier(text) : text;
  }

  /**
   * Get fallback responses based on emotional state
   */
  getFallbackResponse(): string {
    const fallbacks: Record<EmotionalStateType, string[]> = {
      excited: ["whoa thats wild!", "amazing!", "incredible!", "this is huge!"],
      frustrated: [
        "ugh not sure about that",
        "having issues rn",
        "give me a sec",
        "this is annoying",
      ],
      calm: [
        "interesting point",
        "tell me more about that",
        "hmm let me think",
        "I see",
      ],
      curious: [
        "thats fascinating",
        "how does that work?",
        "want to know more",
        "really interesting",
      ],
      playful: ["lol nice", "haha good one", "thats pretty cool", "love it"],
      contemplative: [
        "makes me think...",
        "interesting perspective",
        "hmm worth considering",
        "let me ponder that",
      ],
      confident: [
        "absolutely",
        "i see what you mean",
        "good point",
        "exactly right",
      ],
      focused: [
        "let's focus on this",
        "this is important",
        "pay attention to",
        "key point here",
      ],
    };

    const responses = fallbacks[this.emotionalState.current] || fallbacks.calm;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Check if should show emotional state
   */
  shouldShowEmotion(): boolean {
    return this.emotionalState.intensity > 60 && Math.random() < 0.4;
  }

  /**
   * Get emotional context for response generation
   */
  getEmotionalContext(): {
    shouldBeEmotional: boolean;
    emotionalMarker: string;
    intensityModifier: number;
  } {
    const markers = this.getEmotionalMarkers();

    return {
      shouldBeEmotional: this.shouldShowEmotion(),
      emotionalMarker: markers[Math.floor(Math.random() * markers.length)],
      intensityModifier: this.emotionalState.intensity / 100,
    };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.emotionalState = {
      current: this.config.defaultState,
      intensity: this.config.defaultIntensity,
      triggers: [],
      duration: 0,
      lastUpdate: Date.now(),
      persistence: this.config.persistenceTime,
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopTracking();
  }
}

export default EmotionalService;
