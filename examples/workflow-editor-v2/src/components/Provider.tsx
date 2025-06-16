import React, { useContext, useState } from 'react';
import { Workflow } from '../types';

export interface ProviderProps {
  workflow: Workflow;
  onChange?: (w: Workflow) => void;
}

interface Ctx extends ProviderProps {
  setWorkflow: (w: Workflow) => void;
}

const Context = React.createContext<Ctx | undefined>(undefined);

export const Provider: React.FC<ProviderProps & { children: React.ReactNode }> = ({
  workflow,
  onChange,
  children,
}) => {
  const [wf, setWf] = useState(workflow);

  const setWorkflow = (w: Workflow) => {
    setWf(w);
    onChange?.(w);
  };

  return (
    <Context.Provider value={{ workflow: wf, onChange, setWorkflow }}>
      {children}
    </Context.Provider>
  );
};

export const useProvider = (): Ctx => {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useProvider must be used within Provider');
  return ctx;
};

export const useWorkflow = () => useProvider().workflow;
