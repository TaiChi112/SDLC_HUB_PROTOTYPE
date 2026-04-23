import type { NextRequest } from "next/server";
import { auth, handlers } from "@/app/auth";

// NextAuth v5 route handler using spread syntax for all methods
export const { GET, POST } = handlers;

// Also handle other methods for mutations
export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  return POST(req);
}
