import * as React from 'react';
import { SearchInput, SearchInputProps, TextInput } from '@patternfly/react-core';
import { useThemeContext } from 'mod-arch-kubeflow';
import FormFieldset from './FormFieldset';

type ThemeAwareSearchInputProps = Omit<SearchInputProps, 'onChange' | 'onClear'> & {
  onChange: (value: string) => void;
  onClear?: () => void;
  /** Label shown in the MUI fieldset legend */
  fieldLabel?: string;
  'data-testid'?: string;
};

const ThemeAwareSearchInput: React.FC<ThemeAwareSearchInputProps> = ({
  value,
  onChange,
  onClear,
  fieldLabel,
  placeholder,
  isDisabled,
  className,
  style,
  'aria-label': ariaLabel = 'Search',
  'data-testid': dataTestId,
  ...rest
}) => {
  const { isMUITheme } = useThemeContext();

  if (isMUITheme) {
    return (
      <FormFieldset
        className={className}
        field={fieldLabel}
        component={
          <TextInput
            {...rest}
            value={value}
            type="text"
            placeholder={placeholder}
            onChange={(_event, newValue) => onChange(newValue)}
            isDisabled={isDisabled}
            aria-label={ariaLabel}
            data-testid={dataTestId}
            style={style}
          />
        }
      />
    );
  }

  return (
    <SearchInput
      {...rest}
      className={className}
      style={style}
      placeholder={placeholder}
      value={value}
      isDisabled={isDisabled}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      onChange={(_event, newValue) => onChange(newValue)}
      onClear={(event) => {
        event.stopPropagation();
        onChange('');
        onClear?.();
      }}
    />
  );
};

export default ThemeAwareSearchInput;
