import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio, mimeType, surah } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Processing audio for transcription...');
    
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    const safeMimeType = (typeof mimeType === 'string' && mimeType.trim().length > 0)
      ? mimeType
      : 'audio/webm';

    const fileName = safeMimeType.includes('m4a')
      ? 'audio.m4a'
      : safeMimeType.includes('mp4')
      ? 'audio.mp4'
      : safeMimeType.includes('mpeg')
        ? 'audio.mp3'
        : safeMimeType.includes('wav')
          ? 'audio.wav'
          : 'audio.webm';

    console.log('Audio mimeType:', safeMimeType, 'bytes:', binaryAudio.byteLength);

    const blob = new Blob([binaryAudio], { type: safeMimeType });

    // gpt-transcribe, told it is hearing Quran and which surah, finds the ayah
    // far more often than whisper-1 on short, noisy recitation (tested on
    // Yasin/Mulk/Kahf clips, Oct 2026). The gpt-4o transcribe models were
    // tried too and drop Arabic for German or Chinese on noisy clips, so they
    // are not used. whisper-1 stays as the fallback if the newer model errors
    // or hears nothing.
    const hint = typeof surah === 'string' && surah.trim()
      ? `تلاوة من ${surah.trim()}`
      : 'تلاوة من القرآن الكريم';

    const transcribe = async (model: string, prompt?: string) => {
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('model', model);
      formData.append('language', 'ar'); // Arabic language for Quran
      if (prompt) formData.append('prompt', prompt);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error (${model}): ${await response.text()}`);
      }
      const json = await response.json();
      return (json.text ?? '') as string;
    };

    let text = '';
    let engine = 'gpt-transcribe';
    try {
      text = await transcribe('gpt-transcribe', hint);
    } catch (e) {
      console.error(e);
    }
    if (!text.trim()) {
      engine = 'whisper-1';
      text = await transcribe('whisper-1');
    }

    const result = { text, engine };
    console.log('Transcription result:', engine, result.text);

    return new Response(
      JSON.stringify({ text: result.text, engine: result.engine }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
