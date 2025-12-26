import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dialog, DialogButton } from '@components/common/Dialog';
import { FullScreenLoader } from '@components/common/FullScreenLoader';

interface DialogContextType {
  showDialog: (options: DialogOptions) => void;
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (
    message: string,
    title?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => Promise<void>;

  showLoader: (message?: string) => void;
  hideLoader: () => void;
}

interface DialogOptions {
  title?: string;
  message: string;
  buttons?: DialogButton[];
  onDismiss?: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

interface DialogProviderProps {
  children: React.ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [dialogOptions, setDialogOptions] = useState<DialogOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const [resolvePromise, setResolvePromise] = useState<(() => void) | null>(null);

  // Loader state
  const [isLoading, setIsLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState<string | undefined>(undefined);

  const showDialog = useCallback((options: DialogOptions) => {
    setDialogOptions(options);
    setVisible(true);
  }, []);

  const showAlert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      showDialog({
        title,
        message,
        buttons: [{ text: 'OK', onPress: () => resolve(), style: 'default' }],
        onDismiss: () => {
          setVisible(false);
          setDialogOptions(null);
          resolve();
        },
      });
    });
  }, [showDialog]);

  const showConfirm = useCallback((
    message: string,
    title?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      showDialog({
        title,
        message,
        buttons: [
          {
            text: 'Cancel',
            onPress: () => {
              onCancel?.();
              resolve();
            },
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: () => {
              onConfirm?.();
              resolve();
            },
            style: 'default',
          },
        ],
        onDismiss: () => {
          setVisible(false);
          setDialogOptions(null);
          onCancel?.();
          resolve();
        },
      });
    });
  }, [showDialog]);

  const showLoader = useCallback((message?: string) => {
    setLoaderMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
    setLoaderMessage(undefined);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    dialogOptions?.onDismiss?.();
    setDialogOptions(null);
    resolvePromise?.();
    setResolvePromise(null);
  }, [dialogOptions, resolvePromise]);

  return (
    <DialogContext.Provider value={{ showDialog, showAlert, showConfirm, showLoader, hideLoader }}>
      {children}
      {dialogOptions && (
        <Dialog
          visible={visible}
          title={dialogOptions.title}
          message={dialogOptions.message}
          buttons={dialogOptions.buttons}
          onDismiss={handleDismiss}
        />
      )}
      <FullScreenLoader visible={isLoading} message={loaderMessage} />
    </DialogContext.Provider>
  );
};

