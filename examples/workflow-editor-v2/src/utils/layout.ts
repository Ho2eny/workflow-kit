import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import type { Node, Edge, Rect } from '@xyflow/react';
import { Direction } from '../components/Editor';

type LayoutArgs = {
  nodes: Node[];
  edges: Edge[];
  width: number;
  height: number;
  direction: Direction;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  nodesInitialized: boolean;
  defaultNodeMeasure: { width: number; height: number } | undefined;
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

    const nodesWithMeasures = nodes.map((node) => {
      if (!node.measured) {
        return { ...node, measured: defaultNodeMeasure };
      }
      return node;
    });

    const { nodes: newNodes, edges: newEdges, rect } = getLayoutedElements(
      nodesWithMeasures,
      edges,
      direction
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

  const AUX_SIZE = { width: 120, height: 60 };
  const PRIMARY_SIZE = { width: 200, height: 100 };

  // -----------------------------------------------------------------------
  // 1. Layout primary nodes with Dagre
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

  nodes
    .filter((n) => !isAux(n))
    .forEach((n) => {
      const { x, y } = g.node(n.id);
      n.position = { x, y };
    });

  // -----------------------------------------------------------------------
  // 2. Manually place auxiliary nodes to the right of their parent
  // -----------------------------------------------------------------------
  const OFFSET_X = PRIMARY_SIZE.width + 80;
  const AUX_Y_SPACING = 70;

  nodes.filter(isAux).forEach((aux) => {
    const parentId = (aux.data as any).parentId;
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

    if (!aux.style) aux.style = AUX_SIZE;
  });

  // Bounding box for editor centering
  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + ((n.style as any)?.width ?? 0)));
  const maxY = Math.max(...nodes.map((n) => n.position.y + ((n.style as any)?.height ?? 0)));

  return {
    nodes,
    edges,
    rect: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
};

const isAuxId = (id: string) =>
  id.startsWith('mcp-') || id.startsWith('memory-') || id.startsWith('storage-');
