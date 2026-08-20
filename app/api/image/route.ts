import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  
  // Only allow IPFS URLs for security
  if (!url.startsWith("https://gateway.pinata.cloud/ipfs/") && 
      !url.startsWith("https://ipfs.io/ipfs/") &&
      !url.startsWith("ipfs://")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const fetchUrl = url.startsWith("ipfs://") 
      ? url.replace("ipfs://", "https://ipfs.io/ipfs/")
      : url;
    const res = await fetch(fetchUrl, { next: { revalidate: 31536000 } });
    if (!res.ok) return new NextResponse("Failed", { status: res.status });
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 500 });
  }
}
