import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useThemeContext } from 'mod-arch-kubeflow';
import FieldGroupHelpLabelIcon from './FieldGroupHelpLabelIcon';
import FormFieldset from './FormFieldset';

type ThemeAwareFormGroupWrapperProps = {
  children: React.ReactNode;
  label?: string;
  fieldId: string;
  isRequired?: boolean;
  /** Always-visible description text rendered outside the fieldset (MUI) or before children (PF) */
  descriptionTextNode?: React.ReactNode;
  helperTextNode?: React.ReactNode;
  hasError?: boolean;
  className?: string;
  role?: string;
  isInline?: boolean;
  /** Skip wrapping in FormFieldset — use for components like NumberInput */
  skipFieldset?: boolean;
  labelHelp?: React.ReactElement;
  /** Text content for a help popover icon shown next to the label */
  popoverHelpText?: string;
  'data-testid'?: string;
};

const ThemeAwareFormGroupWrapper: React.FC<ThemeAwareFormGroupWrapperProps> = ({
  children,
  label,
  fieldId,
  isRequired,
  descriptionTextNode,
  helperTextNode,
  hasError = false,
  className,
  role,
  isInline,
  skipFieldset = false,
  labelHelp,
  popoverHelpText,
  'data-testid': dataTestId,
}) => {
  const { isMUITheme } = useThemeContext();

  const errorClass = `${className || ''} ${hasError ? 'pf-m-error' : ''}`.trim();

  const resolvedLabelHelp =
    labelHelp ??
    (popoverHelpText ? <FieldGroupHelpLabelIcon content={popoverHelpText} /> : undefined);

  const formGroupProps = {
    className: errorClass,
    label,
    isRequired,
    fieldId,
    role,
    isInline,
    labelHelp: resolvedLabelHelp,
    'data-testid': dataTestId,
  };

  if (isMUITheme) {
    return (
      <>
        {descriptionTextNode}
        <FormGroup {...formGroupProps}>
          {skipFieldset ? children : <FormFieldset component={children} field={label} />}
        </FormGroup>
        {helperTextNode}
      </>
    );
  }

  return (
    <>
      <FormGroup {...formGroupProps}>
        {descriptionTextNode}
        {children}
        {helperTextNode}
      </FormGroup>
    </>
  );
};

export default ThemeAwareFormGroupWrapper;
