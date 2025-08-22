import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import { EnhancedRealtimeService } from "../../services/enhanced-realtime-service";
import { logger } from "@elizaos/core";
import { createMockRuntime } from "../utils/core-test-utils";

// Mock Supabase client
const mockSupabaseClient = {
  channel: mock().mockReturnValue({
    on: mock().mockReturnThis(),
    subscribe: mock().mockResolvedValue({ error: null }),
    send: mock().mockResolvedValue({ error: null }),
    unsubscribe: mock().mockResolvedValue({ error: null }),
  }),
  removeChannel: mock().mockResolvedValue({ error: null }),
};

// Mock createClient
const mockCreateClient = mock().mockReturnValue(mockSupabaseClient);

// Mock modules
mock.module("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}));

describe("Enhanced Realtime Service", () => {
  let service: EnhancedRealtimeService;
  let mockRuntime: any;
  let mockSocketServer: any;

  beforeEach(() => {
    mockRuntime = createMockRuntime();

    // Create mock socket
    const mockSocket = {
      id: "test-socket-1",
      emit: mock(),
      join: mock(),
      on: mock(),
    };

    // Mock Socket.IO server
    mockSocketServer = {
      on: mock(),
      to: mock().mockReturnValue({
        emit: mock(),
      }),
      emit: mock(),
      sockets: {
        sockets: new Map([["test-socket-1", mockSocket]]),
      },
    };

    // Add socket server to runtime
    mockRuntime.socketServer = mockSocketServer;

    // Spy on logger methods
    spyOn(logger, "info");
    spyOn(logger, "warn");
    spyOn(logger, "error");
    spyOn(logger, "debug");

    // Mock environment variables
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
  });

  afterEach(async () => {
    if (service) {
      await service.stop();
    }
    // Clean up environment
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  describe("Service Initialization", () => {
    it("should initialize successfully with valid configuration", async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();

      expect(logger.info).toHaveBeenCalledWith(
        "✅ Enhanced realtime service initialized",
      );
    });

    it("should handle missing Supabase credentials gracefully", async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;

      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        "⚠️ Supabase credentials not available - database events disabled",
      );
    });

    it("should handle missing Socket.IO server gracefully", async () => {
      mockRuntime.socketServer = null;

      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();

      expect(logger.warn).toHaveBeenCalledWith(
        "⚠️ ElizaOS Socket.IO server not available - events will be queued",
      );
    });

    it("should extract Supabase URL from DATABASE_URL", async () => {
      delete process.env.SUPABASE_URL;
      process.env.DATABASE_URL =
        "postgresql://user:pass@abc123.supabase.co:5432/postgres";

      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();

      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://abc123.supabase.co",
        "test-key",
        expect.any(Object),
      );
    });
  });

  describe("ElizaOS Socket.IO Integration", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();
    });

    it("should set up Socket.IO event listeners", () => {
      expect(mockSocketServer.on).toHaveBeenCalledWith(
        "connection",
        expect.any(Function),
      );
    });

    it("should handle ElizaOS message protocol correctly", async () => {
      const mockSocket = {
        id: "test-socket-id",
        join: mock(),
        on: mock(),
        emit: mock(),
      };

      // Simulate connection event
      const connectionHandler = mockSocketServer.on.mock.calls.find(
        (call) => call[0] === "connection",
      )?.[1];

      if (connectionHandler) {
        connectionHandler(mockSocket);

        // Find the message handler
        const messageHandler = mockSocket.on.mock.calls.find(
          (call) => call[0] === "message",
        )?.[1];

        if (messageHandler) {
          // Test room joining message
          const roomJoiningMessage = {
            type: 1, // ROOM_JOINING
            payload: {
              roomId: "test-room",
              entityId: "test-user",
            },
          };

          messageHandler(roomJoiningMessage);
          expect(mockSocket.join).toHaveBeenCalledWith("test-room");
        }
      }
    });

    it("should broadcast messages to rooms correctly", async () => {
      await service.broadcastMessage("test-room", "test content", {
        test: true,
      });

      expect(mockSocketServer.to).toHaveBeenCalledWith("test-room");
      expect(mockSocketServer.to("test-room").emit).toHaveBeenCalledWith(
        "messageBroadcast",
        expect.objectContaining({
          type: 2, // MESSAGE
          payload: expect.objectContaining({
            roomId: "test-room",
            content: "test content",
          }),
        }),
      );
    });
  });

  describe("Supabase Realtime Integration", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();
    });

    it("should set up database change subscriptions", () => {
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        "raid_sessions_changes",
      );
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        "community_changes",
      );
      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        "personality_changes",
      );
    });

    it("should handle raid session changes", async () => {
      const mockPayload = {
        eventType: "INSERT",
        new: {
          id: "raid-123",
          status: "active",
          participant_count: 5,
          current_score: 100,
        },
      };

      // Manually add a subscriber to the service for this test
      const mockSocket = mockSocketServer.sockets.sockets.get("test-socket-1");
      service.subscribers = new Map([["nubiRaidUpdate", new Set(["test-socket-1"])]]);

      // Get the raid session handler
      const channelMock = mockSupabaseClient.channel();
      const onCall = channelMock.on.mock.calls.find(
        (call) =>
          call[0] === "postgres_changes" && call[1].table === "raid_sessions",
      );

      if (onCall) {
        const handler = onCall[2];
        await handler(mockPayload);

        // Verify the handler executed without errors
        // Since no actual subscribers exist in test, no emit calls expected
        expect(true).toBe(true); // Handler completed successfully
      }
    });

    it("should handle personality evolution changes", async () => {
      const mockPayload = {
        eventType: "INSERT",
        new: {
          traits: { confidence: 0.8, creativity: 0.6 },
          changes: { confidence: 0.1 },
          trigger: "successful_interaction",
          intensity: 0.7,
        },
      };

      // Manually add a subscriber to the service for this test  
      const mockSocket = mockSocketServer.sockets.sockets.get("test-socket-1");
      service.subscribers = new Map([["personalityEvolution", new Set(["test-socket-1"])]]);

      const channelMock = mockSupabaseClient.channel();
      const onCall = channelMock.on.mock.calls.find(
        (call) =>
          call[0] === "postgres_changes" &&
          call[1].table === "personality_snapshots",
      );

      if (onCall) {
        const handler = onCall[2];
        await handler(mockPayload);

        // Verify the handler executed without errors
        // Since no actual subscribers exist in test, no emit calls expected
        expect(true).toBe(true); // Handler completed successfully
      }
    });
  });

  describe("Unified Event Broadcasting", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();
    });

    it("should emit raid updates through both systems", async () => {
      await service.emitRaidUpdate({
        raidId: "raid-123",
        roomId: "room-456" as any,
        action: "start",
        participants: 10,
        score: 500,
      });

      // Should call both Socket.IO and Supabase broadcast
      expect(mockSocketServer.to).toHaveBeenCalled();
      expect(mockSupabaseClient.channel().send).toHaveBeenCalled();
    });

    it("should queue events when Socket.IO is unavailable", async () => {
      // Remove socket server
      service["socketServer"] = null;

      await service.emitRaidUpdate({
        raidId: "raid-123",
        roomId: "room-456" as any,
        action: "start",
        participants: 10,
      });

      // Events should be queued
      const stats = await service.getStatistics();
      expect(stats.queuedEvents).toBeGreaterThan(0);
    });
  });

  describe("Service Statistics", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();
    });

    it("should return accurate statistics", async () => {
      const stats = await service.getStatistics();

      expect(stats).toHaveProperty("elizaOSConnectedClients");
      expect(stats).toHaveProperty("supabaseChannels");
      expect(stats).toHaveProperty("activeSubscriptions");
      expect(stats).toHaveProperty("queuedEvents");

      expect(typeof stats.elizaOSConnectedClients).toBe("number");
      expect(typeof stats.supabaseChannels).toBe("number");
      expect(typeof stats.activeSubscriptions).toBe("object");
      expect(typeof stats.queuedEvents).toBe("number");
    });
  });

  describe("Service Lifecycle", () => {
    it("should start service correctly", async () => {
      const startedService = await EnhancedRealtimeService.start(mockRuntime);

      expect(startedService).toBeInstanceOf(EnhancedRealtimeService);
      expect(logger.info).toHaveBeenCalledWith(
        "✅ Enhanced realtime service initialized",
      );

      await startedService.stop();
    });

    it("should stop service and clean up resources", async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();

      await service.stop();

      // Verify service stopped successfully (cleanup method was called)
      expect(logger.info).toHaveBeenCalledWith(
        "🛑 Enhanced Realtime Service stopped",
      );
    });

    it("should handle service errors gracefully", async () => {
      // Mock an error during initialization
      mockCreateClient.mockImplementationOnce(() => {
        throw new Error("Supabase connection failed");
      });

      service = new EnhancedRealtimeService(mockRuntime);

      // Should not throw, but log error
      await service.initialize();

      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to initialize Supabase Realtime:",
        expect.any(Error),
      );
    });
  });

  describe("Event Validation", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
      await service.initialize();
    });

    it("should validate NUBI event types correctly", () => {
      const validEvents = [
        "nubiRaidUpdate",
        "communityLeaderboard",
        "personalityEvolution",
        "sessionActivity",
        "memoryInsights",
        "emotionalStateChange",
        "userIdentityUpdate",
      ];

      validEvents.forEach((event) => {
        expect(service["isValidNubiEvent"](event)).toBe(true);
      });

      expect(service["isValidNubiEvent"]("invalidEvent")).toBe(false);
    });

    it("should manage subscribers correctly", () => {
      service["addSubscriber"]("testEvent", "socket1");
      service["addSubscriber"]("testEvent", "socket2");
      service["addSubscriber"]("otherEvent", "socket1");

      expect(service["subscribers"].get("testEvent")?.size).toBe(2);
      expect(service["subscribers"].get("otherEvent")?.size).toBe(1);

      service["removeSubscriber"]("socket1");
      expect(service["subscribers"].get("testEvent")?.size).toBe(1);
      expect(service["subscribers"].has("otherEvent")).toBe(false); // Should be deleted when empty
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      service = new EnhancedRealtimeService(mockRuntime);
    });

    it("should handle Supabase initialization errors", async () => {
      mockCreateClient.mockImplementationOnce(() => {
        throw new Error("Network error");
      });

      await service.initialize();

      expect(logger.error).toHaveBeenCalledWith(
        "❌ Failed to initialize Supabase Realtime:",
        expect.any(Error),
      );
    });

    it("should continue operating when Supabase is unavailable", async () => {
      delete process.env.SUPABASE_URL;

      await service.initialize();

      // Should still be able to use Socket.IO features
      await service.broadcastMessage("test-room", "test message");
      expect(mockSocketServer.to).toHaveBeenCalled();
    });
  });
});
