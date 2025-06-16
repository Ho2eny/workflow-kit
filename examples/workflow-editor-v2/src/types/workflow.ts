import { AnyAction } from "./actions";

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  actions: AnyAction[];
  edges: WorkflowEdge[]; // optional manual overrides – auto edges generated in UI
}
