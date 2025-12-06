import React, { useEffect } from 'react';
import { Alert as BootstrapAlert } from 'react-bootstrap';
import './Alert.css';

export type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
}

const Alert: React.FC<AlertProps> = ({
  variant,
  message,
  onClose,
  dismissible = true,
  autoHide = false,
  autoHideDelay = 5000,
}) => {
  useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onClose]);

  return (
    <BootstrapAlert
      variant={variant}
      dismissible={dismissible}
      onClose={onClose}
      className="custom-alert"
    >
      {message}
    </BootstrapAlert>
  );
};

export default Alert;

