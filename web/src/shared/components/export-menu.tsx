"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ExportEndpoint, ExportParams } from "@/shared/lib/download";
import { downloadExport } from "@/shared/lib/download";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

// Export menu (CSV / Excel) with a loading state on the trigger and a toast
// on failure (including 429 rate-limit messages).
export function ExportMenu({
  endpoint,
  params,
  disabled = false,
  label = "Export",
}: {
  endpoint: ExportEndpoint;
  params: ExportParams;
  disabled?: boolean;
  label?: string;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: "csv" | "xlsx") {
    setIsExporting(true);
    try {
      await downloadExport(endpoint, { ...params, format });
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" isLoading={isExporting}>
          <Download aria-hidden="true" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem disabled={isExporting} onClick={() => void handleExport("csv")}>
          <FileText aria-hidden="true" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isExporting} onClick={() => void handleExport("xlsx")}>
          <FileSpreadsheet aria-hidden="true" />
          Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
