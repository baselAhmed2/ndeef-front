export interface LaundryRecord {
  id: number;
  name: string;
  address: string;
  imageUrl?: string | null;
  status: "Active" | "Inactive";
  availability: "Open" | "Closed" | "Busy";
  averageRating: number;
  createdAt: string;
}

export interface CreateLaundryRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateLaundryResponse {
  laundryId: number;
  message: string;
}

export interface FraudAlertRecord {
  id: number;
  userId: string;
  actionType: string;
  reason: string;
  riskScore: number;
  ipAddress: string;
  aiRecommendedAction: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface CommissionTransactionRecord {
  id: number;
  laundryName: string;
  orderId: number;
  orderAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  createdAt: string;
}

export interface LaundryDebtRecord {
  laundryId: number;
  laundryName: string;
  totalEarnings: number;
  pendingCommission: number;
  debtCeiling: number;
  status: string;
}

export interface SystemCommissionsRecord {
  totalPlatformCommissions: number;
  totalPendingDebts: number;
  recentTransactions: CommissionTransactionRecord[];
  laundryDebts: LaundryDebtRecord[];
}

export interface NotificationRecord {
  id: number;
  title: string;
  message: string;
  type: number;
  isRead: boolean;
  orderId?: number | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

export interface UserSettingsRecord {
  language: number;
  currency: number;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  showProfile: boolean;
  shareData: boolean;
}

export interface UpdateUserSettingsPayload {
  language?: number;
  currency?: number;
  pushNotifications?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  whatsappNotifications?: boolean;
  showProfile?: boolean;
  shareData?: boolean;
}

export interface NotificationPreferencesRecord {
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}
