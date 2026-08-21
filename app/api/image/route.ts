import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });
  
  if (!url.startsWith("https://gateway.pinata.cloud/ipfs/") && 
      !url.startsWith("https://ipfs.io/ipfs/") &&
      !url.startsWith("ipfs://")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    // Extract CID and try multiple gateways
    const cid = url.split("/ipfs/").pop()?.split("?")[0] || "";
    const isV1 = cid.startsWith("baf");
    
    // For CIDv1, use subdomain format which works better
    const fetchUrls = isV1 
      ? [`https://${cid}.ipfs.w3s.link`, `https://ipfs.io/ipfs/${cid}`, url]
      : [url, `https://ipfs.io/ipfs/${cid}`];

    let lastError = "";
    for (const fetchUrl of fetchUrls) {
      try {
        const res = await fetch(fetchUrl, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
        lastError = `${fetchUrl}: ${res.status}`;
      } catch (e: any) {
        lastError = `${fetchUrl}: ${e.message}`;
      }
    }
    return new NextResponse(lastError, { status: 404 });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 500 });
  }
}
