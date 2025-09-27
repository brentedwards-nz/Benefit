"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSearch, CheckCircle, XCircle } from "lucide-react";
import { importPayments } from "@/server-actions/admin/transactions/actions";
import { Loading } from "@/components/ui/loading";

interface ImportPaymentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportPaymentsDialog({
  isOpen,
  onClose,
}: ImportPaymentsDialogProps) {
  const [filePath, setFilePath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFilePath(selectedFile.name);
      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await importPayments(formData);
      if (result.success) {
        setImportResult({ success: true, message: result.data.message });
      } else {
        setImportResult({ success: false, message: result.message || "An unknown error occurred." });
      }
    } catch (error) {
      setImportResult({ success: false, message: "An unexpected error occurred." });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setIsImporting(false);
  };

  const handleClose = () => {
    setImportResult(null);
    setFilePath("");
    setFile(null);
    onClose();
  }

  const renderContent = () => {
    if (isImporting) {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <Loading
            title="Importing Payments"
            description="This may take a few moments."
          />
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      );
    }

    if (importResult) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            {importResult.success ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
                <XCircle className="h-12 w-12 text-red-500" />
            )}
            <h2 className="text-xl font-bold">{importResult.success ? "Import Successful" : "Import Failed"}</h2>
            <p className="text-muted-foreground">{importResult.message}</p>
            <Button onClick={handleClose}>Close</Button>
        </div>
      );
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Import Payments</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="payments-file">Payments File</Label>
            <div className="flex gap-2">
              <Input
                id="payments-file"
                value={filePath}
                readOnly
                className="flex-grow"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleIconClick}
              >
                <FileSearch className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleImport} disabled={!filePath}>
            Import
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
