export type OrderStatus =
  | "pending_confirmation"
  | "accepted"
  | "washing"
  | "ready_for_pickup"
  | "picked_up"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface Order {
  id: string;
  userId?: string; // ← NEW: used for ownership check in TrackOrder
  laundryId: string;
  laundryName: string;
  laundryImage?: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceUnit: string;
  itemCount: number;
  pickupDate: string;
  pickupTime: string;
  pickupAddress: string;
  deliveryAddress: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  rating: number | null;
  review: string | null;
  createdAt: string;
  updatedAt: string;
}

export const sampleOrders: Order[] = [
  {
    id: "1001",
    laundryId: "3",
    laundryName: "Express Clean",
    laundryImage:
      "https://images.unsplash.com/photo-1764120656278-994739787d38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    serviceId: "wash-kg",
    serviceName: "Wash & Fold",
    servicePrice: 18,
    serviceUnit: "per kg",
    itemCount: 5,
    pickupDate: "Today",
    pickupTime: "10:00 – 12:00",
    pickupAddress: "14 Tahrir Square, Cairo",
    deliveryAddress: "14 Tahrir Square, Cairo",
    subtotal: 90,
    deliveryFee: 10,
    total: 100,
    status: "washing",
    paymentStatus: "paid",
    rating: null,
    review: null,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "1002",
    laundryId: "1",
    laundryName: "Smart Clean Laundry",
    laundryImage:
      "https://images.unsplash.com/photo-1695679958326-918405eacb70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    serviceId: "dry-shirt",
    serviceName: "Dry Clean – Shirt",
    servicePrice: 35,
    serviceUnit: "per item",
    itemCount: 3,
    pickupDate: "Tomorrow",
    pickupTime: "14:00 – 16:00",
    pickupAddress: "7 El-Nasr Road, New Cairo",
    deliveryAddress: "7 El-Nasr Road, New Cairo",
    subtotal: 105,
    deliveryFee: 10,
    total: 115,
    status: "pending_confirmation",
    paymentStatus: "paid",
    rating: null,
    review: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "1003",
    laundryId: "2",
    laundryName: "Comfort Laundry",
    laundryImage:
      "https://images.unsplash.com/photo-1761079976271-3a78f547ca67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
    serviceId: "iron-shirt",
    serviceName: "Iron – Shirt",
    servicePrice: 8,
    serviceUnit: "per item",
    itemCount: 10,
    pickupDate: "Yesterday",
    pickupTime: "16:00 – 18:00",
    pickupAddress: "22 Corniche El-Nil, Maadi",
    deliveryAddress: "22 Corniche El-Nil, Maadi",
    subtotal: 80,
    deliveryFee: 10,
    total: 90,
    status: "delivered",
    paymentStatus: "paid",
    rating: null,
    review: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

export function initializeSampleOrders() {
  const existingOrders = localStorage.getItem("nadeef_orders");
  if (!existingOrders || existingOrders === "[]") {
    localStorage.setItem("nadeef_orders", JSON.stringify(sampleOrders));
  }
}

export function getOrders(): Order[] {
  initializeSampleOrders();
  try {
    return JSON.parse(localStorage.getItem("nadeef_orders") || "[]");
  } catch {
    return [];
  }
}

export function getOrder(id: string): Order | null {
  const orders = getOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.unshift(order);
  }
  localStorage.setItem("nadeef_orders", JSON.stringify(orders));
}

export function cancelOrder(id: string): Order | null {
  const order = getOrder(id);
  if (!order) return null;

  // Only allow cancellation if order is in early stages
  if (order.status !== "pending_confirmation" && order.status !== "accepted") {
    return null;
  }

  order.status = "cancelled";
  order.updatedAt = new Date().toISOString();
  saveOrder(order);
  return order;
}

export const statusConfig: Record<
  OrderStatus,
  { label: string; color: string; bg: string; description: string }
> = {
  pending_confirmation: {
    label: "Pending Confirmation",
    color: "#EBA050",
    bg: "#FFF7ED",
    description: "Waiting for the laundry to accept your order.",
  },
  accepted: {
    label: "Accepted",
    color: "#1D6076",
    bg: "#EFF8FB",
    description:
      "The laundry has accepted your order and is preparing for pickup.",
  },
  washing: {
    label: "Being Washed",
    color: "#2a7a94",
    bg: "#E8F4F8",
    description: "Your items are currently being cleaned.",
  },
  ready_for_pickup: {
    label: "Ready for Delivery",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your items are clean and ready. A driver is being assigned.",
  },
  picked_up: {
    label: "On the Way",
    color: "#7c3aed",
    bg: "#F5F3FF",
    description: "Your items have been picked up and are on their way to you.",
  },
  delivered: {
    label: "Delivered",
    color: "#059669",
    bg: "#ECFDF5",
    description: "Your order has been delivered successfully.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "#FEF2F2",
    description: "This order has been cancelled.",
  },
};

export const statusOrder: OrderStatus[] = [
  "pending_confirmation",
  "accepted",
  "washing",
  "ready_for_pickup",
  "picked_up",
  "delivered",
];
