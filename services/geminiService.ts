
import { GoogleGenAI, Type } from "@google/genai";
import { ALL_FIELDS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function parseNaturalLanguageQuery(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform this natural language search into a structured query.
      User Query: "${prompt}"
      Available Fields: ${JSON.stringify(ALL_FIELDS.map(f => ({ id: f.id, label: f.label, type: f.type })))}
      
      Return a JSON array of filters where each filter has:
      - fieldId: the id from the available fields
      - operator: 
          for STRING: EQUALS, CONTAINS, STARTS_WITH, ENDS_WITH
          for DATE: LAST_7_DAYS, LAST_30_DAYS, LAST_90_DAYS, CUSTOM_RANGE
          for ENTITY: EQUALS
      - value: the value (string, date string, or array for ENTITY)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              fieldId: { type: Type.STRING },
              operator: { type: Type.STRING },
              value: { type: Type.STRING }
            },
            required: ["fieldId", "operator", "value"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return [];
  }
}
