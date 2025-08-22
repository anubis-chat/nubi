import { Database } from "sqlite3";
import { TweetResult } from "../x-integration/x-posting-service";
import { logger } from "../utils/logger";
import * as path from "path";
import * as fs from "fs";

export interface RaidSession {
  id: string;
  tweetId: string;
  tweetUrl: string;
  startTime: number;
  endTime: number;
  status: "active" | "completed" | "cancelled";
  totalParticipants: number;
}

export interface RaidParticipant {
  raidId: string;
  userId: string;
  username: string;
  actions: string[]; // JSON array of actions
  points: number;
  joinedAt: number;
  position: number; // Order of joining
}

export interface RaidStats {
  totalParticipants: number;
  totalPoints: number;
  topRaider: { username: string; points: number } | null;
  status: string;
}

export class RaidTracker {
  private db!: Database;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(process.cwd(), "data", "raids.db");
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath, (err) => {
        if (err) {
          logger.error("Failed to open database:", err);
          reject(err);
          return;
        }

        logger.info("Raid database opened successfully");
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    const queries = [
      `CREATE TABLE IF NOT EXISTS raids (
        id TEXT PRIMARY KEY,
        tweet_id TEXT UNIQUE,
        tweet_url TEXT,
        started_at INTEGER,
        ended_at INTEGER,
        total_participants INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active'
      )`,

      `CREATE TABLE IF NOT EXISTS raid_participants (
        raid_id TEXT,
        user_id TEXT,
        username TEXT,
        actions TEXT DEFAULT '[]',
        points INTEGER DEFAULT 0,
        joined_at INTEGER,
        position INTEGER,
        PRIMARY KEY (raid_id, user_id),
        FOREIGN KEY (raid_id) REFERENCES raids(id)
      )`,

      `CREATE TABLE IF NOT EXISTS leaderboard (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        total_points INTEGER DEFAULT 0,
        raids_participated INTEGER DEFAULT 0,
        last_active INTEGER,
        best_raid_score INTEGER DEFAULT 0
      )`,

      // Community profiles for enhanced relationship tracking
      `CREATE TABLE IF NOT EXISTS community_profiles (
        user_id TEXT PRIMARY KEY,
        handle TEXT,
        first_seen INTEGER,
        interests TEXT DEFAULT '[]',
        influence_level TEXT DEFAULT 'newcomer',
        interaction_count INTEGER DEFAULT 0,
        sentiment TEXT DEFAULT 'neutral',
        last_interaction INTEGER,
        notable_quotes TEXT DEFAULT '[]',
        preferred_topics TEXT DEFAULT '[]',
        communication_style TEXT DEFAULT 'casual',
        timezone TEXT,
        projects TEXT DEFAULT '[]'
      )`,

      // Community relationships for social dynamics
      `CREATE TABLE IF NOT EXISTS community_relationships (
        user_id TEXT,
        target_id TEXT,
        relationship_type TEXT DEFAULT 'acquaintance',
        strength REAL DEFAULT 0.0,
        last_interaction INTEGER,
        interaction_count INTEGER DEFAULT 0,
        sentiment REAL DEFAULT 0.0,
        notes TEXT,
        PRIMARY KEY (user_id, target_id)
      )`,

      // User identity mapping for cross-platform tracking
      `CREATE TABLE IF NOT EXISTS user_identities (
        internal_id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        platform_user_id TEXT NOT NULL,
        platform_username TEXT,
        display_name TEXT,
        room_id TEXT,
        first_seen INTEGER,
        last_seen INTEGER,
        metadata TEXT,
        UNIQUE(platform, platform_user_id)
      )`,

      // Links between identities for same person across platforms
      `CREATE TABLE IF NOT EXISTS identity_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        primary_identity TEXT,
        linked_identity TEXT,
        confidence REAL DEFAULT 0.0,
        link_reason TEXT,
        created_at INTEGER,
        FOREIGN KEY (primary_identity) REFERENCES user_identities(internal_id),
        FOREIGN KEY (linked_identity) REFERENCES user_identities(internal_id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_raids_status ON raids(status)`,
      `CREATE INDEX IF NOT EXISTS idx_participants_raid ON raid_participants(raid_id)`,
      `CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_community_profiles_handle ON community_profiles(handle)`,
      `CREATE INDEX IF NOT EXISTS idx_community_profiles_influence ON community_profiles(influence_level)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_user ON community_relationships(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_relationships_strength ON community_relationships(strength DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_identities_platform ON user_identities(platform, platform_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_identities_username ON user_identities(platform_username)`,
      `CREATE INDEX IF NOT EXISTS idx_identity_links_primary ON identity_links(primary_identity)`,
      `CREATE INDEX IF NOT EXISTS idx_identity_links_linked ON identity_links(linked_identity)`,

      // Indexes for new tables
      `CREATE INDEX IF NOT EXISTS idx_user_raids_initiator ON user_initiated_raids(initiated_by)`,
      `CREATE INDEX IF NOT EXISTS idx_user_raids_raid ON user_initiated_raids(raid_id)`,
      `CREATE INDEX IF NOT EXISTS idx_raid_targets_channel ON raid_targets(channel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_chat_locks_raid ON chat_locks(raid_id)`,
      `CREATE INDEX IF NOT EXISTS idx_verified_engagements_raid ON verified_engagements(raid_id)`,
      `CREATE INDEX IF NOT EXISTS idx_verified_engagements_user ON verified_engagements(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_banned_raiders_banned_by ON banned_raiders(banned_by)`,

      // User-initiated raids tracking
      `CREATE TABLE IF NOT EXISTS user_initiated_raids (
        id TEXT PRIMARY KEY,
        raid_id TEXT NOT NULL,
        initiated_by TEXT NOT NULL,
        initiator_username TEXT,
        original_message_id TEXT,
        detected_url TEXT,
        prophet_bonus REAL DEFAULT 2.0,
        initiated_at INTEGER,
        FOREIGN KEY (raid_id) REFERENCES raids(id)
      )`,

      // Raid targets for chat locking
      `CREATE TABLE IF NOT EXISTS raid_targets (
        raid_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        likes_target INTEGER DEFAULT 0,
        retweets_target INTEGER DEFAULT 0,
        comments_target INTEGER DEFAULT 0,
        quotes_target INTEGER DEFAULT 0,
        set_by TEXT NOT NULL,
        set_at INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        FOREIGN KEY (raid_id) REFERENCES raids(id)
      )`,

      // Chat lock states
      `CREATE TABLE IF NOT EXISTS chat_locks (
        channel_id TEXT PRIMARY KEY,
        raid_id TEXT NOT NULL,
        is_locked BOOLEAN DEFAULT 0,
        locked_at INTEGER,
        locked_by TEXT,
        unlock_reason TEXT,
        likes_progress INTEGER DEFAULT 0,
        retweets_progress INTEGER DEFAULT 0,
        comments_progress INTEGER DEFAULT 0,
        quotes_progress INTEGER DEFAULT 0,
        last_progress_update INTEGER,
        FOREIGN KEY (raid_id) REFERENCES raids(id)
      )`,

      // Engagement verification tracking
      `CREATE TABLE IF NOT EXISTS verified_engagements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raid_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        tweet_id TEXT NOT NULL,
        engagement_type TEXT NOT NULL,
        verified_at INTEGER NOT NULL,
        points_awarded INTEGER DEFAULT 0,
        multiplier REAL DEFAULT 1.0,
        verification_method TEXT DEFAULT 'api',
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (raid_id) REFERENCES raids(id)
      )`,

      // Banned raiders tracking
      `CREATE TABLE IF NOT EXISTS banned_raiders (
        user_id TEXT PRIMARY KEY,
        username TEXT,
        banned_by TEXT NOT NULL,
        banned_at INTEGER NOT NULL,
        reason TEXT,
        ban_type TEXT DEFAULT 'permanent',
        expires_at INTEGER,
        metadata TEXT DEFAULT '{}'
      )`,

      /* PYRAMID SYSTEM - READY TO ACTIVATE
      // Pyramid structure tracking
      `CREATE TABLE IF NOT EXISTS pyramid_structure (
        user_id TEXT PRIMARY KEY,
        referrer_id TEXT,
        level INTEGER DEFAULT 0,
        referrals TEXT DEFAULT '[]',
        total_descendants INTEGER DEFAULT 0,
        joined_at INTEGER,
        last_active INTEGER,
        conversion_rate REAL DEFAULT 0.0,
        total_rewards REAL DEFAULT 0.0,
        monthly_rewards REAL DEFAULT 0.0,
        status TEXT DEFAULT 'active',
        title TEXT,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (referrer_id) REFERENCES pyramid_structure(user_id)
      )`,

      // Referral rewards tracking
      `CREATE TABLE IF NOT EXISTS referral_rewards (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        level INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT DEFAULT 'instant',
        status TEXT DEFAULT 'pending',
        transaction_hash TEXT,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (from_user_id) REFERENCES pyramid_structure(user_id),
        FOREIGN KEY (to_user_id) REFERENCES pyramid_structure(user_id)
      )`,

      // Pyramid achievements
      `CREATE TABLE IF NOT EXISTS pyramid_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        achievement TEXT NOT NULL,
        unlocked_at INTEGER NOT NULL,
        rarity TEXT DEFAULT 'common',
        reward REAL DEFAULT 0,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES pyramid_structure(user_id),
        UNIQUE(user_id, achievement)
      )`,

      // Referral links tracking
      `CREATE TABLE IF NOT EXISTS referral_links (
        code TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        uses INTEGER DEFAULT 0,
        max_uses INTEGER DEFAULT -1,
        expires_at INTEGER,
        platform TEXT,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES pyramid_structure(user_id)
      )`,

      // Pyramid statistics (for leaderboard)
      `CREATE TABLE IF NOT EXISTS pyramid_stats (
        user_id TEXT PRIMARY KEY,
        week_referrals INTEGER DEFAULT 0,
        month_referrals INTEGER DEFAULT 0,
        total_referrals INTEGER DEFAULT 0,
        week_rewards REAL DEFAULT 0.0,
        month_rewards REAL DEFAULT 0.0,
        total_rewards REAL DEFAULT 0.0,
        best_week INTEGER DEFAULT 0,
        best_month INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_updated INTEGER,
        FOREIGN KEY (user_id) REFERENCES pyramid_structure(user_id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_pyramid_referrer ON pyramid_structure(referrer_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pyramid_level ON pyramid_structure(level)`,
      `CREATE INDEX IF NOT EXISTS idx_pyramid_status ON pyramid_structure(status)`,
      `CREATE INDEX IF NOT EXISTS idx_rewards_user ON referral_rewards(to_user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_rewards_status ON referral_rewards(status)`,
      `CREATE INDEX IF NOT EXISTS idx_achievements_user ON pyramid_achievements(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_links_user ON referral_links(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_stats_referrals ON pyramid_stats(total_referrals DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_stats_rewards ON pyramid_stats(total_rewards DESC)`,
      END PYRAMID SYSTEM */
    ];

    for (const query of queries) {
      await this.runQuery(query);
    }

    logger.info("Database tables created successfully");
  }

  private runQuery(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          logger.error("Database query failed:", err);
          reject(err);
        } else {
          resolve(this);
        }
      });
    });
  }

  private getQuery(query: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          logger.error("Database query failed:", err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private allQuery(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          logger.error("Database query failed:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async createRaid(tweetData: TweetResult): Promise<string> {
    const raidId = `raid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const endTime = startTime + 30 * 60 * 1000; // 30 minutes default

    await this.runQuery(
      `INSERT INTO raids (id, tweet_id, tweet_url, started_at, ended_at, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [raidId, tweetData.tweetId, tweetData.url, startTime, endTime, "active"],
    );

    logger.info(`Created raid: ${raidId} for tweet: ${tweetData.tweetId}`);
    return raidId;
  }

  async joinRaid(
    raidId: string,
    userId: string,
    username: string,
  ): Promise<boolean> {
    try {
      // Check if raid is active
      const raid = await this.getRaid(raidId);
      if (!raid || raid.status !== "active") {
        logger.warn(`Attempt to join inactive raid: ${raidId}`);
        return false;
      }

      // Check if already joined
      const existing = await this.getQuery(
        `SELECT user_id FROM raid_participants WHERE raid_id = ? AND user_id = ?`,
        [raidId, userId],
      );

      if (existing) {
        logger.info(`User ${username} already in raid ${raidId}`);
        return false;
      }

      // Get position (order of joining)
      const position = raid.totalParticipants + 1;

      // Add participant
      await this.runQuery(
        `INSERT INTO raid_participants (raid_id, user_id, username, joined_at, position, points) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [raidId, userId, username, Date.now(), position, 0],
      );

      // Update raid participant count
      await this.runQuery(
        `UPDATE raids SET total_participants = total_participants + 1 WHERE id = ?`,
        [raidId],
      );

      logger.info(
        `User ${username} joined raid ${raidId} at position ${position}`,
      );
      return true;
    } catch (error) {
      logger.error("Failed to join raid:", error);
      return false;
    }
  }

  async recordAction(
    raidId: string,
    userId: string,
    action: string,
    points: number,
  ): Promise<void> {
    try {
      // Get current actions
      const participant = await this.getQuery(
        `SELECT actions, points FROM raid_participants WHERE raid_id = ? AND user_id = ?`,
        [raidId, userId],
      );

      if (!participant) {
        logger.warn(`Participant ${userId} not found in raid ${raidId}`);
        return;
      }

      const actions = JSON.parse(participant.actions || "[]");
      actions.push(action);

      // Calculate bonus based on position
      const position = await this.getParticipantPosition(raidId, userId);
      let multiplier = 1;
      if (position <= 5) multiplier = 3;
      else if (position <= 10) multiplier = 2;
      else if (position <= 25) multiplier = 1.5;

      const totalPoints = participant.points + points * multiplier;

      // Update participant
      await this.runQuery(
        `UPDATE raid_participants 
         SET actions = ?, points = ? 
         WHERE raid_id = ? AND user_id = ?`,
        [JSON.stringify(actions), totalPoints, raidId, userId],
      );

      // Update leaderboard
      await this.updateLeaderboard(userId, points * multiplier);

      logger.info(
        `Recorded action ${action} for user ${userId} in raid ${raidId}: ${points * multiplier} points`,
      );
    } catch (error) {
      logger.error("Failed to record action:", error);
    }
  }

  async updateLeaderboard(userId: string, points: number): Promise<void> {
    try {
      const existing = await this.getQuery(
        `SELECT total_points, raids_participated FROM leaderboard WHERE user_id = ?`,
        [userId],
      );

      if (existing) {
        await this.runQuery(
          `UPDATE leaderboard 
           SET total_points = total_points + ?, 
               last_active = ?,
               best_raid_score = MAX(best_raid_score, ?)
           WHERE user_id = ?`,
          [points, Date.now(), points, userId],
        );
      } else {
        // Get username from recent participation
        const participant = await this.getQuery(
          `SELECT username FROM raid_participants WHERE user_id = ? LIMIT 1`,
          [userId],
        );

        await this.runQuery(
          `INSERT INTO leaderboard (user_id, username, total_points, raids_participated, last_active, best_raid_score) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            participant?.username || "Unknown",
            points,
            1,
            Date.now(),
            points,
          ],
        );
      }
    } catch (error) {
      logger.error("Failed to update leaderboard:", error);
    }
  }

  async getParticipantPosition(
    raidId: string,
    userId: string,
  ): Promise<number> {
    const participant = await this.getQuery(
      `SELECT position FROM raid_participants WHERE raid_id = ? AND user_id = ?`,
      [raidId, userId],
    );
    return participant?.position || 999;
  }

  async getRaid(raidId: string): Promise<RaidSession | null> {
    const raid = await this.getQuery(`SELECT * FROM raids WHERE id = ?`, [
      raidId,
    ]);

    if (!raid) return null;

    return {
      id: raid.id,
      tweetId: raid.tweet_id,
      tweetUrl: raid.tweet_url,
      startTime: raid.started_at,
      endTime: raid.ended_at,
      status: raid.status,
      totalParticipants: raid.total_participants,
    };
  }

  async getRaidStats(raidId: string): Promise<RaidStats> {
    const raid = await this.getRaid(raidId);

    if (!raid) {
      return {
        totalParticipants: 0,
        totalPoints: 0,
        topRaider: null,
        status: "not_found",
      };
    }

    const participants = await this.allQuery(
      `SELECT username, points FROM raid_participants 
       WHERE raid_id = ? 
       ORDER BY points DESC 
       LIMIT 1`,
      [raidId],
    );

    const totalPoints = await this.getQuery(
      `SELECT SUM(points) as total FROM raid_participants WHERE raid_id = ?`,
      [raidId],
    );

    return {
      totalParticipants: raid.totalParticipants,
      totalPoints: totalPoints?.total || 0,
      topRaider: participants[0]
        ? {
            username: participants[0].username,
            points: participants[0].points,
          }
        : null,
      status: raid.status,
    };
  }

  async getLeaderboard(limit: number = 10): Promise<any[]> {
    return await this.allQuery(
      `SELECT username, total_points, raids_participated, best_raid_score 
       FROM leaderboard 
       ORDER BY total_points DESC 
       LIMIT ?`,
      [limit],
    );
  }

  async getUserStats(userId: string): Promise<any> {
    const stats = await this.getQuery(
      `SELECT * FROM leaderboard WHERE user_id = ?`,
      [userId],
    );

    if (!stats) {
      return {
        totalPoints: 0,
        raidsParticipated: 0,
        bestRaidScore: 0,
        rank: "Unranked",
      };
    }

    // Get rank
    const rank = await this.getQuery(
      `SELECT COUNT(*) + 1 as rank 
       FROM leaderboard 
       WHERE total_points > (SELECT total_points FROM leaderboard WHERE user_id = ?)`,
      [userId],
    );

    return {
      ...stats,
      rank: rank?.rank || "Unranked",
    };
  }

  async endRaid(raidId: string): Promise<void> {
    await this.runQuery(
      `UPDATE raids SET status = 'completed', ended_at = ? WHERE id = ?`,
      [Date.now(), raidId],
    );

    // Update raids participated for all participants
    const participants = await this.allQuery(
      `SELECT user_id FROM raid_participants WHERE raid_id = ?`,
      [raidId],
    );

    for (const participant of participants) {
      await this.runQuery(
        `UPDATE leaderboard 
         SET raids_participated = raids_participated + 1 
         WHERE user_id = ?`,
        [participant.user_id],
      );
    }

    logger.info(`Raid ${raidId} ended`);
  }

  async getActiveRaids(): Promise<RaidSession[]> {
    const raids = await this.allQuery(
      `SELECT * FROM raids WHERE status = 'active' ORDER BY started_at DESC`,
    );

    return raids.map((raid) => ({
      id: raid.id,
      tweetId: raid.tweet_id,
      tweetUrl: raid.tweet_url,
      startTime: raid.started_at,
      endTime: raid.ended_at,
      status: raid.status,
      totalParticipants: raid.total_participants,
    }));
  }

  async cleanup(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          logger.error("Error closing database:", err);
        } else {
          logger.info("Database closed successfully");
        }
        resolve();
      });
    });
  }
}
