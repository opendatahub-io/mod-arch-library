import * as React from 'react';
import { POLL_INTERVAL } from '~/utilities/const';
import { useDeepCompareMemoize } from '~/utilities/useDeepCompareMemoize';
import { ConfigSettings, UserSettings } from '~/types';
import useTimeBasedRefresh from '~/hooks/useTimeBasedRefresh';
import { getNamespaces, getUser } from '~/api/k8s';
import { useModularArchContext } from './useModularArchContext';

export const useSettings = (): {
  configSettings: ConfigSettings | null;
  userSettings: UserSettings | null;
  loaded: boolean;
  loadError: Error | undefined;
} => {
  const { config: modularArchConfig } = useModularArchContext();
  const { BFF_API_VERSION, URL_PREFIX } = modularArchConfig;
  const modArchConfig = React.useMemo(
    () => ({
      BFF_API_VERSION,
      URL_PREFIX,
    }),
    [BFF_API_VERSION, URL_PREFIX],
  );
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error>();
  const [config, setConfig] = React.useState<ConfigSettings | null>(null);
  const [user, setUser] = React.useState<UserSettings | null>(null);
  const userRest = React.useMemo(() => getUser('', modArchConfig), [modArchConfig]);
  const namespaceRest = React.useMemo(() => getNamespaces('', modArchConfig), [modArchConfig]);
  const setRefreshMarker = useTimeBasedRefresh();

  React.useEffect(() => {
    let watchHandle: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const watchConfig = () => {
      Promise.all([fetchConfig(), userRest({})])
        .then(([fetchedConfig, fetchedUser]) => {
          if (cancelled) {
            return;
          }
          setConfig(fetchedConfig);
          setUser(fetchedUser);
          setLoaded(true);
          setLoadError(undefined);
        })
        .catch((e) => {
          if (e?.message?.includes('Error getting Oauth Info for user')) {
            // NOTE: this endpoint only requests oauth because of the security layer, this is not an ironclad use-case
            // Something went wrong on the server with the Oauth, let us just log them out and refresh for them
            /* eslint-disable-next-line no-console */
            console.error(
              'Something went wrong with the oauth token, please log out...',
              e.message,
              e,
            );
            setRefreshMarker(new Date());
            return;
          }
          setLoadError(e);
        });
      watchHandle = setTimeout(watchConfig, POLL_INTERVAL);
    };
    watchConfig();

    return () => {
      cancelled = true;
      clearTimeout(watchHandle);
    };
  }, [setRefreshMarker, userRest, namespaceRest]);

  const retConfig = useDeepCompareMemoize<ConfigSettings | null>(config);
  const retUser = useDeepCompareMemoize<UserSettings | null>(user);

  return {
    configSettings: retConfig,
    userSettings: retUser,
    loaded,
    loadError,
  };
};

// Mock a settings config call
// TODO: [Data Flow] replace with the actual call once we have the endpoint
export const fetchConfig = async (): Promise<ConfigSettings> => ({
  common: {
    featureFlags: {
      modelRegistry: true,
    },
  },
});
