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

// --- Audio Helper Functions ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i,
        sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([view], { type: 'audio/wav' });

    function setUint16(data: number) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data: number) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}


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
  
  const systemInstruction = `You are an expert scriptwriter for social media content. Create a script for a UGC (User-Generated Content) style video. The tone should be natural and casual, like a genuine opinion, not a sales pitch.
**Format the script clearly with distinct elements:**
- **Scene Descriptions:** Briefly describe the setting and action. (e.g., A bright, modern kitchen. A person unboxes a product.)
- **Character/Speaker:** Use a clear name or label in uppercase followed by a colon (e.g., SPEAKER:).
- **Dialogue:** Write the spoken lines for the character.
- **Visual Cues:** Add notes for visuals in parentheses (e.g., (Close up on the product)).`;

  const request: GenerateContentParameters = {
    model: '',
    config: {
      systemInstruction: systemInstruction,
    },
    contents: { parts: [] }
  };

  const userTextPrompt = `Context: ${prompt}\nTarget Audience: ${audience}`;

  if (base64ImageData && mimeType) {
    request.model = 'gemini-2.5-flash';
    request.contents.parts.push({
      inlineData: {
        data: base64ImageData,
        mimeType: mimeType,
      },
    });
    request.contents.parts.push({ text: `Analyze this image and, based on it, create the script with the following context:\n${userTextPrompt}` });
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

export const generateSpeech = async (script: string, voiceName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
      throw new Error("Audio generation failed or returned an unexpected format.");
  }
  
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});

  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    outputAudioContext,
    24000,
    1,
  );
  
  const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
  return URL.createObjectURL(wavBlob);
};