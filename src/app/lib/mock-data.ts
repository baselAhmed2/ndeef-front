// Mock data for development when backend is down
export const mockDashboardData = {
  totalRevenue: 15000,
  totalOrders: 45,
  completedOrders: 30,
  pendingOrders: 15,
};

export const mockOrders = [
  { id: "ORD-001", customerName: "Ahmed Hassan", serviceName: "Wash & Fold", items: 5, total: 125, status: "Delivered", time: "2h ago" },
  { id: "ORD-002", customerName: "Sara Ahmed", serviceName: "Dry Cleaning", items: 3, total: 90, status: "Processing", time: "3h ago" },
  { id: "ORD-003", customerName: "Mohammed Ali", serviceName: "Ironing", items: 8, total: 80, status: "Pending", time: "5h ago" },
  { id: "ORD-004", customerName: "Fatima Khaled", serviceName: "Stain Removal", items: 2, total: 100, status: "Ready", time: "6h ago" },
  { id: "ORD-005", customerName: "Omar Youssef", serviceName: "Wash & Fold", items: 10, total: 200, status: "Delivered", time: "8h ago" },
];

export const mockServices = [
  { name: "Wash & Fold", percentage: 40 },
  { name: "Dry Cleaning", percentage: 30 },
  { name: "Ironing", percentage: 20 },
  { name: "Stain Removal", percentage: 10 },
];
