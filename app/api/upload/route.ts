import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const pinataForm = new FormData();
    pinataForm.append("file", file);
    pinataForm.append("pinataMetadata", JSON.stringify({ name: file.name }));
    pinataForm.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
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
    const ipfsUrl = `ipfs://${data.IpfsHash}`;
    const gatewayUrl = `https://ipfs.io/ipfs/${data.IpfsHash}`;
    return NextResponse.json({ ipfsUrl, gatewayUrl, hash: data.IpfsHash });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
