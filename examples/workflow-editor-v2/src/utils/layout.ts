import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import type { Node, Edge, Rect, Position } from '@xyflow/react';
import { Direction } from '../components/Editor';

/**
 * Hooks & helpers to lay out agent pipelines.
 *
 * Primary (agent) nodes are fixed on a single vertical line to keep the
 * control-flow obvious, while auxiliary nodes (mcp / memory / storage) are
 * fanned out to the right of their parent with generous spacing.
 */

type LayoutArgs = {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
  direction: Direction;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  nodesInitialized: boolean;
  defaultNodeMeasure?: { width: number; height: number };
};

export const useLayout = (args: LayoutArgs): Rect => {
  const {
    nodes,
    edges,
    width,
    height,
    direction,
    setNodes,
    setEdges,
    nodesInitialized,
    defaultNodeMeasure,
  } = args;

  return useMemo(() => {
    if (!nodesInitialized) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    // Ensure every node has a size before Dagre runs
    const nodesWithMeasures = nodes.map((node) =>
      node.measured ? node : { ...node, measured: defaultNodeMeasure },
    );

    const { nodes: newNodes, edges: newEdges, rect } = getLayoutedElements(
      nodesWithMeasures,
      edges,
      direction,
    );

    setNodes(newNodes);
    setEdges(newEdges);

    return rect;
  }, [JSON.stringify(nodes), JSON.stringify(edges), width, height, direction, nodesInitialized]);
};

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction: Direction = 'down'
): { nodes: Node[]; edges: Edge[]; rect: Rect } => {
  /** Returns true if the node represents an auxiliary action */
  const isAux = (n: Node) => ['mcp', 'memory', 'storage'].includes(n.type as string);

  const AUX_SIZE = { width: 120, height: 60 } as const;
  const PRIMARY_SIZE = { width: 200, height: 100 } as const;

  // -----------------------------------------------------------------------
  // 1. Lay out primary nodes with Dagre
  // -----------------------------------------------------------------------
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction === 'down' ? 'TB' : 'LR',
    nodesep: 50,
    ranksep: 120,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes
    .filter((n) => !isAux(n))
    .forEach((n) => {
      const { width = PRIMARY_SIZE.width, height = PRIMARY_SIZE.height } = (n.style || {}) as any;
      g.setNode(n.id, { width, height });
    });

  edges.forEach((e) => {
    if (!isAuxId(e.source) && !isAuxId(e.target)) {
      g.setEdge(e.source, e.target);
    }
  });

  dagre.layout(g);

  // -----------------------------------------------------------------------
  // 1-b. Pin all primary nodes to the same vertical line for straight flow
  // -----------------------------------------------------------------------
  const primaryNodes = nodes.filter((n) => !isAux(n));
  const x0 = primaryNodes.length > 0 ? Math.min(...primaryNodes.map((n) => g.node(n.id).x)) : 0;

  primaryNodes.forEach((n) => {
    const { y } = g.node(n.id);
    n.position = { x: x0, y };
    n.sourcePosition = 'bottom' as Position;
    n.targetPosition = 'top' as Position;
  });

  // -----------------------------------------------------------------------
  // 2. Manually place auxiliary nodes to the right of their parent
  // -----------------------------------------------------------------------
  const OFFSET_X = PRIMARY_SIZE.width + 120;
  const AUX_Y_SPACING = 90;

  nodes.filter(isAux).forEach((aux) => {
    const parentId = (aux.data as any)?.parentId;
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const siblings = nodes.filter(
      (n) => isAux(n) && (n.data as any).parentId === parentId,
    );
    const idx = siblings.findIndex((s) => s.id === aux.id);

    aux.position = {
      x: parent.position.x + OFFSET_X,
      y: parent.position.y + (idx - (siblings.length - 1) / 2) * AUX_Y_SPACING,
    };

    aux.style ||= AUX_SIZE;
    aux.targetPosition = 'left' as Position;
  });

  // -----------------------------------------------------------------------
  // 3. Regenerate edges with straight segments & proper handles
  // -----------------------------------------------------------------------
  const newEdges: Edge[] = edges.map((e) => {
    const srcAux = isAuxId(e.source);
    const trgAux = isAuxId(e.target);
    return {
      ...e,
      type: 'straight',
      sourcePosition: srcAux ? ('left' as Position) : ('right' as Position),
      targetPosition: trgAux ? ('left' as Position) : ('top' as Position),
    };
  });

  // -----------------------------------------------------------------------
  // 4. Compute bounding box for editor centering
  // -----------------------------------------------------------------------
  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(
    ...nodes.map((n) => n.position.x + (((n.style || PRIMARY_SIZE) as any).width ?? 0)),
  );
  const maxY = Math.max(
    ...nodes.map((n) => n.position.y + (((n.style || PRIMARY_SIZE) as any).height ?? 0)),
  );

  return {
    nodes,
    edges: newEdges,
    rect: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
};

const isAuxId = (id: string) =>
  id.startsWith('mcp-') || id.startsWith('memory-') || id.startsWith('storage-');
