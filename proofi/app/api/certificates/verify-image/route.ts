import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const VERIFICATION_PROMPT = `You are reviewing an uploaded image to determine if it looks like a genuine professional certificate, diploma, or certification document.

Analyze the image and return ONLY a valid JSON object with no extra text, no markdown, no code blocks:
{
  "verified": true or false,
  "confidence": "high", "medium", or "low",
  "reason": "one short sentence explaining the verdict"
}

Rules:
- Return only the JSON object.
- verified: true if the image appears to be a legitimate certificate/diploma/certification document.
- verified: false if it looks edited, fake, is a blank template, is not a certificate at all, or you cannot tell.
- confidence: how certain you are of your verdict.
- reason: keep it under 100 characters.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured." },
      { status: 500 }
    );
  }

  let file: File | null = null;
  try {
    const formData = await request.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const mimeType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      VERIFICATION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text().trim();

    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: { verified: boolean; confidence: string; reason: string };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Could not parse verification response." },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error("[verify-image] Gemini error:", err);

    const message = err instanceof Error ? err.message : "";
    if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
