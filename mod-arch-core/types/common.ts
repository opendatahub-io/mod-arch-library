import { DeploymentMode } from '~/utilities';

export type ModularArchConfig = {
  deploymentMode: DeploymentMode;
  URL_PREFIX: string;
  BFF_API_VERSION: string;
  // Optional mandatory namespace - when provided, disables namespace listing/selection
  mandatoryNamespace?: string;
};

export type ModArchBody<T> = {
  data: T;
  metadata?: Record<string, unknown>;
};

export type UserSettings = {
  userId: string;
  clusterAdmin?: boolean;
};

export type ConfigSettings = {
  common: CommonConfig;
};

export type CommonConfig = {
  featureFlags: FeatureFlag;
};

export type FeatureFlag = {
  modelRegistry: boolean;
};

export type KeyValuePair = {
  key: string;
  value: string;
};

export type Namespace = {
  name: string;
  displayName?: string;
};

export type UpdateObjectAtPropAndValue<T> = <K extends keyof T>(
  propKey: K,
  propValue: T[K],
) => void;

export type FetchStateObject<T, E = Error> = {
  data: T;
  loaded: boolean;
  error?: E;
  refresh: () => void;
};

export enum AlertVariant {
  success = 'success',
  danger = 'danger',
  warning = 'warning',
  info = 'info',
  custom = 'custom',
}

export type Notification = {
  id?: number;
  status: AlertVariant;
  title: string;
  message?: React.ReactNode;
  hidden?: boolean;
  read?: boolean;
  timestamp: Date;
};

export enum NotificationActionTypes {
  ADD_NOTIFICATION = 'add_notification',
  DELETE_NOTIFICATION = 'delete_notification',
}

export type NotificationAction =
  | {
      type: NotificationActionTypes.ADD_NOTIFICATION;
      payload: Notification;
    }
  | {
      type: NotificationActionTypes.DELETE_NOTIFICATION;
      payload: { id: Notification['id'] };
    };
