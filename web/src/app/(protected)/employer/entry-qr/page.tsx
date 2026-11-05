"use client";

import { EntryQrPage as EntryQrScreen } from "@/features/attendance/entry-qr-page";

// Displayed on a screen at the office entrance: the QR employees scan to
// check in / out. Route chain (role gate + app shell) is provided by the
// (protected)/employer layouts, like every other employer page.
export default function EntryQrPage() {
  return <EntryQrScreen />;
}
