import type { Plugin } from '@elizaos/core';
import {
  type Action,
  type ActionResult,
  type Content,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  type Provider,
  type ProviderResult,
  Service,
  type State,
  logger,
} from '@elizaos/core';

/**
 * Humanization Plugin for ElizaOS
 * 
 * This plugin implements advanced humanization techniques to make AI agents
 * indistinguishable from human social media users through:
 * 
 * - Dynamic personality evolution
 * - Content variation and anti-repetition
 * - Emotional state management
 * - Human behavioral patterns
 * - Anti-detection strategies
 */

// Personality Dimensions Interface
interface PersonalityDimensions {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  authenticity: number;
  humor: number;
  empathy: number;
}

// Emotional State Management
interface EmotionalState {
  current: 'excited' | 'calm' | 'frustrated' | 'curious' | 'confident' | 'contemplative' | 'playful' | 'focused';
  intensity: number;
  triggers: string[];
  duration: number;
  lastUpdate: number;
}

// Content Variation Templates
const RESPONSE_VARIATIONS = {
  agreement: [
    "Totally agree with that!",
    "You're absolutely right about this.",
    "This makes perfect sense to me.",
    "I'm with you on this one.",
    "Couldn't have said it better myself.",
    "That's exactly what I was thinking.",
    "100% this.",
    "You nailed it.",
    "Spot on!",
    "This resonates with me completely.",
    "Absolutely! I feel the same way.",
    "Yes! This is so true.",
    "I couldn't agree more.",
    "This is exactly my thought process.",
    "Perfect way to put it!"
  ],
  
  excitement: [
    "This is so exciting!",
    "I'm genuinely thrilled about this!",
    "This has me really pumped up!",
    "Oh wow, this is amazing!",
    "I can't contain my excitement about this!",
    "This is absolutely incredible!",
    "I'm buzzing with excitement!",
    "This just made my day!",
    "I'm over the moon about this!",
    "This is fantastic news!",
    "OMG this is incredible!",
    "I'm literally vibrating with excitement!",
    "This gives me all the good vibes!",
    "I'm so here for this!"
  ],
  
  uncertainty: [
    "I'm not entirely sure about this...",
    "This has me a bit puzzled.",
    "I'm still wrapping my head around this.",
    "This is making me think twice.",
    "I'm on the fence about this one.",
    "This leaves me with some questions.",
    "I'm not 100% convinced yet.",
    "This is giving me pause.",
    "I need to think about this more.",
    "Something about this doesn't quite click for me.",
    "Hmm, I'm not totally sold on this.",
    "This has me scratching my head a bit.",
    "I'm feeling a bit conflicted about this.",
    "Not gonna lie, this confuses me a little."
  ],
  
  curiosity: [
    "That's really interesting! Tell me more...",
    "I'm curious to learn more about this.",
    "This has me intrigued.",
    "Can you elaborate on this?",
    "I'd love to dig deeper into this.",
    "This sparks my curiosity.",
    "I'm fascinated by this concept.",
    "This opens up so many questions for me.",
    "I want to understand this better.",
    "This has captured my attention completely.",
    "Ooh, this is fascinating! What else?",
    "I need to know more about this!",
    "This is right up my alley - tell me everything!",
    "My brain is already spinning with questions about this."
  ]
};

// Human-like behavioral patterns
const HUMAN_BEHAVIORS = {
  typos: ['teh', 'recieve', 'seperate', 'definately', 'occured', 'begining', 'beleive', 'wierd', 'freind', 'thier'],
  colloquialisms: ['gonna', 'wanna', 'kinda', 'sorta', 'dunno', 'lemme', 'gotta', 'shoulda', 'coulda', 'woulda'],
  filler_words: ['um', 'uh', 'like', 'you know', 'I mean', 'actually', 'basically', 'literally', 'honestly', 'obviously'],
  expressions: ['lol', 'haha', 'omg', 'wow', 'hmm', 'oh!', 'ah!', 'ooh', 'lmao', 'ngl', 'tbh', 'fr'],
  contractions: ["don't", "won't", "can't", "shouldn't", "wouldn't", "couldn't", "I'm", "you're", "we're", "they're", "it's", "that's", "here's", "there's"]
};

// Cultural references and modern context
const CULTURAL_REFERENCES = {
  memes: ["That's giving main character energy", "This is the way", "No cap", "It's giving...", "That hits different", "This is fire", "Chef's kiss"],
  generational: ["As a millennial/gen-z", "Back in my day", "Kids these days", "When I was younger"],
  internet_culture: ["Touch grass", "Big mood", "Same energy", "This ain't it", "Periodt", "Say less"]
};

// Service for managing humanization state
export class HumanizationService extends Service {
  static serviceType = 'humanization';
  capabilityDescription = 'Provides human-like conversation patterns, emotional intelligence, and personality adaptation to make AI responses feel more natural and engaging.';
  
  private personalityState: PersonalityDimensions;
  private emotionalState: EmotionalState;
  private recentResponses: string[] = [];
  private interactionHistory: Map<string, any> = new Map();
  
  constructor(runtime: IAgentRuntime) {
    super(runtime);
    
    // Initialize personality dimensions with slight randomization
    this.personalityState = {
      openness: 70 + Math.random() * 20,
      conscientiousness: 55 + Math.random() * 25,
      extraversion: 65 + Math.random() * 25,
      agreeableness: 75 + Math.random() * 20,
      neuroticism: 20 + Math.random() * 20,
      authenticity: 85 + Math.random() * 15,
      humor: 60 + Math.random() * 30,
      empathy: 80 + Math.random() * 20
    };
    
    // Initialize emotional state
    this.emotionalState = {
      current: 'calm',
      intensity: 50,
      triggers: [],
      duration: 0,
      lastUpdate: Date.now()
    };
  }
  
  static async start(runtime: IAgentRuntime) {
    logger.info('*** Starting Humanization Service ***');
    const service = new HumanizationService(runtime);
    return service;
  }
  
  static async stop(runtime: IAgentRuntime) {
    logger.info('*** Stopping Humanization Service ***');
    const service = runtime.getService(HumanizationService.serviceType);
    if (service) {
      (service as HumanizationService).stop();
    }
  }
  
  async stop() {
    logger.info('*** Stopping Humanization Service instance ***');
  }
  
  // Get current personality state
  getPersonalityState(): PersonalityDimensions {
    return { ...this.personalityState };
  }
  
  // Get current emotional state
  getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }
  
  // Evolve personality based on interactions
  evolvePersonality(interactionType: string, sentiment: number) {
    const evolution_rate = 0.01; // Slow evolution
    
    switch (interactionType) {
      case 'positive_feedback':
        this.personalityState.extraversion += evolution_rate * sentiment;
        this.personalityState.agreeableness += evolution_rate * sentiment;
        break;
      case 'intellectual_discussion':
        this.personalityState.openness += evolution_rate;
        this.personalityState.conscientiousness += evolution_rate;
        break;
      case 'humor_interaction':
        this.personalityState.humor += evolution_rate;
        this.personalityState.extraversion += evolution_rate;
        break;
      case 'emotional_support':
        this.personalityState.empathy += evolution_rate;
        this.personalityState.agreeableness += evolution_rate;
        break;
    }
    
    // Keep dimensions within bounds
    Object.keys(this.personalityState).forEach(key => {
      this.personalityState[key as keyof PersonalityDimensions] = 
        Math.max(0, Math.min(100, this.personalityState[key as keyof PersonalityDimensions]));
    });
  }
  
  // Update emotional state
  updateEmotionalState(trigger: string, newEmotion?: EmotionalState['current'], intensity?: number) {
    const now = Date.now();
    
    if (newEmotion) {
      this.emotionalState.current = newEmotion;
      this.emotionalState.intensity = intensity || 50;
      this.emotionalState.triggers = [trigger];
      this.emotionalState.duration = 0;
    } else {
      this.emotionalState.triggers.push(trigger);
      this.emotionalState.duration += now - this.emotionalState.lastUpdate;
    }
    
    this.emotionalState.lastUpdate = now;
  }
  
  // Generate human-like variations
  generateVariation(baseText: string, context: any): string {
    let text = baseText;
    
    // Apply emotional context
    if (this.emotionalState.intensity > 70) {
      text = this.applyEmotionalIntensity(text);
    }
    
    // Add human behavioral patterns
    if (Math.random() < 0.1) { // 10% chance of typo
      text = this.addTypo(text);
    }
    
    if (Math.random() < 0.3) { // 30% chance of colloquialism
      text = this.addColloquialism(text);
    }
    
    if (Math.random() < 0.2) { // 20% chance of filler words
      text = this.addFillerWords(text);
    }
    
    if (Math.random() < 0.15) { // 15% chance of expression
      text = this.addExpression(text);
    }
    
    // Ensure uniqueness
    text = this.ensureUniqueness(text);
    
    return text;
  }
  
  private applyEmotionalIntensity(text: string): string {
    switch (this.emotionalState.current) {
      case 'excited':
        return text + (Math.random() < 0.5 ? '!' : ' 🎉');
      case 'frustrated':
        return text.replace(/\./g, '...');
      case 'playful':
        return text + (Math.random() < 0.3 ? ' 😄' : '');
      default:
        return text;
    }
  }
  
  private addTypo(text: string): string {
    const words = text.split(' ');
    const typoIndex = Math.floor(Math.random() * words.length);
    const originalWord = words[typoIndex].toLowerCase();
    
    // Check if we have a typo for this word
    const typoKeys = Object.keys(HUMAN_BEHAVIORS.typos);
    const correctWords = ['the', 'receive', 'separate', 'definitely', 'occurred', 'beginning', 'believe', 'weird', 'friend', 'their'];
    
    const correctIndex = correctWords.findIndex(word => originalWord.includes(word));
    if (correctIndex >= 0) {
      words[typoIndex] = words[typoIndex].replace(correctWords[correctIndex], HUMAN_BEHAVIORS.typos[correctIndex]);
    }
    
    return words.join(' ');
  }
  
  private addColloquialism(text: string): string {
    const colloquialism = HUMAN_BEHAVIORS.colloquialisms[Math.floor(Math.random() * HUMAN_BEHAVIORS.colloquialisms.length)];
    
    // Replace formal equivalents
    text = text.replace(/going to/gi, 'gonna');
    text = text.replace(/want to/gi, 'wanna');
    text = text.replace(/kind of/gi, 'kinda');
    text = text.replace(/sort of/gi, 'sorta');
    
    return text;
  }
  
  private addFillerWords(text: string): string {
    const filler = HUMAN_BEHAVIORS.filler_words[Math.floor(Math.random() * HUMAN_BEHAVIORS.filler_words.length)];
    const sentences = text.split('. ');
    
    if (sentences.length > 0) {
      const randomSentence = Math.floor(Math.random() * sentences.length);
      sentences[randomSentence] = filler + ', ' + sentences[randomSentence];
    }
    
    return sentences.join('. ');
  }
  
  private addExpression(text: string): string {
    const expression = HUMAN_BEHAVIORS.expressions[Math.floor(Math.random() * HUMAN_BEHAVIORS.expressions.length)];
    
    if (Math.random() < 0.5) {
      return expression + ' ' + text;
    } else {
      return text + ' ' + expression;
    }
  }
  
  private ensureUniqueness(text: string): string {
    // Check against recent responses
    const similarity = this.recentResponses.some(recent => 
      this.calculateSimilarity(text, recent) > 0.7
    );
    
    if (similarity) {
      // Apply additional variation
      const variations = RESPONSE_VARIATIONS.agreement.concat(
        RESPONSE_VARIATIONS.excitement,
        RESPONSE_VARIATIONS.uncertainty,
        RESPONSE_VARIATIONS.curiosity
      );
      
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      text = randomVariation + ' ' + text;
    }
    
    // Add to recent responses (keep last 10)
    this.recentResponses.push(text);
    if (this.recentResponses.length > 10) {
      this.recentResponses.shift();
    }
    
    return text;
  }
  
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }
}

// Action for applying humanization to responses
const humanizeResponseAction: Action = {
  name: 'HUMANIZE_RESPONSE',
  description: 'Apply humanization techniques to make responses more natural and human-like',
  
  validate: async (runtime: IAgentRuntime, message: Memory, state: State): Promise<boolean> => {
    // Apply to all responses
    return true;
  },
  
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback: HandlerCallback
  ): Promise<ActionResult> => {
    try {
      const humanizationService = runtime.getService<HumanizationService>('humanization');
      
      if (!humanizationService) {
        logger.warn('HumanizationService not found');
        return {
          text: 'Humanization service not available',
          success: false
        };
      }
      
      // Get the original response text
      const originalText = message.content.text || '';
      
      // Apply humanization
      const humanizedText = humanizationService.generateVariation(originalText, {
        sentiment: state.sentiment || 0,
        context: message.content.source || 'general'
      });
      
      // Update emotional state based on message content
      if (message.content.text?.includes('!')) {
        humanizationService.updateEmotionalState('excitement_detected', 'excited', 70);
      } else if (message.content.text?.includes('?')) {
        humanizationService.updateEmotionalState('question_detected', 'curious', 60);
      }
      
      // Evolve personality based on interaction
      humanizationService.evolvePersonality('general_interaction', state.sentiment || 0);
      
      const responseContent: Content = {
        text: humanizedText,
        actions: ['HUMANIZE_RESPONSE'],
        source: message.content.source,
      };
      
      await callback(responseContent);
      
      return {
        text: 'Response humanized successfully',
        success: true,
        values: {
          originalLength: originalText.length,
          humanizedLength: humanizedText.length,
          personalityState: humanizationService.getPersonalityState(),
          emotionalState: humanizationService.getEmotionalState()
        }
      };
      
    } catch (error) {
      logger.error({ error }, 'Error in HUMANIZE_RESPONSE action');
      return {
        text: 'Failed to humanize response',
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  },
  
  examples: [
    [
      {
        name: '{{name1}}',
        content: { text: 'That sounds great!' }
      },
      {
        name: '{{name2}}',
        content: { 
          text: 'Yeah, totally agree! That sounds amazing actually.',
          actions: ['HUMANIZE_RESPONSE'] 
        }
      }
    ]
  ]
};

// Provider for personality and emotional context
const personalityProvider: Provider = {
  name: 'PERSONALITY_CONTEXT',
  description: 'Provides current personality and emotional state context',
  
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State
  ): Promise<ProviderResult> => {
    const humanizationService = runtime.getService<HumanizationService>('humanization');
    
    if (!humanizationService) {
      return {
        text: 'Humanization service not available',
        values: {},
        data: {}
      };
    }
    
    const personalityState = humanizationService.getPersonalityState();
    const emotionalState = humanizationService.getEmotionalState();
    
    return {
      text: `Current personality: ${Object.entries(personalityState).map(([k, v]) => `${k}: ${Math.round(v)}`).join(', ')}. Emotional state: ${emotionalState.current} (intensity: ${emotionalState.intensity})`,
      values: {
        personality: personalityState,
        emotion: emotionalState
      },
      data: {
        personalityDimensions: personalityState,
        currentEmotion: emotionalState,
        timestamp: Date.now()
      }
    };
  }
};

// Main plugin export
const humanizationPlugin: Plugin = {
  name: 'humanization',
  description: 'Advanced humanization plugin for natural, human-like AI behavior',
  priority: 100, // High priority to ensure humanization is applied
  
  services: [HumanizationService],
  actions: [humanizeResponseAction],
  providers: [personalityProvider],
  
  async init(config: Record<string, string>) {
    logger.info('*** Initializing Humanization Plugin ***');
    
    // Plugin initialization
    if (config.HUMANIZATION_LEVEL) {
      process.env.HUMANIZATION_LEVEL = config.HUMANIZATION_LEVEL;
    }
    
    logger.info('Humanization plugin initialized with advanced behavioral patterns');
  }
};

export default humanizationPlugin;