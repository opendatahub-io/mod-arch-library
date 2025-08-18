import React, { useState } from 'react';
import { Label, LabelGroup, Alert, AlertVariant, LabelProps } from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import DashboardDescriptionListGroup from '~/components/DashboardDescriptionListGroup';

interface EditableLabelsProps {
  labels: string[];
  onLabelsChange: (labels: string[]) => Promise<void>;
  isArchive?: boolean;
  title?: string;
  contentWhenEmpty?: string;
  allExistingKeys: string[];
  labelProps?: LabelProps;
  overflowCount?: number; // if isCollapsible is true, this is the number of labels to show before collapsing
  isCollapsible?: boolean;
  onEditingChange?: (editingState: boolean) => void;
  showAlertWhenEditing?: boolean;
}

export const EditableLabelsDescriptionListGroup: React.FC<EditableLabelsProps> = ({
  title = 'Labels',
  contentWhenEmpty = 'No labels',
  labels,
  onLabelsChange,
  isArchive,
  allExistingKeys,
  labelProps = {},
  isCollapsible = true,
  overflowCount,
  onEditingChange,
  showAlertWhenEditing = false,
}) => {
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [hasSavedEdits, setHasSavedEdits] = useState(false);
  const [unsavedLabels, setUnsavedLabels] = useState(labels);
  const [isEditing, setIsEditing] = React.useState(false);

  const handleEditingStateChange = (editingState: boolean) => {
    setIsEditing(editingState);
    onEditingChange?.(editingState);
  };

  const validateLabels = (): string[] => {
    const errors: string[] = [];

    const duplicatesMap = new Map<string, number>();
    unsavedLabels.forEach((label) => {
      duplicatesMap.set(label, (duplicatesMap.get(label) || 0) + 1);
    });

    const duplicateLabels: string[] = [];
    duplicatesMap.forEach((count, label) => {
      if (count > 1) {
        duplicateLabels.push(label);
      }
    });

    if (duplicateLabels.length > 0) {
      if (duplicateLabels.length === 1) {
        const label = duplicateLabels[0] ?? '';
        errors.push(`**${label}** already exists as a label. Ensure that each label is unique.`);
      } else {
        const lastLabel = duplicateLabels.pop() ?? '';
        const formattedLabels = duplicateLabels.map((label) => `**${label}**`).join(', ');
        errors.push(
          `${formattedLabels} and **${lastLabel}** already exist as labels. Ensure that each label is unique.`,
        );
      }
    }
    unsavedLabels.forEach((label) => {
      if (allExistingKeys.includes(label) && !labels.includes(label)) {
        errors.push(
          `**${label}** already exists as a property key. Labels cannot use the same name as existing properties.`,
        );
      }
      if (label.length > 63) {
        errors.push(`**${label}** can't exceed 63 characters`);
      }
    });

    return errors;
  };

  const handleEditComplete = (
    _event: MouseEvent | KeyboardEvent,
    newText: string,
    currentLabel?: string,
  ) => {
    if (!newText) {
      return;
    }

    setUnsavedLabels((prev) => {
      if (currentLabel) {
        const index = prev.indexOf(currentLabel);
        if (index === -1) {
          return [...prev, newText];
        }

        const newLabels = [...prev];
        newLabels[index] = newText;
        return newLabels;
      }
      return [...prev, newText];
    });
  };

  const removeUnsavedLabel = (index: number) => {
    if (isSavingEdits) {
      return;
    }
    setUnsavedLabels(unsavedLabels.filter((_, i) => i !== index));
  };

  const addNewLabel = () => {
    if (isSavingEdits) {
      return;
    }
    const baseLabel = 'New Label';
    let counter = 1;
    let newLabel = baseLabel;

    while (unsavedLabels.includes(newLabel)) {
      newLabel = `${baseLabel} ${counter}`;
      counter++;
    }

    setUnsavedLabels((prev) => {
      const updated = [...prev, newLabel];
      return updated;
    });
  };

  const labelErrors = validateLabels();
  const hasDuplicate = (label: string, index: number): boolean => {
    const firstIndex = unsavedLabels.findIndex((l) => l === label);

    if (firstIndex !== index) {
      return true;
    }

    if (allExistingKeys.includes(label) && !labels.includes(label)) {
      return true;
    }

    return false;
  };

  return (
    <DashboardDescriptionListGroup
      editButtonTestId="editable-labels-group-edit"
      saveButtonTestId="editable-labels-group-save"
      title={title}
      isEmpty={labels.length === 0}
      contentWhenEmpty={contentWhenEmpty}
      isEditable={!isArchive}
      isEditing={isEditing}
      isSavingEdits={isSavingEdits}
      contentWhenEditing={
        <>
          <LabelGroup
            data-testid="editable-label-group"
            isEditable={!isSavingEdits}
            numLabels={unsavedLabels.length}
            addLabelControl={
              !isSavingEdits ? (
                <Label
                  variant="overflow"
                  color="blue"
                  onClick={addNewLabel}
                  data-testid="add-label-button"
                >
                  Add label
                </Label>
              ) : undefined
            }
          >
            {unsavedLabels.map((label, index) => (
              <Label
                data-testid={`editable-label-${label}`}
                key={label + index}
                isEditable={!isSavingEdits}
                onClose={() => removeUnsavedLabel(index)}
                closeBtnProps={{
                  isDisabled: isSavingEdits,
                  'data-testid': `remove-label-${label}`,
                }}
                onEditComplete={(event, newText) => handleEditComplete(event, newText, label)}
                editableProps={{
                  defaultValue: label,
                  'aria-label': 'Edit label',
                  'data-testid': `edit-label-input-${label}`,
                }}
                {...labelProps}
                color={hasDuplicate(label, index) ? 'red' : (labelProps.color ?? 'blue')}
                variant={hasDuplicate(label, index) ? 'filled' : labelProps.variant}
              >
                {label}
              </Label>
            ))}
          </LabelGroup>
          <div className={spacing.mtMd} />
          {labelErrors.length > 0 &&
            labelErrors.map((error, index) => (
              <Alert
                key={index}
                data-testid="label-error-alert"
                variant={AlertVariant.danger}
                isInline
                title={error
                  .split('**')
                  .map((part, i) => (i % 2 === 0 ? part : <strong key={i}>{part}</strong>))}
                aria-live="polite"
                isPlain
                tabIndex={-1}
              />
            ))}
          {showAlertWhenEditing && isEditing && (
            <Alert
              data-testid="editing-labels-alert"
              variant={AlertVariant.info}
              isInline
              title="Changes affect all model versions"
              aria-live="polite"
              isPlain
              tabIndex={-1}
            />
          )}
        </>
      }
      onEditClick={() => {
        setUnsavedLabels(labels);
        handleEditingStateChange(true);
      }}
      onSaveEditsClick={async () => {
        if (labelErrors.length > 0) {
          return;
        }
        setIsSavingEdits(true);
        try {
          await onLabelsChange(unsavedLabels);
        } finally {
          setHasSavedEdits(true);
          setIsSavingEdits(false);
          handleEditingStateChange(false);
        }
      }}
      onDiscardEditsClick={() => {
        setUnsavedLabels(labels);
        handleEditingStateChange(false);
      }}
    >
      <LabelGroup
        data-testid="display-label-group"
        defaultIsOpen={hasSavedEdits}
        key={String(hasSavedEdits)} // Force this to fully remount when we change defaultIsOpen
        numLabels={isCollapsible ? overflowCount : labels.length}
      >
        {labels.map((label) => (
          <Label key={label} color="blue" data-testid="label" {...labelProps}>
            {label}
          </Label>
        ))}
      </LabelGroup>
    </DashboardDescriptionListGroup>
  );
};

export default EditableLabelsDescriptionListGroup;
