import { useContext } from 'react';
import { ModularArchContext, ModularArchContextType } from '~/context/ModularArchContext';
import { ModularArchConfig } from '~/types';

// New hook for accessing all context values
export const useModularArchContext = (): ModularArchContextType => {
  const context = useContext(ModularArchContext);
  if (context === undefined) {
    throw new Error('useModularArchContext must be used within a ModularArchContextProvider');
  }
  return context;
};

export type { ModularArchConfig };
