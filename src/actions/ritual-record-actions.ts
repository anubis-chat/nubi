import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionResult,
  logger,
  UUID,
  ModelType,
} from "@elizaos/core";
import SessionsService from "../services/sessions-service";
import { DatabaseMemoryService } from "../services/database-memory-service";
import CrossPlatformIdentityService from "../services/cross-platform-identity-service";

/**
 * Ritual Action - Start multi-step community workflows
 *
 * Triggers: @nubi start ritual [type] or @nubi ritual [description]
 * Creates Sessions API sessions for structured community interactions
 */
export const ritualAction: Action = {
  name: "NUBI_RITUAL",
  description: "Start multi-step community workflows with persistent context",
  similes: [
    "start ritual",
    "begin ritual",
    "ritual welcome",
    "ritual event",
    "ritual project",
    "ritual discussion",
    "nubi ritual",
    "anubis ritual",
    "jackal ritual",
    "@nubi start",
    "@anubis start",
    "@nubi_bot ritual",
    "@anubis_bot ritual",
    "@nubiai ritual",
    "@anubisai ritual",
  ],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || "";

    // Check for NUBI mentions with platform aliases
    const mentionsNubi = checkNubiMention(text);
    const hasRitual = text.includes("ritual");
    const hasStart = text.includes("start") || text.includes("begin");

    return mentionsNubi && hasRitual && (hasStart || text.includes("ritual "));
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const sessionsService = runtime.getService<SessionsService>("sessions");
      const identityService = runtime.getService<CrossPlatformIdentityService>(
        "cross-platform-identity",
      );

      if (!sessionsService || !identityService) {
        await callback?.({
          text: "🔮 Ritual magic unavailable - services not ready",
        });
        return { success: false };
      }

      const text = message.content?.text || "";
      const ritualType = extractRitualType(text);
      const ritualConfig = getRitualConfig(ritualType);

      // Get user UUID for cross-platform persistence
      const platform = identityService.detectPlatform(message);
      const userId = identityService.extractUserId(message);
      const userContext = await identityService.getCrossPlatformContext(
        platform,
        userId,
      );
      const userUUID = userContext.identity?.user_uuid || userId;

      // Create Sessions API session for this ritual
      const session = await sessionsService.createSession(userUUID, {
        timeoutMinutes: ritualConfig.timeoutMinutes,
        autoRenew: ritualConfig.autoRenew,
        metadata: {
          ritualType,
          ritualTitle: ritualConfig.title,
          originalPlatform: platform,
          originalRoomId: message.roomId,
          steps: ritualConfig.steps,
          createdBy: userId,
        },
      });

      // Store ritual session info
      await storeRitualSession(
        runtime,
        session.id,
        userUUID,
        ritualType,
        ritualConfig,
      );

      // Emit ritual started event
      const socketService = runtime.getService("socket_events");
      if (
        socketService &&
        typeof (socketService as any).emitRitualUpdate === "function"
      ) {
        await (socketService as any).emitRitualUpdate({
          sessionId: session.id,
          roomId: message.roomId,
          userId: userUUID,
          ritualType,
          action: "started",
          currentStep: 1,
          totalSteps: ritualConfig.steps.length,
        });
      }

      await callback?.({
        text:
          `🔮 **${ritualConfig.emoji} ${ritualConfig.title} Ritual Initiated**\n\n` +
          `${ritualConfig.description}\n\n` +
          `⏱️ Duration: ${ritualConfig.timeoutMinutes} minutes\n` +
          `📋 Steps: ${ritualConfig.steps.length}\n` +
          `🔄 Auto-renewal: ${ritualConfig.autoRenew ? "Yes" : "No"}\n\n` +
          `${ritualConfig.firstStep}\n\n` +
          `*Session ID: \`${session.id}\`*`,
      });

      return { success: true, data: { sessionId: session.id, ritualType } };
    } catch (error) {
      logger.error("[RITUAL_ACTION] Failed:", error);

      await callback?.({
        text: "🔮 Ritual initiation failed - the ancient energies are unstable. Try again?",
      });

      return { success: false };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: { text: "@nubi start ritual welcome" },
      },
      {
        name: "{{user2}}",
        content: {
          text: "🔮 **🎉 Community Welcome Ritual Initiated**\n\nLet's get you properly introduced to our community!\n\n⏱️ Duration: 30 minutes\n📋 Steps: 4\n🔄 Auto-renewal: Yes\n\nStep 1: Tell me a bit about yourself - what brings you to our community?",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: { text: "@anubis ritual event planning" },
      },
      {
        name: "{{user2}}",
        content: {
          text: "🔮 **🎪 Event Planning Ritual Initiated**\n\nLet's organize an awesome community event together!",
        },
      },
    ],
  ],
};

/**
 * Record Action - Store permanent user memories
 *
 * Triggers: @nubi record [memory] or @nubi remember [info]
 * Stores user-specific information with vector embeddings
 */
export const recordAction: Action = {
  name: "NUBI_RECORD",
  description:
    "Store permanent user memories for personalized community experience",
  similes: [
    "nubi record",
    "nubi remember",
    "record this",
    "remember that",
    "save to memory",
    "anubis record",
    "anubis remember",
    "jackal record",
    "@nubi record",
    "@anubis record",
    "@nubi_bot record",
    "@anubis_bot remember",
    "@nubiai record",
    "@anubisai remember",
  ],

  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const text = message.content?.text?.toLowerCase() || "";

    // Check for NUBI mentions with platform aliases
    const mentionsNubi = checkNubiMention(text);
    const hasRecord = text.includes("record") || text.includes("remember");

    return mentionsNubi && hasRecord;
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    try {
      const memoryService =
        runtime.getService<DatabaseMemoryService>("database_memory");
      const identityService = runtime.getService<CrossPlatformIdentityService>(
        "cross-platform-identity",
      );

      if (!memoryService || !identityService) {
        await callback?.({
          text: "📝 Memory recording unavailable - ancient scrolls are locked",
        });
        return { success: false };
      }

      const text = message.content?.text || "";
      const recordContent = extractRecordContent(text);

      if (!recordContent) {
        await callback?.({
          text: "📝 What would you like me to record? Try: `@nubi record I love helping with community events`",
        });
        return { success: false };
      }

      // Get user UUID for cross-platform persistence
      const platform = identityService.detectPlatform(message);
      const userId = identityService.extractUserId(message);
      const userContext = await identityService.getCrossPlatformContext(
        platform,
        userId,
      );
      const userUUID = userContext.identity?.user_uuid || userId;

      // Analyze and categorize the record
      const recordAnalysis = analyzeRecord(recordContent);

      // Store the user record
      await storeUserRecord(runtime, {
        userUUID,
        agentId: runtime.agentId,
        platform,
        platformUserId: userId,
        recordType: recordAnalysis.type,
        content: recordContent,
        tags: recordAnalysis.tags,
        importanceScore: recordAnalysis.importance,
        metadata: {
          originalMessage: message.id,
          detectedCategories: recordAnalysis.categories,
          sentiment: recordAnalysis.sentiment,
        },
      });

      // Emit record created event
      const socketService = runtime.getService("socket_events");
      if (
        socketService &&
        typeof (socketService as any).emitRecordCreated === "function"
      ) {
        await (socketService as any).emitRecordCreated({
          userUUID,
          roomId: message.roomId,
          recordType: recordAnalysis.type,
          content: recordContent,
          tags: recordAnalysis.tags,
          importanceScore: recordAnalysis.importance,
          platform,
        });
      }

      await callback?.({
        text:
          `📝 **Recorded to your eternal memory**\n\n` +
          `${recordAnalysis.emoji} **${recordAnalysis.type}**: ${recordContent}\n\n` +
          `🏷️ Tags: ${recordAnalysis.tags.join(", ")}\n` +
          `⭐ Importance: ${recordAnalysis.importance}/10\n\n` +
          `I'll remember this across all platforms and bring it up when relevant!`,
      });

      return {
        success: true,
        data: { recordType: recordAnalysis.type, userUUID },
      };
    } catch (error) {
      logger.error("[RECORD_ACTION] Failed:", error);

      await callback?.({
        text: "📝 Recording failed - the ancient scrolls reject this memory. Try rephrasing?",
      });

      return { success: false };
    }
  },

  examples: [
    [
      {
        name: "{{user1}}",
        content: {
          text: "@nubi record I'm a graphic designer and love creating memes",
        },
      },
      {
        name: "{{user2}}",
        content: {
          text: "📝 **Recorded to your eternal memory**\n\n🎨 **skill**: I'm a graphic designer and love creating memes\n\n🏷️ Tags: design, memes, creative\n⭐ Importance: 8/10\n\nI'll remember this across all platforms and bring it up when relevant!",
        },
      },
    ],
    [
      {
        name: "{{user1}}",
        content: {
          text: "@anubis remember I prefer evening meetups in PST timezone",
        },
      },
      {
        name: "{{user2}}",
        content: {
          text: "📝 **Recorded to your eternal memory**\n\n⏰ **availability**: I prefer evening meetups in PST timezone\n\n🏷️ Tags: events, social\n⭐ Importance: 6/10\n\nI'll remember this across all platforms and bring it up when relevant!",
        },
      },
    ],
  ],
};

/**
 * Helper Functions
 */

/**
 * Check for NUBI mentions with platform aliases
 */
function checkNubiMention(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Core NUBI names
  if (lowerText.includes("@nubi") || lowerText.includes("nubi")) return true;

  // Platform-specific aliases
  if (lowerText.includes("@anubis") || lowerText.includes("anubis"))
    return true;
  if (lowerText.includes("@anubischat") || lowerText.includes("anubischat"))
    return true;
  if (lowerText.includes("@nubibot") || lowerText.includes("nubibot"))
    return true;
  if (lowerText.includes("@jackal") || lowerText.includes("jackal"))
    return true;

  // Telegram specific
  if (lowerText.includes("@nubi_bot") || lowerText.includes("nubi_bot"))
    return true;
  if (lowerText.includes("@anubis_bot") || lowerText.includes("anubis_bot"))
    return true;

  // Discord specific
  if (lowerText.includes("<@") && lowerText.includes("nubi")) return true;
  if (lowerText.includes("<@") && lowerText.includes("anubis")) return true;

  // Twitter/X specific
  if (lowerText.includes("@nubiai") || lowerText.includes("nubiai"))
    return true;
  if (lowerText.includes("@anubisai") || lowerText.includes("anubisai"))
    return true;

  return false;
}

/**
 * Remove NUBI mentions from text using all aliases
 */
function removeNubiMentions(text: string): string {
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

      // Discord mentions
      .replace(/<@\d+>\s*/g, "")

      // Twitter/X
      .replace(/@nubiai\s*/gi, "")
      .replace(/\bnubiai\s*/gi, "")
      .replace(/@anubisai\s*/gi, "")
      .replace(/\banubisai\s*/gi, "")

      .trim()
  );
}

interface RitualConfig {
  title: string;
  emoji: string;
  description: string;
  timeoutMinutes: number;
  autoRenew: boolean;
  steps: string[];
  firstStep: string;
}

function extractRitualType(text: string): string {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("welcome") || lowerText.includes("onboard"))
    return "welcome";
  if (lowerText.includes("event") || lowerText.includes("meetup"))
    return "event";
  if (lowerText.includes("project") || lowerText.includes("collab"))
    return "project";
  if (lowerText.includes("discussion") || lowerText.includes("deep"))
    return "discussion";
  if (lowerText.includes("feedback") || lowerText.includes("survey"))
    return "feedback";

  return "general";
}

function getRitualConfig(ritualType: string): RitualConfig {
  const configs: Record<string, RitualConfig> = {
    welcome: {
      title: "Community Welcome",
      emoji: "🎉",
      description: "Let's get you properly introduced to our community!",
      timeoutMinutes: 30,
      autoRenew: true,
      steps: [
        "Introduction",
        "Interests",
        "Community Guidelines",
        "Connections",
      ],
      firstStep:
        "Step 1: Tell me a bit about yourself - what brings you to our community?",
    },
    event: {
      title: "Event Planning",
      emoji: "🎪",
      description: "Let's organize an awesome community event together!",
      timeoutMinutes: 60,
      autoRenew: true,
      steps: [
        "Event Type",
        "Date & Time",
        "Activities",
        "Promotion",
        "Execution",
      ],
      firstStep:
        "Step 1: What kind of event are you thinking? (Meetup, AMA, Contest, etc.)",
    },
    project: {
      title: "Project Collaboration",
      emoji: "🛠️",
      description: "Time to build something amazing together!",
      timeoutMinutes: 120,
      autoRenew: true,
      steps: [
        "Project Scope",
        "Team Assembly",
        "Planning",
        "Execution",
        "Launch",
      ],
      firstStep:
        "Step 1: What project idea do you want to explore? Describe your vision!",
    },
    discussion: {
      title: "Deep Discussion",
      emoji: "💭",
      description: "Let's dive deep into this topic with proper context!",
      timeoutMinutes: 45,
      autoRenew: true,
      steps: ["Topic Setup", "Context Gathering", "Analysis", "Conclusions"],
      firstStep: "Step 1: What topic would you like to explore in depth?",
    },
    feedback: {
      title: "Community Feedback",
      emoji: "📊",
      description: "Gathering valuable community insights and opinions!",
      timeoutMinutes: 30,
      autoRenew: false,
      steps: ["Questions Setup", "Response Collection", "Analysis"],
      firstStep: "Step 1: What would you like feedback on from the community?",
    },
    general: {
      title: "General Ritual",
      emoji: "✨",
      description: "A custom workflow for your specific needs!",
      timeoutMinutes: 60,
      autoRenew: true,
      steps: ["Setup", "Process", "Completion"],
      firstStep: "Step 1: What would you like to accomplish in this ritual?",
    },
  };

  return configs[ritualType] || configs.general;
}

function extractRecordContent(text: string): string | null {
  // Remove NUBI mentions and command words using comprehensive alias removal
  let content = removeNubiMentions(text)
    .replace(/\b(record|remember)\s*/gi, "")
    .trim();

  if (content.length < 5) return null;

  return content;
}

interface RecordAnalysis {
  type: string;
  emoji: string;
  tags: string[];
  importance: number;
  categories: string[];
  sentiment: string;
}

function analyzeRecord(content: string): RecordAnalysis {
  const lowerContent = content.toLowerCase();

  // Determine record type
  let type = "preference";
  let emoji = "💭";

  if (/designer|artist|creative|draw|design|art/.test(lowerContent)) {
    type = "skill";
    emoji = "🎨";
  } else if (/developer|code|program|tech|engineer/.test(lowerContent)) {
    type = "skill";
    emoji = "💻";
  } else if (/timezone|available|free|schedule/.test(lowerContent)) {
    type = "availability";
    emoji = "⏰";
  } else if (/interest|hobby|enjoy|love|passion/.test(lowerContent)) {
    type = "interest";
    emoji = "❤️";
  } else if (/goal|want|plan|dream|hope/.test(lowerContent)) {
    type = "goal";
    emoji = "🎯";
  } else if (/story|experience|background|history/.test(lowerContent)) {
    type = "story";
    emoji = "📖";
  }

  // Extract tags
  const tags: string[] = [];
  if (/design|art|creative/.test(lowerContent)) tags.push("creative");
  if (/tech|code|develop/.test(lowerContent)) tags.push("technical");
  if (/community|social|people/.test(lowerContent)) tags.push("social");
  if (/event|meetup|organize/.test(lowerContent)) tags.push("events");
  if (/help|support|assist/.test(lowerContent)) tags.push("helpful");
  if (/meme|fun|joke|humor/.test(lowerContent)) tags.push("fun");

  // Determine importance (1-10)
  let importance = 5; // Default
  if (type === "skill" || type === "goal") importance = 8;
  if (type === "availability") importance = 6;
  if (type === "story") importance = 7;
  if (lowerContent.includes("important") || lowerContent.includes("really"))
    importance += 1;
  if (lowerContent.includes("love") || lowerContent.includes("passion"))
    importance += 1;

  importance = Math.min(Math.max(importance, 1), 10);

  // Determine sentiment
  let sentiment = "neutral";
  if (/love|enjoy|great|awesome|excited/.test(lowerContent))
    sentiment = "positive";
  if (/hate|dislike|bad|terrible/.test(lowerContent)) sentiment = "negative";

  return {
    type,
    emoji,
    tags,
    importance,
    categories: [type, ...tags],
    sentiment,
  };
}

async function storeRitualSession(
  runtime: IAgentRuntime,
  sessionId: UUID,
  userUUID: string,
  ritualType: string,
  config: RitualConfig,
): Promise<void> {
  const memoryService =
    runtime.getService<DatabaseMemoryService>("database_memory");
  if (!memoryService) return;

  // Store in ritual_sessions table via DatabaseConnectionManager
  try {
    await (memoryService as any).dbManager?.query(
      `INSERT INTO ritual_sessions (
         session_id, user_uuid, ritual_type, ritual_title, 
         total_steps, step_data, status
       ) VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
      [
        sessionId,
        userUUID,
        ritualType,
        config.title,
        config.steps.length,
        JSON.stringify({ steps: config.steps, currentStepData: {} }),
      ],
    );
  } catch (error) {
    logger.error("[RITUAL_ACTION] Failed to store ritual session:", error);
  }
}

async function storeUserRecord(
  runtime: IAgentRuntime,
  record: {
    userUUID: string;
    agentId: UUID;
    platform: string;
    platformUserId: string;
    recordType: string;
    content: string;
    tags: string[];
    importanceScore: number;
    metadata: any;
  },
): Promise<void> {
  const memoryService =
    runtime.getService<DatabaseMemoryService>("database_memory");
  if (!memoryService) return;

  // Store in user_records table via DatabaseConnectionManager
  try {
    await (memoryService as any).dbManager?.query(
      `INSERT INTO user_records (
         user_uuid, agent_id, platform, platform_user_id,
         record_type, content, tags, importance_score, metadata
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_uuid, content) DO UPDATE SET
         importance_score = GREATEST(user_records.importance_score, $8),
         updated_at = NOW(),
         tags = array_unique(user_records.tags || array[]::text[] || $7),
         metadata = user_records.metadata || $9`,
      [
        record.userUUID,
        record.agentId,
        record.platform,
        record.platformUserId,
        record.recordType,
        record.content,
        record.tags,
        record.importanceScore,
        JSON.stringify(record.metadata),
      ],
    );
  } catch (error) {
    logger.error("[RECORD_ACTION] Failed to store user record:", error);
  }

  // Generate and store vector embedding for the record
  const embedding = await generateEmbedding(runtime, record.content);
  if (embedding) {
    await (memoryService as any).storeMemoryWithEmbedding(
      {
        id: record.userUUID + "_record_" + Date.now(),
        content: { text: record.content },
        entityId: record.userUUID,
        agentId: record.agentId,
        roomId: record.userUUID, // Use userUUID as roomId for personal records
        createdAt: Date.now(),
        type: "user_record",
        metadata: record.metadata,
      },
      embedding,
    );
  }
}

async function generateEmbedding(
  runtime: IAgentRuntime,
  text: string,
): Promise<number[] | null> {
  try {
    // Use ElizaOS embedding service
    const embedding = await runtime.useModel(ModelType.TEXT_EMBEDDING, {
      text: text,
    });
    return embedding;
  } catch (error) {
    logger.debug("[RECORD_ACTION] Failed to generate embedding:", error);
    return null;
  }
}

export const ritualRecordActions = [ritualAction, recordAction];
