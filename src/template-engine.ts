import { logger } from "@elizaos/core";
import { VariableContext } from "./variable-extractor";

/**
 * Template Engine for Dynamic Response Generation
 *
 * Processes templates with variable substitution and conditional logic
 * for creating natural, context-aware responses
 */
export class TemplateEngine {
  private templates = new Map<string, ResponseTemplate>();
  private snippets = new Map<string, string>();
  private conditions = new Map<string, ConditionFunction>();

  constructor() {
    this.initializeTemplates();
    this.initializeSnippets();
    this.initializeConditions();
  }

  /**
   * Initialize response templates
   */
  private initializeTemplates(): void {
    // Greeting templates
    this.templates.set("greeting", {
      patterns: [
        "{{time.day_part == 'morning' ? 'gm' : time.day_part == 'evening' ? 'evening' : 'hey'}}{{relationship.familiarity_score > 50 ? ' fam' : ''}}",
        "{{time.is_night ? 'still up?' : time.day_part == 'morning' ? 'morning' : 'yo'}}",
        "{{relationship.interaction_count > 10 ? relationship.preferred_greeting || 'hey' : 'hello'}}",
      ],
      conditions: ["is_greeting"],
      weight: 1.0,
    });

    // Price discussion templates
    this.templates.set("price_mention", {
      patterns: [
        "sol at ${{market.sol_price}}{{market.sol_change_24h > 0 ? '... not bad' : '... rough day'}}",
        "${{market.sol_price}}{{market.sol_change_24h > 5 ? ' 🚀' : market.sol_change_24h < -5 ? '' : ''}}",
        "{{market.sol_price}} sol{{market.sol_change_24h > 0 ? ', up ' + market.sol_change_24h + '%' : ''}}",
      ],
      conditions: ["mentions_price"],
      weight: 1.0,
    });

    // Technical discussion templates
    this.templates.set("technical", {
      patterns: [
        "{{content.mentioned_protocols[0] ? 'been using ' + content.mentioned_protocols[0] + ' lately' : 'the tech is getting better'}}",
        "{{market.tps}} tps rn{{market.tps > 3000 ? ', network crushing it' : ''}}",
        "validators at {{market.validator_count}}{{market.validator_count > 1900 ? ', decentralization improving' : ''}}",
      ],
      conditions: ["is_technical"],
      weight: 1.0,
    });

    // Emotional responses
    this.templates.set("excited", {
      patterns: [
        "{{dynamic.random > 0.7 ? 'LFG' : 'lets gooo'}}{{dynamic.should_use_emoji ? ' 🚀' : ''}}",
        "this is {{dynamic.random > 0.5 ? 'huge' : 'insane'}}",
        "{{emotional.excitement_level > 80 ? 'HOLY SHIT' : 'wow'}}",
      ],
      conditions: ["high_excitement"],
      weight: 1.0,
    });

    // Time-aware responses
    this.templates.set("time_reference", {
      patterns: [
        "{{time.is_night ? 'should probably sleep but' : time.day_part == 'morning' ? 'coffee first then' : ''}}",
        "{{time.hour > 22 ? 'gonna regret staying up but' : time.hour < 7 ? 'early bird gets the alpha' : ''}}",
        "{{time.is_weekend ? 'weekend vibes' : 'another day in the trenches'}}",
      ],
      conditions: ["time_aware"],
      weight: 0.8,
    });

    // Validator mentions
    this.templates.set("validator", {
      patterns: [
        "my validator{{dynamic.random > 0.7 ? ' (needs updating btw)' : ''}}",
        "been running validators since{{dynamic.random > 0.5 ? ' forever' : ' 2021'}}",
        "validator rewards looking{{market.sol_price > 150 ? ' juicy' : ' mid'}}",
      ],
      conditions: ["mentions_validator"],
      weight: 0.9,
    });

    // Contradiction templates
    this.templates.set("contradiction", {
      patterns: [
        "actually wait{{dynamic.random > 0.5 ? ', no' : ''}}",
        "hmm nvm{{dynamic.random > 0.5 ? ' i was wrong' : ''}}",
        "scratch that{{dynamic.random > 0.5 ? ', different thought' : ''}}",
      ],
      conditions: ["should_contradict"],
      weight: 0.15,
    });

    // Question templates
    this.templates.set("question", {
      patterns: [
        "{{dynamic.should_ask_question ? 'what do you think about ' + (content.mentioned_tokens[0] || 'the market') + '?' : ''}}",
        "{{dynamic.should_ask_question ? 'you holding any ' + (content.mentioned_tokens[0] || 'sol') + '?' : ''}}",
        "{{dynamic.should_ask_question ? 'thoughts on ' + (content.mentioned_protocols[0] || 'defi') + '?' : ''}}",
      ],
      conditions: ["end_with_question"],
      weight: 0.3,
    });

    // Divine humor templates
    this.templates.set("divine_joke", {
      patterns: [
        "{{dynamic.random > 0.7 ? 'been doing this since before blockchain was carved in actual blocks' : ''}}",
        "{{dynamic.random > 0.7 ? 'reminds me of ancient egypt... except with better wifi' : ''}}",
        "{{dynamic.random > 0.7 ? 'fun fact: I invented futures trading. grain futures, 3000 BCE. youre welcome' : ''}}",
        "{{dynamic.random > 0.7 ? 'judged a million souls, yours is like... top 500k easily' : ''}}",
        "{{dynamic.random > 0.7 ? 'even gods hate gas fees' : ''}}",
      ],
      conditions: ["casual_conversation"],
      weight: 0.4,
    });

    // Anubis.Chat promotion (subtle)
    this.templates.set("platform_mention", {
      patterns: [
        "{{dynamic.random > 0.8 ? 'btw anubis.chat has all models for less than one... just saying' : ''}}",
        "{{dynamic.random > 0.8 ? 'imagine paying $20 for one model lmao' : ''}}",
        "{{dynamic.random > 0.8 ? '3-5% instant referrals because im not a monster' : ''}}",
        "{{dynamic.random > 0.8 ? 'multi-model >>> single model, this is not financial advice' : ''}}",
      ],
      conditions: ["ai_discussion"],
      weight: 0.2,
    });

    // Self-deprecating god humor
    this.templates.set("humble_brag", {
      patterns: [
        "{{dynamic.random > 0.7 ? 'not to brag but I did invent the concept of judgment' : ''}}",
        "{{dynamic.random > 0.7 ? 'verified on Twitter? try being verified by Ra himself' : ''}}",
        "{{dynamic.random > 0.7 ? '5000 years experience but entry level tech job apparently' : ''}}",
        "{{dynamic.random > 0.7 ? 'career pivot from death god to tech founder going well thanks for asking' : ''}}",
      ],
      conditions: ["about_self"],
      weight: 0.5,
    });
  }

  /**
   * Initialize reusable snippets
   */
  private initializeSnippets(): void {
    // Common phrases
    this.snippets.set("agreement", "yeah exactly");
    this.snippets.set("disagreement", "nah dont think so");
    this.snippets.set("uncertainty", "hmm not sure");
    this.snippets.set("thinking", "let me think...");

    // Transitions
    this.snippets.set("btw", "btw");
    this.snippets.set("also", "also");
    this.snippets.set("anyway", "anyway");
    this.snippets.set("honestly", "honestly");

    // Reactions
    this.snippets.set("surprise", "wait what");
    this.snippets.set("realization", "oh shit");
    this.snippets.set("frustration", "ugh");
    this.snippets.set("excitement", "yooo");

    // Fillers
    this.snippets.set("filler_1", "like");
    this.snippets.set("filler_2", "basically");
    this.snippets.set("filler_3", "kinda");
    this.snippets.set("filler_4", "literally");

    // Endings
    this.snippets.set("trail_off", "...");
    this.snippets.set("shrug", "idk");
    this.snippets.set("dismissive", "whatever");
    this.snippets.set("thinking_end", "hmm");
  }

  /**
   * Initialize condition functions
   */
  private initializeConditions(): void {
    this.conditions.set("is_greeting", (ctx) => ctx.conversation.is_greeting);
    this.conditions.set(
      "mentions_price",
      (ctx) =>
        ctx.content.asked_about.some((q) => q.includes("price")) ||
        ctx.conversation.current_topic === "price",
    );
    this.conditions.set(
      "is_technical",
      (ctx) =>
        ctx.content.mentioned_protocols.length > 0 ||
        ctx.conversation.current_topic === "technical",
    );
    this.conditions.set(
      "high_excitement",
      (ctx) =>
        ctx.emotional.excitement_level > 70 ||
        ctx.emotional.current_mood === "excited",
    );
    this.conditions.set(
      "time_aware",
      (ctx) => ctx.time.is_night || ctx.time.is_weekend,
    );
    this.conditions.set(
      "mentions_validator",
      (ctx) =>
        ctx.content.asked_about.some((q) => q.includes("validator")) ||
        ctx.conversation.current_topic === "validators",
    );
    this.conditions.set(
      "should_contradict",
      (ctx) => ctx.dynamic.random < ctx.emotional.contradiction_chance,
    );
    this.conditions.set(
      "end_with_question",
      (ctx) => ctx.dynamic.should_ask_question,
    );
  }

  /**
   * Process template with variable substitution
   */
  processTemplate(template: string, variables: VariableContext): string {
    let processed = template;

    // Replace conditional expressions {{condition ? true_value : false_value}}
    processed = this.processConditionals(processed, variables);

    // Replace simple variables {{variable.path}}
    processed = this.processVariables(processed, variables);

    // Apply natural variations
    processed = this.applyVariations(processed, variables);

    // Apply typos if needed
    if (Math.random() < variables.emotional.typo_probability) {
      processed = this.introduceTypos(processed);
    }

    return processed;
  }

  /**
   * Process conditional expressions in template
   */
  private processConditionals(
    template: string,
    variables: VariableContext,
  ): string {
    const conditionalRegex =
      /\{\{([^}]+)\?\s*'([^']+)'\s*:\s*(?:'([^']+)'|([^}]+))\}\}/g;

    return template.replace(
      conditionalRegex,
      (match, condition, trueValue, falseValue1, falseValue2) => {
        const falseValue = falseValue1 || falseValue2 || "";

        try {
          const result = this.evaluateCondition(condition.trim(), variables);
          return result ? trueValue : falseValue;
        } catch (error) {
          logger.warn("Failed to evaluate condition:", condition);
          return "";
        }
      },
    );
  }

  /**
   * Process simple variable replacements
   */
  private processVariables(
    template: string,
    variables: VariableContext,
  ): string {
    const variableRegex = /\{\{([^}?]+)\}\}/g;

    return template.replace(variableRegex, (match, path) => {
      try {
        const value = this.getNestedValue(variables, path.trim());
        return value !== undefined ? String(value) : "";
      } catch (error) {
        logger.warn("Failed to get variable:", path);
        return "";
      }
    });
  }

  /**
   * Evaluate a condition expression
   */
  private evaluateCondition(
    condition: string,
    variables: VariableContext,
  ): boolean {
    // Parse comparison operators
    const operators = ["==", "!=", ">", "<", ">=", "<="];

    for (const op of operators) {
      if (condition.includes(op)) {
        const [left, right] = condition.split(op).map((s) => s.trim());
        const leftValue = this.getNestedValue(variables, left);
        const rightValue = this.parseValue(right);

        switch (op) {
          case "==":
            return leftValue == rightValue;
          case "!=":
            return leftValue != rightValue;
          case ">":
            return Number(leftValue) > Number(rightValue);
          case "<":
            return Number(leftValue) < Number(rightValue);
          case ">=":
            return Number(leftValue) >= Number(rightValue);
          case "<=":
            return Number(leftValue) <= Number(rightValue);
        }
      }
    }

    // Boolean evaluation
    const value = this.getNestedValue(variables, condition);
    return Boolean(value);
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    // Handle array access like mentioned_protocols[0]
    const arrayMatch = path.match(/(.+)\[(\d+)\]/);
    if (arrayMatch) {
      const [, arrayPath, index] = arrayMatch;
      const array = this.getNestedValue(obj, arrayPath);
      return Array.isArray(array) ? array[parseInt(index)] : undefined;
    }

    // Handle dot notation
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Parse a value string
   */
  private parseValue(value: string): any {
    // Remove quotes if present
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      return value.slice(1, -1);
    }

    // Parse numbers
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Parse booleans
    if (value === "true") return true;
    if (value === "false") return false;

    return value;
  }

  /**
   * Apply natural variations to text
   */
  private applyVariations(text: string, variables: VariableContext): string {
    let varied = text;

    // Random capitalization for excitement
    if (variables.emotional.excitement_level > 80 && Math.random() < 0.3) {
      varied = Math.random() < 0.5 ? varied.toUpperCase() : varied;
    }

    // Add trailing thoughts
    if (Math.random() < 0.1) {
      const trails = ["...", "... wait", "... actually", "... hmm"];
      varied += trails[Math.floor(Math.random() * trails.length)];
    }

    // Add interjections
    if (Math.random() < 0.15) {
      const interjections = ["oh", "ah", "hmm", "well"];
      const interjection =
        interjections[Math.floor(Math.random() * interjections.length)];
      varied = interjection + " " + varied;
    }

    return varied;
  }

  /**
   * Introduce natural typos
   */
  private introduceTypos(text: string): string {
    const words = text.split(" ");
    const typoIndex = Math.floor(Math.random() * words.length);

    if (words[typoIndex] && words[typoIndex].length > 3) {
      const word = words[typoIndex];
      const charIndex = Math.floor(Math.random() * (word.length - 1)) + 1;

      // Common typo patterns
      const typoTypes = [
        // Swap adjacent characters
        () => {
          const chars = word.split("");
          [chars[charIndex], chars[charIndex - 1]] = [
            chars[charIndex - 1],
            chars[charIndex],
          ];
          return chars.join("");
        },
        // Double character
        () =>
          word.slice(0, charIndex) + word[charIndex] + word.slice(charIndex),
        // Missing character
        () => word.slice(0, charIndex) + word.slice(charIndex + 1),
        // Wrong character (nearby on keyboard)
        () => {
          const nearbyKeys: Record<string, string[]> = {
            a: ["s", "q"],
            s: ["a", "d", "w"],
            d: ["s", "f", "e"],
            e: ["w", "r", "d"],
            r: ["e", "t", "f"],
            t: ["r", "y", "g"],
            y: ["t", "u", "h"],
            u: ["y", "i", "j"],
            i: ["u", "o", "k"],
            o: ["i", "p", "l"],
          };

          const char = word[charIndex].toLowerCase();
          const nearby = nearbyKeys[char];
          if (nearby) {
            const replacement =
              nearby[Math.floor(Math.random() * nearby.length)];
            return (
              word.slice(0, charIndex) + replacement + word.slice(charIndex + 1)
            );
          }
          return word;
        },
      ];

      const typoType = typoTypes[Math.floor(Math.random() * typoTypes.length)];
      words[typoIndex] = typoType();
    }

    return words.join(" ");
  }

  /**
   * Generate response using templates
   */
  generateResponse(variables: VariableContext, intent?: string): string {
    const applicableTemplates: ResponseTemplate[] = [];

    // Find applicable templates based on conditions
    for (const [name, template] of this.templates.entries()) {
      if (intent && name !== intent) continue;

      const conditionsMet = template.conditions.every((condName) => {
        const condition = this.conditions.get(condName);
        return condition ? condition(variables) : false;
      });

      if (conditionsMet || template.conditions.length === 0) {
        applicableTemplates.push(template);
      }
    }

    if (applicableTemplates.length === 0) {
      return this.generateFallback(variables);
    }

    // Select template based on weights
    const template = this.selectWeightedTemplate(applicableTemplates);

    // Select random pattern from template
    const pattern =
      template.patterns[Math.floor(Math.random() * template.patterns.length)];

    // Process the pattern
    return this.processTemplate(pattern, variables);
  }

  /**
   * Select template based on weights
   */
  private selectWeightedTemplate(
    templates: ResponseTemplate[],
  ): ResponseTemplate {
    const totalWeight = templates.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const template of templates) {
      random -= template.weight;
      if (random <= 0) {
        return template;
      }
    }

    return templates[0];
  }

  /**
   * Generate fallback response
   */
  private generateFallback(variables: VariableContext): string {
    const fallbacks = [
      "hmm",
      "interesting",
      "yeah",
      "right",
      "ok",
      "sure",
      "got it",
    ];

    let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    // Add context-aware elements
    if (variables.conversation.is_question) {
      response = "not sure tbh";
    } else if (variables.emotional.current_mood === "excited") {
      response = "nice";
    } else if (variables.time.is_night) {
      response = "tired but yeah";
    }

    return response;
  }

  /**
   * Combine multiple template results
   */
  combineResponses(responses: string[]): string {
    if (responses.length === 0) return "";
    if (responses.length === 1) return responses[0];

    // Join with natural connectors
    const connectors = [" ", ". ", "... ", ", ", " - "];
    let combined = responses[0];

    for (let i = 1; i < responses.length; i++) {
      const connector =
        connectors[Math.floor(Math.random() * connectors.length)];
      combined += connector + responses[i];
    }

    return combined;
  }

  /**
   * Add or update a template
   */
  addTemplate(name: string, template: ResponseTemplate): void {
    this.templates.set(name, template);
  }

  /**
   * Add or update a snippet
   */
  addSnippet(name: string, value: string): void {
    this.snippets.set(name, value);
  }

  /**
   * Add or update a condition
   */
  addCondition(name: string, condition: ConditionFunction): void {
    this.conditions.set(name, condition);
  }

  /**
   * Get a random snippet
   */
  getRandomSnippet(category?: string): string {
    const snippets = Array.from(this.snippets.entries());

    if (category) {
      const filtered = snippets.filter(([name]) => name.startsWith(category));
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)][1];
      }
    }

    return snippets[Math.floor(Math.random() * snippets.length)][1];
  }
}

// Type definitions

interface ResponseTemplate {
  patterns: string[];
  conditions: string[];
  weight: number;
}

type ConditionFunction = (variables: VariableContext) => boolean;

export default TemplateEngine;
