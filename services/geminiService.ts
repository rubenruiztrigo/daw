
import { GoogleGenAI } from "@google/genai";

// Fix: Initialized Google GenAI with API key from environment following best practices
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache to prevent re-generating content during a session
const cache = new Map<string, string>();

/**
 * Fix: Implemented generateTenderSummary to resolve import errors in TendersView.
 * This service summarizes public tenders for professionals using gemini-3-flash-preview.
 */
export const generateTenderSummary = async (id: string, title: string, description: string): Promise<string> => {
  // Check cache first to avoid redundant API calls
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  try {
    const prompt = `Resume la siguiente licitación pública de forma concisa para profesionales del sector público. 
    Título: ${title}
    ID: ${id}
    Descripción: ${description}
    El resumen debe ser directo y resaltar los aspectos más importantes.`;

    // Use gemini-3-flash-preview for basic text tasks like summarization
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the .text property of GenerateContentResponse
    const summary = response.text || "No se pudo generar el resumen.";
    cache.set(id, summary);
    return summary;
  } catch (error) {
    console.error("Error generating tender summary:", error);
    return "Error al generar el resumen con IA.";
  }
};
