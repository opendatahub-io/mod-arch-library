import { ModArchBody } from '~/types';

export const mockModArchResponse = <T>(data: T): ModArchBody<T> => ({
  data,
});
