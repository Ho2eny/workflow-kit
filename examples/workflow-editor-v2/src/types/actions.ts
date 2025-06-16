import { v4 as uuid } from "uuid";

export type ActionKind = "email" | "delay" | "agent" | "webhook";

export interface WorkflowActionBase {
  id: string;
  kind: ActionKind;
  name?: string;
  description?: string;
}

export interface EmailAction extends WorkflowActionBase {
  kind: "email";
  to: string;
  subject: string;
  body: string;
}

export interface DelayAction extends WorkflowActionBase {
  kind: "delay";
  durationMs: number;
}

// ── Agent-specific domain objects ────────────────────────────────────────────
export interface MCP {
  id: string;
  name: string;
  endpoint: string;
  transport: "stdio" | "sse" | "streamable-http";
  envs: Record<string, any>;
  args: string[];
}

export interface Memory {
  id: string;
  name: string;
  conversationHistory: number;
  workingMemory: any; // JSON blob
}

export interface Storage {
  id: string;
  type: "postgres"; // currently fixed
  endpoint: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AgentAction extends WorkflowActionBase {
  kind: "agent";
  instructions: string;
  inputs: {
    mcps: MCP[];
    memory: Memory;
    storage: Storage;
  };
}

export type AnyAction = EmailAction | DelayAction | AgentAction;

// Factory helpers (optional convenience)
export const createEmailAction = (
  init?: Partial<EmailAction>
): EmailAction => ({
  id: uuid(),
  kind: "email",
  to: "",
  subject: "",
  body: "",
  ...init,
});
