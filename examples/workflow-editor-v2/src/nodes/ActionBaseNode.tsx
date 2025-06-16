import React from "react";
import { Handle, Position } from "@xyflow/react";
import { WorkflowActionBase, EmailAction, DelayAction, AgentAction, MCP, Memory, Storage } from "../types/actions";

interface Props<T extends WorkflowActionBase> {
  action: T;
  children: React.ReactNode;
  className?: string;
}

export const ActionBaseNode = <T extends WorkflowActionBase>({
  action,
  children,
  className = "",
}: Props<T>) => (
  <div className={`wf-node wf-node-${action.kind} ${className}`.trim()}>
    <Handle type="target" position={Position.Top} />
    {children}
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const EmailNode: React.FC<{ action: EmailAction }> = ({ action }) => (
  <ActionBaseNode action={action}>
    <h4>📧 Email</h4>
    <p>{action.to || "(no recipient)"}</p>
  </ActionBaseNode>
);

export const DelayNode: React.FC<{ action: DelayAction }> = ({ action }) => (
  <ActionBaseNode action={action}>
    <h4>⏱ Delay</h4>
    <p>{action.durationMs / 1000}s</p>
  </ActionBaseNode>
);

export const AgentNode: React.FC<{ action: AgentAction }> = ({ action }) => (
  <ActionBaseNode action={action} className="wf-node-agent">
    <h4>🤖 Agent</h4>
    <p>{action.name}</p>
  </ActionBaseNode>
);

export const McpNode: React.FC<{ mcp: MCP }> = ({ mcp }) => (
  <div className="wf-node wf-node-mcp">
    <Handle type="target" position={Position.Top} />
    <h4>MCP</h4>
    <p>{mcp.name}</p>
  </div>
);

export const MemoryNode: React.FC<{ memory: Memory }> = ({ memory }) => (
  <div className="wf-node wf-node-memory">
    <Handle type="target" position={Position.Top} />
    <h4>🧠 Memory</h4>
    <p>history: {memory.conversationHistory}</p>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

export const StorageNode: React.FC<{ storage: Storage }> = ({ storage }) => (
  <div className="wf-node wf-node-storage">
    <Handle type="target" position={Position.Top} />
    <h4>💾 Storage</h4>
    <p>{storage.database}@{storage.endpoint}:{storage.port}</p>
  </div>
);
