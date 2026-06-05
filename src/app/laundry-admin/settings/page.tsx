import { Suspense } from "react";
import { Settings } from "@/app/pages/laundry-admin/Settings";

export const dynamic = 'force-dynamic';


export default function LaundrySettingsPage() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <Settings
        initialTab="notifications"
        pageTitle="Settings"
        pageSubtitle="Manage your account preferences and notification channels"
        visibleTabs={["notifications", "preferences"]}
      />
    </Suspense>
  );
}
