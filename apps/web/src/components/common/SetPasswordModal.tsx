import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/forms/Input";
import { useToast } from "@/hooks/useToast";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Persist the new password (calls the relevant reset-password API). */
  onSubmit: (password: string) => Promise<void>;
  title?: string;
  subjectName?: string;
}

/**
 * Admin "Set New Password" dialog (members & staff). The admin types a new
 * password directly — no OTP, no email link. The current password is never
 * shown (only hashes are stored). Strength rules mirror the backend
 * (assertStrongPassword): ≥8 chars with at least one letter and one number.
 */
export default function SetPasswordModal({ open, onClose, onSubmit, title = "Set New Password", subjectName }: Props) {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    if (busy) return;
    setPw("");
    setConfirm("");
    onClose();
  }

  async function submit() {
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return toast.error("Password must contain at least one letter and one number.");
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    try {
      await onSubmit(pw);
      toast.success("Password updated. The user must sign in again with the new password.");
      setPw("");
      setConfirm("");
      onClose();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to set password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={subjectName ? `Set a new login password for ${subjectName}. They will be signed out and must use the new password.` : undefined}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={() => void submit()} loading={busy}>Save password</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input label="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Min 8 chars · 1 letter + 1 number" autoComplete="new-password" />
        <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <p className="text-xs text-(--text-muted)">The current password is never shown — passwords are stored only as secure hashes and cannot be recovered.</p>
      </div>
    </Modal>
  );
}
