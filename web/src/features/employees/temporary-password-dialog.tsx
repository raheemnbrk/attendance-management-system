"use client";

import { AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

// The temporary password is only returned once by the backend, so this
// dialog is the single place it is ever displayed.
export function TemporaryPasswordDialog({
  password,
  title,
  description,
  onClose,
}: {
  password: string | null;
  title: string;
  description: string;
  onClose: () => void;
}) {
  async function copyPassword() {
    if (!password) {
      return;
    }

    await navigator.clipboard.writeText(password);
    toast.success("Password copied to clipboard");
  }

  return (
    <Dialog open={password != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-sm">{password}</code>
          <Button type="button" variant="outline" size="sm" onClick={copyPassword}>
            <Copy aria-hidden="true" />
            Copy
          </Button>
        </div>
        <p className="flex items-start gap-2 text-xs text-warning-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          This password will not be shown again. Share it with the employee and ask them
          to change it after signing in.
        </p>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
