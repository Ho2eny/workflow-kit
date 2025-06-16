import { useProvider } from "./Provider";

/**
 * The form for editing a workflow's name and description.
 */
export const SidebarWorkflowForm = () => {
  const { workflow, setWorkflow } = useProvider();

  return (
    <div className="wf-sidebar-form">
      <label>
        Workflow name
        <input
          type="text"
          defaultValue={workflow?.name}
          placeholder="Untitled workflow"
          onBlur={(e) => {
            setWorkflow({ ...workflow, name: e.target.value });
          }}
        />
      </label>
      <label>
        Description
        <textarea
          placeholder="Add a short description..."
          defaultValue={workflow?.description}
          rows={4}
          onBlur={(e) => {
            setWorkflow({ ...workflow, description: e.target.value });
          }}
        />
      </label>
    </div>
  );
};
