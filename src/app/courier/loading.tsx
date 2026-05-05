import NdeefPageLoader from "@/app/components/NdeefPageLoader";

export default function CourierLoading() {
  return (
    <NdeefPageLoader
      title="Loading courier workspace"
      subtitle="Pulling your route, orders, and delivery tools..."
      accent="amber"
    />
  );
}
