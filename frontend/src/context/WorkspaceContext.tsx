import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type WorkspaceType = 'launch' | 'intelligence' | null;

interface WorkspaceContextType {
  workspace: WorkspaceType;
  setWorkspace: (ws: WorkspaceType) => void;
  isLaunch: boolean;
  isIntelligence: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [workspace, setWorkspaceState] = useState<WorkspaceType>(() => {
    const stored = localStorage.getItem('nexus-workspace');
    if (stored === 'launch' || stored === 'intelligence') return stored;
    return null;
  });

  const setWorkspace = useCallback((ws: WorkspaceType) => {
    setWorkspaceState(ws);
    if (ws) {
      localStorage.setItem('nexus-workspace', ws);
    } else {
      localStorage.removeItem('nexus-workspace');
    }
  }, []);

  const value: WorkspaceContextType = {
    workspace,
    setWorkspace,
    isLaunch: workspace === 'launch',
    isIntelligence: workspace === 'intelligence',
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};
