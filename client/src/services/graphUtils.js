import dagre from 'dagre';

/**
 * Calculates Dagre automated layout for nodes and edges
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 90,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    // Standard node dimensions
    dagreGraph.setNode(node.id, { width: 280, height: 160 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - 140,
        y: nodeWithPosition.y - 80,
      },
    };
  });

  return { nodes: newNodes, edges };
}

/**
 * Quick client-side cycle check for drag-and-drop connection validation
 */
export function willCreateCycle(edges, source, target) {
  if (source === target) return true;

  // Check if there is a path from target to source
  const adj = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push(edge.target);
  }

  // BFS from target to see if we can reach source
  const visited = new Set();
  const queue = [target];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === source) return true; // Path exists, adding source -> target creates cycle!

    visited.add(curr);
    const neighbors = adj.get(curr) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        queue.push(next);
      }
    }
  }

  return false;
}

/**
 * Helper to reconstruct full cycle loop for display
 */
export function findCycleChain(edges, source, target) {
  // Find path from target to source
  const adj = new Map();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    adj.get(edge.source).push(edge.target);
  }

  const queue = [[target]];
  const visited = new Set();

  while (queue.length > 0) {
    const path = queue.shift();
    const lastNode = path[path.length - 1];

    if (lastNode === source) {
      // Reconstructed: source -> target -> ... -> source
      return [source, ...path];
    }

    visited.add(lastNode);
    for (const neighbor of adj.get(lastNode) || []) {
      if (!visited.has(neighbor)) {
        queue.push([...path, neighbor]);
      }
    }
  }

  return [source, target, source];
}

export const STATUS_COLORS = {
  Completed: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'shadow-glow-accent',
  },
  Ready: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    dot: 'bg-teal-400',
    glow: 'shadow-glow-accent',
  },
  'In Progress': {
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
    glow: '',
  },
  Blocked: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-500',
    glow: 'shadow-glow-rose',
  },
  Overdue: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-500',
    glow: 'shadow-glow-amber',
  },
};

export const PRIORITY_COLORS = {
  Critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  High: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  Medium: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  Low: 'bg-zinc-900 text-zinc-400 border-zinc-800',
};
