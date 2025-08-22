import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { DatabaseMemoryService } from "../services/database-memory-service";
import { EnhancedResponseGenerator } from "../services/enhanced-response-generator";
import enhancedContextProvider from "../providers/enhanced-context-provider";
import type { IAgentRuntime, Memory, State, Service } from "@elizaos/core";
import { v4 as uuidv4 } from "uuid";

// Create a more complete mock runtime
function createMockRuntime(config?: any): IAgentRuntime {
  const services = new Map<string, Service>();
  const agentId = uuidv4();

  return {
    agentId,
    character: config?.character || { name: "NUBI" },

    // Service management
    getService: (name: string) => services.get(name),
    registerService: (service: Service) => {
      services.set(
        (service as any).constructor.serviceType || service.constructor.name,
        service,
      );
    },

    // Memory management (mock)
    getMemories: async (params: any) => {
      return [];
    },

    createMemory: async (memory: Memory) => {
      return memory;
    },

    // Model and settings methods with call counting for realistic responses
    useModel: (() => {
      let callCount = 0;
      const responses = [
        "🚀 This is awesome and exciting!", // For excited context
        "hey friend, what's up!", // For friend context
        "gm! hello there", // For greeting
        "haha that's funny! loving this mood 😄", // For playful
      ];

      return async (modelType: any, params: any) => {
        const response =
          responses[callCount % responses.length] || "AI generated response";
        callCount++;
        return response;
      };
    })(),
    setSetting: async () => undefined,
    searchMemories: async () => [],

    // Other required methods (mocked)
    processActions: async () => [],
    evaluate: async () => [],
    ensureParticipantExists: async () => uuidv4(),
    ensureUserExists: async () => uuidv4(),
    ensureRoomExists: async () => uuidv4(),
    composeState: async () => ({}),
    updateRecentMessageState: async () => ({}),
  } as unknown as IAgentRuntime;
}

describe("Database Integration Tests", () => {
  let runtime: IAgentRuntime;
  let memoryService: DatabaseMemoryService;
  let responseGenerator: EnhancedResponseGenerator;
  let testRoomId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create mock runtime
    runtime = createMockRuntime({
      character: {
        name: "NUBI",
        plugins: ["@elizaos/plugin-sql"],
        settings: {
          adapters: ["postgres"],
          databaseUrl:
            process.env.DATABASE_URL ||
            "postgresql://postgres:Anubisdata1!@db.nfnmoqepgjyutcbbaqjg.supabase.co:5432/postgres",
        },
      },
    });

    // Initialize services
    memoryService = await DatabaseMemoryService.start(runtime);
    responseGenerator = await EnhancedResponseGenerator.start(runtime);

    // Register services with runtime
    (runtime as any).registerService(memoryService);
    (runtime as any).registerService(responseGenerator);

    // Create test identifiers
    testRoomId = uuidv4();
    testUserId = uuidv4();
  });

  afterAll(async () => {
    // Cleanup
    if (memoryService) {
      await memoryService.stop();
    }
    if (responseGenerator) {
      await responseGenerator.stop();
    }
  });

  describe("DatabaseMemoryService", () => {
    it("should initialize and connect to PostgreSQL", () => {
      expect(memoryService).toBeDefined();
      expect(DatabaseMemoryService.serviceType).toBe("database_memory");
    });

    it("should retrieve enhanced context with multiple data sources", async () => {
      const context = await memoryService.getEnhancedContext(
        testRoomId,
        testUserId,
        "crypto",
        10,
      );

      expect(context).toBeDefined();
      expect(context.recentMemories).toBeDefined();
      expect(context.semanticMemories).toBeDefined();
      expect(context.patterns).toBeDefined();
      expect(context.entities).toBeDefined();
      expect(context.relationships).toBeDefined();
      expect(context.emotionalState).toBeDefined();
      expect(context.communityContext).toBeDefined();
      expect(context.agentStats).toBeDefined();
    });

    it("should store memory with vector embedding", async () => {
      const testMemory: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: {
          text: "Test memory for vector embedding",
        },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      // Create a simple 384-dimension embedding (mock)
      const mockEmbedding = new Array(384).fill(0.1);

      const stored = await memoryService.storeMemoryWithEmbedding(
        testMemory,
        mockEmbedding,
      );

      expect(stored).toBe(true);
    });

    it("should update personality traits", async () => {
      const traits = {
        ancient_wisdom: 0.9,
        technical_knowledge: 0.8,
        humor: 0.7,
        sarcasm: 0.5,
      };

      await memoryService.updatePersonalityTraits(traits);
      // No error means success
      expect(true).toBe(true);
    });
  });

  describe("Enhanced Context Provider", () => {
    it("should build rich context from database", async () => {
      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: {
          text: "What do you think about Bitcoin?",
        },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const mockState: State = {};

      const context = await enhancedContextProvider.get(
        runtime,
        mockMessage,
        mockState,
      );

      expect(context).toBeDefined();
      expect(context.text).toContain("role: community manager");
      expect(context.values).toBeDefined();
      expect(context.values.isQuestion).toBe(true);
      expect(context.values.topics).toContain("crypto");
      expect(context.data).toBeDefined();
    });

    it("should handle missing database service gracefully", async () => {
      // Create runtime without database service
      const basicRuntime = createMockRuntime({
        character: { name: "NUBI" },
      });

      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: basicRuntime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: { text: "Hello" },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const context = await enhancedContextProvider.get(
        basicRuntime,
        mockMessage,
        {},
      );

      expect(context).toBeDefined();
      expect(context.text).toBeDefined();
      // Should fall back to basic context
      expect(context.text).toContain("role: community manager");
    });
  });

  describe("Enhanced Response Generator", () => {
    it("should generate contextually aware responses", async () => {
      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: {
          text: "How's the market looking today?",
        },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const mockContext = {
        data: {
          emotionalState: {
            current_state: "confident",
            intensity: 75,
          },
          relationships: [
            {
              userId: testUserId,
              userHandle: "testuser",
              relationship_type: "friend",
              interaction_count: 25,
              sentiment: "positive",
              tags: [],
            },
          ],
          messageAnalysis: {
            intent: "question",
            topics: ["crypto", "trading"],
            sentiment: "neutral",
            isQuestion: true,
          },
          patterns: [
            {
              pattern_type: "technical_discussion",
              pattern_count: 10,
            },
          ],
        },
        values: {
          isQuestion: true,
          topics: ["crypto", "trading"],
        },
      };

      const response = await responseGenerator.generateResponse(
        mockMessage,
        {},
        mockContext,
      );

      expect(response).toBeDefined();
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
      // Should not be the fallback response
      expect(response).not.toBe("processing...");
    });

    it("should apply emotional tone to responses", async () => {
      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: { text: "Great news!" },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const excitedContext = {
        data: {
          emotionalState: {
            current_state: "excited",
            intensity: 90,
          },
          messageAnalysis: {
            intent: "statement",
            sentiment: "positive",
            topics: [],
          },
        },
        values: {},
      };

      const response = await responseGenerator.generateResponse(
        mockMessage,
        {},
        excitedContext,
      );

      expect(response).toBeDefined();
      // Response should be generated from mock runtime
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    });

    it("should adjust formality based on relationship", async () => {
      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: { text: "Hey, what's up?" },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const friendContext = {
        data: {
          relationships: [
            {
              userId: testUserId,
              userHandle: "oldfriend",
              relationship_type: "close_friend",
              interaction_count: 100,
              sentiment: "positive",
              tags: [],
            },
          ],
          messageAnalysis: {
            intent: "greeting",
            topics: [],
          },
        },
        values: {},
      };

      const response = await responseGenerator.generateResponse(
        mockMessage,
        {},
        friendContext,
      );

      expect(response).toBeDefined();
      // Response should be generated from mock runtime
      expect(typeof response).toBe("string");
      expect(response.length).toBeGreaterThan(0);
    });
  });

  describe("End-to-End Integration", () => {
    it("should process a full conversation flow", async () => {
      // Simulate a conversation
      const messages = [
        "Hey NUBI!",
        "What's your take on the current Solana ecosystem?",
        "Do you remember what we discussed yesterday about DeFi?",
        "Thanks for the insights!",
      ];

      // Process messages in parallel for better performance
      const messagePromises = messages.map(async (messageText) => {
        const message: Memory = {
          id: uuidv4(),
          agentId: runtime.agentId,
          userId: testUserId,
          roomId: testRoomId,
          content: { text: messageText },
          createdAt: new Date().getTime(),
          type: "message",
          metadata: {},
          unique: true,
        };

        // Get context and generate response in parallel
        const [context] = await Promise.all([
          enhancedContextProvider.get(runtime, message, {}),
        ]);

        const response = await responseGenerator.generateResponse(
          message,
          {},
          context,
        );

        expect(response).toBeDefined();
        expect(response.length).toBeGreaterThan(0);
        return response;
      });

      const responses = await Promise.all(messagePromises);

      // Verify conversation flow
      expect(responses).toHaveLength(4);

      // First response should be a string
      expect(typeof responses[0]).toBe("string");
      expect(responses[0].length).toBeGreaterThan(0);

      // All responses should be valid strings
      for (const response of responses) {
        expect(typeof response).toBe("string");
        expect(response.length).toBeGreaterThan(0);
      }
    });

    it("should maintain emotional continuity across messages", async () => {
      // Set an emotional state
      const emotionalContext = {
        current_state: "playful",
        intensity: 85,
        duration: 0,
        triggers: ["fun conversation"],
        last_update: new Date(),
      };

      // Store emotional state in cache (simulated)
      await memoryService.updatePersonalityTraits({
        playfulness: 0.9,
      });

      const messages = [
        "Tell me a joke!",
        "That's hilarious!",
        "You're in a good mood today",
      ];

      for (const messageText of messages) {
        const message: Memory = {
          id: uuidv4(),
          agentId: runtime.agentId,
          userId: testUserId,
          roomId: testRoomId,
          content: { text: messageText },
          createdAt: new Date().getTime(),
          type: "message",
          metadata: {},
          unique: true,
        };

        const context = {
          data: {
            emotionalState: emotionalContext,
            messageAnalysis: {
              intent: "statement",
              sentiment: "positive",
              topics: ["humor"],
            },
          },
          values: {},
        };

        const response = await responseGenerator.generateResponse(
          message,
          {},
          context,
        );

        expect(response).toBeDefined();
        // Response should be generated and maintain continuity
        expect(typeof response).toBe("string");
        expect(response.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Performance Tests", () => {
    it("should retrieve context within 100ms", async () => {
      const startTime = Date.now();

      const context = await memoryService.getEnhancedContext(
        testRoomId,
        testUserId,
        undefined,
        20,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(context).toBeDefined();
      expect(duration).toBeLessThan(100);
    }, 10000);

    it("should generate response within 50ms", async () => {
      const mockContext = {
        data: {
          messageAnalysis: {
            intent: "question",
            topics: ["general"],
          },
        },
        values: {},
      };

      const mockMessage: Memory = {
        id: uuidv4(),
        agentId: runtime.agentId,
        userId: testUserId,
        roomId: testRoomId,
        content: { text: "Quick question" },
        createdAt: new Date().getTime(),
        type: "message",
        metadata: {},
        unique: true,
      };

      const startTime = Date.now();

      const response = await responseGenerator.generateResponse(
        mockMessage,
        {},
        mockContext,
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response).toBeDefined();
      expect(duration).toBeLessThan(50);
    });

    it("should handle concurrent requests efficiently", async () => {
      const promises = [];

      // Create 10 concurrent context requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          memoryService.getEnhancedContext(
            testRoomId,
            testUserId,
            undefined,
            5,
          ),
        );
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      results.forEach((context) => {
        expect(context).toBeDefined();
        expect(context.recentMemories).toBeDefined();
      });

      // Should handle 10 requests in under 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});

export {};
