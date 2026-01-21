
import { GoogleGenAI } from "@google/genai";

// Simple in-memory cache to prevent re-generating summaries for the same items during a session
const summaryCache = new Map<string, string>();

/**
 * Generates an enhanced summary for a public tender using Gemini AI.
 * Follows the latest SDK guidelines for direct initialization and content generation.
 */
export const generateTenderSummary = async (id: string, title: string, originalText: string): Promise<string | null> => {
  // Return cached result if available to save tokens and improve performance
  if (summaryCache.has(id)) {
    return summaryCache.get(id)!;
  }

  try {
    // Initializing the GenAI client with the API key from environment variables as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Actúa como un experto en contratación pública. Analiza la siguiente licitación y genera un resumen EXTREMADAMENTE BREVE (máximo 2 líneas) explicando únicamente QUÉ producto, servicio u obra se busca contratar. 
    
    Instrucciones:
    - Sé directo y conciso.
    - Elimina códigos, IDs, referencias burocráticas y estado del expediente.
    - Céntrate en la oportunidad de negocio: ¿Qué se puede vender u ofrecer aquí?
    - No uses frases introductorias como "El objeto es" o "Se licita".

    Título: ${title}
    Descripción Original: ${originalText}
    
    Resumen breve:`;

    // Using gemini-3-flash-preview as it is the recommended model for basic text tasks like summarization
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Access the text property directly on the response object
    const text = response.text;
    if (text) {
        const cleanText = text.trim();
        summaryCache.set(id, cleanText);
        return cleanText;
    }
  } catch (error) {
    // Log warning instead of throwing to allow the UI to fallback to the original summary
    console.warn(`Error generating summary for tender ${id}:`, error);
  }

  return null;
};
