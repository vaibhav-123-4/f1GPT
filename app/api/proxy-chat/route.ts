// app/api/proxy-chat/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.CHATBOT_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
