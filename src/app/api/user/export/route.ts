import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportUserData } from "@/actions/user.actions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await exportUserData();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  const json = JSON.stringify(result.data, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="my-certificationhub-data.json"',
    },
  });
}
