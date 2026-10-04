import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haptics } from "@/lib/haptics";
import { findAyah } from "@/lib/ayah-match";

const MAX_RECORDING_TIME_MS = 30000; // 30 seconds

interface AyahData {
  number: number;
  first?: string;
  last?: string;
  text?: string;
}

interface VoiceAyahSearchProps {
  ayahs: AyahData[];
  onAyahFound: (ayahNumber: number) => void;
  /** The surah's Arabic name, e.g. "سورة يس" — tells the transcriber what it is hearing. */
  surahName?: string;
  accentColor?: string;
}

export const VoiceAyahSearch = ({ 
  ayahs, 
  onAyahFound, 
  surahName,
  accentColor = "#1e3c72" 
}: VoiceAyahSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear auto-stop timer on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];

      const chosenMimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

      const mediaRecorder = chosenMimeType
        ? new MediaRecorder(stream, { mimeType: chosenMimeType })
        : new MediaRecorder(stream);

      mimeTypeRef.current = mediaRecorder.mimeType || chosenMimeType || 'audio/webm';
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      // A small timeslice improves reliability on some browsers (ensures dataavailable fires)
      mediaRecorder.start(250);
      setIsRecording(true);
      await haptics.light();
      toast.info("Recording... Tap again to stop (max 30s)");

      // Auto-stop after 30 seconds
      autoStopTimerRef.current = setTimeout(async () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('Auto-stopping recording after 30 seconds');
          toast.info("Auto-stopped after 30 seconds");
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          await haptics.light();
        }
      }, MAX_RECORDING_TIME_MS);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
    // Clear auto-stop timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      await haptics.light();
    }
  };

  const processRecording = async () => {
    if (chunksRef.current.length === 0) {
      toast.error("No audio recorded");
      return;
    }

    setIsProcessing(true);

    try {
      const audioBlob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' });
      
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await base64Promise;

      // Call edge function
      const { data, error } = await supabase.functions.invoke('transcribe-ayah', {
        body: { audio: base64Audio, mimeType: audioBlob.type, surah: surahName }
      });

      if (error) {
        console.error('Transcription error:', error);
        throw new Error(error.message || 'Failed to transcribe audio');
      }

      if (!data?.text) {
        toast.error("Could not understand the audio. Please try again.");
        return;
      }

      console.log('Transcribed text:', data.text);
      toast.success(`Heard: "${data.text}"`);

      // Find matching ayah
      const matchedAyah = findAyah(data.text, ayahs);
      
      if (matchedAyah) {
        await haptics.success();
        toast.success(`Found Ayah ${matchedAyah}!`);
        onAyahFound(matchedAyah);
      } else {
        await haptics.warning();
        toast.error("Could not find matching ayah. Please try again.");
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = async () => {
    if (isProcessing) return;
    
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isProcessing}
      className={`h-20 w-20 rounded-full shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
      title="Voice search for ayah"
    >
      {isProcessing ? (
        <Loader2 className="w-10 h-10 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-10 h-10" />
      ) : (
        <Mic className="w-10 h-10" />
      )}
    </Button>
  );
};
