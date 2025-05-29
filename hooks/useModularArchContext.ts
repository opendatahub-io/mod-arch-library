import { useContext } from 'react';
import { ModularArchContext, ModularArchContextType } from '~/context/ModularArchContext';
import { ModularArchConfig } from '~/types';

export const useModularArchContext = (): ModularArchConfig => {
  const context = useContext(ModularArchContext);
  if (context === undefined) {
    throw new Error('useModularArchContext must be used within a ModularArchContextProvider');
  }
  return context.config;
};

// New hook for accessing all context values
export const useModularArchFullContext = (): ModularArchContextType => {
  const context = useContext(ModularArchContext);
  if (context === undefined) {
    throw new Error('useModularArchFullContext must be used within a ModularArchContextProvider');
  }
  return context;
};

export type { ModularArchConfig };
