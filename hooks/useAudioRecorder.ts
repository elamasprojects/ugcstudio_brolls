import { useState, useRef } from 'react';
// FIX: Added React import to resolve namespace errors for React types.
import React from 'react';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => void;
  stopRecording: () => void;
}

const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return { isRecording, startRecording, stopRecording, audioBlob, audioUrl };
};

export default useAudioRecorder;
