import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  let body: { name?: string; issuer?: string; domain?: string; issuedAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, issuer, domain, issuedAt } = body;
  if (!name || !issuer) {
    return NextResponse.json(
      { error: "name and issuer are required." },
      { status: 400 }
    );
  }

  const prompt = `Write a 1-2 sentence professional description for a certificate with the following details:
- Certificate name: ${name}
- Issued by: ${issuer}${domain ? `\n- Domain: ${domain}` : ""}${issuedAt ? `\n- Issued: ${issuedAt}` : ""}

Rules:
- Write in third person (e.g. "Demonstrates proficiency in...").
- Keep it under 200 characters.
- Return ONLY the description text. No quotes, no extra text.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const description = result.response.text().trim().replace(/^["']|["']$/g, "");

    return NextResponse.json({ data: { description } });
  } catch (err) {
    console.error("[describe] Gemini error:", err);

    const message = err instanceof Error ? err.message : "";
    if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Could not generate description. Please write one manually." },
      { status: 500 }
    );
  }
}
