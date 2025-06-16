import { NodeTypes } from "@xyflow/react";
import { triggerNodeFactory } from "./TriggerNode";
import { BlankNode } from "./BlankNode";
import {
  EmailNode,
  DelayNode,
  AgentNode,
  McpNode,
  MemoryNode,
  StorageNode,
} from "./ActionBaseNode";

export const nodeTypes: NodeTypes = {
  trigger: triggerNodeFactory,
  blank: BlankNode,
  email: EmailNode,
  delay: DelayNode,
  agent: AgentNode,
  mcp: McpNode,
  memory: MemoryNode,
  storage: StorageNode,
};
