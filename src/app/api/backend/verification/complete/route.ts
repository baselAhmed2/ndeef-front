import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("[verification/complete] Completing verification");

    // Mock response - backend doesn't have this endpoint yet
    // Return success to allow the verification flow to continue
    return NextResponse.json(
      { 
        verified: true,
        adminApprovalStatus: "Pending",
        role: "LaundryAdmin"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verification/complete exception]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
