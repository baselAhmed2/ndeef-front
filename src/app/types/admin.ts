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

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}
