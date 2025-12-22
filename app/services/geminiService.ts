import { GoogleGenAI, Type } from "@google/genai";
import { Task, Category } from "../types";
import { v4 as uuidv4 } from 'uuid'; // We will simulate uuid since we don't have the lib, see simple helper below

const getSystemInstruction = () => `
  You are an expert productivity assistant. 
  Your goal is to break down user goals into actionable, concrete tasks.
  Focus on realistic daily steps.
`;

export const generateTasksFromGoal = async (goal: string, date: string): Promise<Omit<Task, 'id' | 'date'>[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `My goal is: "${goal}". Generate 3 to 5 actionable tasks I can do starting ${date}.`,
      config: {
        systemInstruction: getSystemInstruction(),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A concise action title" },
              category: { type: Type.STRING, enum: ['Work', 'Personal', 'Health', 'Learning', 'Finance'] },
              status: { type: Type.STRING, enum: ['todo', 'in-progress', 'done'] }
            },
            required: ["title", "category", "status"]
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
