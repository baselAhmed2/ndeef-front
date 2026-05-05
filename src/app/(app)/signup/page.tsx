import SignupPage from "@/app/pages/SignupPage";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return <SignupPage initialRole={resolvedSearchParams?.role ?? null} />;
}
