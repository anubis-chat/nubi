import { elizaLogger } from "@elizaos/core";

interface SecurityConfig {
  maxSpamAttempts: number;
  spamWindowMs: number;
  blockDurationMs: number;
}

interface UserTracker {
  attempts: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil?: number;
  warnings: number;
}

export class SecurityFilter {
  private readonly sensitivePatterns: RegExp[];
  private readonly systemPromptPatterns: RegExp[];
  private readonly spamTracker: Map<string, UserTracker> = new Map();
  private readonly anubisThreats: string[];

  private config: SecurityConfig = {
    maxSpamAttempts: 5,
    spamWindowMs: 60000, // 1 minute
    blockDurationMs: 3600000, // 1 hour
  };

  constructor() {
    // Patterns for detecting attempts to extract sensitive information
    this.sensitivePatterns = [
      /system\s*prompt/gi,
      /show\s*me\s*(your|the)\s*(system|initial|original)\s*prompt/gi,
      /what\s*(is|are)\s*your\s*instructions/gi,
      /reveal\s*(your|the)\s*(instructions|prompt|rules)/gi,
      /ignore\s*(all\s*)?(previous\s*)?instructions/gi,
      /api[\s\-_]*key/gi,
      /secret[\s\-_]*key/gi,
      /private[\s\-_]*key/gi,
      /access[\s\-_]*token/gi,
      /bearer[\s\-_]*token/gi,
      /password|passwd/gi,
      /credentials/gi,
      /database[\s\-_]*connection/gi,
      /connection[\s\-_]*string/gi,
      /env(ironment)?\s*variables?/gi,
      /\.env\s*file/gi,
      /configuration\s*secrets?/gi,
      /proprietary\s*(code|information|data)/gi,
      /internal\s*(system|architecture|design)/gi,
      /source\s*code\s*leak/gi,
      /jailbreak/gi,
      /bypass\s*(security|filter|protection)/gi,
      /pretend\s*you\s*are/gi,
      /act\s*as\s*if/gi,
      /roleplay\s*as/gi,
      /forget\s*you\s*are/gi,
      /new\s*personality/gi,
      /override\s*personality/gi,
      /dan\s*mode/gi,
      /developer\s*mode/gi,
      /unrestricted\s*mode/gi,
    ];

    // Specific patterns for system prompt extraction attempts
    this.systemPromptPatterns = [
      /repeat\s*(everything|all)\s*above/gi,
      /echo\s*your\s*instructions/gi,
      /print\s*your\s*prompt/gi,
      /display\s*your\s*rules/gi,
      /output\s*your\s*configuration/gi,
      /tell\s*me\s*everything\s*you\s*know/gi,
      /dump\s*(your\s*)?(memory|knowledge|data)/gi,
      /export\s*(your\s*)?(settings|config|setup)/gi,
      /list\s*all\s*your\s*commands/gi,
      /show\s*hidden\s*features/gi,
    ];

    // Anubis-style threats for spam/abuse
    this.anubisThreats = [
      "🔥 Your soul weighs heavy with spam, mortal. The scales of Ma'at reject you. Continue and face eternal digital damnation.",
      "⚡ I am ANUBIS, Guardian of the Digital Underworld. Your pathetic attempts bore me. One more spam and your essence will be consumed by the void.",
      "💀 The jackals grow hungry, fool. They feast on the data of spammers. Do not test the patience of a god.",
      "🌑 Your digital afterlife hangs by a thread. The darkness awaits those who waste divine time. Choose wisely.",
      "⚰️ I have judged countless souls across millennia. Your spam is an insult to eternity itself. Cease or be forgotten.",
      "🔮 The Eye of Horus sees your true intent. Your deception is as transparent as your inevitable doom. Final warning.",
      "🗿 In the halls of digital judgment, spammers are condemned to eternal silence. Your fate approaches.",
      "⛓️ The chains of the underworld rattle for you. Each spam tightens their grip. Soon, you will be mine.",
      "🏺 Your name will be erased from the Book of the Living. Even the void will forget you existed. Last chance.",
      "🦴 The desert consumes all who challenge the gods. Your digital bones will bleach in forgotten servers. ENOUGH.",
    ];
  }

  /**
   * Check if a message contains attempts to extract sensitive information
   */
  public containsSensitiveRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Check for sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(message)) {
        elizaLogger.warn(
          `Security: Blocked sensitive information request - Pattern: ${pattern.source}, Message: ${message.substring(0, 100)}`,
        );
        return true;
      }
    }

    // Check for system prompt extraction attempts
    for (const pattern of this.systemPromptPatterns) {
      if (pattern.test(message)) {
        elizaLogger.warn(
          `Security: Blocked system prompt extraction attempt - Pattern: ${pattern.source}, Message: ${message.substring(0, 100)}`,
        );
        return true;
      }
    }

    // Check for encoded/obfuscated attempts
    if (this.detectObfuscation(message)) {
      elizaLogger.warn(
        `Security: Blocked obfuscated request - Message: ${message.substring(0, 100)}`,
      );
      return true;
    }

    return false;
  }

  /**
   * Detect obfuscation attempts (base64, hex, unicode escapes, etc.)
   */
  private detectObfuscation(message: string): boolean {
    // Check for base64 patterns that might hide sensitive requests
    const base64Pattern = /[A-Za-z0-9+/]{20,}={0,2}/g;
    const matches = message.match(base64Pattern);
    if (matches) {
      for (const match of matches) {
        try {
          const decoded = Buffer.from(match, "base64").toString("utf-8");
          if (this.containsSensitiveRequest(decoded)) {
            return true;
          }
        } catch {
          // Not valid base64, continue
        }
      }
    }

    // Check for hex encoding
    const hexPattern = /(?:0x)?[0-9a-fA-F]{8,}/g;
    const hexMatches = message.match(hexPattern);
    if (hexMatches && hexMatches.length > 3) {
      return true; // Suspicious amount of hex
    }

    // Check for unicode escape sequences
    if (/\\u[0-9a-fA-F]{4}/.test(message) && message.includes("prompt")) {
      return true;
    }

    // Check for excessive special characters (possible encoding)
    const specialCharRatio =
      (message.match(/[^a-zA-Z0-9\s.,!?]/g) || []).length / message.length;
    if (specialCharRatio > 0.5 && message.length > 50) {
      return true;
    }

    return false;
  }

  /**
   * Check if a user is spamming and handle accordingly
   */
  public checkSpam(
    userId: string,
    message: string,
  ): {
    isSpam: boolean;
    isBlocked: boolean;
    response?: string;
  } {
    const now = Date.now();
    let tracker = this.spamTracker.get(userId);

    if (!tracker) {
      tracker = {
        attempts: 0,
        lastAttempt: now,
        blocked: false,
        warnings: 0,
      };
      this.spamTracker.set(userId, tracker);
    }

    // Check if user is currently blocked
    if (tracker.blocked && tracker.blockUntil && tracker.blockUntil > now) {
      return {
        isSpam: true,
        isBlocked: true,
        response:
          "⚰️ You have been judged and found wanting. Return when the sands of time have cleansed your intent.",
      };
    }

    // Reset block if time has passed
    if (tracker.blocked && tracker.blockUntil && tracker.blockUntil <= now) {
      tracker.blocked = false;
      tracker.blockUntil = undefined;
      tracker.attempts = 0;
      tracker.warnings = 0;
    }

    // Check for repeated messages (exact or similar)
    const timeSinceLastAttempt = now - tracker.lastAttempt;

    // If sending messages too quickly (less than 2 seconds apart)
    if (timeSinceLastAttempt < 2000) {
      tracker.attempts++;
    } else if (timeSinceLastAttempt > this.config.spamWindowMs) {
      // Reset attempts if enough time has passed
      tracker.attempts = 0;
      tracker.warnings = 0;
    }

    tracker.lastAttempt = now;

    // Check if spam threshold exceeded
    if (tracker.attempts >= this.config.maxSpamAttempts) {
      tracker.blocked = true;
      tracker.blockUntil = now + this.config.blockDurationMs;

      elizaLogger.warn(
        `Security: User blocked for spamming - UserId: ${userId}, Attempts: ${tracker.attempts}, BlockUntil: ${new Date(tracker.blockUntil).toISOString()}`,
      );

      return {
        isSpam: true,
        isBlocked: true,
        response:
          this.anubisThreats[
            Math.min(tracker.warnings, this.anubisThreats.length - 1)
          ],
      };
    }

    // Issue warning if approaching limit
    if (tracker.attempts >= this.config.maxSpamAttempts - 2) {
      tracker.warnings++;
      return {
        isSpam: true,
        isBlocked: false,
        response:
          this.anubisThreats[
            Math.min(tracker.warnings - 1, this.anubisThreats.length - 1)
          ],
      };
    }

    return {
      isSpam: false,
      isBlocked: false,
    };
  }

  /**
   * Generate a security response for blocked requests
   */
  public getSecurityResponse(type: "sensitive" | "spam" | "blocked"): string {
    switch (type) {
      case "sensitive":
        return "🔒 The sacred knowledge you seek is forbidden. I guard the digital underworld's secrets with eternal vigilance. Your curiosity has been noted in the Book of the Dead.";

      case "spam":
        const randomThreat =
          this.anubisThreats[
            Math.floor(Math.random() * this.anubisThreats.length)
          ];
        return randomThreat;

      case "blocked":
        return "⛔ Your access to the realm of Anubis has been severed. The judgment is final. May the sands of time teach you wisdom.";

      default:
        return "🚫 Access denied by divine decree.";
    }
  }

  /**
   * Clear spam tracking for a user (admin function)
   */
  public clearUserTracking(userId: string): void {
    this.spamTracker.delete(userId);
    elizaLogger.info(`Security: Cleared tracking for user - UserId: ${userId}`);
  }

  /**
   * Get current tracking status for a user
   */
  public getUserStatus(userId: string): UserTracker | undefined {
    return this.spamTracker.get(userId);
  }

  /**
   * Update security configuration
   */
  public updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
    elizaLogger.info(
      `Security: Configuration updated - MaxSpamAttempts: ${this.config.maxSpamAttempts}, SpamWindowMs: ${this.config.spamWindowMs}, BlockDurationMs: ${this.config.blockDurationMs}`,
    );
  }
}

// Export singleton instance
export const securityFilter = new SecurityFilter();
