import { APIOptions } from '~/api/types';
import { handleRestFailures } from '~/api/errorUtils';
import { isModArchResponse, restGET } from '~/api/apiUtils';
import { Namespace, UserSettings } from '~/types';

// Define a type for the config needed by these functions
type K8sApiConfig = {
  BFF_API_VERSION: string;
  URL_PREFIX: string;
};

// Functions now accept config object
export const getUser =
  (hostPath: string, config: K8sApiConfig) =>
  (opts: APIOptions): Promise<UserSettings> =>
    handleRestFailures(
      restGET(hostPath, `${config.URL_PREFIX}/api/${config.BFF_API_VERSION}/user`, {}, opts),
    ).then((response) => {
      if (isModArchResponse<UserSettings>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });

export const getNamespaces =
  (hostPath: string, config: K8sApiConfig) =>
  (opts: APIOptions): Promise<Namespace[]> =>
    handleRestFailures(
      restGET(hostPath, `${config.URL_PREFIX}/api/${config.BFF_API_VERSION}/namespaces`, {}, opts),
    ).then((response) => {
      if (isModArchResponse<Namespace[]>(response)) {
        return response.data;
      }
      throw new Error('Invalid response format');
    });
