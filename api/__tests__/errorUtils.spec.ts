import { NotReadyError } from '~/utilities/useFetchState';
import { APIError } from '~/api/types';
import { handleRestFailures } from '~/api/errorUtils';
import { mockGenericResponse } from '~/__tests__/__mocks__/mockGenericResponse';
import { mockBFFResponse } from '~/__tests__/__mocks__/utils';

describe('handleRestFailures', () => {
  it('should successfully return registered models', async () => {
    const modelRegistryMock = mockGenericResponse({});
    const result = await handleRestFailures(Promise.resolve(mockBFFResponse(modelRegistryMock)));
    expect(result.data).toStrictEqual(modelRegistryMock);
  });

  it('should handle and throw model registry errors', async () => {
    const statusMock: APIError = {
      error: {
        code: '',
        message: 'error',
      },
    };

    await expect(handleRestFailures(Promise.resolve(statusMock))).rejects.toThrow('error');
  });

  it('should handle common state errors ', async () => {
    await expect(handleRestFailures(Promise.reject(new NotReadyError('error')))).rejects.toThrow(
      'error',
    );
  });

  it('should handle other errors', async () => {
    await expect(handleRestFailures(Promise.reject(new Error('error')))).rejects.toThrow(
      'Error communicating with server',
    );
  });
});
