import { IAgentRuntime, logger } from "@elizaos/core";
import SessionsService from "../services/sessions-service";

/**
 * ElizaOS Sessions API Routes
 * 
 * Full compliance with ElizaOS Sessions API specification:
 * - POST /api/sessions/create - Create new session
 * - POST /api/sessions/{id}/message - Send message to session
 * - GET /api/sessions/{id}/history - Get message history
 * - PUT /api/sessions/{id}/renew - Renew session
 * - POST /api/sessions/{id}/heartbeat - Update heartbeat
 * - DELETE /api/sessions/{id} - End session
 * - GET /api/sessions - List sessions
 * - GET /api/sessions/analytics - Get analytics
 */

export const sessionsRoutes = [
  {
    path: "/api/sessions/create",
    type: "POST" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { userId, timeoutMinutes, autoRenew, metadata } = request.body || {};

        // Validate timeout range
        if (timeoutMinutes !== undefined && (timeoutMinutes < 5 || timeoutMinutes > 1440)) {
          return response.status(400).json({
            success: false,
            error: "timeoutMinutes must be between 5 and 1440"
          });
        }

        const session = await sessionsService.createSession(userId, {
          timeoutMinutes,
          autoRenew,
          metadata
        });

        logger.info(`[SESSIONS_API] Created session ${session.id}`);

        response.json({
          success: true,
          session: {
            id: session.id,
            agentId: session.agentId,
            userId: session.userId,
            roomId: session.roomId,
            status: session.status,
            timeoutMinutes: session.timeoutMinutes,
            autoRenew: session.autoRenew,
            expiresAt: session.expiresAt.toISOString(),
            createdAt: session.createdAt.toISOString(),
            metadata: session.metadata
          }
        });
      } catch (error) {
        logger.error("[SESSIONS_API] Failed to create session:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  },

  {
    path: "/api/sessions/:sessionId/message",
    type: "POST" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { sessionId } = request.params;
        const { senderId, senderType, content, metadata } = request.body || {};

        if (!senderId || !senderType || !content) {
          return response.status(400).json({
            success: false,
            error: "senderId, senderType, and content are required"
          });
        }

        if (!['user', 'agent'].includes(senderType)) {
          return response.status(400).json({
            success: false,
            error: "senderType must be 'user' or 'agent'"
          });
        }

        const message = await sessionsService.sendSessionMessage(
          sessionId,
          senderId,
          senderType,
          content,
          metadata
        );

        // If this is a user message to the agent, generate response
        let agentResponse = null;
        if (senderType === 'user') {
          try {
            // Create memory object for agent processing
            const memory = {
              id: message.id,
              agentId: runtime.agentId,
              userId: senderId,
              entityId: senderId,
              roomId: sessionId,
              content: content,
              createdAt: Date.now(), // Use timestamp instead of Date object
              type: "message",
              metadata: metadata || {},
              unique: true
            };

            // Use composeState for context-aware response
            const state = await runtime.composeState(memory);

            // Generate response using runtime's message generation
            const responseContent = await (runtime as any).messageManager?.createMemory({
              ...memory,
              agentId: runtime.agentId
            });

            if (responseContent) {
              agentResponse = await sessionsService.sendSessionMessage(
                sessionId,
                runtime.agentId,
                'agent',
                responseContent,
                { generatedAt: new Date().toISOString() }
              );
            }
          } catch (responseError) {
            logger.error("[SESSIONS_API] Failed to generate agent response:", responseError);
            // Continue without agent response
          }
        }

        response.json({
          success: true,
          message: {
            id: message.id,
            sessionId: message.sessionId,
            senderId: message.senderId,
            senderType: message.senderType,
            content: message.content,
            timestamp: message.timestamp.toISOString(),
            sequenceNumber: message.sequenceNumber,
            metadata: message.metadata
          },
          agentResponse: agentResponse ? {
            id: agentResponse.id,
            sessionId: agentResponse.sessionId,
            senderId: agentResponse.senderId,
            senderType: agentResponse.senderType,
            content: agentResponse.content,
            timestamp: agentResponse.timestamp.toISOString(),
            sequenceNumber: agentResponse.sequenceNumber,
            metadata: agentResponse.metadata
          } : null
        });

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to send message:", error);
        
        if (error instanceof Error && error.message.includes('expired')) {
          response.status(410).json({
            success: false,
            error: "Session has expired",
            code: "SESSION_EXPIRED"
          });
        } else if (error instanceof Error && error.message.includes('not found')) {
          response.status(404).json({
            success: false,
            error: "Session not found",
            code: "SESSION_NOT_FOUND"
          });
        } else {
          response.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error"
          });
        }
      }
    }
  },

  {
    path: "/api/sessions/:sessionId/history",
    type: "GET" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { sessionId } = request.params;
        const limit = parseInt(request.query?.limit) || 50;
        const offset = parseInt(request.query?.offset) || 0;

        if (limit > 100) {
          return response.status(400).json({
            success: false,
            error: "limit cannot exceed 100"
          });
        }

        const messages = await sessionsService.getSessionHistory(sessionId, limit, offset);

        response.json({
          success: true,
          sessionId,
          messages: messages.map(msg => ({
            id: msg.id,
            senderId: msg.senderId,
            senderType: msg.senderType,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
            sequenceNumber: msg.sequenceNumber,
            metadata: msg.metadata
          })),
          pagination: {
            limit,
            offset,
            hasMore: messages.length === limit
          }
        });

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to get history:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  },

  {
    path: "/api/sessions/:sessionId/renew",
    type: "PUT" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { sessionId } = request.params;
        const { timeoutMinutes } = request.body || {};

        if (timeoutMinutes !== undefined && (timeoutMinutes < 5 || timeoutMinutes > 1440)) {
          return response.status(400).json({
            success: false,
            error: "timeoutMinutes must be between 5 and 1440"
          });
        }

        const session = await sessionsService.renewSession(sessionId, timeoutMinutes);

        response.json({
          success: true,
          session: {
            id: session.id,
            status: session.status,
            timeoutMinutes: session.timeoutMinutes,
            expiresAt: session.expiresAt.toISOString(),
            lastActivity: session.lastActivity.toISOString(),
            updatedAt: session.updatedAt.toISOString()
          }
        });

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to renew session:", error);
        
        if (error instanceof Error && error.message.includes('not found')) {
          response.status(404).json({
            success: false,
            error: "Session not found or not active",
            code: "SESSION_NOT_FOUND"
          });
        } else {
          response.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Internal server error"
          });
        }
      }
    }
  },

  {
    path: "/api/sessions/:sessionId/heartbeat",
    type: "POST" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { sessionId } = request.params;
        const success = await sessionsService.updateHeartbeat(sessionId);

        if (success) {
          response.json({
            success: true,
            timestamp: new Date().toISOString()
          });
        } else {
          response.status(404).json({
            success: false,
            error: "Session not found or not active",
            code: "SESSION_NOT_FOUND"
          });
        }

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to update heartbeat:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  },

  {
    path: "/api/sessions/:sessionId",
    type: "DELETE" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const { sessionId } = request.params;
        const success = await sessionsService.endSession(sessionId);

        if (success) {
          response.json({
            success: true,
            message: "Session ended successfully"
          });
        } else {
          response.status(404).json({
            success: false,
            error: "Session not found or already ended",
            code: "SESSION_NOT_FOUND"
          });
        }

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to end session:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  },

  {
    path: "/api/sessions",
    type: "GET" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const userId = request.query?.userId;
        const status = request.query?.status;
        const limit = Math.min(parseInt(request.query?.limit) || 20, 100);
        const offset = parseInt(request.query?.offset) || 0;

        if (status && !['active', 'expired', 'ended'].includes(status)) {
          return response.status(400).json({
            success: false,
            error: "status must be 'active', 'expired', or 'ended'"
          });
        }

        const sessions = await sessionsService.listSessions(userId, status, limit, offset);

        response.json({
          success: true,
          sessions: sessions.map(session => ({
            id: session.id,
            agentId: session.agentId,
            userId: session.userId,
            roomId: session.roomId,
            status: session.status,
            timeoutMinutes: session.timeoutMinutes,
            autoRenew: session.autoRenew,
            expiresAt: session.expiresAt.toISOString(),
            lastActivity: session.lastActivity.toISOString(),
            createdAt: session.createdAt.toISOString(),
            metadata: session.metadata
          })),
          pagination: {
            limit,
            offset,
            hasMore: sessions.length === limit
          }
        });

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to list sessions:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  },

  {
    path: "/api/sessions/analytics",
    type: "GET" as const,
    handler: async (request: any, response: any, runtime: IAgentRuntime) => {
      try {
        const sessionsService = runtime.getService<SessionsService>("sessions");
        if (!sessionsService) {
          return response.status(503).json({
            success: false,
            error: "Sessions service not available"
          });
        }

        const days = Math.min(parseInt(request.query?.days) || 7, 30);
        const analytics = await sessionsService.getSessionAnalytics(days);

        response.json({
          success: true,
          analytics: {
            period: `${days} days`,
            summary: analytics.summary,
            dailyStats: analytics.dailyStats.map((stat: any) => ({
              date: stat.session_date,
              totalSessions: stat.total_sessions,
              uniqueUsers: stat.unique_users,
              avgDurationMinutes: Math.round(stat.avg_duration_minutes || 0),
              avgTimeoutSetting: stat.avg_timeout_setting,
              activeSessions: stat.active_sessions,
              expiredSessions: stat.expired_sessions,
              endedSessions: stat.ended_sessions,
              avgMessagesPerSession: Math.round(stat.avg_messages_per_session || 0)
            }))
          }
        });

      } catch (error) {
        logger.error("[SESSIONS_API] Failed to get analytics:", error);
        response.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Internal server error"
        });
      }
    }
  }
];

export default sessionsRoutes;