import {
  IAgentRuntime,
  Memory,
  State,
  ActionResult,
  logger,
} from "@elizaos/core";
// MessageRouterService removed - using built-in ElizaOS routing
import ComposeStateService from "../services/compose-state-service";

/**
 * Action Middleware System
 *
 * Integrates with ElizaOS's native action processing to provide:
 * - Pre-action routing coordination
 * - @mention preprocessing with platform aliases
 * - Action conflict resolution and prioritization
 * - Real-time event coordination
 * - Cross-platform action synchronization
 */

export interface ActionMiddlewareContext {
  originalMessage: Memory;
  routingDecision: any;
  preprocessedContent: any;
  priority: number;
  shouldExecute: boolean;
  delayExecution?: number;
}

export class ActionMiddleware {
  private runtime: IAgentRuntime;
  // Using built-in ElizaOS routing instead of custom MessageRouterService
  private composeStateService: ComposeStateService | null = null;

  constructor(runtime: IAgentRuntime) {
    this.runtime = runtime;
  }

  /**
   * Initialize middleware with services
   */
  async initialize(): Promise<void> {
    // Using built-in ElizaOS routing instead of custom MessageRouterService
    this.composeStateService =
      this.runtime.getService<ComposeStateService>("compose_state");

    logger.info(
      "[ACTION_MIDDLEWARE] Initialized with official ElizaOS integration",
    );
  }

  /**
   * Pre-process message before action validation
   */
  async preprocessMessage(message: Memory): Promise<ActionMiddlewareContext> {
    const context: ActionMiddlewareContext = {
      originalMessage: message,
      routingDecision: null,
      preprocessedContent: { ...message.content },
      priority: 1,
      shouldExecute: true,
    };

    try {
      // Using built-in ElizaOS routing instead of custom router service
      // Set default routing decision
      context.routingDecision = {
        routingMethod: "immediate",
        targetActions: [],
        crossPlatformSync: false,
        crossPlatformProfiles: [],
      };

      // Apply routing decision to execution
      if (context.routingDecision.routingMethod === "queued") {
        context.shouldExecute = false;
        context.delayExecution = 5000; // 5 second delay for queued actions
      } else if (context.routingDecision.routingMethod === "session_based") {
        context.priority = 2; // Higher priority for session-based
      }

      // Preprocess @mentions with comprehensive alias removal
      if (message.content?.text) {
        context.preprocessedContent.text = this.preprocessMentions(
          message.content.text,
        );
        context.preprocessedContent.originalText = message.content.text;
      }

      // Emit preprocessing event using official patterns
      if (
        this.runtime.events &&
        typeof this.runtime.events.get === "function"
      ) {
        const handlers = this.runtime.events.get("messageBroadcast");
        if (handlers && Array.isArray(handlers)) {
          const eventParams = {
            agentId: this.runtime.agentId,
            roomId: context.originalMessage.roomId,
            userId: (context.originalMessage as any).entityId,
            content: {
              text: "Message preprocessed for action execution",
              metadata: {
                eventType: "preprocessing",
                priority: context.priority,
                shouldExecute: context.shouldExecute,
                routingMethod: context.routingDecision?.routingMethod,
                targetActions: context.routingDecision?.targetActions || [],
                delayExecution: context.delayExecution,
              },
            },
            timestamp: new Date().toISOString(),
          };
          // Execute all handlers
          for (const handler of handlers) {
            try {
              await handler(eventParams);
            } catch (error) {
              logger.warn("[ACTION_MIDDLEWARE] Event handler failed:", error);
            }
          }
        }
      }

      logger.debug(
        `[ACTION_MIDDLEWARE] Preprocessed message - execute: ${context.shouldExecute}, priority: ${context.priority}`,
      );

      return context;
    } catch (error) {
      logger.error("[ACTION_MIDDLEWARE] Preprocessing failed:", error);

      // Return safe fallback context
      return {
        ...context,
        shouldExecute: true,
        priority: 1,
      };
    }
  }

  /**
   * Post-process action results
   */
  async postprocessAction(
    actionName: string,
    result: ActionResult,
    context: ActionMiddlewareContext,
  ): Promise<ActionResult> {
    try {
      // Emit action completion using official events
      if (
        this.runtime.events &&
        typeof this.runtime.events.get === "function"
      ) {
        const handlers = this.runtime.events.get("messageComplete");
        if (handlers && Array.isArray(handlers)) {
          const eventParams = {
            agentId: this.runtime.agentId,
            roomId: context.originalMessage.roomId,
            userId: (context.originalMessage as any).entityId,
            timestamp: new Date().toISOString(),
            data: {
              actionName,
              success: result.success,
              messageId: context.originalMessage.id,
              priority: context.priority,
              executionTime:
                Date.now() - (context.originalMessage.createdAt || Date.now()),
              resultData: result.data,
            },
          };
          // Execute all handlers
          for (const handler of handlers) {
            try {
              await handler(eventParams);
            } catch (error) {
              logger.warn("[ACTION_MIDDLEWARE] Event handler failed:", error);
            }
          }
        }
      }

      // Handle cross-platform coordination using official events
      if (context.routingDecision?.crossPlatformSync) {
        await this.coordinateCrossPlatform(actionName, result, context);
      }

      // Process any queued follow-up actions
      // Using built-in ElizaOS action processing instead of custom router
      if (result.success) {
        const userUUID = (context.originalMessage as any).entityId;
        if (userUUID) {
          // Built-in ElizaOS handles queued actions automatically
        }
      }

      logger.debug(
        `[ACTION_MIDDLEWARE] Post-processed action ${actionName}: ${result.success ? "success" : "failed"}`,
      );

      return result;
    } catch (error) {
      logger.error("[ACTION_MIDDLEWARE] Post-processing failed:", error);
      return result;
    }
  }

  /**
   * Comprehensive @mention preprocessing with all platform aliases
   */
  private preprocessMentions(text: string): string {
    return (
      text
        // Core names
        .replace(/@nubi\s*/gi, "")
        .replace(/\bnubi\s*/gi, "")
        .replace(/@anubis\s*/gi, "")
        .replace(/\banubis\s*/gi, "")

        // Platform aliases
        .replace(/@anubischat\s*/gi, "")
        .replace(/\banubischat\s*/gi, "")
        .replace(/@nubibot\s*/gi, "")
        .replace(/\bnubibot\s*/gi, "")
        .replace(/@jackal\s*/gi, "")
        .replace(/\bjackal\s*/gi, "")

        // Telegram
        .replace(/@nubi_bot\s*/gi, "")
        .replace(/\bnubi_bot\s*/gi, "")
        .replace(/@anubis_bot\s*/gi, "")
        .replace(/\banubis_bot\s*/gi, "")

        // Discord mentions (preserve structure but clean content)
        .replace(/<@\d+>\s*/g, "")

        // Twitter/X
        .replace(/@nubiai\s*/gi, "")
        .replace(/\bnubiai\s*/gi, "")
        .replace(/@anubisai\s*/gi, "")
        .replace(/\banubisai\s*/gi, "")

        .trim()
    );
  }

  /**
   * Coordinate cross-platform action synchronization using official events
   */
  private async coordinateCrossPlatform(
    actionName: string,
    result: ActionResult,
    context: ActionMiddlewareContext,
  ): Promise<void> {
    try {
      // Use official ElizaOS world-state event for cross-platform coordination
      if (
        this.runtime.events &&
        typeof this.runtime.events.get === "function"
      ) {
        const handlers = this.runtime.events.get("world-state");
        if (handlers && Array.isArray(handlers)) {
          const eventParams = {
            agentId: this.runtime.agentId,
            timestamp: new Date().toISOString(),
            state: {
              actionName,
              success: result.success,
              messageId: context.originalMessage.id,
              roomId: context.originalMessage.roomId,
              userId: (context.originalMessage as any).entityId,
              routingDecision: context.routingDecision,
              syncTargets: context.routingDecision?.crossPlatformProfiles || [],
              eventType: "cross_platform_action_sync",
            },
          };
          // Execute all handlers
          for (const handler of handlers) {
            try {
              await handler(eventParams);
            } catch (error) {
              logger.warn("[ACTION_MIDDLEWARE] Event handler failed:", error);
            }
          }
        }
      }

      logger.debug(
        `[ACTION_MIDDLEWARE] Coordinated cross-platform sync for action ${actionName} using official patterns`,
      );
    } catch (error) {
      logger.debug(
        "[ACTION_MIDDLEWARE] Cross-platform coordination failed:",
        error,
      );
    }
  }
}

/**
 * Middleware wrapper for actions
 */
export function withActionMiddleware(originalAction: any) {
  return {
    ...originalAction,
    handler: async (
      runtime: IAgentRuntime,
      message: Memory,
      state: State,
      options: any,
      callback: any,
    ) => {
      const middleware = new ActionMiddleware(runtime);
      await middleware.initialize();

      // Preprocess message
      const context = await middleware.preprocessMessage(message);

      // Check if we should execute
      if (!context.shouldExecute) {
        if (context.delayExecution) {
          // Queue for later execution
          setTimeout(async () => {
            const result = await originalAction.handler(
              runtime,
              message,
              state,
              options,
              callback,
            );
            await middleware.postprocessAction(
              originalAction.name,
              result,
              context,
            );
          }, context.delayExecution);

          return { success: true, text: "Action queued for processing..." };
        } else {
          return {
            success: false,
            text: "Action execution blocked by routing decision",
          };
        }
      }

      // Execute original action with preprocessed content
      const modifiedMessage = {
        ...message,
        content: context.preprocessedContent,
      };

      const result = await originalAction.handler(
        runtime,
        modifiedMessage,
        state,
        options,
        callback,
      );

      // Post-process results
      return await middleware.postprocessAction(
        originalAction.name,
        result,
        context,
      );
    },
  };
}

export default ActionMiddleware;
