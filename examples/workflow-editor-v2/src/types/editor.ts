export interface PublicEngineAction {
  kind: string;
  name: string;
  description?: string;
}

export interface WorkflowAction {
  id: string;
  kind: string;
  inputs: Record<string, any>;
}
