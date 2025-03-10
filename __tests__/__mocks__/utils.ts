import { BFFBody } from '~/types';

export const mockBFFResponse = <T>(data: T): BFFBody<T> => ({
  data,
});
