import * as React from 'react';

/**
 * Prevents accidental page unload when there are unsaved changes.
 * Adds a `beforeunload` listener while `shouldBlock` is true.
 */
export const useBrowserUnloadBlocker = (shouldBlock: boolean): void => {
  React.useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Some browsers require returnValue to be set
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);
};

export default useBrowserUnloadBlocker;


