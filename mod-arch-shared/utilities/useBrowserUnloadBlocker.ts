import * as React from 'react';

export const useBrowserUnloadBlocker = (shouldBlock: boolean): void => {
  React.useEffect(() => {
    if (!shouldBlock) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock]);
};

export default useBrowserUnloadBlocker;


