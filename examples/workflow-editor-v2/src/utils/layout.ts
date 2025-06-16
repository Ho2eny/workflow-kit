import { useMemo } from 'react';
import Dagre from '@dagrejs/dagre';
import { Node, Edge, Rect } from '@xyflow/react';
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
  direction: Direction
): { nodes: Node[]; edges: Edge[]; rect: Rect } => {
  const g = new Dagre.graphlib.Graph({ directed: true }).setDefaultEdgeLabel(() => ({}));

  let nodePadding = 60;
  if (direction === 'right') {
    nodePadding += 50;
  }

  g.setGraph({
    nodesep: 100,
    ranksep: nodePadding,
    rankdir: direction === 'down' ? 'TB' : 'LR',
  });

  nodes.forEach((node) =>
    g.setNode(node.id, {
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
      node,
    })
  );

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  Dagre.layout(g);

  const layout = g.nodes().map((nodeID) => {
    const dagreNode = g.node(nodeID);
    const node = (dagreNode as any).node as Node;

    const x = dagreNode.x - (node.measured?.width ?? 0) / 2;
    const y = dagreNode.y - (node.measured?.height ?? 0) / 2;

    return { ...node, position: { x, y } };
  });

  const minX = Math.min(...layout.map((node) => node.position.x));
  const minY = Math.min(...layout.map((node) => node.position.y));
  const maxX = Math.max(...layout.map((node) => node.position.x + (node.measured?.width ?? 0)));
  const maxY = Math.max(...layout.map((node) => node.position.y + (node.measured?.height ?? 0)));

  return {
    nodes: layout,
    edges,
    rect: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
};
