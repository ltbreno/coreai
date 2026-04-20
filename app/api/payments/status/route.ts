import { NextRequest, NextResponse } from "next/server";

const ABACATE_BASE = "https://api.abacatepay.com/v1";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

  const apiKey = process.env.ABACATE_PAY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chave não configurada" },
      { status: 500 },
    );
  }

  const res = await fetch(`${ABACATE_BASE}/pixQrCode/check?id=${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ status: "pending" });
  }

  const json = await res.json();
  // Abacate Pay returns status field inside data
  const status: string = json.data?.status ?? "PENDING";

  return NextResponse.json({
    status:
      status.toUpperCase() === "PAID" || status.toUpperCase() === "COMPLETED"
        ? "completed"
        : "pending",
  });
}
