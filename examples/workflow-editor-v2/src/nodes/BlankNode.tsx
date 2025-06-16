import React from "react";
import { Handle, Position } from "@xyflow/react";

export const BlankNode: React.FC = () => (
  <div className="wf-node wf-node-blank">
    <Handle type="target" position={Position.Top} />
    <Handle type="source" position={Position.Bottom} />
  </div>
);
