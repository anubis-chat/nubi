import { logger } from "@elizaos/core";
import { Database } from "sqlite3";
import * as path from "path";

/**
 * Variable Collector Service
 *
 * Learns and tracks commonly needed variables over time,
 * building user-specific patterns and preferences
 */
export class VariableCollector {
  private db: Database | null = null;
  private patternCache = new Map<string, VariablePattern>();
  private userPreferences = new Map<string, UserPreferences>();
  private commonVariables = new Map<string, number>(); // variable name -> usage count

  constructor(dbPath?: string) {
    this.initializeDatabase(dbPath);
  }

  /**
   * Initialize database for persistent pattern storage
   */
  private async initializeDatabase(dbPath?: string): Promise<void> {
    const finalPath =
      dbPath || path.join(process.cwd(), "data", "variables.db");

    this.db = new Database(finalPath, (err) => {
      if (err) {
        logger.error("Failed to open variable collector database:", err instanceof Error ? err.message : String(err));
        this.db = null;
      } else {
        logger.info("Variable collector database connected");
        this.createTables();
      }
    });
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) return;

    const queries = [
      `CREATE TABLE IF NOT EXISTS variable_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        variable_name TEXT NOT NULL,
        variable_value TEXT,
        usage_count INTEGER DEFAULT 1,
        last_used INTEGER,
        context TEXT,
        created_at INTEGER,
        UNIQUE(user_id, variable_name, variable_value)
      )`,

      `CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        preferred_name TEXT,
        favorite_topics TEXT,
        language_style TEXT,
        greeting_style TEXT,
        typical_active_hours TEXT,
        preferred_protocols TEXT,
        watched_tokens TEXT,
        communication_patterns TEXT,
        metadata TEXT,
        updated_at INTEGER
      )`,

      `CREATE TABLE IF NOT EXISTS common_variables (
        variable_name TEXT PRIMARY KEY,
        usage_count INTEGER DEFAULT 1,
        sample_values TEXT,
        contexts TEXT,
        importance_score REAL DEFAULT 0.5,
        last_updated INTEGER
      )`,

      `CREATE TABLE IF NOT EXISTS learned_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name TEXT UNIQUE,
        template_pattern TEXT,
        variables_used TEXT,
        success_rate REAL DEFAULT 0.5,
        usage_count INTEGER DEFAULT 0,
        created_at INTEGER
      )`,

      `CREATE INDEX IF NOT EXISTS idx_patterns_user ON variable_patterns(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_patterns_variable ON variable_patterns(variable_name)`,
      `CREATE INDEX IF NOT EXISTS idx_common_usage ON common_variables(usage_count DESC)`,
    ];

    for (const query of queries) {
      await new Promise<void>((resolve, reject) => {
        this.db!.run(query, (err) => {
          if (err) {
            logger.error("Failed to create table:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Collect and learn from variable usage
   */
  async collectVariables(
    userId: string,
    variables: Record<string, any>,
    context: string,
  ): Promise<void> {
    // Track each variable usage
    for (const [name, value] of Object.entries(variables)) {
      await this.trackVariable(userId, name, value, context);
    }

    // Update user preferences based on patterns
    await this.updateUserPreferences(userId, variables);

    // Learn common variable patterns
    await this.learnCommonPatterns(variables);
  }

  /**
   * Track individual variable usage
   */
  private async trackVariable(
    userId: string,
    name: string,
    value: any,
    context: string,
  ): Promise<void> {
    if (!this.db) return;

    const valueStr = JSON.stringify(value);
    const now = Date.now();

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO variable_patterns (user_id, variable_name, variable_value, usage_count, last_used, context, created_at)
         VALUES (?, ?, ?, 1, ?, ?, ?)
         ON CONFLICT(user_id, variable_name, variable_value)
         DO UPDATE SET usage_count = usage_count + 1, last_used = ?`,
        [userId, name, valueStr, now, context, now, now],
        (err) => {
          if (err) {
            logger.error("Failed to track variable:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });

    // Update cache
    const cacheKey = `${userId}:${name}`;
    const pattern = this.patternCache.get(cacheKey) || {
      userId,
      variableName: name,
      values: new Map(),
      totalUsage: 0,
      contexts: new Set(),
    };

    pattern.values.set(valueStr, (pattern.values.get(valueStr) || 0) + 1);
    pattern.totalUsage++;
    pattern.contexts.add(context);
    this.patternCache.set(cacheKey, pattern);
  }

  /**
   * Update user preferences based on collected patterns
   */
  private async updateUserPreferences(
    userId: string,
    variables: Record<string, any>,
  ): Promise<void> {
    const prefs = this.userPreferences.get(userId) || {
      userId,
      preferredName: null,
      favoriteTopics: [],
      languageStyle: "normal",
      greetingStyle: null,
      typicalActiveHours: [],
      preferredProtocols: [],
      watchedTokens: [],
      communicationPatterns: {},
    };

    // Learn from current variables
    if (variables.user?.preferred_name) {
      prefs.preferredName = variables.user.preferred_name;
    }

    if (variables.content?.mentioned_protocols?.length > 0) {
      variables.content.mentioned_protocols.forEach((protocol: string) => {
        if (!prefs.preferredProtocols.includes(protocol)) {
          prefs.preferredProtocols.push(protocol);
        }
      });
    }

    if (variables.content?.mentioned_tokens?.length > 0) {
      variables.content.mentioned_tokens.forEach((token: string) => {
        if (!prefs.watchedTokens.includes(token)) {
          prefs.watchedTokens.push(token);
        }
      });
    }

    if (variables.time?.hour !== undefined) {
      const hour = variables.time.hour;
      if (!prefs.typicalActiveHours.includes(hour)) {
        prefs.typicalActiveHours.push(hour);
      }
    }

    // Update cache and database
    this.userPreferences.set(userId, prefs);
    await this.saveUserPreferences(prefs);
  }

  /**
   * Save user preferences to database
   */
  private async saveUserPreferences(prefs: UserPreferences): Promise<void> {
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO user_preferences 
         (user_id, preferred_name, favorite_topics, language_style, greeting_style,
          typical_active_hours, preferred_protocols, watched_tokens, 
          communication_patterns, metadata, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prefs.userId,
          prefs.preferredName,
          JSON.stringify(prefs.favoriteTopics),
          prefs.languageStyle,
          prefs.greetingStyle,
          JSON.stringify(prefs.typicalActiveHours),
          JSON.stringify(prefs.preferredProtocols),
          JSON.stringify(prefs.watchedTokens),
          JSON.stringify(prefs.communicationPatterns),
          JSON.stringify(prefs.metadata || {}),
          Date.now(),
        ],
        (err) => {
          if (err) {
            logger.error("Failed to save user preferences:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Learn common patterns across all users
   */
  private async learnCommonPatterns(
    variables: Record<string, any>,
  ): Promise<void> {
    // Track which variables are commonly used
    const flatVariables = this.flattenObject(variables);

    for (const [name, value] of Object.entries(flatVariables)) {
      this.commonVariables.set(name, (this.commonVariables.get(name) || 0) + 1);

      // Update database periodically
      if (this.commonVariables.get(name)! % 10 === 0) {
        await this.updateCommonVariable(name, value);
      }
    }
  }

  /**
   * Update common variable in database
   */
  private async updateCommonVariable(
    name: string,
    sampleValue: any,
  ): Promise<void> {
    if (!this.db) return;

    const count = this.commonVariables.get(name) || 1;

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO common_variables (variable_name, usage_count, sample_values, last_updated)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(variable_name)
         DO UPDATE SET usage_count = usage_count + 1, last_updated = ?`,
        [name, count, JSON.stringify([sampleValue]), Date.now(), Date.now()],
        (err) => {
          if (err) {
            logger.error("Failed to update common variable:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    // Check cache first
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId)!;
    }

    // Load from database
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      this.db!.get(
        `SELECT * FROM user_preferences WHERE user_id = ?`,
        [userId],
        (err, row: any) => {
          if (err) {
            logger.error("Failed to get user preferences:", err instanceof Error ? err.message : String(err));
            resolve(null);
          } else if (row) {
            const prefs: UserPreferences = {
              userId: row.user_id,
              preferredName: row.preferred_name,
              favoriteTopics: JSON.parse(row.favorite_topics || "[]"),
              languageStyle: row.language_style,
              greetingStyle: row.greeting_style,
              typicalActiveHours: JSON.parse(row.typical_active_hours || "[]"),
              preferredProtocols: JSON.parse(row.preferred_protocols || "[]"),
              watchedTokens: JSON.parse(row.watched_tokens || "[]"),
              communicationPatterns: JSON.parse(
                row.communication_patterns || "{}",
              ),
              metadata: JSON.parse(row.metadata || "{}"),
            };

            this.userPreferences.set(userId, prefs);
            resolve(prefs);
          } else {
            resolve(null);
          }
        },
      );
    });
  }

  /**
   * Get most used variables for a user
   */
  async getUserPatterns(
    userId: string,
    limit: number = 10,
  ): Promise<VariablePattern[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT variable_name, variable_value, usage_count, context
         FROM variable_patterns
         WHERE user_id = ?
         ORDER BY usage_count DESC
         LIMIT ?`,
        [userId, limit],
        (err, rows: any[]) => {
          if (err) {
            logger.error("Failed to get user patterns:", err instanceof Error ? err.message : String(err));
            resolve([]);
          } else {
            const patterns = rows.map((row) => ({
              userId,
              variableName: row.variable_name,
              values: new Map([[row.variable_value, row.usage_count]]),
              totalUsage: row.usage_count,
              contexts: new Set([row.context]),
            }));
            resolve(patterns);
          }
        },
      );
    });
  }

  /**
   * Get commonly used variables across all users
   */
  async getCommonVariables(limit: number = 20): Promise<CommonVariable[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM common_variables
         ORDER BY usage_count DESC
         LIMIT ?`,
        [limit],
        (err, rows: any[]) => {
          if (err) {
            logger.error("Failed to get common variables:", err instanceof Error ? err.message : String(err));
            resolve([]);
          } else {
            const variables = rows.map((row) => ({
              name: row.variable_name,
              usageCount: row.usage_count,
              sampleValues: JSON.parse(row.sample_values || "[]"),
              importanceScore: row.importance_score,
            }));
            resolve(variables);
          }
        },
      );
    });
  }

  /**
   * Learn and save a template pattern
   */
  async learnTemplate(
    name: string,
    pattern: string,
    variablesUsed: string[],
    success: boolean,
  ): Promise<void> {
    if (!this.db) return;

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `INSERT INTO learned_templates (template_name, template_pattern, variables_used, success_rate, usage_count, created_at)
         VALUES (?, ?, ?, ?, 1, ?)
         ON CONFLICT(template_name)
         DO UPDATE SET 
           usage_count = usage_count + 1,
           success_rate = (success_rate * usage_count + ?) / (usage_count + 1)`,
        [
          name,
          pattern,
          JSON.stringify(variablesUsed),
          success ? 1.0 : 0.0,
          Date.now(),
          success ? 1.0 : 0.0,
        ],
        (err) => {
          if (err) {
            logger.error("Failed to learn template:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Get successful templates
   */
  async getSuccessfulTemplates(
    minSuccessRate: number = 0.7,
  ): Promise<LearnedTemplate[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM learned_templates
         WHERE success_rate >= ?
         ORDER BY success_rate DESC, usage_count DESC`,
        [minSuccessRate],
        (err, rows: any[]) => {
          if (err) {
            logger.error("Failed to get templates:", err instanceof Error ? err.message : String(err));
            resolve([]);
          } else {
            const templates = rows.map((row) => ({
              name: row.template_name,
              pattern: row.template_pattern,
              variablesUsed: JSON.parse(row.variables_used || "[]"),
              successRate: row.success_rate,
              usageCount: row.usage_count,
            }));
            resolve(templates);
          }
        },
      );
    });
  }

  /**
   * Suggest variables based on context
   */
  async suggestVariables(
    userId: string,
    currentContext: string,
  ): Promise<SuggestedVariables> {
    const userPrefs = await this.getUserPreferences(userId);
    const userPatterns = await this.getUserPatterns(userId, 5);
    const commonVars = await this.getCommonVariables(10);

    const suggestions: SuggestedVariables = {
      userSpecific: {},
      contextual: {},
      common: {},
    };

    // Add user-specific suggestions
    if (userPrefs) {
      if (userPrefs.preferredName) {
        suggestions.userSpecific.preferred_name = userPrefs.preferredName;
      }
      if (userPrefs.watchedTokens.length > 0) {
        suggestions.userSpecific.watched_tokens = userPrefs.watchedTokens;
      }
      if (userPrefs.preferredProtocols.length > 0) {
        suggestions.userSpecific.preferred_protocols =
          userPrefs.preferredProtocols;
      }
    }

    // Add contextual suggestions based on patterns
    userPatterns.forEach((pattern) => {
      if (pattern.contexts.has(currentContext)) {
        const mostUsedValue = Array.from(pattern.values.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];
        if (mostUsedValue) {
          suggestions.contextual[pattern.variableName] = JSON.parse(
            mostUsedValue[0],
          );
        }
      }
    });

    // Add common variables
    commonVars.slice(0, 5).forEach((variable) => {
      if (variable.sampleValues.length > 0) {
        suggestions.common[variable.name] = variable.sampleValues[0];
      }
    });

    return suggestions;
  }

  /**
   * Flatten nested object for variable tracking
   */
  private flattenObject(obj: any, prefix: string = ""): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Clean up old data
   */
  async cleanup(daysToKeep: number = 30): Promise<void> {
    if (!this.db) return;

    const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    await new Promise<void>((resolve, reject) => {
      this.db!.run(
        `DELETE FROM variable_patterns WHERE last_used < ?`,
        [cutoff],
        (err) => {
          if (err) {
            logger.error("Failed to cleanup old patterns:", err instanceof Error ? err.message : String(err));
            reject(err);
          } else {
            logger.info("Cleaned up old variable patterns");
            resolve();
          }
        },
      );
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await new Promise<void>((resolve) => {
        this.db!.close((err) => {
          if (err) {
            logger.error("Error closing variable collector database:", err instanceof Error ? err.message : String(err));
          }
          resolve();
        });
      });
      this.db = null;
    }

    this.patternCache.clear();
    this.userPreferences.clear();
    this.commonVariables.clear();
  }
}

// Type definitions

interface VariablePattern {
  userId: string;
  variableName: string;
  values: Map<string, number>; // value -> usage count
  totalUsage: number;
  contexts: Set<string>;
}

interface UserPreferences {
  userId: string;
  preferredName: string | null;
  favoriteTopics: string[];
  languageStyle: string;
  greetingStyle: string | null;
  typicalActiveHours: number[];
  preferredProtocols: string[];
  watchedTokens: string[];
  communicationPatterns: Record<string, any>;
  metadata?: Record<string, any>;
}

interface CommonVariable {
  name: string;
  usageCount: number;
  sampleValues: any[];
  importanceScore: number;
}

interface LearnedTemplate {
  name: string;
  pattern: string;
  variablesUsed: string[];
  successRate: number;
  usageCount: number;
}

interface SuggestedVariables {
  userSpecific: Record<string, any>;
  contextual: Record<string, any>;
  common: Record<string, any>;
}

export default VariableCollector;
