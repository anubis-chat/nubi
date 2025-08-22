import { IAgentRuntime, Memory, State, Content, logger } from "@elizaos/core";
import { PersonalityService } from "./personality-service";
import { EmotionalService } from "./emotional-service";
import { AntiDetectionService, ConversationContext } from "./anti-detection-service";
import { TemplateEngine } from "../template-engine";
import { VariableContext } from "../variable-extractor";

export interface ResponseGenerationConfig {
  enableTemplates: boolean;
  templateUsageRate: number;
  doubleMessageRate: number;
  maxResponseLength: number;
  minResponseLength: number;
}

export interface ProcessedResponse {
  text: string;
  metadata: {
    emotionalState?: string;
    personalityDimensions?: any;
    appliedPatterns: string[];
    responseDelay: number;
    isDoubleMessage?: boolean;
    templateUsed?: boolean;
    [key: string]: any;
  };
}

export class ResponseGenerationService {
  private config: ResponseGenerationConfig;
  private templateEngine: TemplateEngine;

  constructor(
    private runtime: IAgentRuntime,
    private personalityService: PersonalityService,
    private emotionalService: EmotionalService,
    private antiDetectionService: AntiDetectionService,
    config?: Partial<ResponseGenerationConfig>
  ) {
    this.config = {
      enableTemplates: true,
      templateUsageRate: 0.3,
      doubleMessageRate: 0.05,
      maxResponseLength: 500,
      minResponseLength: 10,
      ...config,
    };

    this.templateEngine = new TemplateEngine();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Initialize common templates
    this.templateEngine.addTemplate("greeting", {
      patterns: [
        "{{#if time.isMorning}}morning {{user.name}}{{else if time.isEvening}}evening{{else}}hey{{/if}}",
        "{{#if relationship.friend}}hey friend{{else}}hello{{/if}}",
      ],
      conditions: [],
      weight: 1.0,
    });

    this.templateEngine.addTemplate("marketReaction", {
      patterns: [
        "{{#if market.volatile}}markets are insane today{{else}}pretty chill day in the markets{{/if}}",
        "{{#if market.bullish}}feeling bullish{{else if market.bearish}}rough times{{/if}}",
      ],
      conditions: [],
      weight: 1.0,
    });

    this.templateEngine.addTemplate("contextual", {
      patterns: [
        "{{#if time.isNight}}getting late here{{/if}}",
        "{{#if relationship.interactions > 5}}we've talked about this before{{/if}}",
        "{{#if emotional.frustrated}}still annoyed about {{emotional.triggers.[0]}}{{/if}}",
      ],
      conditions: [],
      weight: 1.0,
    });
  }

  /**
   * Generate a response based on context
   */
  async generateResponse(
    message: Memory,
    state: State,
    context: ConversationContext,
    variables?: VariableContext
  ): Promise<ProcessedResponse> {
    try {
      // Generate base response
      let response = await this.generateBaseResponse(message, state);

      // Apply personality modifiers
      response = this.applyPersonalityModifiers(response);

      // Apply emotional state
      response = this.applyEmotionalState(response);

      // Apply templates if enabled
      if (this.config.enableTemplates && variables && Math.random() < this.config.templateUsageRate) {
        response = this.applyTemplates(response, variables);
      }

      // Apply anti-detection patterns
      response = this.antiDetectionService.applyCountermeasures(response, context);

      // Apply humanization
      response = this.antiDetectionService.humanizeResponse(
        response,
        this.emotionalService.getIntensity()
      );

      // Check for double message opportunity
      const isDoubleMessage = this.antiDetectionService.shouldUseDoubleMessage();
      if (isDoubleMessage) {
        response = this.createDoubleMessage(response);
      }

      // Calculate response delay
      const responseDelay = this.antiDetectionService.calculateResponseDelay(
        context.messageCount
      );

      return {
        text: response,
        metadata: {
          emotionalState: this.emotionalService.getCurrentEmotion(),
          personalityDimensions: this.personalityService.getSnapshot(),
          appliedPatterns: context.appliedPatterns,
          responseDelay,
          isDoubleMessage,
          templateUsed: variables && Math.random() < this.config.templateUsageRate,
        },
      };
    } catch (error) {
      logger.error("Response generation failed:", error);
      return this.generateFallbackResponse(context);
    }
  }

  /**
   * Generate base response using the runtime model
   */
  private async generateBaseResponse(message: Memory, state: State): Promise<string> {
    try {
      const prompt = this.buildPrompt(message, state);
      
      const result = await this.runtime.useModel("text-generation", {
        prompt,
        temperature: 0.8,
        maxTokens: this.config.maxResponseLength,
        frequencyPenalty: 0.6,
        presencePenalty: 0.6,
        stop: ["\n\n", "---", "Human:", "Assistant:"],
      });

      return result.text || this.emotionalService.getFallbackResponse();
    } catch (error) {
      logger.warn("Model generation failed, using fallback:", error);
      return this.emotionalService.getFallbackResponse();
    }
  }

  /**
   * Build prompt for model generation
   */
  private buildPrompt(message: Memory, state: State): string {
    const personalityModifiers = this.personalityService.getResponseModifiers();
    const emotionalContext = this.emotionalService.getEmotionalContext();
    
    let prompt = `You are responding to: "${message.content.text}"
    
Personality traits:
- Formality: ${personalityModifiers.formality}
- Enthusiasm: ${personalityModifiers.enthusiasm}
- Verbosity: ${personalityModifiers.verbosity}
- Current emotion: ${this.emotionalService.getCurrentEmotion()}
`;

    if (emotionalContext.shouldBeEmotional) {
      prompt += `\nShow ${this.emotionalService.getCurrentEmotion()} emotion in your response.`;
    }

    if (state.sentiment) {
      prompt += `\nUser sentiment: ${state.sentiment > 0 ? "positive" : "negative"}`;
    }

    prompt += "\n\nResponse:";
    
    return prompt;
  }

  /**
   * Apply personality-based modifications
   */
  private applyPersonalityModifiers(text: string): string {
    const modifiers = this.personalityService.getResponseModifiers();
    
    // Apply formality adjustments
    if (modifiers.formality < 0.3) {
      text = text.toLowerCase();
    }

    // Apply enthusiasm
    if (modifiers.enthusiasm > 0.7 && this.personalityService.shouldUsePattern("enthusiastic")) {
      text = text + "!";
    }

    // Apply humor
    if (this.personalityService.shouldUsePattern("humor")) {
      const humorMarkers = [" lol", " haha", " 😄"];
      text += humorMarkers[Math.floor(Math.random() * humorMarkers.length)];
    }

    // Apply philosophical tendency
    if (this.personalityService.shouldUsePattern("philosophical")) {
      const philosophicalPrefixes = ["you know, ", "when you think about it, ", "interestingly, "];
      text = philosophicalPrefixes[Math.floor(Math.random() * philosophicalPrefixes.length)] + text;
    }

    return text;
  }

  /**
   * Apply emotional state to response
   */
  private applyEmotionalState(text: string): string {
    const emotionalContext = this.emotionalService.getEmotionalContext();
    
    if (emotionalContext.shouldBeEmotional) {
      // Apply emotional intensity
      text = this.emotionalService.applyEmotionalIntensity(text);
      
      // Add emotional marker
      if (emotionalContext.emotionalMarker) {
        const position = Math.random();
        if (position < 0.3) {
          text = `${emotionalContext.emotionalMarker} ${text}`;
        } else if (position < 0.7) {
          text = `${text} ${emotionalContext.emotionalMarker}`;
        }
      }
    }

    return text;
  }

  /**
   * Apply template processing
   */
  private applyTemplates(text: string, variables: VariableContext): string {
    const templates = [
      "{{#if time.isNight}}getting late here{{/if}}",
      "{{#if market.volatile}}crazy day in the markets{{/if}}",
      "{{#if relationship.interactions > 5}}we've talked about this before{{/if}}",
    ];

    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    const templateResult = this.templateEngine.processTemplate(selectedTemplate, variables);

    if (templateResult && templateResult.trim()) {
      // Insert template result naturally
      const insertPoint = Math.random();
      if (insertPoint < 0.3) {
        text = `${templateResult}... ${text}`;
      } else if (insertPoint < 0.7) {
        text = `${text} (${templateResult})`;
      } else {
        text = `${text}\n\n${templateResult}`;
      }
    }

    return text;
  }

  /**
   * Create double message format
   */
  private createDoubleMessage(text: string): string {
    const splitPoint = Math.floor(text.length * 0.7);
    const firstPart = text.substring(0, splitPoint);
    const secondPart = text.substring(splitPoint);
    return `${firstPart}||DOUBLE||${secondPart}`;
  }

  /**
   * Generate fallback response
   */
  private generateFallbackResponse(context: ConversationContext): ProcessedResponse {
    const fallbackText = this.emotionalService.getFallbackResponse();
    
    return {
      text: fallbackText,
      metadata: {
        emotionalState: this.emotionalService.getCurrentEmotion(),
        personalityDimensions: this.personalityService.getSnapshot(),
        appliedPatterns: [],
        responseDelay: 1000,
        isFallback: true,
      },
    };
  }

  /**
   * Generate error response
   */
  generateErrorResponse(error: string): ProcessedResponse {
    return {
      text: this.emotionalService.getFallbackResponse(),
      metadata: {
        error: true,
        errorMessage: error,
        emotionalState: "calm",
        personalityDimensions: this.personalityService.getSnapshot(),
        appliedPatterns: [],
        responseDelay: 1000,
      },
    };
  }

  /**
   * Process a raw response through all enhancement layers
   */
  async processRawResponse(
    response: string,
    context: ConversationContext,
    variables?: VariableContext
  ): Promise<string> {
    // Apply personality
    response = this.applyPersonalityModifiers(response);
    
    // Apply emotional state
    response = this.applyEmotionalState(response);
    
    // Apply templates
    if (this.config.enableTemplates && variables) {
      response = this.applyTemplates(response, variables);
    }
    
    // Apply anti-detection
    response = this.antiDetectionService.applyCountermeasures(response, context);
    
    // Apply humanization
    response = this.antiDetectionService.humanizeResponse(
      response,
      this.emotionalService.getIntensity()
    );
    
    return response;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ResponseGenerationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get response history
   */
  getResponseHistory(): string[] {
    return this.antiDetectionService.getResponseHistory();
  }
}

export default ResponseGenerationService;