import React from "react";
import { Handle, Position } from "@xyflow/react";

export const triggerNodeFactory = ({ data }: any) => {
  const { trigger } = data;
  return (
    <div className="wf-node wf-node-trigger">
      <Handle type="source" position={Position.Bottom} />
      <h4>Trigger</h4>
      <p>{trigger}</p>
    </div>
  );
};
