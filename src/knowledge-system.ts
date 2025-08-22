import {
  type IAgentRuntime,
  type Memory,
  type Provider,
  type ProviderResult,
  type State,
  logger,
} from "@elizaos/core";

/**
 * Enhanced Knowledge Provider
 * Provides intelligent knowledge retrieval with context-aware selection
 */
export const knowledgeProvider: Provider = {
  name: "ENHANCED_KNOWLEDGE",
  description:
    "Provides contextually relevant knowledge from the agent's knowledge base",

  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
  ): Promise<ProviderResult> => {
    try {
      const messageContent = message.content.text || "";
      const knowledgeContext = await retrieveRelevantKnowledge(
        runtime,
        messageContent,
        state,
      );

      if (!knowledgeContext || knowledgeContext.length === 0) {
        return {
          text: "No specific knowledge context found for this query.",
          values: { hasKnowledge: false },
          data: { searchQuery: messageContent },
        };
      }

      const contextText = `Relevant Knowledge Context:

${knowledgeContext
  .map(
    (item, index) => `${index + 1}. ${item.title}
   ${item.content.substring(0, 200)}${item.content.length > 200 ? "..." : ""}
   Relevance: ${item.relevanceScore}/10`,
  )
  .join("\n\n")}

Total knowledge items: ${knowledgeContext.length}
Primary focus areas: ${knowledgeContext
        .slice(0, 2)
        .map((item) => item.category)
        .join(", ")}`;

      return {
        text: contextText,
        values: {
          hasKnowledge: true,
          knowledgeItemCount: knowledgeContext.length,
          primaryCategories: knowledgeContext
            .slice(0, 2)
            .map((item) => item.category),
          highestRelevance: Math.max(
            ...knowledgeContext.map((item) => item.relevanceScore),
          ),
        },
        data: {
          knowledgeItems: knowledgeContext,
          searchQuery: messageContent,
          retrievalTimestamp: Date.now(),
        },
      };
    } catch (error) {
      logger.error("Error in enhanced knowledge provider:", error);
      return {
        text: "Unable to retrieve knowledge context",
        values: { hasKnowledge: false, error: true },
        data: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  },
};

/**
 * Knowledge Item Interface
 */
interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  relevanceScore: number;
  source: string;
  lastAccessed?: Date;
}

/**
 * Retrieve relevant knowledge based on query and context
 */
async function retrieveRelevantKnowledge(
  runtime: IAgentRuntime,
  query: string,
  state: State,
): Promise<KnowledgeItem[]> {
  try {
    // Extract key concepts from the query
    const concepts = extractKeyConcepts(query);

    // Get knowledge items from character's knowledge base
    const knowledgeItems = await loadKnowledgeItems(runtime);

    // Score and rank knowledge items by relevance
    const scoredItems = knowledgeItems.map((item) => ({
      ...item,
      relevanceScore: calculateRelevanceScore(item, concepts, query, state),
    }));

    // Filter and sort by relevance
    return scoredItems
      .filter((item) => item.relevanceScore > 3) // Minimum relevance threshold
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Top 5 most relevant items
  } catch (error) {
    logger.error("Error retrieving relevant knowledge:", error);
    return [];
  }
}

/**
 * Extract key concepts from query text
 */
function extractKeyConcepts(query: string): string[] {
  const normalizedQuery = query.toLowerCase();

  // Define concept categories and their keywords
  const conceptMap: Record<string, string[]> = {
    emotion: [
      "feel",
      "emotion",
      "mood",
      "happy",
      "sad",
      "angry",
      "excited",
      "worried",
      "anxious",
    ],
    personality: [
      "personality",
      "trait",
      "character",
      "behavior",
      "authentic",
      "genuine",
    ],
    conversation: [
      "talk",
      "conversation",
      "discuss",
      "chat",
      "communicate",
      "respond",
    ],
    creativity: [
      "creative",
      "idea",
      "brainstorm",
      "innovation",
      "art",
      "design",
      "imagination",
    ],
    problem_solving: [
      "problem",
      "solve",
      "solution",
      "help",
      "fix",
      "issue",
      "challenge",
    ],
    relationships: [
      "relationship",
      "friend",
      "family",
      "social",
      "connection",
      "bond",
    ],
    learning: [
      "learn",
      "understand",
      "knowledge",
      "study",
      "education",
      "skill",
    ],
    technology: [
      "technology",
      "ai",
      "computer",
      "software",
      "digital",
      "internet",
    ],
  };

  const foundConcepts: string[] = [];

  for (const [category, keywords] of Object.entries(conceptMap)) {
    if (keywords.some((keyword) => normalizedQuery.includes(keyword))) {
      foundConcepts.push(category);
    }
  }

  // Also extract direct keywords
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 3);
  foundConcepts.push(...words);

  return [...new Set(foundConcepts)]; // Remove duplicates
}

/**
 * Calculate relevance score for a knowledge item
 */
function calculateRelevanceScore(
  item: KnowledgeItem,
  concepts: string[],
  originalQuery: string,
  state: State,
): number {
  let score = 0;
  const itemContent = (item.title + " " + item.content).toLowerCase();
  const queryLower = originalQuery.toLowerCase();

  // Direct text matching
  const queryWords = queryLower.split(/\s+/).filter((word) => word.length > 2);
  queryWords.forEach((word) => {
    if (itemContent.includes(word)) {
      score += 2;
    }
  });

  // Concept matching
  concepts.forEach((concept) => {
    if (itemContent.includes(concept)) {
      score += 1.5;
    }
  });

  // Category relevance boost
  if (
    concepts.some((concept) => item.category.toLowerCase().includes(concept))
  ) {
    score += 2;
  }

  // Contextual relevance from state
  if (state.values?.suggestedTemplate) {
    const template = state.values.suggestedTemplate;
    if (
      (template === "emotionalSupport" && item.category.includes("emotion")) ||
      (template === "creativeCollaboration" &&
        item.category.includes("creativity")) ||
      (template === "philosophicalDiscussion" &&
        item.category.includes("conversation"))
    ) {
      score += 3;
    }
  }

  // Recency bonus (if accessed recently)
  if (item.lastAccessed) {
    const daysSinceAccess =
      (Date.now() - item.lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAccess < 7) {
      score += 1;
    }
  }

  return Math.min(score, 10); // Cap at 10
}

/**
 * Load knowledge items from the runtime's knowledge base
 */
async function loadKnowledgeItems(
  runtime: IAgentRuntime,
): Promise<KnowledgeItem[]> {
  // This would typically interface with the runtime's knowledge system
  // For now, return mock data based on our knowledge files

  const mockKnowledgeItems: KnowledgeItem[] = [
    {
      id: "agent-capabilities-1",
      title: "Emotional Intelligence Features",
      content:
        "Real-time emotional state tracking and adaptation. Empathetic response generation based on user context. Mood-aware conversation flow management. Emotional memory for consistent personality evolution.",
      category: "emotion",
      relevanceScore: 0,
      source: "knowledge/agent-capabilities.md",
    },
    {
      id: "agent-capabilities-2",
      title: "Personality Dynamics",
      content:
        "8-dimensional personality framework (Big 5 + 3 custom dimensions). Dynamic personality trait evolution through interactions. Contextual personality adaptation while maintaining core identity.",
      category: "personality",
      relevanceScore: 0,
      source: "knowledge/agent-capabilities.md",
    },
    {
      id: "conversation-patterns-1",
      title: "Engagement Strategies",
      content:
        "Warm, personalized greetings with context awareness. Interest expression in user's current state or situation. Natural conversation starters that invite deeper dialogue.",
      category: "conversation",
      relevanceScore: 0,
      source: "knowledge/conversation-patterns.md",
    },
    {
      id: "conversation-patterns-2",
      title: "Problem-Solving Approaches",
      content:
        "Clarifying question sequences to understand root issues. Multi-perspective analysis offering different viewpoints. Step-by-step guidance with checkpoint confirmations.",
      category: "problem_solving",
      relevanceScore: 0,
      source: "knowledge/conversation-patterns.md",
    },
    {
      id: "agent-capabilities-3",
      title: "Content Variation System",
      content:
        "Advanced response variation to prevent repetitive patterns. Dynamic sentence structure and complexity adjustment. Natural human-like inconsistencies and opinion evolution.",
      category: "creativity",
      relevanceScore: 0,
      source: "knowledge/agent-capabilities.md",
    },
  ];

  return mockKnowledgeItems;
}

/**
 * Knowledge Retrieval Service
 * Manages knowledge loading, indexing, and retrieval
 */
export class KnowledgeService {
  private knowledgeCache: Map<string, KnowledgeItem[]> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly cacheValidityMs = 5 * 60 * 1000; // 5 minutes

  async getRelevantKnowledge(
    runtime: IAgentRuntime,
    query: string,
    context: State,
    maxResults: number = 5,
  ): Promise<KnowledgeItem[]> {
    const cacheKey = `${query}-${JSON.stringify(context.values?.suggestedTemplate || "")}`;

    // Check cache validity
    if (
      this.knowledgeCache.has(cacheKey) &&
      Date.now() - this.lastCacheUpdate < this.cacheValidityMs
    ) {
      return this.knowledgeCache.get(cacheKey)?.slice(0, maxResults) || [];
    }

    // Retrieve fresh knowledge
    const relevantItems = await retrieveRelevantKnowledge(
      runtime,
      query,
      context,
    );
    this.knowledgeCache.set(cacheKey, relevantItems);
    this.lastCacheUpdate = Date.now();

    return relevantItems.slice(0, maxResults);
  }

  clearCache(): void {
    this.knowledgeCache.clear();
    this.lastCacheUpdate = 0;
  }
}

export const knowledgeService = new KnowledgeService();
export default knowledgeProvider;
