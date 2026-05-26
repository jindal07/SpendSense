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

/** Web Speech sends audio to Google; these errors mean we should use local recording instead. */
const SPEECH_FALLBACK_ERRORS = new Set([
  'network',
  'service-not-available',
  'language-not-supported',
  'audio-capture',
]);

export default function VoiceEntrySheet({ open, onOpenChange, onParsed }) {
  const { hasKey } = useAiKey();
  const canUseLiveSpeech = !!getSpeechRecognition();

  /** 'record' = MediaRecorder + Gemini (reliable). 'speech' = browser live captions (needs Google network). */
  const [inputMode, setInputMode] = useState('record');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsing, setParsing] = useState(false);
  const [micError, setMicError] = useState(null);
  const recRef = useRef(null);
  const mediaRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const useLiveSpeech = inputMode === 'speech' && canUseLiveSpeech;

  const cleanup = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    try {
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    } catch {
      /* ignore */
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recRef.current = null;
    mediaRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    if (!open) {
      cleanup();
      setListening(false);
      setTranscript('');
      setMicError(null);
      setInputMode('record');
    }
  }, [open, cleanup]);

  const switchToRecordMode = (message) => {
    cleanup();
    setListening(false);
    setInputMode('record');
    if (message) setMicError(message);
  };

  const startWebSpeech = () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      switchToRecordMode('Live captions are not supported in this browser. Using voice recording.');
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
        recRef.current = null;
        if (e.error === 'not-allowed') {
          setMicError(
            'Microphone permission denied. Allow microphone access in browser settings, or type your expense below.'
          );
        } else if (e.error === 'no-speech') {
          toast.info('No speech detected. Try again.');
        } else if (SPEECH_FALLBACK_ERRORS.has(e.error)) {
          switchToRecordMode(
            e.error === 'network'
              ? 'Live captions need internet (browser connects to Google). Use voice recording instead — tap the button below.'
              : 'Live captions unavailable. Use voice recording instead — tap the button below.'
          );
        } else {
          setMicError(`Speech recognition error: ${e.error}. Try voice recording instead.`);
        }
      };
      rec.onend = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
      setMicError(null);
    } catch (err) {
      switchToRecordMode(err.message || 'Could not start live captions. Using voice recording.');
    }
  };

  const stopWebSpeech = () => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setListening(false);
        mediaRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || 'audio/webm',
        });
        chunksRef.current = [];

        if (blob.size < 1000) {
          toast.error('Recording too short. Hold the button and speak for at least 2 seconds.');
          return;
        }
        setParsing(true);
        try {
          const file = new File([blob], 'voice.webm', { type: blob.type });
          const r = await parseExpenseAudio(file);
          onParsed?.(r);
          onOpenChange(false);
        } catch (e) {
          toast.error(e.message || 'Failed to parse audio');
        } finally {
          setParsing(false);
        }
      };
      mr.start(250);
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
        setMicError('Microphone permission denied. Allow access in browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setMicError('No microphone found. Connect a microphone and try again.');
      } else {
        setMicError(err.message || 'Could not access microphone');
      }
    }
  };

  const toggleListen = () => {
    if (listening) {
      if (useLiveSpeech) stopWebSpeech();
      else {
        try {
          mediaRef.current?.stop();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    setMicError(null);
    if (useLiveSpeech) startWebSpeech();
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
            {useLiveSpeech
              ? 'Speak and edit the transcript, then parse.'
              : 'Record your expense — AI will transcribe and fill the form.'}
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

            {canUseLiveSpeech && (
              <div className="flex rounded-xl border border-border/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (listening) cleanup();
                    setListening(false);
                    setInputMode('record');
                    setMicError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
                    inputMode === 'record'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Voice recording
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (listening) cleanup();
                    setListening(false);
                    setInputMode('speech');
                    setMicError(null);
                  }}
                  className={`flex-1 rounded-lg py-2 font-medium transition-colors ${
                    inputMode === 'speech'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Live captions
                </button>
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
                  {useLiveSpeech ? 'Stop listening' : 'Stop recording'}
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" />
                  {useLiveSpeech ? 'Start speaking' : 'Tap to record (30s max)'}
                </>
              )}
            </Button>

            {listening && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                </span>
                {useLiveSpeech ? 'Listening…' : 'Recording… release to process'}
              </div>
            )}

            {useLiveSpeech && (
              <>
                <div className="space-y-2">
                  <Label>Transcript</Label>
                  <Input
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Your speech will appear here…"
                  />
                </div>
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
              </>
            )}

            {parsing && !useLiveSpeech && (
              <div className="flex flex-col items-center gap-2 py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Transcribing with AI…</p>
              </div>
            )}

            {!useLiveSpeech && !listening && !parsing && (
              <p className="text-center text-xs text-muted-foreground">
                Uses your Gemini key — works without browser speech services.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
