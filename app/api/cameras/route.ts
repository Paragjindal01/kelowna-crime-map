import { cameras } from "../../../data/cameras";

export async function GET() {
  try {
    return new Response(JSON.stringify(cameras), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Camera API error:", error);
    return new Response(JSON.stringify({ error: "Camera API failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}