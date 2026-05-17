import { Modal } from '../../components/ui/Modal';

interface ConfirmModalProps {
  isOpen:      boolean;
  title:       string;
  message:     string;
  confirmLabel?: string;
  cancelLabel?:  string;
  destructive?: boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

/**
 * Generic confirmation dialog wrapping the shared Modal. Used for
 * destructive actions (delete customer, archive product, etc).
 */
export function ConfirmModal({
  isOpen, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, onConfirm, onCancel,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-md">
      <p className="text-gray-700 text-sm leading-relaxed">{message}</p>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={[
            'px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors',
            destructive
              ? 'bg-black text-white border-2 border-danger hover:bg-red shadow-lg shadow-danger/30'
              : 'bg-accent text-white border-2 border-accent hover:bg-accent-light',
          ].join(' ')}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
