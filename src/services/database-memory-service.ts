import {
  Service,
  IAgentRuntime,
  Memory,
  logger,
  UUID,
} from "@elizaos/core";
import { Client } from "pg";

/**
 * Enhanced Database Memory Service
 * 
 * Provides advanced memory retrieval using PostgreSQL features:
 * - Semantic search with vector embeddings
 * - Pattern recognition from materialized views
 * - Multi-table context aggregation
 * - NUBI-specific analytics functions
 */

interface MemoryPattern {
  pattern_type: string;
  pattern_count: number;
  avg_sentiment: number;
  unique_users: number;
  first_seen: Date;
  last_seen: Date;
}

interface EntityInteraction {
  entity_name: string;
  entity_type: string;
  total_mentions: number;
  avg_sentiment: number;
}

interface RelationshipContext {
  userId: string;
  userHandle: string;
  relationship_type: string;
  interaction_count: number;
  sentiment: string;
  tags: string[];
}

interface EmotionalContext {
  current_state: string;
  intensity: number;
  duration: number;
  triggers: string[];
  last_update: Date;
}

interface EnhancedMemoryContext {
  recentMemories: Memory[];
  semanticMemories: Memory[];
  patterns: MemoryPattern[];
  entities: EntityInteraction[];
  relationships: RelationshipContext[];
  emotionalState: EmotionalContext | null;
  communityContext: any;
  agentStats: any;
}

export class DatabaseMemoryService extends Service {
  static serviceType = "database_memory" as const;
  capabilityDescription = "Advanced database-driven memory retrieval and context building";

  private dbClient: Client | null = null;
  private agentId: UUID;

  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
    this.agentId = runtime.agentId;
  }

  static async start(runtime: IAgentRuntime): Promise<DatabaseMemoryService> {
    const service = new DatabaseMemoryService(runtime);
    await service.initialize();
    return service;
  }

  private async initialize(): Promise<void> {
    try {
      // Use runtime's database connection if available
      const databaseUrl = process.env.DATABASE_URL || 
        "postgresql://postgres:Anubisdata1!@db.nfnmoqepgjyutcbbaqjg.supabase.co:5432/postgres";
      
      this.dbClient = new Client({
        connectionString: databaseUrl,
      });

      await this.dbClient.connect();
      logger.info("[DATABASE_MEMORY_SERVICE] Connected to PostgreSQL");

      // Verify agent exists
      const agentCheck = await this.dbClient.query(
        'SELECT id, name FROM agents WHERE id = $1 OR name = $2 LIMIT 1',
        [this.agentId, 'NUBI']
      );

      if (agentCheck.rows.length > 0) {
        this.agentId = agentCheck.rows[0].id;
        logger.info(`[DATABASE_MEMORY_SERVICE] Using agent: ${agentCheck.rows[0].name} (${this.agentId})`);
      }
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive memory context for response generation
   */
  async getEnhancedContext(
    roomId: UUID,
    userId?: UUID,
    topic?: string,
    limit: number = 20
  ): Promise<EnhancedMemoryContext> {
    const context: EnhancedMemoryContext = {
      recentMemories: [],
      semanticMemories: [],
      patterns: [],
      entities: [],
      relationships: [],
      emotionalState: null,
      communityContext: {},
      agentStats: {},
    };

    try {
      // 1. Get recent memories
      context.recentMemories = await this.getRecentMemories(roomId, limit);

      // 2. Get semantic memories if topic provided
      if (topic) {
        context.semanticMemories = await this.getSemanticMemories(topic, roomId, limit);
      }

      // 3. Get memory patterns from materialized view
      context.patterns = await this.getMemoryPatterns(roomId);

      // 4. Get entity interactions
      context.entities = await this.getEntityInteractions();

      // 5. Get relationship context if userId provided
      if (userId) {
        context.relationships = await this.getRelationshipContext(userId);
      }

      // 6. Get emotional state
      context.emotionalState = await this.getEmotionalState();

      // 7. Get community context
      context.communityContext = await this.getCommunityContext(roomId);

      // 8. Get agent activity stats
      context.agentStats = await this.getAgentStats();

      logger.debug("[DATABASE_MEMORY_SERVICE] Built enhanced context: " +
        `memories=${context.recentMemories.length}, ` +
        `semantic=${context.semanticMemories.length}, ` +
        `patterns=${context.patterns.length}, ` +
        `relationships=${context.relationships.length}`);

      return context;
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to build context:", error);
      return context; // Return partial context
    }
  }

  /**
   * Get recent memories from the room
   */
  private async getRecentMemories(roomId: UUID, limit: number): Promise<Memory[]> {
    try {
      const result = await this.dbClient!.query(
        `SELECT * FROM memories 
         WHERE "roomId" = $1 AND "agentId" = $2
         ORDER BY "createdAt" DESC
         LIMIT $3`,
        [roomId, this.agentId, limit]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        agentId: row.agentId,
        userId: row.entityId,
        entityId: row.entityId, // Add entityId field
        roomId: row.roomId,
        content: row.content,
        createdAt: row.createdAt,
        type: row.type,
        metadata: row.metadata,
        unique: row.unique,
      }));
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to get recent memories:", error);
      return [];
    }
  }

  /**
   * Get semantically similar memories using vector search
   */
  private async getSemanticMemories(topic: string, roomId: UUID, limit: number): Promise<Memory[]> {
    try {
      // First, get embedding for the topic (simplified - would use actual embedding model)
      // For now, use text similarity search
      const result = await this.dbClient!.query(
        `SELECT m.* FROM memories m
         WHERE m."agentId" = $1
           AND m."roomId" = $2
           AND (
             m.content->>'text' ILIKE $3
             OR m.content->>'text' @@ plainto_tsquery($4)
           )
         ORDER BY m."createdAt" DESC
         LIMIT $5`,
        [this.agentId, roomId, `%${topic}%`, topic, limit]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        agentId: row.agentId,
        userId: row.entityId,
        entityId: row.entityId, // Add entityId field
        roomId: row.roomId,
        content: row.content,
        createdAt: row.createdAt,
        type: row.type,
        metadata: row.metadata,
        unique: row.unique,
      }));
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to get semantic memories:", error);
      return [];
    }
  }

  /**
   * Get memory patterns from materialized view
   */
  private async getMemoryPatterns(roomId: UUID): Promise<MemoryPattern[]> {
    try {
      const result = await this.dbClient!.query(
        `SELECT * FROM get_memory_patterns($1)
         WHERE room_id = $2
         ORDER BY pattern_count DESC
         LIMIT 10`,
        [this.agentId, roomId]
      );

      return result.rows.map((row: any) => ({
        pattern_type: row.pattern_type,
        pattern_count: row.pattern_count,
        avg_sentiment: row.avg_sentiment,
        unique_users: row.unique_users,
        first_seen: row.first_seen,
        last_seen: row.last_seen,
      }));
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Memory patterns not available:", error);
      return [];
    }
  }

  /**
   * Get entity interactions from materialized view
   */
  private async getEntityInteractions(): Promise<EntityInteraction[]> {
    try {
      const result = await this.dbClient!.query(
        `SELECT * FROM get_entity_interactions($1)
         ORDER BY total_mentions DESC
         LIMIT 20`,
        [this.agentId]
      );

      return result.rows.map((row: any) => ({
        entity_name: row.entity_name,
        entity_type: row.entity_type,
        total_mentions: row.total_mentions,
        avg_sentiment: row.avg_sentiment,
      }));
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Entity interactions not available:", error);
      return [];
    }
  }

  /**
   * Get relationship context for a user
   */
  private async getRelationshipContext(userId: UUID): Promise<RelationshipContext[]> {
    try {
      const result = await this.dbClient!.query(
        `SELECT 
           r.*,
           e.names,
           e.metadata
         FROM relationships r
         JOIN entities e ON r."targetEntityId" = e.id
         WHERE r."sourceEntityId" = $1 AND r."agentId" = $2
         ORDER BY r."created_at" DESC
         LIMIT 10`,
        [userId, this.agentId]
      );

      return result.rows.map((row: any) => ({
        userId: row.targetEntityId,
        userHandle: row.names?.[0] || 'unknown',
        relationship_type: row.metadata?.type || 'acquaintance',
        interaction_count: row.metadata?.interaction_count || 0,
        sentiment: row.metadata?.sentiment || 'neutral',
        tags: row.tags || [],
      }));
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Relationships not available:", error);
      return [];
    }
  }

  /**
   * Get current emotional state
   */
  private async getEmotionalState(): Promise<EmotionalContext | null> {
    try {
      const result = await this.dbClient!.query(
        `SELECT 
           value->>'current_state' as current_state,
           (value->>'intensity')::float as intensity,
           (value->>'duration')::bigint as duration,
           value->'triggers' as triggers,
           created_at as last_update
         FROM cache
         WHERE agent_id = $1 AND key = 'emotional_state'
         ORDER BY created_at DESC
         LIMIT 1`,
        [this.agentId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        current_state: row.current_state || 'neutral',
        intensity: row.intensity || 70,
        duration: row.duration || 0,
        triggers: row.triggers || [],
        last_update: row.last_update,
      };
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Emotional state not available:", error);
      return null;
    }
  }

  /**
   * Get community context
   */
  private async getCommunityContext(roomId: UUID): Promise<any> {
    try {
      const result = await this.dbClient!.query(
        `SELECT 
           COUNT(DISTINCT p."entityId") as unique_participants,
           COUNT(DISTINCT m.id) as total_messages,
           AVG(LENGTH(m.content->>'text')) as avg_message_length,
           MAX(m."createdAt") as last_activity
         FROM rooms r
         LEFT JOIN participants p ON r.id = p."roomId"
         LEFT JOIN memories m ON r.id = m."roomId"
         WHERE r.id = $1 AND r."agentId" = $2
         GROUP BY r.id`,
        [roomId, this.agentId]
      );

      if (result.rows.length === 0) return {};

      return {
        participants: result.rows[0].unique_participants || 0,
        messages: result.rows[0].total_messages || 0,
        avgMessageLength: Math.round(result.rows[0].avg_message_length || 0),
        lastActivity: result.rows[0].last_activity,
      };
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Community context not available:", error);
      return {};
    }
  }

  /**
   * Get agent activity statistics
   */
  private async getAgentStats(): Promise<any> {
    try {
      const result = await this.dbClient!.query(
        `SELECT * FROM get_agent_activity_summary($1)`,
        [this.agentId]
      );

      if (result.rows.length === 0) return {};

      const stats = result.rows[0];
      return {
        totalMessages: stats.total_messages || 0,
        totalMemories: stats.total_memories || 0,
        uniqueRooms: stats.unique_rooms || 0,
        uniqueUsers: stats.unique_users || 0,
        avgMessageLength: Math.round(stats.avg_message_length || 0),
        mostActiveHour: stats.most_active_hour || 0,
      };
    } catch (error) {
      logger.warn("[DATABASE_MEMORY_SERVICE] Agent stats not available:", error);
      return {};
    }
  }

  /**
   * Store memory with vector embedding
   */
  async storeMemoryWithEmbedding(
    memory: Memory,
    embedding?: number[]
  ): Promise<boolean> {
    try {
      // Store memory (ElizaOS handles basic storage)
      // We just add the embedding if provided
      if (embedding && embedding.length > 0) {
        const dimensionMap: { [key: number]: string } = {
          384: 'dim_384',
          512: 'dim_512',
          768: 'dim_768',
          1024: 'dim_1024',
          1536: 'dim_1536',
          3072: 'dim_3072',
        };

        const column = dimensionMap[embedding.length];
        if (column) {
          await this.dbClient!.query(
            `INSERT INTO embeddings (memory_id, ${column}, created_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (memory_id) DO UPDATE SET ${column} = $2`,
            [memory.id, `[${embedding.join(',')}]`]
          );
          logger.debug(`[DATABASE_MEMORY_SERVICE] Stored embedding for memory ${memory.id}`);
        }
      }
      return true;
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to store embedding:", error);
      return false;
    }
  }

  /**
   * Update personality traits based on interactions
   */
  async updatePersonalityTraits(traits: Record<string, number>): Promise<void> {
    try {
      await this.dbClient!.query(
        `INSERT INTO cache (key, agent_id, value, created_at)
         VALUES ('personality_traits', $1, $2, NOW())
         ON CONFLICT (key, agent_id) DO UPDATE SET 
           value = $2,
           created_at = NOW()`,
        [this.agentId, JSON.stringify(traits)]
      );
      logger.debug("[DATABASE_MEMORY_SERVICE] Updated personality traits");
    } catch (error) {
      logger.error("[DATABASE_MEMORY_SERVICE] Failed to update traits:", error);
    }
  }

  /**
   * Clean up on service stop
   */
  async stop(): Promise<void> {
    if (this.dbClient) {
      await this.dbClient.end();
      logger.info("[DATABASE_MEMORY_SERVICE] Disconnected from PostgreSQL");
    }
  }
}

export default DatabaseMemoryService;