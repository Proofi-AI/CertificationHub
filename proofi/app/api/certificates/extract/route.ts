import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const EXTRACTION_PROMPT = `You are reading a professional certificate or certification document. Extract the following information from it and return ONLY a valid JSON object with no extra text, no markdown, no code blocks.

Return this exact JSON structure:
{
  "name": "full certificate or course name",
  "issuer": "the company or organization that issued it",
  "issuedAt": "YYYY-MM-DD format if found, otherwise null",
  "expiresAt": "YYYY-MM-DD format if found, null if no expiry or not found",
  "credentialId": "credential ID, license number, or certificate number if found, otherwise null"
}

Rules:
- Return only the JSON object. No explanation, no markdown, no extra text.
- If you cannot find a value, set it to null.
- For issuedAt and expiresAt, always convert to YYYY-MM-DD format.
- For the name field, use the full official name of the certification, not abbreviations.
- For the issuer field, use the full organization name.`;

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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
    ]);

    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: Record<string, string | null>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Could not parse extraction response." },
        { status: 422 }
      );
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error("[extract] Gemini error:", err);

    const message = err instanceof Error ? err.message : "";
    if (message.includes("429") || message.includes("quota") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        { error: "Gemini API quota exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Extraction failed. Please fill in the details manually." },
      { status: 500 }
    );
  }
}
