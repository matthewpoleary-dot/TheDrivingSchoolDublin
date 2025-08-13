import { getAvailableSlots } from "@/lib/availability";

// Browser test: /api/slots?serviceId=...&date=YYYY-MM-DD
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");
  if (!serviceId || !date) {
    return Response.json(
      { error: "serviceId and date are required" },
      { status: 400 }
    );
  }
  const slots = await getAvailableSlots(serviceId, date);
  return Response.json({ slots });
}

// Real usage: POST { serviceId, date }
export async function POST(req: Request) {
  const { serviceId, date } = await req.json();
  if (!serviceId || !date) {
    return Response.json(
      { error: "serviceId and date are required" },
      { status: 400 }
    );
  }
  const slots = await getAvailableSlots(serviceId, date);
  return Response.json({ slots });
}
