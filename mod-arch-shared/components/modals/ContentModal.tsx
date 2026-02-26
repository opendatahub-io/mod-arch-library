import * as React from 'react';
import { useId } from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  ButtonProps,
  ModalProps,
  ModalHeaderProps,
} from '@patternfly/react-core';

export type ButtonAction = {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  dataTestId?: string;
};

export type ContentModalProps = {
  onClose: () => void;
  contents: React.ReactNode;
  title: string | React.ReactNode;
  buttonActions?: ButtonAction[];
  description?: React.ReactNode;
  disableFocusTrap?: boolean;
  dataTestId?: string;
  bodyClassName?: string;
  variant?: ModalProps['variant'];
  bodyLabel?: string;
  titleIconVariant?: ModalHeaderProps['titleIconVariant'];
};

const ContentModal: React.FC<ContentModalProps> = ({
  onClose,
  contents,
  title,
  buttonActions,
  description,
  disableFocusTrap,
  dataTestId = 'content-modal',
  bodyClassName,
  variant = 'medium',
  bodyLabel,
  titleIconVariant,
}) => {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <Modal
      data-testid={dataTestId}
      isOpen
      variant={variant}
      onClose={onClose}
      disableFocusTrap={disableFocusTrap}
      aria-labelledby={headingId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <ModalHeader
        title={title}
        labelId={headingId}
        description={description ? <div id={descriptionId}>{description}</div> : undefined}
        titleIconVariant={titleIconVariant}
        data-testid="generic-modal-header"
      />
      <ModalBody className={bodyClassName} aria-label={bodyLabel}>
        {contents}
      </ModalBody>
      {buttonActions && (
        <ModalFooter>
          {buttonActions.map((action, index) => (
            <Button
              key={`${action.label}-${index}`}
              variant={action.variant}
              onClick={action.onClick}
              data-testid={action.dataTestId}
            >
              {action.label}
            </Button>
          ))}
        </ModalFooter>
      )}
    </Modal>
  );
};

export default ContentModal;
