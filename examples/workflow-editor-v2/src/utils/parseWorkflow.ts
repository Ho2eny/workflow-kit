import { Edge, Node } from "@xyflow/react";
import { v4 as uuid } from "uuid";
import {
  AnyAction,
  AgentAction,
  MCP,
  Memory,
  Storage,
} from "../types/actions";
import { Workflow } from "../types/workflow";
import { getLayoutedElements } from "./layout";

const SMALL = { width: 120, height: 60 };

export const buildGraph = (
  workflow: Workflow,
  direction: "down" | "right" = "down"
) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Trigger
  nodes.push({
    id: "trigger",
    type: "trigger",
    data: { trigger: workflow.id },
    position: { x: 0, y: 0 },
  });

  workflow.actions.forEach((action: AnyAction, idx) => {
    const baseId = action.id;

    // Base action node
    nodes.push({
      id: baseId,
      type: action.kind,
      data: { action },
      position: { x: 0, y: 0 },
    });

    // Linear edge chain
    const src = idx === 0 ? "trigger" : workflow.actions[idx - 1].id;
    edges.push({ id: uuid(), source: src, target: baseId, type: "smoothstep" });

    // ── Agent fan-out ───────────────────────────────────────────────────────
    if (action.kind === "agent") {
      const agent = action as AgentAction;

      // 1) MCPs
      agent.inputs.mcps.forEach((mcp: MCP) => {
        nodes.push({
          id: mcp.id,
          type: "mcp",
          data: { mcp, parentId: baseId },
          position: { x: 0, y: 0 },
          style: SMALL,
        });
        edges.push({ id: uuid(), source: baseId, target: mcp.id, type: "smoothstep" });
      });

      // 2) Memory
      const mem = agent.inputs.memory as Memory;
      const memId = mem.id;
      nodes.push({
        id: memId,
        type: "memory",
        data: { memory: mem, parentId: baseId },
        position: { x: 0, y: 0 },
        style: SMALL,
      });
      edges.push({ id: uuid(), source: baseId, target: memId, type: "smoothstep" });

      // 3) Storage
      const stg = agent.inputs.storage as Storage;
      const stgId = stg.id;
      nodes.push({
        id: stgId,
        type: "storage",
        data: { storage: stg, parentId: memId },
        position: { x: 0, y: 0 },
        style: SMALL,
      });
      edges.push({ id: uuid(), source: memId, target: stgId, type: "smoothstep" });
    }
  });

  return getLayoutedElements(nodes, edges, direction);
};
