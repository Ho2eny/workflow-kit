import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
  NodeChange,
  ReactFlowProvider,
} from "@xyflow/react";
import { nodeTypes } from "../nodes";
import { buildGraph } from "../utils/parseWorkflow";
import { useProvider } from "./Provider";
import { SidebarWorkflowForm } from "./WorkflowForm";
import { useLayout } from "../utils/layout";

export type Direction = "right" | "down";
export interface EditorProps {
  direction?: Direction;
}

export const Editor: React.FC<EditorProps> = ({ direction = "down" }) => (
  <ReactFlowProvider>
    <EditorInner direction={direction} />
  </ReactFlowProvider>
);

const EditorInner: React.FC<EditorProps> = ({ direction = "down" }) => {
  const { workflow } = useProvider();
  const ref = useRef<HTMLDivElement>(null);
  const nodesInitialized = useNodesInitialized();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(workflow, direction),
    [workflow, direction]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useLayout({
    nodes,
    edges,
    width: ref.current?.offsetWidth ?? 0,
    height: ref.current?.offsetHeight ?? 0,
    direction,
    setNodes,
    setEdges,
    nodesInitialized,
    defaultNodeMeasure: undefined,
  });

  useEffect(() => {
    const { nodes, edges } = buildGraph(workflow, direction);
    setNodes(nodes);
    setEdges(edges);
  }, [workflow, direction]);

  return (
    <div>
      <div ref={ref} className="wf-editor">
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
          onEdgesChange={onEdgesChange}
          edgesFocusable={false}
          edgesReconnectable={false}
          proOptions={{ hideAttribution: true }}
        />
      </div>
      <SidebarWorkflowForm />
    </div>
  );
};
