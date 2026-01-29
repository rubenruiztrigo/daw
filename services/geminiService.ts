
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache to prevent re-generating content during a session
const cache = new Map<string, string>();

/**
 * Service to summarize public administration content for professionals using gemini-3-flash-preview.
 */
export const generateContentSummary = async (id: string, title: string, description: string): Promise<string> => {
  if (cache.has(id)) {
    return cache.get(id)!;
  }

  try {
    const prompt = `Resume el siguiente contenido de administración pública de forma concisa para profesionales. 
    Título: ${title}
    ID: ${id}
    Descripción: ${description}
    El resumen debe ser directo y resaltar los aspectos más importantes.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const summary = response.text || "No se pudo generar el resumen.";
    cache.set(id, summary);
    return summary;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error al generar el resumen con IA.";
  }
};
