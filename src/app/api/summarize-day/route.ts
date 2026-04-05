import {GoogleGenAI} from "@google/genai";
import {NextResponse} from "next/server";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY!});

export async function POST(request: Request) {
    try {
        const {tasks} = await request.json();
        const tasksList = tasks
            .map((t: any) => `- ${t.title} (Priority: ${t.priority})`)
            .join("\n");

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{
                role: "user",
                parts: [{
                    text: `Here are my tasks for today:\n${tasksList}\n\nPlease provide a brief, motivating 2-sentence summary of my day and tell me exactly which task I should focus on first based on its priority and importance.`
                }]
            }]
        });

        const summary = response.text.trim();

        return NextResponse.json({summary});

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({summary: "Could not generate summary. Just focus on your high priority tasks!"}, {status: 500});
    }
}