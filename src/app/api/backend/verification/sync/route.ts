import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verificationSessionId = searchParams.get("verificationSessionId");

    if (!verificationSessionId) {
      return NextResponse.json(
        { error: "Verification session ID is required" },
        { status: 400 }
      );
    }

    console.log("[verification/sync] Session ID:", verificationSessionId);

    // Mock response - backend doesn't have this endpoint yet
    // Return success to allow the verification flow to continue
    return NextResponse.json(
      { synced: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[verification/sync exception]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
