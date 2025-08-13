import * as React from 'react';

type EditingState = {
  isEditingLabels: boolean;
  isEditingDescription: boolean;
  isEditingProperties: boolean;
};

type ModelDetailsCardContextType = {
  editingState: EditingState;
  setIsEditingLabels: (isEditing: boolean) => void;
  setIsEditingDescription: (isEditing: boolean) => void;
  setIsEditingProperties: (isEditing: boolean) => void;
  showAlert: boolean;
};

export const ModelDetailsCardContext = React.createContext<ModelDetailsCardContextType>({
  editingState: {
    isEditingLabels: false,
    isEditingDescription: false,
    isEditingProperties: false,
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsEditingLabels: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsEditingDescription: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsEditingProperties: () => {},
  showAlert: false,
});

export const ModelDetailsCardContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [editingState, setEditingState] = React.useState<EditingState>({
    isEditingLabels: false,
    isEditingDescription: false,
    isEditingProperties: false,
  });

  const setIsEditingLabels = React.useCallback((isEditing: boolean) => {
    setEditingState((prev) => ({ ...prev, isEditingLabels: isEditing }));
  }, []);

  const setIsEditingDescription = React.useCallback((isEditing: boolean) => {
    setEditingState((prev) => ({ ...prev, isEditingDescription: isEditing }));
  }, []);

  const setIsEditingProperties = React.useCallback((isEditing: boolean) => {
    setEditingState((prev) => ({ ...prev, isEditingProperties: isEditing }));
  }, []);

  const showAlert = React.useMemo(
    () =>
      editingState.isEditingLabels ||
      editingState.isEditingDescription ||
      editingState.isEditingProperties,
    [editingState],
  );

  const contextValue = React.useMemo(
    () => ({
      editingState,
      setIsEditingLabels,
      setIsEditingDescription,
      setIsEditingProperties,
      showAlert,
    }),
    [editingState, setIsEditingLabels, setIsEditingDescription, setIsEditingProperties, showAlert],
  );

  return (
    <ModelDetailsCardContext.Provider value={contextValue}>
      {children}
    </ModelDetailsCardContext.Provider>
  );
};
