import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Workflow,
  WorkflowAction,
  PublicEngineAction,
} from '../types';
import type { Node, Edge } from '@xyflow/react';

// -----------------------------------------------------------------------------
// Context typing
// -----------------------------------------------------------------------------

export interface ProviderProps {
  /** Initial workflow loaded from the server / file */
  workflow: Workflow;

  /**
   * List of engine actions that the provider can add to the workflow.
   * These should be fetched once when the editor mounts.
   */
  availableActions: PublicEngineAction[];

  /**
   * Called whenever the *internal* copy of the workflow mutates.  Use this to
   * synchronize with external state (e.g. form.saveDraft, useAutosave, etc.)
   */
  onChange?: (wf: Workflow) => void;
}

export interface Ctx extends ProviderProps {
  /** Current working copy – always kept in sync with the graph */
  workflow: Workflow;
  setWorkflow: (w: Workflow) => void;

  /** Currently‑selected node (undefined means nothing is selected) */
  selectedNode?: Node;
  setSelectedNode: (n?: Node) => void;

  /**
   * The temporary “blank” placeholder created when the user clicks the ➕
   * button between two nodes.  Once the user picks an action the blank is
   * replaced.
   */
  blankNode?: Node;
  setBlankNode: (n?: Node) => void;

  /** left / right so the editor can allocate flex space correctly */
  sidebarPosition: 'left' | 'right';
  setSidebarPosition: (p: 'left' | 'right') => void;

  /** Mutations helpers ----------------------------------------------------- */
  appendAction: (
    engineAction: PublicEngineAction,
    parentActionId: string | undefined,
    connectingEdge?: Edge | undefined,
  ) => void;

  deleteAction: (actionId: string) => void;
}

// -----------------------------------------------------------------------------
// Internal helper
// -----------------------------------------------------------------------------

const Context = createContext<Ctx | undefined>(undefined);

export const useProvider = (): Ctx => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useProvider must be used within a <Provider/>');
  return ctx;
};

export const useWorkflow = () => useProvider().workflow;

// -----------------------------------------------------------------------------
// Provider component
// -----------------------------------------------------------------------------

export const Provider: React.FC<ProviderProps & { children: React.ReactNode }> = ({
  workflow: initialWorkflow,
  availableActions,
  onChange,
  children,
}) => {
  // Working copy of the workflow; *never* mutate initialWorkflow directly.
  const [workflow, setWorkflowState] = useState<Workflow>(() => ({
    ...initialWorkflow,
  }));

  // UI state ------------------------------------------------------------------
  const [selectedNode, setSelectedNode] = useState<Node | undefined>();
  const [blankNode, setBlankNode] = useState<Node | undefined>();
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('right');

  // ---------------------------------------------------------------------------
  // State helpers --------------------------------------------------------------
  // ---------------------------------------------------------------------------

  const setWorkflow = useCallback(
    (w: Workflow) => {
      setWorkflowState(w);
      onChange?.(w);
    },
    [onChange],
  );

  /**
   * Attach a new action *and* the necessary graph artefacts (node + edge).
   *
   * @param engineAction The catalogue item chosen by the user.
   * @param parentActionId ID of the workflow action that will precede the new one.
   * @param connectingEdge (optional) Edge that was connecting parent → blank.
   */
  const appendAction = useCallback<Ctx['appendAction']>(
    (engineAction, parentActionId, connectingEdge) => {
      setWorkflow((wf) => {
        // 1. Concrete workflowAction ------------------------------------------------------------------
        const newAction: WorkflowAction = {
          id: crypto.randomUUID(),
          kind: engineAction.kind,
          inputs: {},
        } as WorkflowAction;

        // 2. Splice it into wf.actions after the parentAction (or at end)
        const parentIdx = parentActionId
          ? wf.actions.findIndex((a: any) => a.id === parentActionId)
          : wf.actions.length - 1;
        const newActions = [...(wf.actions as any[])];
        newActions.splice(parentIdx + 1, 0, newAction);

        // 3. Fix edges (this example assumes a simple linear workflow)
        const newEdges = wf.edges.filter((e: any) => e !== connectingEdge);
        if (parentActionId) {
          newEdges.push({ source: parentActionId, target: newAction.id } as any);
        }

        return { ...wf, actions: newActions, edges: newEdges } as Workflow;
      });

      // Once added, clear blank + select the new node so Sidebar shows it
      setBlankNode(undefined);
      setSelectedNode(undefined);
    },
    [setWorkflow],
  );

  /** Remove an action and the edges that reference it */
  const deleteAction = useCallback<Ctx['deleteAction']>(
    (actionId) => {
      setWorkflow((wf) => {
        return {
          ...wf,
          actions: (wf.actions as any[]).filter((a: any) => a.id !== actionId),
          edges: wf.edges.filter(
            (e: any) => e.source !== actionId && e.target !== actionId,
          ),
        } as Workflow;
      });
    },
    [setWorkflow],
  );

  // ---------------------------------------------------------------------------
  // Memoise context value so that components only rerender when needed --------
  // ---------------------------------------------------------------------------
  const ctxValue = useMemo<Ctx>(
    () => ({
      workflow,
      setWorkflow,
      onChange,
      availableActions,

      selectedNode,
      setSelectedNode,

      blankNode,
      setBlankNode,

      sidebarPosition,
      setSidebarPosition,

      appendAction,
      deleteAction,
    }),
    [
      workflow,
      setWorkflow,
      onChange,
      availableActions,
      selectedNode,
      blankNode,
      sidebarPosition,
      appendAction,
      deleteAction,
    ],
  );

  return <Context.Provider value={ctxValue}>{children}</Context.Provider>;
};

// -----------------------------------------------------------------------------
// Bridge between xy‑flow events ↔︎ Provider (optional) -------------------------
// -----------------------------------------------------------------------------
// These helpers can live anywhere in your codebase.  Put them close to the
// component where you render <ReactFlow /> so they have direct access to its
// callbacks.

/** Hook that subscribes to ReactFlow node‑selection changes and wires them into
 *  the Provider.  Must be placed *inside* <Provider/>.
 */
export const useSyncSelectionWithProvider = () => {
  const { setSelectedNode } = useProvider();

  // react‑flow gives us `onNodesChange` and `onSelectionChange` – adapt either.
  const onNodesChange = useCallback(
    (changes: { id: string; selected: boolean }[]) => {
      const sel = changes.find((c) => c.selected);
      setSelectedNode(sel ? (sel as unknown as Node) : undefined);
    },
    [setSelectedNode],
  );

  return { onNodesChange };
};

