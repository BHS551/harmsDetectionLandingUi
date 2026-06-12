import { NextRequest, NextResponse } from "next/server";

const HEIMDAL_URL = "https://a2ukt8vyhb.execute-api.us-east-1.amazonaws.com/default/heimdalManager";

export async function POST(req: NextRequest) {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
        return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const body = await req.text();

    const upstream = await fetch(HEIMDAL_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: authorization,
        },
        body,
    });

    const text = await upstream.text();

    return new NextResponse(text, {
        status: upstream.status,
        headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
}
