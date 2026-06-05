import { Suspense } from "react";
import { Settings } from "@/app/pages/laundry-admin/Settings";

export const dynamic = "force-dynamic";

export default function LaundryProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <Settings
        initialTab="profile"
        pageTitle="Profile"
        pageSubtitle="Manage your personal and laundry profile information"
        visibleTabs={["profile"]}
      />
    </Suspense>
  );
}
