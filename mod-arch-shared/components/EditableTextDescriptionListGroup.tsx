import * as React from 'react';
import {
  Alert,
  AlertVariant,
  ExpandableSection,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import DashboardDescriptionListGroup, {
  DashboardDescriptionListGroupProps,
} from '~/components/DashboardDescriptionListGroup';
import FormFieldset from '~/components/FormFieldset';
import { ModelDetailsCardContext } from '~/context/ModelDetailsCardContext';

type EditableTextDescriptionListGroupProps = Pick<
  DashboardDescriptionListGroupProps,
  'title' | 'contentWhenEmpty'
> & {
  value: string;
  saveEditedValue: (value: string) => Promise<void>;
  baseTestId?: string;
  isArchive?: boolean;
  editableVariant: 'TextInput' | 'TextArea';
  truncateMaxLines?: number;
  showAlertWhenEditing?: boolean;
};

const EditableTextDescriptionListGroup: React.FC<EditableTextDescriptionListGroupProps> = ({
  title,
  contentWhenEmpty,
  value,
  isArchive,
  saveEditedValue,
  baseTestId,
  editableVariant,
  truncateMaxLines = 12,
  showAlertWhenEditing = false,
}) => {
  const [unsavedValue, setUnsavedValue] = React.useState(value);
  const [isSavingEdits, setIsSavingEdits] = React.useState(false);
  const [isTextExpanded, setIsTextExpanded] = React.useState(false);
  const {
    editingState: { isEditingDescription: isEditing },
    setIsEditingDescription: setIsEditing,
  } = React.useContext(ModelDetailsCardContext);

  const editableTextArea = 
    editableVariant === 'TextInput' ? (
      <TextInput
        autoFocus
        data-testid={baseTestId && `${baseTestId}-input`}
        aria-label={`Text input for editing ${title}`}
        value={unsavedValue}
        onChange={(_event, v) => setUnsavedValue(v)}
        isDisabled={isSavingEdits}
      />
    ) : (
      <TextArea
        autoFocus
        data-testid={baseTestId && `${baseTestId}-input`}
        aria-label={`Text box for editing ${title}`}
        value={unsavedValue}
        onChange={(_event, v) => setUnsavedValue(v)}
        isDisabled={isSavingEdits}
        rows={24}
        resizeOrientation="vertical"
      />
  );

  return (
    <DashboardDescriptionListGroup
      title={title}
      isEmpty={!value}
      contentWhenEmpty={contentWhenEmpty}
      isEditable={!isArchive}
      isEditing={isEditing}
      isSavingEdits={isSavingEdits}
      groupTestId={baseTestId && `${baseTestId}-group`}
      editButtonTestId={baseTestId && `${baseTestId}-edit`}
      saveButtonTestId={baseTestId && `${baseTestId}-save`}
      cancelButtonTestId={baseTestId && `${baseTestId}-cancel`}
      contentWhenEditing={
        <>
          <FormFieldset component={editableTextArea} />
          <div className={spacing.mtMd} />
          {showAlertWhenEditing && isEditing && (
            <Alert
              data-testid="editing-description-alert"
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
        setUnsavedValue(value);
        setIsEditing(true);
      }}
      onSaveEditsClick={async () => {
        setIsSavingEdits(true);
        try {
          await saveEditedValue(unsavedValue);
        } finally {
          setIsSavingEdits(false);
        }
        setIsEditing(false);
      }}
      onDiscardEditsClick={() => {
        setUnsavedValue(value);
        setIsEditing(false);
      }}
    >
      <ExpandableSection
        data-testid={baseTestId}
        variant="truncate"
        truncateMaxLines={truncateMaxLines}
        toggleText={isTextExpanded ? 'Show less' : 'Show more'}
        onToggle={(_event, isExpanded) => setIsTextExpanded(isExpanded)}
        isExpanded={isTextExpanded}
      >
        {value}
      </ExpandableSection>
    </DashboardDescriptionListGroup>
  );
};

export default EditableTextDescriptionListGroup;
