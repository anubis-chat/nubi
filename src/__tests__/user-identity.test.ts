import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { UserIdentityService } from "../user-identity-service";
import { Memory, UUID, IAgentRuntime } from "@elizaos/core";
import { Database } from "sqlite3";
import * as fs from "fs";
import * as path from "path";

// Mock runtime
const mockRuntime = {
  agentId: "test-agent-123" as UUID,
  getSetting: (key: string) => undefined,
  getMemory: async () => null,
  messageManager: {
    createMemory: async (memory: Memory) => memory,
  },
  databaseAdapter: {
    db: null,
  },
} as unknown as IAgentRuntime;

describe("UserIdentityService", () => {
  let service: UserIdentityService;
  const testDbPath = path.join(process.cwd(), "data", "test-identity.db");

  beforeEach(async () => {
    // Ensure data directory exists
    const dataDir = path.dirname(testDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Clean up any existing test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Pass test database path to service
    service = new UserIdentityService(mockRuntime, testDbPath);
    // Wait for initialization and table creation
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterEach(async () => {
    await service.stop();
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("Platform-specific identity extraction", () => {
    it("should extract Twitter/X identity correctly", async () => {
      const twitterMessage: Memory = {
        id: "msg-1" as UUID,
        userId: "user-123" as UUID,
        agentId: "agent-123" as UUID,
        roomId: "room-123" as UUID,
        content: {
          text: "Hello from Twitter!",
          source: "twitter",
          author: {
            id: "tw-user-456",
            username: "cryptowhale",
            name: "Crypto Whale 🐋",
            verified: true,
            followersCount: 50000,
          },
          tweet_id: "1234567890",
        },
        createdAt: Date.now(),
        entityId: "entity-123" as UUID,
      };

      const identity = await service.extractIdentity(twitterMessage);

      expect(identity.platform).toBe("twitter");
      expect(identity.platformUserId).toBe("tw-user-456");
      expect(identity.platformUsername).toBe("cryptowhale");
      expect(identity.displayName).toBe("Crypto Whale 🐋");
      expect(identity.metadata.verified).toBe(true);
      expect(identity.metadata.followers).toBe(50000);
    });

    it("should extract Telegram identity correctly", async () => {
      const telegramMessage: Memory = {
        id: "msg-2" as UUID,
        userId: "user-456" as UUID,
        agentId: "agent-123" as UUID,
        roomId: "room-456" as UUID,
        content: {
          text: "Hello from Telegram!",
          source: "telegram",
          from: {
            id: 789012345,
            username: "defi_master",
            first_name: "DeFi",
            last_name: "Master",
          },
          chat: {
            id: -1001234567890,
            title: "Crypto Trading Group",
          },
        },
        createdAt: Date.now(),
        entityId: "entity-456" as UUID,
      };

      const identity = await service.extractIdentity(telegramMessage);

      expect(identity.platform).toBe("telegram");
      expect(identity.platformUserId).toBe("789012345");
      expect(identity.platformUsername).toBe("defi_master");
      expect(identity.displayName).toBe("DeFi Master");
      expect(identity.metadata.chatId).toBe(-1001234567890);
      expect(identity.metadata.chatTitle).toBe("Crypto Trading Group");
    });

    it("should extract Discord identity correctly", async () => {
      const discordMessage: Memory = {
        id: "msg-3" as UUID,
        userId: "user-789" as UUID,
        agentId: "agent-123" as UUID,
        roomId: "room-789" as UUID,
        content: {
          text: "Hello from Discord!",
          source: "discord",
          author: {
            id: "discord-user-123",
            username: "moonboy",
          },
          member: {
            nickname: "MoonBoy 🚀",
            roles: ["trader", "whale"],
          },
          guildId: "guild-456",
          channelId: "channel-789",
        },
        createdAt: Date.now(),
        entityId: "entity-789" as UUID,
      };

      const identity = await service.extractIdentity(discordMessage);

      expect(identity.platform).toBe("discord");
      expect(identity.platformUserId).toBe("discord-user-123");
      expect(identity.platformUsername).toBe("moonboy");
      expect(identity.displayName).toBe("MoonBoy 🚀");
      expect(identity.metadata.guildId).toBe("guild-456");
      expect(identity.metadata.channelId).toBe("channel-789");
      expect(identity.metadata.roles).toContain("trader");
    });
  });

  describe("Identity resolution and persistence", () => {
    it("should create and persist new identity", async () => {
      const identity = await service.resolveIdentity(
        "twitter",
        "tw-new-user",
        "newtrader",
        "New Trader",
        "room-123" as UUID,
      );

      expect(identity.platform).toBe("twitter");
      expect(identity.platformUserId).toBe("tw-new-user");
      expect(identity.platformUsername).toBe("newtrader");
      expect(identity.displayName).toBe("New Trader");
      expect(identity.roomId).toBe("room-123");
      expect(identity.internalId).toBeDefined();

      // Should retrieve from cache on second call
      const cached = await service.resolveIdentity("twitter", "tw-new-user");
      expect(cached.internalId).toBe(identity.internalId);
    });

    it("should detect similar usernames across platforms", async () => {
      // Create identities on different platforms with similar usernames
      const twitterIdentity = await service.resolveIdentity(
        "twitter",
        "tw-123",
        "cryptoking",
        "Crypto King",
        "room-1" as UUID,
      );

      const telegramIdentity = await service.resolveIdentity(
        "telegram",
        "tg-456",
        "cryptoking_official",
        "Crypto King",
        "room-2" as UUID,
      );

      const discordIdentity = await service.resolveIdentity(
        "discord",
        "dc-789",
        "cryptoking",
        "CryptoKing",
        "room-3" as UUID,
      );

      // Detect potential links
      const potentialLinks =
        await service.detectPotentialLinks(twitterIdentity);

      // Should find the Discord user with exact username match
      const exactMatch = potentialLinks.find(
        (link) => link.reason === "similar_username" && link.confidence > 0.9,
      );
      expect(exactMatch).toBeDefined();

      // Should also find similar usernames
      expect(potentialLinks.length).toBeGreaterThan(0);
    });

    it("should link identities and retrieve linked accounts", async () => {
      // Create two identities
      const twitter = await service.resolveIdentity(
        "twitter",
        "tw-user-99",
        "megawhale",
        "Mega Whale",
        "room-1" as UUID,
      );

      const telegram = await service.resolveIdentity(
        "telegram",
        "tg-user-99",
        "megawhale_tg",
        "Mega Whale",
        "room-2" as UUID,
      );

      // Link them as same person
      await service.linkIdentities(
        twitter.internalId,
        telegram.internalId,
        0.95,
        "same_display_name_and_similar_username",
      );

      // Get linked identities
      const twitterLinks = await service.getLinkedIdentities(
        twitter.internalId,
      );
      const telegramLinks = await service.getLinkedIdentities(
        telegram.internalId,
      );

      expect(twitterLinks).toHaveLength(1);
      expect(twitterLinks[0].internalId).toBe(telegram.internalId);

      expect(telegramLinks).toHaveLength(1);
      expect(telegramLinks[0].internalId).toBe(twitter.internalId);
    });
  });

  describe("Cross-platform scenarios", () => {
    it("should handle user active on multiple platforms", async () => {
      const userId = "multi-platform-user";

      // Same user joins from different platforms
      const platforms = [
        {
          platform: "twitter" as const,
          userId: "tw-multi",
          username: "multiuser",
        },
        {
          platform: "telegram" as const,
          userId: "tg-multi",
          username: "multiuser_tg",
        },
        {
          platform: "discord" as const,
          userId: "dc-multi",
          username: "multiuser#1234",
        },
      ];

      const identities = [];
      for (const p of platforms) {
        const identity = await service.resolveIdentity(
          p.platform,
          p.userId,
          p.username,
          "Multi Platform User",
          "room-shared" as UUID,
        );
        identities.push(identity);
      }

      // All should have different internal IDs initially
      const uniqueIds = new Set(identities.map((i) => i.internalId));
      expect(uniqueIds.size).toBe(3);

      // Link them all as same person
      await service.linkIdentities(
        identities[0].internalId,
        identities[1].internalId,
        0.9,
        "manual_verification",
      );

      await service.linkIdentities(
        identities[1].internalId,
        identities[2].internalId,
        0.9,
        "manual_verification",
      );

      // Verify all are linked
      const links = await service.getLinkedIdentities(identities[0].internalId);
      expect(links).toHaveLength(2);

      const linkedPlatforms = links.map((l) => l.platform).sort();
      expect(linkedPlatforms).toEqual(["discord", "telegram"]);
    });

    it("should maintain identity after service restart", async () => {
      // Create identity
      const identity1 = await service.resolveIdentity(
        "twitter",
        "tw-persist",
        "persistuser",
        "Persist User",
        "room-1" as UUID,
      );

      const originalId = identity1.internalId;

      // Stop service (simulating restart)
      await service.stop();

      // Create new service instance with same database
      const newService = new UserIdentityService(mockRuntime, testDbPath);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Resolve same identity
      const identity2 = await newService.resolveIdentity(
        "twitter",
        "tw-persist",
      );

      // Should get same internal ID
      expect(identity2.internalId).toBe(originalId);
      expect(identity2.platformUsername).toBe("persistuser");

      await newService.stop();
    });

    it("should handle edge cases gracefully", async () => {
      // User with no username
      const noUsername = await service.resolveIdentity(
        "twitter",
        "tw-no-username",
        undefined,
        "Anonymous User",
        "room-1" as UUID,
      );
      expect(noUsername.platformUsername).toContain("user_");

      // User with only ID
      const onlyId = await service.resolveIdentity("telegram", "tg-only-id");
      expect(onlyId.displayName).toBeDefined();

      // Generic platform message
      const genericMessage: Memory = {
        id: "msg-generic" as UUID,
        userId: "user-generic" as UUID,
        agentId: "agent-123" as UUID,
        roomId: "room-generic" as UUID,
        content: {
          text: "Generic message",
        },
        createdAt: Date.now(),
        entityId: "entity-generic" as UUID,
      };

      const genericIdentity = await service.extractIdentity(genericMessage);
      expect(genericIdentity.platform).toBe("unknown");
    });
  });

  describe("Username similarity detection", () => {
    it("should calculate similarity correctly", async () => {
      const testCases = [
        { u1: "cryptoking", u2: "cryptoking", expected: 1.0 },
        { u1: "cryptoking", u2: "cryptoking_official", expected: 0.8 },
        { u1: "whale", u2: "megawhale", expected: 0.8 },
        { u1: "trader123", u2: "trader456", expected: 0.5 },
        { u1: "alice", u2: "bob", expected: 0.0 },
      ];

      for (const test of testCases) {
        // Create identities to test similarity
        const id1 = await service.resolveIdentity(
          "twitter",
          `tw-${test.u1}`,
          test.u1,
          "User 1",
        );

        const id2 = await service.resolveIdentity(
          "telegram",
          `tg-${test.u2}`,
          test.u2,
          "User 2",
        );

        const potentialLinks = await service.detectPotentialLinks(id1);
        const link = potentialLinks.find((l) => l.identity2 === id2.internalId);

        if (test.expected > 0.7) {
          expect(link).toBeDefined();
          if (link) {
            expect(link.confidence).toBeGreaterThanOrEqual(test.expected - 0.1);
          }
        }
      }
    });
  });
});
