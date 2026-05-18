interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="p-4 border rounded">
      <p>Are you sure?</p>
      <div className="flex gap-2 mt-3">
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onCancel}>No</button>
      </div>
    </div>
  );
}