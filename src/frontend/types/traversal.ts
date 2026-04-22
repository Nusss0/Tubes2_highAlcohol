export type TraversalAlgorithm = "bfs" | "dfs";
export type TraversalResultScope = "top" | "all";
export type TraversalSourceType = "html" | "url";

export interface HtmlTraversalInput {
  sourceType: TraversalSourceType;
  source: string;
  algorithm: TraversalAlgorithm;
  selector: string;
  resultScope: TraversalResultScope;
  limit: number;
}

export interface DomAttribute {
  name: string;
  value: string;
}

export interface DomTreeNode {
  id: string;
  label: string;
  tagName: string;
  depth: number;
  attributes: DomAttribute[];
  textPreview: string;
  isMatch: boolean;
  children: DomTreeNode[];
}

export interface TraversalStep {
  order: number;
  nodeId: string;
  label: string;
  depth: number;
  matched: boolean;
  frontier: string[];
  message: string;
}

export interface TraversalMetrics {
  algorithm: TraversalAlgorithm;
  selector: string;
  sourceType: TraversalSourceType;
  maxDepth: number;
  totalNodes: number;
  nodesVisited: number;
  matchesFound: number;
  elapsedMs: number;
}

export interface TraversalLca {
  available: boolean;
  nodeId: string;
  label: string;
  depth: number;
  matchCount: number;
  reason: string;
}

export interface TraversalResult {
  tree: DomTreeNode;
  steps: TraversalStep[];
  metrics: TraversalMetrics;
  lca?: TraversalLca;
  visitedOrderById: Record<string, number>;
  matchedNodeIds: string[];
  stopReason: string;
}