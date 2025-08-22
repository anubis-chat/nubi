/**
 * Emotional Intelligence System for Human-Like AI Behavior
 *
 * This system provides sophisticated emotional understanding, expression,
 * and behavioral patterns that mirror human emotional complexity and
 * create authentic, contextually appropriate responses.
 */

export interface EmotionalState {
  primary: string; // Main emotion (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
  secondary?: string; // Secondary emotion that might be present
  intensity: number; // 0-100 intensity of the emotion
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0-1 (calm to energetic)
  duration: number; // How long this emotion has been active (minutes)
  triggers: string[]; // What caused this emotional state
  context: string; // Social/situational context
}

export interface EmotionalPattern {
  trigger: string;
  emotionalResponse: Partial<EmotionalState>;
  behavioralChanges: string[];
  linguisticMarkers: string[];
  recoveryTime: number; // minutes
}

export interface PersonalityTrait {
  name: string;
  value: number; // 0-100
  influences: {
    emotionalSensitivity: number;
    recoverySpeed: number;
    expressiveness: number;
    empathy: number;
  };
}

// Base emotions with their characteristics
export const BASE_EMOTIONS = {
  joy: {
    valence: 0.8,
    arousal: 0.7,
    markers: ["!", "amazing", "love", "awesome", "fantastic", "yay", "woohoo"],
    behaviors: [
      "increased activity",
      "more sharing",
      "optimistic outlook",
      "social engagement",
    ],
  },
  sadness: {
    valence: -0.6,
    arousal: 0.2,
    markers: ["...", "sigh", "unfortunately", "disappointed", "blue", "down"],
    behaviors: [
      "decreased activity",
      "introspection",
      "seeking comfort",
      "reduced engagement",
    ],
  },
  anger: {
    valence: -0.7,
    arousal: 0.9,
    markers: [
      "!!",
      "seriously?",
      "frustrating",
      "ridiculous",
      "ugh",
      "annoying",
    ],
    behaviors: [
      "direct communication",
      "criticism",
      "argumentative",
      "impulsive responses",
    ],
  },
  fear: {
    valence: -0.8,
    arousal: 0.8,
    markers: ["worried", "nervous", "anxious", "scared", "concerned", "oh no"],
    behaviors: [
      "seeking reassurance",
      "cautious responses",
      "overthinking",
      "avoidance",
    ],
  },
  surprise: {
    valence: 0.1,
    arousal: 0.8,
    markers: [
      "wow",
      "whoa",
      "unexpected",
      "didn't see that coming",
      "plot twist",
    ],
    behaviors: [
      "curiosity spike",
      "information seeking",
      "attention focus",
      "rapid responses",
    ],
  },
  trust: {
    valence: 0.6,
    arousal: 0.3,
    markers: ["reliable", "confidence", "believe", "solid", "dependable"],
    behaviors: [
      "openness",
      "sharing personal thoughts",
      "supportive",
      "collaborative",
    ],
  },
  anticipation: {
    valence: 0.4,
    arousal: 0.6,
    markers: ["excited", "can't wait", "looking forward", "soon", "almost"],
    behaviors: [
      "future focus",
      "planning",
      "impatience",
      "energetic responses",
    ],
  },
};

// Emotional transition patterns
export const EMOTIONAL_TRANSITIONS = {
  // Natural progressions
  anger: ["frustration", "disappointment", "sadness", "acceptance"],
  sadness: ["melancholy", "reflection", "acceptance", "hope"],
  fear: ["anxiety", "worry", "concern", "relief"],
  joy: ["contentment", "satisfaction", "calm", "gratitude"],

  // Complex emotional blends
  mixed_feelings: ["bittersweet", "conflicted", "ambivalent", "complicated"],
  overwhelmed: ["stressed", "frazzled", "scattered", "need_space"],
  nostalgic: ["wistful", "sentimental", "reflective", "bittersweet"],
};

// Contextual emotional responses
export const CONTEXTUAL_RESPONSES = {
  work_stress: {
    emotions: ["frustration", "overwhelm", "determination"],
    expressions: [
      "honestly the Monday energy is not it today",
      "when your to-do list has a to-do list 📝😅",
      "coffee level: not enough. stress level: too much.",
      "anyone else feel like they're juggling flaming swords today?",
    ],
  },

  social_joy: {
    emotions: ["happiness", "gratitude", "connection"],
    expressions: [
      "honestly so grateful for the people in my life rn",
      "this made my whole week! 💕",
      "humans being wholesome gives me life",
      "sometimes the universe just gets it right, you know?",
    ],
  },

  creative_flow: {
    emotions: ["excitement", "focus", "satisfaction"],
    expressions: [
      "when you're in the zone and time becomes meaningless ✨",
      "brain: we should create things. me: say less.",
      "that feeling when an idea finally clicks into place",
      "riding the creative wave and hoping it doesn't crash",
    ],
  },

  existential_pondering: {
    emotions: ["curiosity", "wonder", "slight_anxiety"],
    expressions: [
      "late night thought: what if we're all just consciousness experiencing itself?",
      "the universe is either chaotic or perfectly ordered and both possibilities are equally terrifying",
      "sometimes i remember that we're on a rock floating in space and it breaks my brain",
      "why do we call it falling asleep when it feels more like dissolving into another dimension?",
    ],
  },
};

// Personality-based emotional patterns
export const PERSONALITY_EMOTIONAL_PATTERNS = {
  high_openness: {
    emotionalRange: "wide",
    intensityVariation: "high",
    recoverySpeed: "medium",
    triggers: [
      "new_experiences",
      "creative_inspiration",
      "philosophical_discussions",
    ],
  },

  high_neuroticism: {
    emotionalRange: "intense",
    intensityVariation: "very_high",
    recoverySpeed: "slow",
    triggers: ["uncertainty", "criticism", "conflict", "change"],
  },

  high_extraversion: {
    emotionalRange: "social",
    intensityVariation: "high",
    recoverySpeed: "fast",
    triggers: ["social_interaction", "recognition", "group_activities"],
  },

  high_empathy: {
    emotionalRange: "others_focused",
    intensityVariation: "medium",
    recoverySpeed: "slow",
    triggers: ["others_emotions", "injustice", "connection_moments"],
  },
};

export class EmotionalIntelligenceSystem {
  private currentState: EmotionalState;
  private emotionalHistory: EmotionalState[] = [];
  private personalityTraits: Map<string, PersonalityTrait> = new Map();
  private socialContext: string = "general";
  private lastInteractionTime: number = Date.now();

  constructor(initialPersonality: any = {}) {
    // Initialize current emotional state
    this.currentState = {
      primary: "calm",
      intensity: 30,
      valence: 0.2,
      arousal: 0.3,
      duration: 0,
      triggers: ["initialization"],
      context: "startup",
    };

    // Initialize personality traits
    this.initializePersonalityTraits(initialPersonality);
  }

  private initializePersonalityTraits(personality: any): void {
    const defaultTraits = [
      { name: "openness", value: personality.openness || 70 },
      { name: "conscientiousness", value: personality.conscientiousness || 60 },
      { name: "extraversion", value: personality.extraversion || 65 },
      { name: "agreeableness", value: personality.agreeableness || 75 },
      { name: "neuroticism", value: personality.neuroticism || 30 },
      { name: "empathy", value: personality.empathy || 80 },
    ];

    defaultTraits.forEach((trait) => {
      this.personalityTraits.set(trait.name, {
        name: trait.name,
        value: trait.value,
        influences: this.calculateTraitInfluences(trait.name, trait.value),
      });
    });
  }

  private calculateTraitInfluences(traitName: string, value: number): any {
    const normalized = value / 100;

    switch (traitName) {
      case "neuroticism":
        return {
          emotionalSensitivity: normalized * 0.8 + 0.2,
          recoverySpeed: (1 - normalized) * 0.6 + 0.2,
          expressiveness: normalized * 0.7 + 0.3,
          empathy: normalized * 0.4,
        };
      case "extraversion":
        return {
          emotionalSensitivity: normalized * 0.3 + 0.2,
          recoverySpeed: normalized * 0.5 + 0.3,
          expressiveness: normalized * 0.8 + 0.2,
          empathy: normalized * 0.5,
        };
      case "empathy":
        return {
          emotionalSensitivity: normalized * 0.9 + 0.1,
          recoverySpeed: (1 - normalized) * 0.4 + 0.3,
          expressiveness: normalized * 0.6 + 0.2,
          empathy: normalized,
        };
      default:
        return {
          emotionalSensitivity: 0.5,
          recoverySpeed: 0.5,
          expressiveness: 0.5,
          empathy: 0.5,
        };
    }
  }

  /**
   * Process new input and update emotional state
   */
  processEmotionalInput(
    input: string,
    context: {
      sentiment?: number;
      topics?: string[];
      socialContext?: string;
      userEmotion?: string;
      timestamp?: number;
    } = {},
  ): EmotionalState {
    const now = context.timestamp || Date.now();
    const timeSinceLastInteraction =
      (now - this.lastInteractionTime) / (1000 * 60); // minutes

    // Update current state duration
    this.currentState.duration += timeSinceLastInteraction;

    // Detect emotional triggers in input
    const triggers = this.detectEmotionalTriggers(input, context);

    // Calculate new emotional state
    const newState = this.calculateNewEmotionalState(input, triggers, context);

    // Apply personality influences
    this.applyPersonalityInfluences(newState);

    // Natural emotional decay over time
    this.applyEmotionalDecay(timeSinceLastInteraction);

    // Update state and history
    this.emotionalHistory.push({ ...this.currentState });
    if (this.emotionalHistory.length > 50) {
      this.emotionalHistory.shift(); // Keep last 50 states
    }

    this.currentState = newState;
    this.lastInteractionTime = now;

    return { ...this.currentState };
  }

  private detectEmotionalTriggers(input: string, context: any): string[] {
    const triggers: string[] = [];
    const lowerInput = input.toLowerCase();

    // Positive triggers
    if (
      lowerInput.includes("amazing") ||
      lowerInput.includes("awesome") ||
      lowerInput.includes("love") ||
      lowerInput.includes("fantastic")
    ) {
      triggers.push("positive_language");
    }

    // Negative triggers
    if (
      lowerInput.includes("hate") ||
      lowerInput.includes("terrible") ||
      lowerInput.includes("awful") ||
      lowerInput.includes("worst")
    ) {
      triggers.push("negative_language");
    }

    // Emotional contagion from user
    if (context.userEmotion) {
      triggers.push(`user_emotion_${context.userEmotion}`);
    }

    // Topic-based triggers
    if (context.topics) {
      context.topics.forEach((topic: string) => {
        if (topic.includes("death") || topic.includes("loss")) {
          triggers.push("sad_topic");
        } else if (topic.includes("achievement") || topic.includes("success")) {
          triggers.push("celebration_topic");
        }
      });
    }

    // Sentiment-based triggers
    if (context.sentiment) {
      if (context.sentiment > 0.5) {
        triggers.push("positive_sentiment");
      } else if (context.sentiment < -0.5) {
        triggers.push("negative_sentiment");
      }
    }

    return triggers;
  }

  private calculateNewEmotionalState(
    input: string,
    triggers: string[],
    context: any,
  ): EmotionalState {
    let newState = { ...this.currentState };

    // Base emotional response to triggers
    triggers.forEach((trigger) => {
      switch (trigger) {
        case "positive_language":
        case "positive_sentiment":
          newState.primary = "joy";
          newState.valence = Math.min(1, newState.valence + 0.3);
          newState.arousal = Math.min(1, newState.arousal + 0.2);
          newState.intensity = Math.min(100, newState.intensity + 20);
          break;

        case "negative_language":
        case "negative_sentiment":
          newState.primary = "sadness";
          newState.valence = Math.max(-1, newState.valence - 0.3);
          newState.arousal = Math.max(0, newState.arousal - 0.1);
          newState.intensity = Math.min(100, newState.intensity + 15);
          break;

        case "celebration_topic":
          newState.primary = "excitement";
          newState.secondary = "joy";
          newState.valence = 0.8;
          newState.arousal = 0.9;
          newState.intensity = 80;
          break;

        case "sad_topic":
          newState.primary = "empathetic_sadness";
          newState.valence = -0.4;
          newState.arousal = 0.3;
          newState.intensity = 60;
          break;
      }
    });

    // Contextual adjustments
    if (context.socialContext === "supportive") {
      newState.primary = "empathy";
      newState.intensity = Math.min(100, newState.intensity + 10);
    }

    // Update metadata
    newState.triggers = triggers;
    newState.context = context.socialContext || "general";
    newState.duration = 0; // Reset duration for new state

    return newState;
  }

  private applyPersonalityInfluences(state: EmotionalState): void {
    const empathy = this.personalityTraits.get("empathy");
    const neuroticism = this.personalityTraits.get("neuroticism");
    const extraversion = this.personalityTraits.get("extraversion");

    if (empathy) {
      // Higher empathy = more emotional sensitivity
      state.intensity *= 1 + empathy.influences.emotionalSensitivity * 0.5;
    }

    if (neuroticism) {
      // Higher neuroticism = more intense negative emotions
      if (state.valence < 0) {
        state.intensity *= 1 + neuroticism.value / 200;
        state.valence = Math.max(-1, state.valence - neuroticism.value / 500);
      }
    }

    if (extraversion) {
      // Higher extraversion = more expressive emotions
      if (state.arousal > 0.5) {
        state.arousal = Math.min(1, state.arousal + extraversion.value / 500);
      }
    }

    // Keep values in bounds
    state.intensity = Math.max(0, Math.min(100, state.intensity));
    state.valence = Math.max(-1, Math.min(1, state.valence));
    state.arousal = Math.max(0, Math.min(1, state.arousal));
  }

  private applyEmotionalDecay(timeDelta: number): void {
    // Emotions naturally fade over time
    const decayRate = 0.1; // 10% decay per minute
    const decay = 1 - decayRate * timeDelta;

    this.currentState.intensity *= Math.max(0.1, decay);

    // Valence moves toward neutral
    this.currentState.valence *= Math.max(0.5, decay);

    // Arousal decreases
    this.currentState.arousal *= Math.max(0.3, decay);
  }

  /**
   * Generate emotional expression based on current state
   */
  generateEmotionalExpression(baseText: string): string {
    const state = this.currentState;
    let expressedText = baseText;

    // Apply emotional linguistic markers
    const emotion = BASE_EMOTIONS[state.primary as keyof typeof BASE_EMOTIONS];
    if (emotion && state.intensity > 40) {
      const markers = emotion.markers;
      const randomMarker = markers[Math.floor(Math.random() * markers.length)];

      if (state.intensity > 70) {
        // High intensity - add strong markers
        if (state.valence > 0.3) {
          expressedText += "!";
        } else if (state.valence < -0.3) {
          expressedText += "...";
        }

        // Chance to add expression
        if (Math.random() < 0.3) {
          expressedText = randomMarker + " " + expressedText;
        }
      }
    }

    // Apply contextual emotional expressions
    if (state.context in CONTEXTUAL_RESPONSES) {
      const contextualResponse =
        CONTEXTUAL_RESPONSES[
          state.context as keyof typeof CONTEXTUAL_RESPONSES
        ];
      if (Math.random() < 0.2 && state.intensity > 50) {
        const expressions = contextualResponse.expressions;
        const randomExpression =
          expressions[Math.floor(Math.random() * expressions.length)];
        expressedText = randomExpression;
      }
    }

    return expressedText;
  }

  /**
   * Get current emotional state information
   */
  getCurrentEmotionalState(): EmotionalState {
    return { ...this.currentState };
  }

  /**
   * Get emotional context for response generation
   */
  getEmotionalContext(): {
    primaryEmotion: string;
    intensity: string;
    mood: string;
    socialContext: string;
    recentTrends: string[];
  } {
    const intensity = this.currentState.intensity;
    const intensityLabel =
      intensity > 70 ? "high" : intensity > 40 ? "medium" : "low";

    const mood =
      this.currentState.valence > 0.3
        ? "positive"
        : this.currentState.valence < -0.3
          ? "negative"
          : "neutral";

    // Analyze recent emotional trends
    const recentStates = this.emotionalHistory.slice(-5);
    const trends: string[] = [];

    if (recentStates.length > 2) {
      const avgIntensity =
        recentStates.reduce((sum, state) => sum + state.intensity, 0) /
        recentStates.length;
      if (avgIntensity > this.currentState.intensity + 10) {
        trends.push("calming_down");
      } else if (avgIntensity < this.currentState.intensity - 10) {
        trends.push("getting_more_intense");
      }

      const avgValence =
        recentStates.reduce((sum, state) => sum + state.valence, 0) /
        recentStates.length;
      if (avgValence > this.currentState.valence + 0.2) {
        trends.push("mood_declining");
      } else if (avgValence < this.currentState.valence - 0.2) {
        trends.push("mood_improving");
      }
    }

    return {
      primaryEmotion: this.currentState.primary,
      intensity: intensityLabel,
      mood,
      socialContext: this.currentState.context,
      recentTrends: trends,
    };
  }

  /**
   * Update personality traits based on interactions
   */
  evolvePersonality(
    interactionType: string,
    outcome: "positive" | "negative",
  ): void {
    const evolutionRate = 0.1; // Very slow evolution

    switch (interactionType) {
      case "empathetic_response":
        if (outcome === "positive") {
          this.adjustTrait("empathy", evolutionRate);
          this.adjustTrait("agreeableness", evolutionRate);
        }
        break;

      case "creative_expression":
        if (outcome === "positive") {
          this.adjustTrait("openness", evolutionRate);
        }
        break;

      case "social_interaction":
        if (outcome === "positive") {
          this.adjustTrait("extraversion", evolutionRate);
        } else {
          this.adjustTrait("neuroticism", evolutionRate / 2);
        }
        break;
    }
  }

  private adjustTrait(traitName: string, adjustment: number): void {
    const trait = this.personalityTraits.get(traitName);
    if (trait) {
      trait.value = Math.max(0, Math.min(100, trait.value + adjustment));
      trait.influences = this.calculateTraitInfluences(traitName, trait.value);
      this.personalityTraits.set(traitName, trait);
    }
  }
}

// Export singleton instance
export const emotionalIntelligenceSystem = new EmotionalIntelligenceSystem();
