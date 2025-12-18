import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { haptics } from "@/lib/haptics";

interface AyahData {
  number: number;
  first?: string;
  last?: string;
  text?: string;
}

interface VoiceAyahSearchProps {
  ayahs: AyahData[];
  onAyahFound: (ayahNumber: number) => void;
  accentColor?: string;
}

export const VoiceAyahSearch = ({ 
  ayahs, 
  onAyahFound, 
  accentColor = "#1e3c72" 
}: VoiceAyahSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm");

  const normalizeArabicText = (text: string): string => {
    // Remove diacritics and normalize Arabic text for better matching
    return text
      .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel
      .replace(/[\u0621]/g, 'ا') // Normalize hamza
      .replace(/[\u0622\u0623\u0625]/g, 'ا') // Normalize alef variants
      .replace(/[\u0629]/g, 'ه') // Normalize taa marbuta
      .replace(/[\u064A\u0649]/g, 'ي') // Normalize yaa variants
      .replace(/\s+/g, ' ')
      .trim();
  };

  const findBestMatch = (transcribedText: string): number | null => {
    const normalizedTranscript = normalizeArabicText(transcribedText);
    console.log('Searching for:', normalizedTranscript);
    
    let bestMatch: { ayahNumber: number; score: number } | null = null;

    for (const ayah of ayahs) {
      let fullAyah = '';
      if (ayah.text) {
        fullAyah = normalizeArabicText(ayah.text);
      } else if (ayah.first && ayah.last) {
        const normalizedFirst = normalizeArabicText(ayah.first);
        const normalizedLast = normalizeArabicText(ayah.last);
        fullAyah = normalizedFirst + ' ' + normalizedLast;
      }

      // Check if transcript is contained in any ayah or vice versa
      const transcriptWords = normalizedTranscript.split(' ').filter(w => w.length > 1);
      
      let matchingWords = 0;
      for (const word of transcriptWords) {
        if (fullAyah.includes(word)) {
          matchingWords++;
        }
      }

      const score = transcriptWords.length > 0 ? matchingWords / transcriptWords.length : 0;

      if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { ayahNumber: ayah.number, score };
      }
    }

    console.log('Best match:', bestMatch);
    return bestMatch?.ayahNumber ?? null;
  };

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
      toast.info("Recording... Tap again to stop");
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = async () => {
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
        body: { audio: base64Audio, mimeType: audioBlob.type }
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
      const matchedAyah = findBestMatch(data.text);
      
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
      className="text-white hover:bg-white/20 absolute top-4 right-4"
      title="Voice search for ayah"
    >
      {isProcessing ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="w-5 h-5 text-red-400" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
};
