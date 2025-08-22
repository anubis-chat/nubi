import {
  logger,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from "@elizaos/core";
import { nubiCharacter } from "./nubi-character.ts";
import nubiPlugin from "./nubi-plugin.ts";
import { ProjectStarterTestSuite } from "./__tests__/e2e/project-starter.e2e";

const initCharacter = ({ runtime }: { runtime: IAgentRuntime }) => {
  try {
    logger.info("🚀 Initializing NUBI - The Symbiotic Essence of Anubis");
    logger.info({ name: nubiCharacter.name }, "Agent Identity:");

    // Validate character configuration
    if (!nubiCharacter.name || !nubiCharacter.plugins) {
      throw new Error("Invalid character configuration");
    }

    // Log comprehensive feature set
    logger.info(
      {
        personalityDimensions: 10,
        emotionalStates: 7,
        antiDetectionPatterns: 16,
        knowledgeBase: nubiCharacter.knowledge?.length || 0,
        messageExamples: nubiCharacter.messageExamples?.length || 0,
        topics: nubiCharacter.topics?.length || 0,
        plugins: nubiCharacter.plugins?.length || 0,
        symbioticArchitecture: "enabled",
      },
      "✨ Symbiotic Essence Features:",
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

    logger.info("🎯 NUBI Agent ready for deployment");
  } catch (error) {
    logger.error("❌ Character initialization failed:", error);
    throw error;
  }
};

export const projectAgent: ProjectAgent = {
  character: nubiCharacter,
  init: async (runtime: IAgentRuntime) => await initCharacter({ runtime }),
  plugins: [nubiPlugin], // Enhanced NUBI plugin with all features
  tests: [ProjectStarterTestSuite],
};

const project: Project = {
  agents: [projectAgent],
};

export { nubiCharacter as character } from "./nubi-character.ts";
export { nubiCharacter } from "./nubi-character.ts";

export default project;
