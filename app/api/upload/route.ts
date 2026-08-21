import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const pinataForm = new FormData();
    pinataForm.append("file", file);
    pinataForm.append("network", "public");
    pinataForm.append("name", file.name);
    const res = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataForm,
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    const data = await res.json();
    const hash = data.data?.cid;
    if (!hash) return NextResponse.json({ error: "No CID returned" }, { status: 500 });
    const ipfsUrl = `ipfs://${hash}`;
    const gatewayUrl = `/api/image?url=${encodeURIComponent(`https://gateway.pinata.cloud/ipfs/${hash}`)}`;
    return NextResponse.json({ ipfsUrl, gatewayUrl, hash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
