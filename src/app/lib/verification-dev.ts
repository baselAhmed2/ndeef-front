export function shouldBypassVerificationInDev() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DIDIT_VERIFICATION !== "true"
  );
}
