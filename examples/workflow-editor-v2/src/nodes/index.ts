import type { NodeTypes, NodeProps } from "@xyflow/react";
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
  email: ({ data }: NodeProps) => <EmailNode action={(data as any).action} />,
  delay: ({ data }: NodeProps) => <DelayNode action={(data as any).action} />,
  agent: ({ data }: NodeProps) => <AgentNode action={(data as any).action} />,
  mcp: ({ data }: NodeProps) => <McpNode mcp={(data as any).mcp} />,
  memory: ({ data }: NodeProps) => <MemoryNode memory={(data as any).memory} />,
  storage: ({ data }: NodeProps) => (
    <StorageNode storage={(data as any).storage} />
  ),
};
