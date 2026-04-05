import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { title } = await request.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `Based on this task title, respond with ONLY one word — High, Medium, or Low — based on how urgent this task seems: "${title}"` }]
      }]
    });

    const priority = response.text.trim();

    return NextResponse.json({ priority });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ priority: "Medium" });
  }
}