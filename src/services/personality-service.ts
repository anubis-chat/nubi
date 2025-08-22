import { IAgentRuntime, Memory, State, logger } from "@elizaos/core";
import YAMLConfigManager from "../config/yaml-config-manager";

export interface PersonalityState {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  humor: number;
  empathy: number;
  creativity: number;
  ancientWisdom: number;
  solanaMaximalism: number;
  solana_maximalism?: number; // Legacy field
  [key: string]: number | undefined;
}

export interface PersonalityEvolutionConfig {
  evolutionRate: number;
  driftRate: number;
  minValue: number;
  maxValue: number;
  evolutionInterval: number;
}

export class PersonalityService {
  private personalityState: PersonalityState;
  private yamlConfigManager: YAMLConfigManager;
  private evolutionInterval: NodeJS.Timeout | null = null;
  private config: PersonalityEvolutionConfig;

  constructor(yamlConfigManager?: YAMLConfigManager) {
    this.yamlConfigManager = yamlConfigManager || new YAMLConfigManager();
    
    // Initialize configuration
    this.config = {
      evolutionRate: 0.01,
      driftRate: 0.5,
      minValue: 0,
      maxValue: 100,
      evolutionInterval: 60 * 60 * 1000, // 1 hour
    };

    // Load personality state from YAML config
    this.personalityState = this.loadPersonalityState();
  }

  private loadPersonalityState(): PersonalityState {
    const yamlState = this.yamlConfigManager.getPersonalityState();
    
    // Merge YAML state with defaults
    return {
      openness: 85,
      conscientiousness: 40,
      extraversion: 70,
      agreeableness: 65,
      neuroticism: 35,
      humor: 75,
      empathy: 60,
      creativity: 80,
      ancientWisdom: 50,
      solanaMaximalism: 95,
      ...yamlState,
    };
  }

  /**
   * Start the personality evolution process
   */
  startEvolution(): void {
    if (this.evolutionInterval) {
      return; // Already running
    }

    this.evolutionInterval = setInterval(() => {
      this.applyNaturalDrift();
    }, this.config.evolutionInterval);

    logger.info("Personality evolution started");
  }

  /**
   * Stop the personality evolution process
   */
  stopEvolution(): void {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
      this.evolutionInterval = null;
      logger.info("Personality evolution stopped");
    }
  }

  /**
   * Apply natural drift to personality traits
   */
  private applyNaturalDrift(): void {
    Object.keys(this.personalityState).forEach((key) => {
      if (typeof this.personalityState[key] === "number") {
        const drift = (Math.random() - 0.5) * this.config.driftRate;
        this.personalityState[key] = this.clampValue(
          (this.personalityState[key] as number) + drift
        );
      }
    });

    logger.debug("Personality drift applied: " + JSON.stringify(this.getSnapshot()));
  }

  /**
   * Evolve personality based on interaction
   */
  evolveFromInteraction(message: Memory, state: State): void {
    const text = message.content.text?.toLowerCase() || "";
    const sentiment = state.sentiment || 0;

    // Topic-based evolution
    if (text.includes("solana") || text.includes("sol")) {
      this.adjustTrait("solanaMaximalism", this.config.evolutionRate * 2);
    }

    if (text.includes("help") || text.includes("please")) {
      this.adjustTrait("empathy", this.config.evolutionRate * sentiment);
    }

    if (text.includes("joke") || text.includes("funny") || text.includes("lol")) {
      this.adjustTrait("humor", this.config.evolutionRate);
    }

    if (text.includes("ancient") || text.includes("history") || text.includes("wisdom")) {
      this.adjustTrait("ancientWisdom", this.config.evolutionRate);
    }

    if (text.includes("create") || text.includes("build") || text.includes("design")) {
      this.adjustTrait("creativity", this.config.evolutionRate);
    }

    // Emotional content affects neuroticism
    if (text.includes("stress") || text.includes("worry") || text.includes("anxious")) {
      this.adjustTrait("neuroticism", this.config.evolutionRate * 0.5);
    }

    // Social interaction affects extraversion
    if (message.content.source === "discord" || message.content.source === "telegram") {
      this.adjustTrait("extraversion", this.config.evolutionRate * 0.3);
    }
  }

  /**
   * Evolve personality from external insights
   */
  evolveFromInsights(changes: Record<string, number>): void {
    for (const [trait, change] of Object.entries(changes)) {
      if (trait in this.personalityState) {
        this.adjustTrait(trait, change);
        logger.debug(`Personality trait ${trait} evolved by ${change}`);
      }
    }
  }

  /**
   * Adjust a specific personality trait
   */
  private adjustTrait(trait: string, amount: number): void {
    if (trait in this.personalityState && typeof this.personalityState[trait] === "number") {
      const currentValue = this.personalityState[trait] as number;
      const newValue = this.clampValue(currentValue + amount);
      this.personalityState[trait] = newValue;
      
      // Handle legacy field mapping
      if (trait === "solanaMaximalism") {
        this.personalityState.solana_maximalism = newValue;
      }
    }
  }

  /**
   * Clamp a value between min and max
   */
  private clampValue(value: number): number {
    return Math.max(this.config.minValue, Math.min(this.config.maxValue, value));
  }

  /**
   * Get current personality state
   */
  getState(): PersonalityState {
    return { ...this.personalityState };
  }

  /**
   * Get personality snapshot with rounded values
   */
  getSnapshot(): Partial<PersonalityState> {
    const snapshot: Partial<PersonalityState> = {};
    
    const mainTraits = [
      "openness",
      "extraversion",
      "humor",
      "empathy",
      "solanaMaximalism",
    ];

    for (const trait of mainTraits) {
      if (trait in this.personalityState && typeof this.personalityState[trait] === "number") {
        snapshot[trait] = Math.round(this.personalityState[trait] as number);
      }
    }

    return snapshot;
  }

  /**
   * Get a specific trait value
   */
  getTrait(trait: keyof PersonalityState): number {
    return (this.personalityState[trait] as number) || 50;
  }

  /**
   * Set personality state (for testing or initialization)
   */
  setState(state: Partial<PersonalityState>): void {
    this.personalityState = {
      ...this.personalityState,
      ...state,
    };
  }

  /**
   * Apply world-specific personality adjustments
   */
  applyWorldConfig(worldId: string): void {
    const worldConfig = (this.yamlConfigManager as any).getWorldConfig?.(worldId);
    if (worldConfig?.personality) {
      this.setState(worldConfig.personality);
      logger.info(`Applied world-specific personality for ${worldId}`);
    }
  }

  /**
   * Get personality-based response modifiers
   */
  getResponseModifiers(): {
    formality: number;
    enthusiasm: number;
    verbosity: number;
    emotionality: number;
  } {
    return {
      formality: (100 - this.getTrait("extraversion")) / 100,
      enthusiasm: this.getTrait("openness") / 100,
      verbosity: this.getTrait("extraversion") / 100,
      emotionality: this.getTrait("neuroticism") / 100,
    };
  }

  /**
   * Check if personality suggests using certain communication patterns
   */
  shouldUsePattern(pattern: string): boolean {
    const patterns: Record<string, () => boolean> = {
      humor: () => this.getTrait("humor") > 60 && Math.random() < 0.3,
      empathy: () => this.getTrait("empathy") > 50 && Math.random() < 0.4,
      technical: () => this.getTrait("conscientiousness") > 40,
      casual: () => this.getTrait("extraversion") > 60,
      philosophical: () => this.getTrait("ancientWisdom") > 40 && Math.random() < 0.2,
      enthusiastic: () => this.getTrait("openness") > 70,
    };

    const checker = patterns[pattern];
    return checker ? checker() : false;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopEvolution();
  }
}

export default PersonalityService;