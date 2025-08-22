import {
  Service,
  IAgentRuntime,
  Memory,
  logger,
  UUID,
} from "@elizaos/core";

/**
 * Socket.IO Real-time Events Service for NUBI
 * 
 * Implements ElizaOS Socket.IO integration with custom events:
 * - nubiRaidUpdate - Real-time raid coordination
 * - communityLeaderboard - Live leaderboard updates
 * - personalityEvolution - Personality changes broadcast
 * - sessionActivity - Session-specific events
 * - memoryInsights - Memory pattern broadcasts
 * - emotionalStateChange - Emotional transitions
 */

export interface SocketEventData {
  agentId: UUID;
  roomId?: UUID;
  userId?: UUID;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

export class SocketIOEventsService extends Service {
  static serviceType = "socket_events" as const;
  capabilityDescription = "Real-time Socket.IO events for NUBI features";

  private socketServer: any = null;
  private eventQueue: Array<{ event: string; data: SocketEventData }> = [];
  private subscribers: Map<string, Set<string>> = new Map(); // event -> Set<socketId>

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
  }

  static async start(runtime: IAgentRuntime): Promise<SocketIOEventsService> {
    const service = new SocketIOEventsService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    try {
      // Get Socket.IO server from ElizaOS runtime
      this.socketServer = (this.runtime as any).socketServer || (this.runtime as any).io;
      
      if (!this.socketServer) {
        logger.warn("[SOCKET_EVENTS] Socket.IO server not available");
        return;
      }

      // Set up NUBI-specific event listeners
      this.setupEventListeners();
      
      logger.info("[SOCKET_EVENTS] Socket.IO events service initialized");
    } catch (error) {
      logger.error("[SOCKET_EVENTS] Failed to initialize:", error);
    }
  }

  /**
   * Set up custom Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socketServer) return;

    this.socketServer.on('connection', (socket: any) => {
      logger.debug(`[SOCKET_EVENTS] Client connected: ${socket.id}`);

      // Handle room joining for targeted broadcasts
      socket.on('joinRoom', (data: { roomId: string; userId?: string }) => {
        socket.join(data.roomId);
        this.addSubscriber('roomActivity', socket.id);
        logger.debug(`[SOCKET_EVENTS] Client ${socket.id} joined room ${data.roomId}`);
      });

      // Handle specific NUBI event subscriptions
      socket.on('subscribeToNubiEvents', (events: string[]) => {
        for (const event of events) {
          if (this.isValidNubiEvent(event)) {
            this.addSubscriber(event, socket.id);
            logger.debug(`[SOCKET_EVENTS] Client ${socket.id} subscribed to ${event}`);
          }
        }
      });

      // Handle personality tracking subscription
      socket.on('trackPersonality', (agentId: string) => {
        this.addSubscriber('personalityEvolution', socket.id);
        socket.personalityTracking = agentId;
      });

      // Handle community leaderboard subscription
      socket.on('trackLeaderboard', (roomId?: string) => {
        this.addSubscriber('communityLeaderboard', socket.id);
        socket.leaderboardRoom = roomId;
      });

      // Clean up on disconnect
      socket.on('disconnect', () => {
        this.removeSubscriber(socket.id);
        logger.debug(`[SOCKET_EVENTS] Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit NUBI raid update
   */
  async emitRaidUpdate(data: {
    raidId: string;
    roomId: UUID;
    action: 'start' | 'update' | 'complete';
    participants: number;
    score?: number;
    leaderboard?: Array<{ userId: string; score: number }>;
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
      data: {
        raidId: data.raidId,
        action: data.action,
        participants: data.participants,
        score: data.score,
        leaderboard: data.leaderboard
      },
      metadata: { eventType: 'raid' }
    };

    await this.emitToRoom('nubiRaidUpdate', data.roomId, eventData);
    logger.debug(`[SOCKET_EVENTS] Emitted raid update for ${data.raidId}`);
  }

  /**
   * Emit community leaderboard update
   */
  async emitLeaderboardUpdate(data: {
    roomId: UUID;
    leaderboard: Array<{
      userId: string;
      username: string;
      score: number;
      rank: number;
      change: number;
    }>;
    period: 'daily' | 'weekly' | 'monthly';
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
      data: {
        leaderboard: data.leaderboard,
        period: data.period,
        totalParticipants: data.leaderboard.length
      },
      metadata: { eventType: 'leaderboard' }
    };

    await this.emitToRoom('communityLeaderboard', data.roomId, eventData);
    logger.debug(`[SOCKET_EVENTS] Emitted leaderboard update for room ${data.roomId}`);
  }

  /**
   * Emit personality evolution update
   */
  async emitPersonalityEvolution(data: {
    traits: Record<string, number>;
    changes: Record<string, number>;
    trigger: string;
    intensity: number;
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      timestamp: new Date().toISOString(),
      data: {
        traits: data.traits,
        changes: data.changes,
        trigger: data.trigger,
        intensity: data.intensity,
        evolution: this.analyzePersonalityChange(data.changes)
      },
      metadata: { eventType: 'personality' }
    };

    await this.emitToSubscribers('personalityEvolution', eventData);
    logger.debug(`[SOCKET_EVENTS] Emitted personality evolution: ${data.trigger}`);
  }

  /**
   * Emit session activity
   */
  async emitSessionActivity(data: {
    sessionId: UUID;
    roomId: UUID;
    userId: UUID;
    action: 'created' | 'message' | 'renewed' | 'expired' | 'ended';
    messageCount?: number;
    expiresAt?: Date;
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      roomId: data.roomId,
      userId: data.userId,
      timestamp: new Date().toISOString(),
      data: {
        sessionId: data.sessionId,
        action: data.action,
        messageCount: data.messageCount,
        expiresAt: data.expiresAt?.toISOString()
      },
      metadata: { eventType: 'session' }
    };

    await this.emitToRoom('sessionActivity', data.roomId, eventData);
    logger.debug(`[SOCKET_EVENTS] Emitted session activity: ${data.action} for ${data.sessionId}`);
  }

  /**
   * Emit memory insights
   */
  async emitMemoryInsights(data: {
    roomId: UUID;
    patterns: Array<{ type: string; count: number; significance: number }>;
    relationships: Array<{ userId: string; strength: number; type: string }>;
    trends: Array<{ metric: string; direction: 'up' | 'down' | 'stable'; change: number }>;
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
      data: {
        patterns: data.patterns,
        relationships: data.relationships,
        trends: data.trends,
        summary: this.generateInsightsSummary(data)
      },
      metadata: { eventType: 'memory' }
    };

    await this.emitToRoom('memoryInsights', data.roomId, eventData);
    logger.debug(`[SOCKET_EVENTS] Emitted memory insights for room ${data.roomId}`);
  }

  /**
   * Emit emotional state change
   */
  async emitEmotionalStateChange(data: {
    roomId?: UUID;
    previousEmotion: string;
    currentEmotion: string;
    intensity: number;
    triggers: string[];
    duration: number;
  }): Promise<void> {
    const eventData: SocketEventData = {
      agentId: this.runtime.agentId,
      roomId: data.roomId,
      timestamp: new Date().toISOString(),
      data: {
        transition: `${data.previousEmotion} → ${data.currentEmotion}`,
        previousEmotion: data.previousEmotion,
        currentEmotion: data.currentEmotion,
        intensity: data.intensity,
        triggers: data.triggers,
        duration: data.duration,
        emotional_context: this.getEmotionalContext(data.currentEmotion, data.intensity)
      },
      metadata: { eventType: 'emotion' }
    };

    if (data.roomId) {
      await this.emitToRoom('emotionalStateChange', data.roomId, eventData);
    } else {
      await this.emitToSubscribers('emotionalStateChange', eventData);
    }
    
    logger.debug(`[SOCKET_EVENTS] Emitted emotional state change: ${data.previousEmotion} → ${data.currentEmotion}`);
  }

  /**
   * Generic method to emit to room
   */
  private async emitToRoom(event: string, roomId: UUID, data: SocketEventData): Promise<void> {
    if (!this.socketServer) {
      this.queueEvent(event, data);
      return;
    }

    this.socketServer.to(roomId).emit(event, data);
  }

  /**
   * Generic method to emit to event subscribers
   */
  private async emitToSubscribers(event: string, data: SocketEventData): Promise<void> {
    if (!this.socketServer) {
      this.queueEvent(event, data);
      return;
    }

    const subscribers = this.subscribers.get(event);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    for (const socketId of subscribers) {
      const socket = this.socketServer.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit(event, data);
      }
    }
  }

  /**
   * Queue events when Socket.IO is not available
   */
  private queueEvent(event: string, data: SocketEventData): void {
    this.eventQueue.push({ event, data });
    
    // Keep queue size manageable
    if (this.eventQueue.length > 100) {
      this.eventQueue.shift();
    }
  }

  /**
   * Process queued events when Socket.IO becomes available
   */
  private async processQueuedEvents(): Promise<void> {
    if (!this.socketServer || this.eventQueue.length === 0) {
      return;
    }

    logger.info(`[SOCKET_EVENTS] Processing ${this.eventQueue.length} queued events`);
    
    for (const { event, data } of this.eventQueue) {
      await this.emitToSubscribers(event, data);
    }
    
    this.eventQueue = [];
  }

  /**
   * Helper methods
   */
  private isValidNubiEvent(event: string): boolean {
    const validEvents = [
      'nubiRaidUpdate',
      'communityLeaderboard',
      'personalityEvolution',
      'sessionActivity',
      'memoryInsights',
      'emotionalStateChange'
    ];
    return validEvents.includes(event);
  }

  private addSubscriber(event: string, socketId: string): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(socketId);
  }

  private removeSubscriber(socketId: string): void {
    for (const [event, subscribers] of this.subscribers) {
      subscribers.delete(socketId);
      if (subscribers.size === 0) {
        this.subscribers.delete(event);
      }
    }
  }

  private analyzePersonalityChange(changes: Record<string, number>): {
    dominant: string;
    direction: 'positive' | 'negative' | 'mixed';
    magnitude: 'small' | 'medium' | 'large';
  } {
    const entries = Object.entries(changes);
    const maxChange = Math.max(...entries.map(([_, v]) => Math.abs(v)));
    const dominant = entries.find(([_, v]) => Math.abs(v) === maxChange)?.[0] || 'unknown';
    
    const positiveChanges = entries.filter(([_, v]) => v > 0).length;
    const negativeChanges = entries.filter(([_, v]) => v < 0).length;
    
    return {
      dominant,
      direction: positiveChanges > negativeChanges ? 'positive' : 
                negativeChanges > positiveChanges ? 'negative' : 'mixed',
      magnitude: maxChange > 0.5 ? 'large' : maxChange > 0.2 ? 'medium' : 'small'
    };
  }

  private generateInsightsSummary(data: any): {
    totalPatterns: number;
    strongestPattern: string;
    relationshipCount: number;
    trendingUp: number;
    trendingDown: number;
  } {
    return {
      totalPatterns: data.patterns.length,
      strongestPattern: data.patterns.reduce((max: any, p: any) => 
        p.significance > (max?.significance || 0) ? p : max, null)?.type || 'none',
      relationshipCount: data.relationships.length,
      trendingUp: data.trends.filter((t: any) => t.direction === 'up').length,
      trendingDown: data.trends.filter((t: any) => t.direction === 'down').length
    };
  }

  private getEmotionalContext(emotion: string, intensity: number): {
    category: string;
    energy: 'low' | 'medium' | 'high';
    valence: 'positive' | 'negative' | 'neutral';
  } {
    const emotionCategories: Record<string, { energy: string; valence: string }> = {
      happy: { energy: 'high', valence: 'positive' },
      excited: { energy: 'high', valence: 'positive' },
      calm: { energy: 'low', valence: 'positive' },
      sad: { energy: 'low', valence: 'negative' },
      angry: { energy: 'high', valence: 'negative' },
      neutral: { energy: 'medium', valence: 'neutral' },
      focused: { energy: 'medium', valence: 'positive' },
      confused: { energy: 'medium', valence: 'negative' }
    };

    const context = emotionCategories[emotion] || { energy: 'medium', valence: 'neutral' };
    
    return {
      category: emotion,
      energy: intensity > 70 ? 'high' : intensity > 40 ? 'medium' : 'low',
      valence: context.valence as any
    };
  }

  /**
   * Get real-time statistics
   */
  async getStatistics(): Promise<{
    connectedClients: number;
    activeSubscriptions: Record<string, number>;
    queuedEvents: number;
    eventsEmittedToday: number;
  }> {
    const connectedClients = this.socketServer ? 
      Object.keys(this.socketServer.sockets.sockets).length : 0;
    
    const activeSubscriptions: Record<string, number> = {};
    for (const [event, subscribers] of this.subscribers) {
      activeSubscriptions[event] = subscribers.size;
    }

    return {
      connectedClients,
      activeSubscriptions,
      queuedEvents: this.eventQueue.length,
      eventsEmittedToday: 0 // Would be tracked with actual metrics
    };
  }

  /**
   * Clean up on service stop
   */
  async stop(): Promise<void> {
    this.eventQueue = [];
    this.subscribers.clear();
    logger.info("[SOCKET_EVENTS] Service stopped");
  }
}

export default SocketIOEventsService;