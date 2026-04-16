/**
 * API Connectivity Test Suite
 * Tests all backend endpoints to ensure proper connectivity
 */

import { 
  // Laundry Admin
  getDashboardSummary,
  getRevenueWeekly,
  getIncomingOrders,
  getServices,
  getSchedule,
  getCapacity,
  getCommissionSummary,
  getPayments,
  getProfile,
  getExternalAnalytics,
  getForecast,
  getVerificationStatus,
  getLaundryNotifications,
} from "./laundry-admin-client";

import {
  googleLogin,
  forgotPasswordApi,
} from "../services/api";

export interface ApiTestResult {
  endpoint: string;
  status: "success" | "error" | "warning";
  message: string;
  responseTime?: number;
  data?: any;
}

// Test Authentication APIs
export async function testAuthApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Google Login (without actual token - should fail gracefully)
  try {
    const start = performance.now();
    await googleLogin("invalid_token_test");
    results.push({
      endpoint: "POST /api/auth/google-login",
      status: "warning",
      message: "Endpoint reached but invalid token",
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    const start = performance.now();
    results.push({
      endpoint: "POST /api/auth/google-login",
      status: error.message?.includes("Network") ? "error" : "success",
      message: error.message || "Endpoint reachable",
      responseTime: performance.now() - start,
    });
  }
  
  // Test Forgot Password
  try {
    const start = performance.now();
    await forgotPasswordApi("test@example.com");
    results.push({
      endpoint: "POST /api/auth/forgot-password",
      status: "success",
      message: "Endpoint reachable",
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "POST /api/auth/forgot-password",
      status: error.message?.includes("Network") ? "error" : "warning",
      message: error.message || "Unknown error",
    });
  }
  
  return results;
}

// Test Laundry Admin Dashboard APIs
export async function testDashboardApis(_token: string): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Dashboard Summary
  try {
    const start = performance.now();
    const summary = await getDashboardSummary();
    results.push({
      endpoint: "GET /api/laundry-admin/dashboard",
      status: "success",
      message: "Dashboard data retrieved",
      responseTime: performance.now() - start,
      data: summary,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/dashboard",
      status: "error",
      message: error.message || "Failed to fetch dashboard",
    });
  }
  
  // Test Revenue Weekly
  try {
    const start = performance.now();
    const weekly = await getRevenueWeekly();
    results.push({
      endpoint: "GET /api/laundry-admin/revenue/weekly",
      status: "success",
      message: `Retrieved ${weekly.length} data points`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/revenue/weekly",
      status: "error",
      message: error.message || "Failed to fetch revenue",
    });
  }
  
  // Test Incoming Orders
  try {
    const start = performance.now();
    const orders = await getIncomingOrders();
    results.push({
      endpoint: "GET /api/laundry-admin/orders/incoming",
      status: "success",
      message: `Retrieved ${orders.length} incoming orders`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/orders/incoming",
      status: "error",
      message: error.message || "Failed to fetch orders",
    });
  }
  
  return results;
}

// Test Services APIs
export async function testServicesApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Get Services
  try {
    const start = performance.now();
    const services = await getServices();
    results.push({
      endpoint: "GET /api/laundry-admin/services",
      status: "success",
      message: `Retrieved ${services.length} services`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/services",
      status: "error",
      message: error.message || "Failed to fetch services",
    });
  }
  
  return results;
}

// Test Schedule & Availability APIs
export async function testScheduleApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Get Schedule
  try {
    const start = performance.now();
    const schedule = await getSchedule();
    results.push({
      endpoint: "GET /api/laundry-admin/availability/schedule",
      status: "success",
      message: `Schedule retrieved successfully (${Object.keys(schedule).length} days)`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/availability/schedule",
      status: "error",
      message: error.message || "Failed to fetch schedule",
    });
  }
  
  // Test Get Capacity
  try {
    const start = performance.now();
    const capacity = await getCapacity();
    results.push({
      endpoint: "GET /api/laundry-admin/availability/capacity",
      status: "success",
      message: `Capacity: ${capacity.maxOrdersPerDay} orders/day`,
      responseTime: performance.now() - start,
      data: capacity,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/availability/capacity",
      status: "error",
      message: error.message || "Failed to fetch capacity",
    });
  }
  
  return results;
}

// Test Commission & Payments APIs
export async function testPaymentApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Commission Summary
  try {
    const start = performance.now();
    const commission = await getCommissionSummary();
    results.push({
      endpoint: "GET /api/laundry-admin/commission/summary",
      status: "success",
      message: `Revenue: ${commission.totalRevenue}, Commission: ${commission.commissionDue}`,
      responseTime: performance.now() - start,
      data: commission,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/commission/summary",
      status: "error",
      message: error.message || "Failed to fetch commission",
    });
  }
  
  // Test Payments
  try {
    const start = performance.now();
    const payments = await getPayments();
    results.push({
      endpoint: "GET /api/laundry-admin/payments",
      status: "success",
      message: `Retrieved ${payments.length} payments`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/payments",
      status: "error",
      message: error.message || "Failed to fetch payments",
    });
  }
  
  return results;
}

// Test Profile & Setup APIs
export async function testProfileApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Get Profile
  try {
    const start = performance.now();
    const profile = await getProfile();
    results.push({
      endpoint: "GET /api/laundry-admin/profile",
      status: "success",
      message: `Profile: ${profile.name}`,
      responseTime: performance.now() - start,
      data: profile,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/profile",
      status: "error",
      message: error.message || "Failed to fetch profile",
    });
  }
  
  // Test Verification Status
  try {
    const start = performance.now();
    const status = await getVerificationStatus();
    results.push({
      endpoint: "GET /api/verification/status",
      status: "success",
      message: `Verified: ${status.isIdentityVerified}, Role: ${status.role}`,
      responseTime: performance.now() - start,
      data: status,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/verification/status",
      status: "error",
      message: error.message || "Failed to fetch verification status",
    });
  }
  
  return results;
}

// Test Analytics APIs
export async function testAnalyticsApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test External Analytics
  try {
    const start = performance.now();
    const analytics = await getExternalAnalytics();
    results.push({
      endpoint: "GET /api/laundry-admin/analytics/external",
      status: "success",
      message: "Analytics retrieved",
      responseTime: performance.now() - start,
      data: analytics,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/analytics/external",
      status: "error",
      message: error.message || "Failed to fetch analytics",
    });
  }
  
  // Test Forecast
  try {
    const start = performance.now();
    const forecast = await getForecast();
    results.push({
      endpoint: "GET /api/laundry-admin/forecast",
      status: "success",
      message: `Next week: ${forecast.expectedOrdersNextWeek} orders`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/forecast",
      status: "error",
      message: error.message || "Failed to fetch forecast",
    });
  }
  
  return results;
}

// Test Notifications APIs
export async function testNotificationApis(): Promise<ApiTestResult[]> {
  const results: ApiTestResult[] = [];
  
  // Test Get Notifications
  try {
    const start = performance.now();
    const notifications = await getLaundryNotifications();
    results.push({
      endpoint: "GET /api/laundry-admin/notifications",
      status: "success",
      message: `Retrieved ${notifications.length} notifications`,
      responseTime: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      endpoint: "GET /api/laundry-admin/notifications",
      status: "error",
      message: error.message || "Failed to fetch notifications",
    });
  }
  
  return results;
}

// Run All Tests
export async function runAllApiTests(token?: string): Promise<{
  summary: { total: number; passed: number; failed: number; warnings: number };
  results: ApiTestResult[];
}> {
  console.log("🧪 Starting API Connectivity Tests...");
  
  const allResults: ApiTestResult[] = [];
  
  // Auth tests (no token needed)
  const authResults = await testAuthApis();
  allResults.push(...authResults);
  
  if (token) {
    // Tests requiring authentication
    const dashboardResults = await testDashboardApis(token);
    const servicesResults = await testServicesApis();
    const scheduleResults = await testScheduleApis();
    const paymentResults = await testPaymentApis();
    const profileResults = await testProfileApis();
    const analyticsResults = await testAnalyticsApis();
    const notificationResults = await testNotificationApis();
    
    allResults.push(
      ...dashboardResults,
      ...servicesResults,
      ...scheduleResults,
      ...paymentResults,
      ...profileResults,
      ...analyticsResults,
      ...notificationResults
    );
  }
  
  // Calculate summary
  const summary = {
    total: allResults.length,
    passed: allResults.filter((r) => r.status === "success").length,
    failed: allResults.filter((r) => r.status === "error").length,
    warnings: allResults.filter((r) => r.status === "warning").length,
  };
  
  console.log("\n📊 Test Summary:");
  console.log(`   Total: ${summary.total}`);
  console.log(`   ✅ Passed: ${summary.passed}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  console.log(`   ⚠️  Warnings: ${summary.warnings}`);
  
  return { summary, results: allResults };
}

// Export for use in browser console
if (typeof window !== "undefined") {
  (window as any).testApis = runAllApiTests;
  (window as any).testAuth = testAuthApis;
  (window as any).testDashboard = testDashboardApis;
}
