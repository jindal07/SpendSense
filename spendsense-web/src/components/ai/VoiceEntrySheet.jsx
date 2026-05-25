import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseExpense, parseExpenseAudio } from '@/api/ai';
import { useAiKey } from '@/hooks/useAiKey';
import AiUnavailable from './AiUnavailable';
import { toast } from 'sonner';

const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export default function VoiceEntrySheet({ open, onOpenChange, onParsed }) {
  const { hasKey } = useAiKey();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsing, setParsing] = useState(false);
  const [micError, setMicError] = useState(null);
  const recRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const hasSpeechAPI = !!getSpeechRecognition();

  const cleanup = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    try {
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    } catch {}
    recRef.current = null;
    mediaRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      setListening(false);
      setTranscript('');
      setMicError(null);
    }
  }, [open, cleanup]);

  const startWebSpeech = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setMicError('Speech recognition not supported in this browser');
      return;
    }
    try {
      const rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.continuous = true;
      rec.onresult = (e) => {
        const text = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('');
        setTranscript(text);
      };
      rec.onerror = (e) => {
        setListening(false);
        if (e.error === 'not-allowed') {
          setMicError('Microphone permission denied. Please allow access in your browser settings.');
        } else if (e.error === 'no-speech') {
          toast.info('No speech detected. Try again.');
        } else {
          setMicError(`Microphone error: ${e.error}`);
        }
      };
      rec.onend = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
      setMicError(null);
    } catch (err) {
      setMicError(err.message || 'Failed to start speech recognition');
    }
  };

  const stopWebSpeech = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setListening(false);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        if (blob.size < 1000) {
          toast.error('Recording too short. Please try again.');
          return;
        }
        setParsing(true);
        try {
          const r = await parseExpenseAudio(blob);
          onParsed?.(r);
          onOpenChange(false);
        } catch (e) {
          toast.error(e.message || 'Failed to parse audio');
        } finally {
          setParsing(false);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setListening(true);
      setMicError(null);
      setTimeout(() => {
        if (mediaRef.current?.state === 'recording') {
          mediaRef.current.stop();
        }
      }, 30000);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setMicError('Microphone permission denied. Please allow access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Please connect a microphone and try again.');
      } else {
        setMicError(err.message || 'Could not access microphone');
      }
    }
  };

  const toggleListen = () => {
    if (listening) {
      if (hasSpeechAPI) stopWebSpeech();
      else {
        try { mediaRef.current?.stop(); } catch {}
      }
      return;
    }
    setMicError(null);
    if (hasSpeechAPI) startWebSpeech();
    else startMediaRecorder();
  };

  const handleParse = async () => {
    if (!transcript.trim()) return;
    setParsing(true);
    try {
      const r = await parseExpense({ transcript: transcript.trim() });
      if (r.entries?.length > 1) {
        toast.info(`Found ${r.entries.length} expenses — adding first`);
        onParsed?.(r.entries[0]);
      } else {
        onParsed?.(r);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e.message || 'Failed to parse expense');
    } finally {
      setParsing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-3 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Expense
          </DialogTitle>
          <DialogDescription>
            Say something like &quot;Spent 250 on Uber yesterday&quot;
          </DialogDescription>
        </DialogHeader>

        {!hasKey ? (
          <AiUnavailable />
        ) : (
          <div className="space-y-4 py-2">
            {micError && (
              <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            <Button
              type="button"
              variant={listening ? 'destructive' : 'default'}
              className="w-full"
              size="lg"
              onClick={toggleListen}
              disabled={parsing}
            >
              {listening ? (
                <>
                  <MicOff className="h-5 w-5" />
                  Stop listening
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  {hasSpeechAPI ? 'Start speaking' : 'Record (30s max)'}
                </>
              )}
            </Button>

            {listening && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
                Listening…
              </div>
            )}

            {hasSpeechAPI && (
              <div className="space-y-2">
                <Label>Transcript</Label>
                <Input
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Your speech will appear here…"
                />
              </div>
            )}

            {hasSpeechAPI && (
              <Button
                className="w-full"
                onClick={handleParse}
                disabled={parsing || !transcript.trim()}
              >
                {parsing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Parse expense
                  </>
                )}
              </Button>
            )}

            {parsing && !hasSpeechAPI && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Processing audio…</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
