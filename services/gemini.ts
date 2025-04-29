import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export class GeminiService {
  static async generateSubject(postContent: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a concise, professional email subject line for a job application based on this LinkedIn post:\n${postContent}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().replace(/^"|"$/g, '').trim();
  }

  static async generateMessage(postContent: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Write a professional, friendly email message for a job application based on this LinkedIn post. Mention that the resume is attached, and keep it under 200 words.\n${postContent}`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().replace(/^"|"$/g, '').trim();
  }
} 