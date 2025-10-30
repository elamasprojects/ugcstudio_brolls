
/**
 * Sends recorded audio and a selected voice ID to the ElevenLabs API for conversion.
 * WARNING: This implementation calls the ElevenLabs API directly from the frontend
 * and exposes the API key. For a production environment, this logic should be
 * moved to a secure backend server.
 * 
 * @param audioBlob The user's recorded audio as a Blob.
 * @param voiceId The ID of the selected ElevenLabs voice.
 * @returns A promise that resolves to an object URL for the converted audio.
 */
export const convertSpeechToSpeech = async (audioBlob: Blob, voiceId: string): Promise<string> => {
  const ELEVENLABS_API_KEY = 'sk_38ea94dab36fa8ca5085a6113a882ba025d983abd7fa95cf';
  const url = `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`;
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'user_recording.mp3');
  // Use the recommended STS model as per the documentation
  formData.append('model_id', 'eleven_multilingual_sts_v2');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    // Try to parse the detailed error from ElevenLabs
    try {
      const errorData = await response.json();
      console.error("ElevenLabs API Error:", errorData);
      const errorMessage = errorData.detail?.message || JSON.stringify(errorData.detail) || 'The server returned an error.';
      throw new Error(errorMessage);
    } catch (e) {
      throw new Error(`Conversion failed with status: ${response.status}. Please check the console for details.`);
    }
  }

  // The successful response body is the audio file directly
  const convertedAudioBlob = await response.blob();
  return URL.createObjectURL(convertedAudioBlob);
};
