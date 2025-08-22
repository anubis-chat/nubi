import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { PersonalityService } from "../../services/personality-service";
import { Memory, State } from "@elizaos/core";

describe("PersonalityService", () => {
  let service: PersonalityService;

  beforeEach(() => {
    service = new PersonalityService();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe("initialization", () => {
    it("should initialize with default personality state", () => {
      const state = service.getState();
      
      expect(state.openness).toBeDefined();
      expect(state.conscientiousness).toBeDefined();
      expect(state.extraversion).toBeDefined();
      expect(state.agreeableness).toBeDefined();
      expect(state.neuroticism).toBeDefined();
      expect(state.humor).toBeDefined();
      expect(state.empathy).toBeDefined();
      expect(state.creativity).toBeDefined();
      expect(state.ancientWisdom).toBeDefined();
      expect(state.solanaMaximalism).toBeDefined();
    });

    it("should have values within valid range", () => {
      const state = service.getState();
      
      Object.values(state).forEach(value => {
        if (typeof value === "number") {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
        }
      });
    });
  });

  describe("trait management", () => {
    it("should get specific trait values", () => {
      const openness = service.getTrait("openness");
      expect(typeof openness).toBe("number");
      expect(openness).toBeGreaterThanOrEqual(0);
      expect(openness).toBeLessThanOrEqual(100);
    });

    it("should set personality state", () => {
      const newState = {
        humor: 90,
        empathy: 80,
      };

      service.setState(newState);
      
      expect(service.getTrait("humor")).toBe(90);
      expect(service.getTrait("empathy")).toBe(80);
    });

    it("should not affect other traits when setting specific ones", () => {
      const originalOpenness = service.getTrait("openness");
      
      service.setState({ humor: 95 });
      
      expect(service.getTrait("humor")).toBe(95);
      expect(service.getTrait("openness")).toBe(originalOpenness);
    });
  });

  describe("evolution from interactions", () => {
    it("should increase solanaMaximalism when Solana is mentioned", () => {
      const originalValue = service.getTrait("solanaMaximalism");
      
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: { text: "What do you think about Solana?" },
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = { sentiment: 0.5 } as State;
      
      service.evolveFromInteraction(message, state);
      
      expect(service.getTrait("solanaMaximalism")).toBeGreaterThan(originalValue);
    });

    it("should increase empathy with help requests", () => {
      const originalValue = service.getTrait("empathy");
      
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: { text: "Please help me understand this" },
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = { sentiment: 1.0 } as State;
      
      service.evolveFromInteraction(message, state);
      
      expect(service.getTrait("empathy")).toBeGreaterThan(originalValue);
    });

    it("should increase humor when jokes are mentioned", () => {
      const originalValue = service.getTrait("humor");
      
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: { text: "That's a funny joke lol" },
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = {} as State;
      
      service.evolveFromInteraction(message, state);
      
      expect(service.getTrait("humor")).toBeGreaterThan(originalValue);
    });
  });

  describe("evolution from insights", () => {
    it("should apply insight changes correctly", () => {
      const originalOpenness = service.getTrait("openness");
      const originalHumor = service.getTrait("humor");
      
      service.evolveFromInsights({
        openness: 5,
        humor: -3,
      });
      
      expect(service.getTrait("openness")).toBe(originalOpenness + 5);
      expect(service.getTrait("humor")).toBe(originalHumor - 3);
    });

    it("should clamp values within valid range", () => {
      service.setState({ openness: 98 });
      
      service.evolveFromInsights({ openness: 10 });
      
      expect(service.getTrait("openness")).toBe(100);
    });

    it("should ignore unknown traits", () => {
      const stateBefore = service.getState();
      
      service.evolveFromInsights({
        unknownTrait: 50,
      });
      
      const stateAfter = service.getState();
      expect(stateAfter).toEqual(stateBefore);
    });
  });

  describe("personality snapshot", () => {
    it("should return rounded values in snapshot", () => {
      service.setState({
        openness: 85.7,
        humor: 74.3,
        empathy: 60.8,
      });
      
      const snapshot = service.getSnapshot();
      
      expect(snapshot.openness).toBe(86);
      expect(snapshot.humor).toBe(74);
      expect(snapshot.empathy).toBe(61);
    });

    it("should only include main traits in snapshot", () => {
      const snapshot = service.getSnapshot();
      const expectedTraits = ["openness", "extraversion", "humor", "empathy", "solanaMaximalism"];
      
      Object.keys(snapshot).forEach(trait => {
        expect(expectedTraits).toContain(trait);
      });
    });
  });

  describe("response modifiers", () => {
    it("should calculate response modifiers based on personality", () => {
      service.setState({
        extraversion: 80,
        openness: 70,
        neuroticism: 40,
      });
      
      const modifiers = service.getResponseModifiers();
      
      expect(modifiers.formality).toBe(0.2); // (100 - 80) / 100
      expect(modifiers.enthusiasm).toBe(0.7); // 70 / 100
      expect(modifiers.verbosity).toBe(0.8); // 80 / 100
      expect(modifiers.emotionality).toBe(0.4); // 40 / 100
    });
  });

  describe("pattern suggestions", () => {
    it("should suggest humor pattern when humor is high", () => {
      service.setState({ humor: 80 });
      
      // Run multiple times due to randomness
      let humorSuggested = false;
      for (let i = 0; i < 20; i++) {
        if (service.shouldUsePattern("humor")) {
          humorSuggested = true;
          break;
        }
      }
      
      expect(humorSuggested).toBe(true);
    });

    it("should not suggest humor pattern when humor is low", () => {
      service.setState({ humor: 20 });
      
      // Run multiple times to ensure it's consistently false
      for (let i = 0; i < 10; i++) {
        expect(service.shouldUsePattern("humor")).toBe(false);
      }
    });

    it("should suggest casual pattern when extraversion is high", () => {
      service.setState({ extraversion: 80 });
      expect(service.shouldUsePattern("casual")).toBe(true);
    });

    it("should handle unknown patterns gracefully", () => {
      expect(service.shouldUsePattern("unknownPattern")).toBe(false);
    });
  });

  describe("world configuration", () => {
    it("should apply world-specific configuration", () => {
      // This test would need a mock YAMLConfigManager
      // For now, just verify the method exists and doesn't throw
      expect(() => service.applyWorldConfig("test-world")).not.toThrow();
    });
  });

  describe("evolution process", () => {
    it("should start and stop evolution without errors", () => {
      expect(() => service.startEvolution()).not.toThrow();
      expect(() => service.stopEvolution()).not.toThrow();
    });

    it("should handle multiple start calls gracefully", () => {
      service.startEvolution();
      service.startEvolution(); // Should not create duplicate interval
      service.stopEvolution();
      // No assertion needed - just checking it doesn't throw
    });
  });

  describe("edge cases", () => {
    it("should handle empty message text", () => {
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: { text: "" },
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = {} as State;
      
      expect(() => service.evolveFromInteraction(message, state)).not.toThrow();
    });

    it("should handle null message text", () => {
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: {},
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = {} as State;
      
      expect(() => service.evolveFromInteraction(message, state)).not.toThrow();
    });

    it("should handle negative sentiment values", () => {
      const originalEmpathy = service.getTrait("empathy");
      
      const message: Memory = {
        id: "test-id",
        entityId: "entity-1",
        roomId: "room-1",
        content: { text: "please help" },
        createdAt: Date.now(),
      } as Memory;
      
      const state: State = { sentiment: -1.0 } as State;
      
      service.evolveFromInteraction(message, state);
      
      expect(service.getTrait("empathy")).toBeLessThan(originalEmpathy);
    });
  });
});