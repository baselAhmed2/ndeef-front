import NdeefPageLoader from "@/app/components/NdeefPageLoader";

export default function LaundryAdminLoading() {
  return (
    <NdeefPageLoader
      title="Loading laundry dashboard"
      subtitle="Preparing orders, customers, and business controls..."
      accent="teal"
    />
  );
}
