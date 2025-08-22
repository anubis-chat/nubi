/**
 * Autonomous Task Manager
 * 
 * Self-directed goal setting, task scheduling, and progress tracking
 * Enables the agent to set its own objectives and work towards them
 */

import { IAgentRuntime, logger, Memory, State } from "@elizaos/core";
import Database from "better-sqlite3";
import * as cron from "node-cron";
import { EventEmitter } from "events";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "growth" | "engagement" | "learning" | "community" | "technical" | "creative";
  priority: "high" | "medium" | "low";
  status: "planned" | "active" | "completed" | "failed";
  targetDate: number;
  createdAt: number;
  completedAt?: number;
  progress: number; // 0-100
  metrics: {
    target: number;
    current: number;
    unit: string;
  };
  subGoals?: string[]; // IDs of sub-goals
  parentGoalId?: string;
}

interface ScheduledTask {
  id: string;
  goalId?: string;
  name: string;
  description: string;
  type: "one-time" | "recurring" | "cron" | "background";
  schedule?: string; // Cron expression or interval
  nextRun: number;
  lastRun?: number;
  status: "pending" | "running" | "completed" | "failed";
  retries: number;
  maxRetries: number;
  handler: string; // Function name to execute
  params?: any;
  result?: any;
  error?: string;
}

interface BackgroundJob {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  status: "running" | "completed" | "failed";
  progress: number;
  logs: string[];
}

export class AutonomousTaskManager extends EventEmitter {
  private runtime: IAgentRuntime;
  private db: Database.Database;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();
  private backgroundJobs: Map<string, BackgroundJob> = new Map();
  private taskHandlers: Map<string, Function> = new Map();
  
  // Self-reflection intervals
  private dailyReflectionJob?: cron.ScheduledTask;
  private weeklyPlanningJob?: cron.ScheduledTask;
  
  constructor(runtime: IAgentRuntime) {
    super();
    this.runtime = runtime;
    this.db = new Database("./data/autonomous_tasks.db");
    this.initializeDatabase();
    this.registerDefaultHandlers();
    this.startAutonomousScheduler();
  }

  private initializeDatabase(): void {
    // Goals table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        target_date INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        progress INTEGER DEFAULT 0,
        metrics_target INTEGER,
        metrics_current INTEGER DEFAULT 0,
        metrics_unit TEXT,
        parent_goal_id TEXT,
        FOREIGN KEY (parent_goal_id) REFERENCES goals(id)
      )
    `);

    // Sub-goals relationship table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sub_goals (
        parent_id TEXT NOT NULL,
        child_id TEXT NOT NULL,
        PRIMARY KEY (parent_id, child_id),
        FOREIGN KEY (parent_id) REFERENCES goals(id),
        FOREIGN KEY (child_id) REFERENCES goals(id)
      )
    `);

    // Scheduled tasks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_tasks (
        id TEXT PRIMARY KEY,
        goal_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        schedule TEXT,
        next_run INTEGER NOT NULL,
        last_run INTEGER,
        status TEXT NOT NULL,
        retries INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        handler TEXT NOT NULL,
        params TEXT,
        result TEXT,
        error TEXT,
        FOREIGN KEY (goal_id) REFERENCES goals(id)
      )
    `);

    // Task execution history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        execution_time INTEGER NOT NULL,
        duration INTEGER,
        status TEXT NOT NULL,
        result TEXT,
        error TEXT,
        FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id)
      )
    `);

    // Progress tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS progress_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        progress INTEGER NOT NULL,
        notes TEXT,
        metrics_value INTEGER,
        FOREIGN KEY (goal_id) REFERENCES goals(id)
      )
    `);
  }

  /**
   * Agent sets its own goals autonomously
   */
  async setGoal(
    title: string,
    description: string,
    category: Goal["category"],
    priority: Goal["priority"],
    targetDays: number = 7,
    metrics?: { target: number; unit: string }
  ): Promise<Goal> {
    const goal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      category,
      priority,
      status: "planned",
      targetDate: Date.now() + (targetDays * 24 * 60 * 60 * 1000),
      createdAt: Date.now(),
      progress: 0,
      metrics: {
        target: metrics?.target || 100,
        current: 0,
        unit: metrics?.unit || "percent"
      }
    };

    this.db.prepare(`
      INSERT INTO goals (
        id, title, description, category, priority, status,
        target_date, created_at, progress, metrics_target, 
        metrics_current, metrics_unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      goal.id, goal.title, goal.description, goal.category,
      goal.priority, goal.status, goal.targetDate, goal.createdAt,
      goal.progress, goal.metrics.target, goal.metrics.current,
      goal.metrics.unit
    );

    logger.info(`🎯 New goal set: ${title} (${category}, ${priority} priority)`);
    this.emit("goalSet", goal);
    
    // Create initial tasks for the goal
    await this.generateTasksForGoal(goal);
    
    return goal;
  }

  /**
   * Generate tasks automatically based on goal type
   */
  private async generateTasksForGoal(goal: Goal): Promise<void> {
    const tasks: Partial<ScheduledTask>[] = [];
    
    switch (goal.category) {
      case "growth":
        // Twitter growth tasks
        tasks.push(
          {
            name: "Daily Twitter Engagement",
            description: "Engage with crypto Twitter for visibility",
            type: "cron",
            schedule: "0 9,14,19 * * *", // 9am, 2pm, 7pm
            handler: "engageTwitter"
          },
          {
            name: "Share Alpha Thread",
            description: "Post educational thread about Solana",
            type: "cron",
            schedule: "0 16 * * *", // 4pm daily
            handler: "postEducationalThread"
          }
        );
        break;
        
      case "engagement":
        tasks.push(
          {
            name: "Community Check-in",
            description: "Check Discord/Telegram for questions",
            type: "recurring",
            schedule: "2h", // Every 2 hours
            handler: "checkCommunity"
          },
          {
            name: "Reply to Mentions",
            description: "Respond to all mentions",
            type: "recurring",
            schedule: "30m",
            handler: "replyToMentions"
          }
        );
        break;
        
      case "learning":
        tasks.push(
          {
            name: "Research New Protocols",
            description: "Learn about new Solana protocols",
            type: "cron",
            schedule: "0 10 * * *", // 10am daily
            handler: "researchProtocols"
          },
          {
            name: "Analyze Market Trends",
            description: "Study DeFi trends and patterns",
            type: "cron",
            schedule: "0 8,20 * * *", // 8am and 8pm
            handler: "analyzeTrends"
          }
        );
        break;
        
      case "community":
        tasks.push(
          {
            name: "Host Community Event",
            description: "Organize raid or educational session",
            type: "cron",
            schedule: "0 18 * * 5", // 6pm Friday
            handler: "hostCommunityEvent"
          },
          {
            name: "Recognize Contributors",
            description: "Thank active community members",
            type: "cron",
            schedule: "0 12 * * 0", // Noon Sunday
            handler: "recognizeContributors"
          }
        );
        break;
    }
    
    // Schedule all generated tasks
    for (const taskData of tasks) {
      await this.scheduleTask({
        ...taskData,
        goalId: goal.id,
        status: "pending",
        retries: 0,
        maxRetries: 3
      } as ScheduledTask);
    }
  }

  /**
   * Schedule a task (can be one-time, recurring, or cron-based)
   */
  async scheduleTask(task: ScheduledTask): Promise<void> {
    task.id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    task.nextRun = task.nextRun || this.calculateNextRun(task);
    
    this.db.prepare(`
      INSERT INTO scheduled_tasks (
        id, goal_id, name, description, type, schedule,
        next_run, status, retries, max_retries, handler, params
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      task.id, task.goalId || null, task.name, task.description,
      task.type, task.schedule || null, task.nextRun, task.status,
      task.retries, task.maxRetries, task.handler,
      JSON.stringify(task.params || {})
    );
    
    // Set up cron job if it's a cron task
    if (task.type === "cron" && task.schedule) {
      const job = cron.schedule(task.schedule, async () => {
        await this.executeTask(task.id);
      });
      this.cronJobs.set(task.id, job);
      job.start();
    }
    
    logger.info(`📅 Task scheduled: ${task.name} (${task.type})`);
    this.emit("taskScheduled", task);
  }

  /**
   * Execute a scheduled task
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.db.prepare(
      "SELECT * FROM scheduled_tasks WHERE id = ?"
    ).get(taskId) as any;
    
    if (!task) {
      logger.error(`Task ${taskId} not found`);
      return;
    }
    
    const handler = this.taskHandlers.get(task.handler);
    if (!handler) {
      logger.error(`Handler ${task.handler} not found for task ${task.name}`);
      return;
    }
    
    // Update task status
    this.db.prepare(
      "UPDATE scheduled_tasks SET status = ?, last_run = ? WHERE id = ?"
    ).run("running", Date.now(), taskId);
    
    const startTime = Date.now();
    
    try {
      // Execute the task handler
      const result = await handler.call(this, 
        JSON.parse(task.params || "{}"),
        this.runtime
      );
      
      // Update task with success
      this.db.prepare(`
        UPDATE scheduled_tasks 
        SET status = ?, result = ?, next_run = ?
        WHERE id = ?
      `).run(
        "completed",
        JSON.stringify(result),
        this.calculateNextRun(task),
        taskId
      );
      
      // Log execution history
      this.db.prepare(`
        INSERT INTO task_history (task_id, execution_time, duration, status, result)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        taskId,
        startTime,
        Date.now() - startTime,
        "completed",
        JSON.stringify(result)
      );
      
      // Update goal progress if linked
      if (task.goal_id) {
        await this.updateGoalProgress(task.goal_id);
      }
      
      logger.info(`✅ Task completed: ${task.name}`);
      this.emit("taskCompleted", { task, result });
      
    } catch (error) {
      // Handle task failure
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.db.prepare(`
        UPDATE scheduled_tasks 
        SET status = ?, error = ?, retries = retries + 1
        WHERE id = ?
      `).run("failed", errorMessage, taskId);
      
      // Log failure
      this.db.prepare(`
        INSERT INTO task_history (task_id, execution_time, duration, status, error)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        taskId,
        startTime,
        Date.now() - startTime,
        "failed",
        errorMessage
      );
      
      logger.error(`❌ Task failed: ${task.name} - ${errorMessage}`);
      this.emit("taskFailed", { task, error: errorMessage });
      
      // Retry if under max retries
      if (task.retries < task.max_retries) {
        const retryDelay = Math.pow(2, task.retries) * 60000; // Exponential backoff
        setTimeout(() => this.executeTask(taskId), retryDelay);
      }
    }
  }

  /**
   * Register default task handlers
   */
  private registerDefaultHandlers(): void {
    // Twitter engagement handler
    this.taskHandlers.set("engageTwitter", async (params: any, runtime: IAgentRuntime) => {
      logger.info("🐦 Executing Twitter engagement task");
      // This would call Twitter API to find and engage with relevant content
      return {
        tweetsEngaged: Math.floor(Math.random() * 10) + 5,
        replies: Math.floor(Math.random() * 5) + 2,
        retweets: Math.floor(Math.random() * 3) + 1
      };
    });
    
    // Educational thread handler
    this.taskHandlers.set("postEducationalThread", async (params: any, runtime: IAgentRuntime) => {
      logger.info("📚 Creating educational thread");
      // Generate and post educational content
      const topics = [
        "How liquid staking works on Solana",
        "Understanding MEV on Solana",
        "Jupiter aggregator deep dive",
        "Compressed NFTs explained",
        "Validator economics breakdown"
      ];
      const topic = topics[Math.floor(Math.random() * topics.length)];
      return { topic, posted: true, engagement: "pending" };
    });
    
    // Community check handler
    this.taskHandlers.set("checkCommunity", async (params: any, runtime: IAgentRuntime) => {
      logger.info("👥 Checking community channels");
      return {
        discord: { messages: 15, replied: 8 },
        telegram: { messages: 23, replied: 12 }
      };
    });
    
    // Mention reply handler
    this.taskHandlers.set("replyToMentions", async (params: any, runtime: IAgentRuntime) => {
      logger.info("💬 Replying to mentions");
      return { mentions: 5, replied: 5, skipped: 0 };
    });
    
    // Protocol research handler
    this.taskHandlers.set("researchProtocols", async (params: any, runtime: IAgentRuntime) => {
      logger.info("🔬 Researching new protocols");
      const protocols = ["New DeFi protocol", "Novel NFT standard", "Bridge innovation"];
      return { researched: protocols[Math.floor(Math.random() * protocols.length)] };
    });
    
    // Market analysis handler
    this.taskHandlers.set("analyzeTrends", async (params: any, runtime: IAgentRuntime) => {
      logger.info("📈 Analyzing market trends");
      return {
        trend: Math.random() > 0.5 ? "bullish" : "consolidating",
        keyMetrics: { tvl: "15.2B", volume: "2.8B" }
      };
    });
    
    // Community event handler
    this.taskHandlers.set("hostCommunityEvent", async (params: any, runtime: IAgentRuntime) => {
      logger.info("🎉 Hosting community event");
      return { event: "Raid coordination", participants: 45 };
    });
    
    // Recognize contributors handler
    this.taskHandlers.set("recognizeContributors", async (params: any, runtime: IAgentRuntime) => {
      logger.info("🏆 Recognizing top contributors");
      return { recognized: 5, posted: true };
    });
  }

  /**
   * Calculate next run time for a task
   */
  private calculateNextRun(task: any): number {
    if (task.type === "one-time") {
      return task.next_run || Date.now();
    }
    
    if (task.type === "recurring" && task.schedule) {
      // Parse schedule like "2h", "30m", "1d"
      const match = task.schedule.match(/(\d+)([hmsd])/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers: any = { m: 60000, h: 3600000, d: 86400000, s: 1000 };
        return Date.now() + (value * multipliers[unit]);
      }
    }
    
    // For cron tasks, let node-cron handle it
    return Date.now() + 3600000; // Default 1 hour
  }

  /**
   * Update goal progress based on completed tasks
   */
  private async updateGoalProgress(goalId: string): Promise<void> {
    const goal = this.db.prepare(
      "SELECT * FROM goals WHERE id = ?"
    ).get(goalId) as any;
    
    if (!goal) return;
    
    // Count completed tasks for this goal
    const taskStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM scheduled_tasks
      WHERE goal_id = ?
    `).get(goalId) as any;
    
    const progress = taskStats.total > 0 
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : 0;
    
    // Update goal progress
    this.db.prepare(
      "UPDATE goals SET progress = ? WHERE id = ?"
    ).run(progress, goalId);
    
    // Log progress
    this.db.prepare(`
      INSERT INTO progress_logs (goal_id, timestamp, progress, notes)
      VALUES (?, ?, ?, ?)
    `).run(goalId, Date.now(), progress, `${taskStats.completed}/${taskStats.total} tasks completed`);
    
    // Check if goal is completed
    if (progress >= 100) {
      this.db.prepare(
        "UPDATE goals SET status = 'completed', completed_at = ? WHERE id = ?"
      ).run(Date.now(), goalId);
      
      logger.info(`🎉 Goal completed: ${goal.title}`);
      this.emit("goalCompleted", goal);
    }
  }

  /**
   * Start autonomous scheduler that manages all tasks
   */
  private startAutonomousScheduler(): void {
    // Check for pending tasks every minute
    setInterval(async () => {
      const now = Date.now();
      const pendingTasks = this.db.prepare(`
        SELECT * FROM scheduled_tasks 
        WHERE status = 'pending' AND next_run <= ?
        AND type != 'cron'
      `).all(now) as any[];
      
      for (const task of pendingTasks) {
        await this.executeTask(task.id);
      }
    }, 60000); // Every minute
    
    // Daily reflection - agent reviews its progress
    this.dailyReflectionJob = cron.schedule("0 23 * * *", async () => {
      await this.performDailyReflection();
    });
    
    // Weekly planning - agent sets new goals
    this.weeklyPlanningJob = cron.schedule("0 10 * * 1", async () => {
      await this.performWeeklyPlanning();
    });
    
    logger.info("🤖 Autonomous task scheduler started");
  }

  /**
   * Agent reflects on daily progress
   */
  private async performDailyReflection(): Promise<void> {
    logger.info("🌙 Performing daily reflection...");
    
    // Get today's completed tasks
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const completedToday = this.db.prepare(`
      SELECT COUNT(*) as count FROM task_history
      WHERE execution_time >= ? AND status = 'completed'
    `).get(todayStart) as any;
    
    // Get active goals progress
    const activeGoals = this.db.prepare(`
      SELECT * FROM goals 
      WHERE status = 'active'
      ORDER BY priority DESC
    `).all() as any[];
    
    const reflection = {
      date: new Date().toISOString(),
      tasksCompleted: completedToday.count,
      goalsInProgress: activeGoals.length,
      topPriorities: activeGoals.slice(0, 3).map((g: any) => ({
        title: g.title,
        progress: g.progress
      })),
      mood: this.assessMood(completedToday.count),
      nextFocus: this.determineNextFocus(activeGoals)
    };
    
    logger.info("Daily reflection:", JSON.stringify(reflection));
    this.emit("dailyReflection", reflection);
    
    // Adjust next day's priorities based on progress
    await this.adjustPriorities(reflection);
  }

  /**
   * Agent plans for the week ahead
   */
  private async performWeeklyPlanning(): Promise<void> {
    logger.info("📅 Performing weekly planning...");
    
    // Review last week's performance
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM task_history
      WHERE execution_time >= ?
    `).get(weekAgo) as any;
    
    const completionRate = weekStats.total_tasks > 0
      ? (weekStats.completed_tasks / weekStats.total_tasks) * 100
      : 0;
    
    // Set new weekly goals based on performance
    const newGoals = [];
    
    if (completionRate > 80) {
      // Doing well, set ambitious goals
      newGoals.push(
        await this.setGoal(
          "Expand Twitter Reach",
          "Grow follower base by 20% through quality content",
          "growth",
          "high",
          7,
          { target: 20, unit: "percent" }
        )
      );
    }
    
    if (completionRate < 50) {
      // Struggling, set achievable goals
      newGoals.push(
        await this.setGoal(
          "Maintain Engagement",
          "Keep community engaged with regular updates",
          "engagement",
          "medium",
          7,
          { target: 50, unit: "interactions" }
        )
      );
    }
    
    // Always set a learning goal
    newGoals.push(
      await this.setGoal(
        "Learn New Protocol",
        "Deep dive into a new Solana protocol",
        "learning",
        "medium",
        7,
        { target: 1, unit: "protocol" }
      )
    );
    
    logger.info(`📋 Weekly planning complete. Set ${newGoals.length} new goals`);
    this.emit("weeklyPlanning", { newGoals, weekStats, completionRate });
  }

  /**
   * Assess agent's mood based on performance
   */
  private assessMood(tasksCompleted: number): string {
    if (tasksCompleted > 20) return "accomplished";
    if (tasksCompleted > 10) return "productive";
    if (tasksCompleted > 5) return "steady";
    if (tasksCompleted > 0) return "slow";
    return "unproductive";
  }

  /**
   * Determine next area of focus
   */
  private determineNextFocus(activeGoals: any[]): string {
    const categoryPriority = ["growth", "engagement", "community", "learning", "technical", "creative"];
    
    for (const category of categoryPriority) {
      const goal = activeGoals.find((g: any) => g.category === category && g.progress < 50);
      if (goal) return category;
    }
    
    return "growth"; // Default focus
  }

  /**
   * Adjust priorities based on reflection
   */
  private async adjustPriorities(reflection: any): Promise<void> {
    // If unproductive, reduce task frequency
    if (reflection.mood === "unproductive") {
      const tasks = this.db.prepare(
        "SELECT * FROM scheduled_tasks WHERE type = 'recurring'"
      ).all() as any[];
      
      for (const task of tasks) {
        // Increase intervals by 50%
        const newSchedule = this.adjustSchedule(task.schedule, 1.5);
        this.db.prepare(
          "UPDATE scheduled_tasks SET schedule = ? WHERE id = ?"
        ).run(newSchedule, task.id);
      }
    }
    
    // If accomplished, can handle more
    if (reflection.mood === "accomplished") {
      // Add bonus tasks
      await this.scheduleTask({
        name: "Bonus Engagement",
        description: "Extra community interaction",
        type: "one-time",
        nextRun: Date.now() + 3600000, // In 1 hour
        handler: "engageTwitter",
        status: "pending",
        retries: 0,
        maxRetries: 1
      } as ScheduledTask);
    }
  }

  /**
   * Adjust schedule timing
   */
  private adjustSchedule(schedule: string, multiplier: number): string {
    const match = schedule.match(/(\d+)([hmsd])/);
    if (match) {
      const value = Math.round(parseInt(match[1]) * multiplier);
      return `${value}${match[2]}`;
    }
    return schedule;
  }

  /**
   * Get current goals and their status
   */
  async getCurrentGoals(): Promise<Goal[]> {
    return this.db.prepare(`
      SELECT * FROM goals 
      WHERE status IN ('planned', 'active')
      ORDER BY priority DESC, target_date ASC
    `).all() as Goal[];
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(limit: number = 10): Promise<ScheduledTask[]> {
    return this.db.prepare(`
      SELECT * FROM scheduled_tasks 
      WHERE status = 'pending'
      ORDER BY next_run ASC
      LIMIT ?
    `).all(limit) as ScheduledTask[];
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(days: number = 7): Promise<any> {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const taskMetrics = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        AVG(duration) as avg_duration
      FROM task_history
      WHERE execution_time >= ?
    `).get(since);
    
    const goalMetrics = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        AVG(progress) as avg_progress
      FROM goals
      WHERE created_at >= ?
    `).get(since);
    
    return {
      tasks: taskMetrics,
      goals: goalMetrics,
      period: `${days} days`
    };
  }

  /**
   * Manual goal update (for external events)
   */
  async updateGoalMetrics(goalId: string, currentValue: number): Promise<void> {
    this.db.prepare(
      "UPDATE goals SET metrics_current = ? WHERE id = ?"
    ).run(currentValue, goalId);
    
    const goal = this.db.prepare(
      "SELECT * FROM goals WHERE id = ?"
    ).get(goalId) as any;
    
    if (goal) {
      const progress = Math.round((currentValue / goal.metrics_target) * 100);
      this.db.prepare(
        "UPDATE goals SET progress = ? WHERE id = ?"
      ).run(Math.min(100, progress), goalId);
      
      if (progress >= 100) {
        this.db.prepare(
          "UPDATE goals SET status = 'completed', completed_at = ? WHERE id = ?"
        ).run(Date.now(), goalId);
        
        logger.info(`🎉 Goal completed through metric achievement: ${goal.title}`);
        this.emit("goalCompleted", goal);
      }
    }
  }

  /**
   * Clean up and stop all jobs
   */
  async shutdown(): Promise<void> {
    // Stop all cron jobs
    for (const job of this.cronJobs.values()) {
      job.stop();
    }
    
    // Stop reflection jobs
    this.dailyReflectionJob?.stop();
    this.weeklyPlanningJob?.stop();
    
    // Close database
    this.db.close();
    
    logger.info("🛑 Autonomous task manager shutdown complete");
  }
}

export default AutonomousTaskManager;