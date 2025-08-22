import {
  logger,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from "@elizaos/core";
import { anubisCharacter } from "./anubis-character.ts";
import anubisPlugin from "./anubis-plugin.ts";
import { ProjectStarterTestSuite } from "./__tests__/e2e/project-starter.e2e";

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  try {
    logger.info("🚀 Initializing Anubis Agent Unified God Mode");
    logger.info({ name: anubisCharacter.name }, "Agent Identity:");

    // Validate character configuration
    if (!anubisCharacter.name || !anubisCharacter.plugins) {
      throw new Error("Invalid character configuration");
    }

    // Log comprehensive feature set
    logger.info(
      {
        personalityDimensions: 10,
        emotionalStates: 7,
        antiDetectionPatterns: 16,
        knowledgeBase: anubisCharacter.knowledge?.length || 0,
        messageExamples: anubisCharacter.messageExamples?.length || 0,
        topics: anubisCharacter.topics?.length || 0,
        plugins: anubisCharacter.plugins?.length || 0,
        unifiedArchitecture: "enabled",
      },
      "✨ Unified God Mode Features:",
    );

    // Validate environment
    const requiredEnvVars = ["OPENAI_API_KEY"];
    const missingVars = requiredEnvVars.filter(
      (var_name) => !process.env[var_name],
    );

    if (missingVars.length > 0) {
      logger.warn(
        { missingVars },
        "⚠️  Missing required environment variables",
      );
    }

    // Log optional features status
    const features = {
      raidBot: !!process.env.TELEGRAM_BOT_TOKEN,
      twitterIntegration: !!process.env.TWITTER_API_KEY,
      discordIntegration: !!process.env.DISCORD_API_TOKEN,
      solanaIntegration: !!process.env.SOLANA_PRIVATE_KEY,
      anthropicFallback: !!process.env.ANTHROPIC_API_KEY,
    };

    logger.info(features, "🔧 Feature Status:");

    logger.info("🎯 Anubis Agent ready for deployment");
  } catch (error) {
    logger.error("❌ Character initialization failed:", error);
    throw error;
  }
};

export const projectAgent: ProjectAgent = {
  character: anubisCharacter,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [anubisPlugin], // Enhanced Anubis plugin with all features
  tests: [ProjectStarterTestSuite],
};

const project: Project = {
  agents: [projectAgent],
};

export { anubisCharacter as character } from "./anubis-character.ts";
export { anubisCharacter } from "./anubis-character.ts";

export default project;
