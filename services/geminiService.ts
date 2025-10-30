
import { GoogleGenAI, Modality, Chat, GenerateContentResponse } from "@google/genai";
import type { VideoGenerationReferenceImage, GenerateVideosOperation, GenerateContentParameters, GenerateContentResponse as GenerateContentResponseType } from "@google/genai";

// VEO generation can take several minutes. These are reassuring messages for the user.
export const VEO_LOADING_MESSAGES = [
  "Warming up the AI director... 🎬",
  "Analyzing your creative vision...",
  "Storyboarding the first few scenes...",
  "This can take a few minutes, great art needs patience!",
  "Rendering keyframes...",
  "Adding cinematic flair...",
  "Almost there, preparing for the final cut...",
];


export const editImage = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64ImageData,
            mimeType: mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });
  
  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    const base64Result = part.inlineData.data;
    const resultMimeType = part.inlineData.mimeType;
    return `data:${resultMimeType};base64,${base64Result}`;
  }
  throw new Error("Image generation failed or returned an unexpected format.");
};

export const generateVideo = async (
  prompt: string,
  base64ImageData: string | null,
  mimeType: string | null,
  aspectRatio: '16:9' | '9:16',
  onProgress: (message: string) => void
): Promise<string> => {
  // A new instance must be created to use the most up-to-date API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  let operation: GenerateVideosOperation;
  try {
    onProgress(VEO_LOADING_MESSAGES[0]);
    operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      ...(base64ImageData && mimeType && { image: { imageBytes: base64ImageData, mimeType } }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio,
      }
    });
  } catch (e) {
     if (e instanceof Error && e.message.includes("Requested entity was not found.")) {
        throw new Error("API_KEY_INVALID");
     }
     throw e;
  }

  let progressIndex = 1;
  while (!operation.done) {
    onProgress(VEO_LOADING_MESSAGES[progressIndex % VEO_LOADING_MESSAGES.length]);
    progressIndex++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    try {
        operation = await ai.operations.getVideosOperation({ operation });
    } catch(e) {
        if (e instanceof Error && e.message.includes("Requested entity was not found.")) {
            throw new Error("API_KEY_INVALID");
        }
        throw e;
    }
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation failed to produce a download link.");
  }

  onProgress("Downloading generated video...");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  if(!response.ok) {
    throw new Error("Failed to download the generated video.");
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};

export const createChat = (): Chat => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a helpful and friendly support assistant for B-Roll Studio AI. You help users understand how to use the app to generate videos and images.",
        },
    });
};

export const analyzeImage = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response: GenerateContentResponseType = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
        parts: [
            {
                inlineData: {
                    data: base64ImageData,
                    mimeType: mimeType,
                },
            },
            {
                text: prompt,
            },
        ],
    },
  });
  return response.text;
};

export const generateScript = async (
  prompt: string,
  audience: string,
  useThinkingMode: boolean,
  base64ImageData: string | null,
  mimeType: string | null
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const systemInstruction = "Crea un script para un video que sea contenido UGC, que sea natural, que sea un tono casual, y que se note que la persona está dando como su opinión sobre el producto o servicio, en caso de estar vendiendo algo, y no tanto vendiéndolo como si fuese un vendedor de la compañía, sino un contenido súper natural.";

  const request: GenerateContentParameters = {
    model: '',
    config: {
      systemInstruction: systemInstruction,
    },
    contents: { parts: [] }
  };

  const userTextPrompt = `Contexto: ${prompt}\nAudiencia Objetivo: ${audience}`;

  if (base64ImageData && mimeType) {
    request.model = 'gemini-2.5-flash';
    request.contents.parts.push({
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    });
    request.contents.parts.push({ text: `Analiza esta imagen y, basándote en ella, crea el script con el siguiente contexto:\n${userTextPrompt}` });
  } else {
    request.contents.parts.push({ text: userTextPrompt });
    if (useThinkingMode) {
      request.model = 'gemini-2.5-pro';
      request.config!.thinkingConfig = { thinkingBudget: 32768 };
    } else {
      request.model = 'gemini-2.5-flash';
    }
  }

  const response = await ai.models.generateContent(request);

  return response.text;
};
