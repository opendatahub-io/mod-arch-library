type MockGenericResponse = {
  id?: string;
  name?: string;
  description?: string;
};

export const mockGenericResponse = ({
  name = 'test',
  description = 'test',
  id = '1',
}: MockGenericResponse): MockGenericResponse => ({
  name,
  description,
  id,
});
