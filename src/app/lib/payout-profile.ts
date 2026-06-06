import { PayoutTransferMethod, PayoutTransferType, type UpsertPayoutProfileRequest } from "@/app/lib/api";

export const payoutMethodOptions = [
  { value: PayoutTransferMethod.BankTransfer, label: "Bank Transfer" },
  { value: PayoutTransferMethod.Instapay, label: "Instapay" },
  { value: PayoutTransferMethod.MobileWallet, label: "Mobile Wallet" },
  { value: PayoutTransferMethod.BankAccount, label: "Bank Account" },
  { value: PayoutTransferMethod.Card, label: "Bank Card" },
  { value: PayoutTransferMethod.OctoCard, label: "Octo Card" },
];

export function parseTransferMethod(value: string | number | null | undefined): PayoutTransferMethod {
  if (typeof value === "number" && value in PayoutTransferMethod) {
    return value as PayoutTransferMethod;
  }

  switch (String(value || "").toLowerCase()) {
    case "1":
    case "banktransfer":
      return PayoutTransferMethod.BankTransfer;
    case "2":
    case "instapay":
      return PayoutTransferMethod.Instapay;
    case "3":
    case "mobilewallet":
      return PayoutTransferMethod.MobileWallet;
    case "4":
    case "bankaccount":
      return PayoutTransferMethod.BankAccount;
    case "5":
    case "card":
      return PayoutTransferMethod.Card;
    case "6":
    case "octocard":
      return PayoutTransferMethod.OctoCard;
    default:
      return PayoutTransferMethod.BankAccount;
  }
}

export function parseTransferType(value: string | number | null | undefined): PayoutTransferType | null {
  if (typeof value === "number" && value in PayoutTransferType) {
    return value as PayoutTransferType;
  }

  switch (String(value || "").toLowerCase()) {
    case "1":
    case "bankaccount":
      return PayoutTransferType.BankAccount;
    case "2":
    case "iban":
      return PayoutTransferType.Iban;
    case "3":
    case "instapayaddress":
      return PayoutTransferType.InstapayAddress;
    case "4":
    case "mobilenumber":
      return PayoutTransferType.MobileNumber;
    default:
      return null;
  }
}

export function getMethodLabel(method: string | number | null | undefined) {
  const parsed = parseTransferMethod(method);
  return payoutMethodOptions.find((option) => option.value === parsed)?.label || "Not Configured";
}

export function getTransferTypeLabel(type: string | number | null | undefined) {
  const parsed = parseTransferType(type);
  switch (parsed) {
    case PayoutTransferType.BankAccount:
      return "Bank Account Number";
    case PayoutTransferType.Iban:
      return "IBAN";
    case PayoutTransferType.InstapayAddress:
      return "Instapay Address";
    case PayoutTransferType.MobileNumber:
      return "Mobile Number";
    default:
      return "-";
  }
}

export function getDefaultTransferType(method: PayoutTransferMethod): PayoutTransferType | null {
  switch (method) {
    case PayoutTransferMethod.BankTransfer:
    case PayoutTransferMethod.BankAccount:
      return PayoutTransferType.BankAccount;
    case PayoutTransferMethod.Instapay:
      return PayoutTransferType.InstapayAddress;
    case PayoutTransferMethod.MobileWallet:
      return PayoutTransferType.MobileNumber;
    default:
      return null;
  }
}

export function needsTransferType(method: PayoutTransferMethod) {
  return (
    method === PayoutTransferMethod.BankTransfer ||
    method === PayoutTransferMethod.BankAccount ||
    method === PayoutTransferMethod.Instapay ||
    method === PayoutTransferMethod.MobileWallet
  );
}

export function buildPayoutPayload(formData: UpsertPayoutProfileRequest): UpsertPayoutProfileRequest {
  const method = formData.transferMethod;
  const transferType = needsTransferType(method) ? (formData.transferType ?? getDefaultTransferType(method)) : null;

  return {
    transferMethod: method,
    transferType,
    recipientFullName: formData.recipientFullName.trim(),
    recipientMobileNumber:
      method === PayoutTransferMethod.MobileWallet ||
      (method === PayoutTransferMethod.Instapay && transferType === PayoutTransferType.MobileNumber)
        ? formData.recipientMobileNumber?.trim() || null
        : null,
    bankName:
      method === PayoutTransferMethod.BankTransfer ||
      method === PayoutTransferMethod.BankAccount ||
      method === PayoutTransferMethod.Card
        ? formData.bankName?.trim() || null
        : null,
    bankAccountNumber:
      method === PayoutTransferMethod.BankTransfer ||
      method === PayoutTransferMethod.BankAccount ||
      (method === PayoutTransferMethod.Instapay && transferType === PayoutTransferType.InstapayAddress)
        ? formData.bankAccountNumber?.trim() || null
        : null,
    cardNumber:
      method === PayoutTransferMethod.Card || method === PayoutTransferMethod.OctoCard
        ? formData.cardNumber?.trim() || null
        : null,
    nationalId: formData.nationalId?.trim() || null,
  };
}
