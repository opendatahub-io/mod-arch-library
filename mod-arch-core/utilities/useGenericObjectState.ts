import * as React from 'react';
import { UpdateObjectAtPropAndValue } from '~/types';

export type GenericObjectState<T> = [
  data: T,
  setData: UpdateObjectAtPropAndValue<T>,
  resetDefault: () => void,
  replace: (newValue: T) => void,
];

const useGenericObjectState = <T>(defaultData: T): GenericObjectState<T> => {
  const [value, setValue] = React.useState<T>(defaultData);

  const setPropValue = React.useCallback<UpdateObjectAtPropAndValue<T>>((propKey, propValue) => {
    setValue((oldValue) => ({ ...oldValue, [propKey]: propValue }));
  }, []);

  const defaultDataRef = React.useRef(defaultData);
  const resetToDefault = React.useCallback(() => {
    setValue(defaultDataRef.current);
  }, []);

  const replace = React.useCallback((newValue: T) => {
    setValue(newValue);
  }, []);

  return [value, setPropValue, resetToDefault, replace];
};

export default useGenericObjectState;
