import { useCallback, useEffect } from 'react';

export function useBrowserUnloadBlocker(shouldBlock: boolean): void {
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (shouldBlock) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    [shouldBlock],
  );

  useEffect(() => {
    if (!shouldBlock) {
      return;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldBlock, handleBeforeUnload]);
}
