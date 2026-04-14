import { Suspense } from "react";
import { Settings } from "@/app/pages/laundry-admin/Settings";

export default function LaundrySettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <Settings />
    </Suspense>
  );
}
