import * as React from 'react';
import { Modal, ModalVariant } from '@patternfly/react-core';
import DashboardModalFooter from './DashboardModalFooter';

type NavigationBlockerModalProps = {
  hasUnsavedChanges: boolean;
  onDiscardEditsClick: () => void;
};

const NavigationBlockerModal: React.FC<NavigationBlockerModalProps> = ({
  hasUnsavedChanges,
  onDiscardEditsClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const onClose = () => setIsOpen(false);

  return (
    <Modal
      title="Discard unsaved changes?"
      isOpen={isOpen}
      variant={ModalVariant.small}
      onClose={onClose}
    >
      <p>If you leave this page, your unsaved changes will be lost.</p>
      <DashboardModalFooter
        submitLabel="Discard changes"
        submitButtonVariant="danger"
        onSubmit={() => {
          onDiscardEditsClick();
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};

export default NavigationBlockerModal;
