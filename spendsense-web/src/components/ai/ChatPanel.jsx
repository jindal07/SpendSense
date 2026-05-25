import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/api/ai';
import { useAiKey } from '@/hooks/useAiKey';
import { useAuth } from '@/auth/AuthContext';
import AiConsentDialog from './AiConsentDialog';
import AiUnavailable from './AiUnavailable';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROMPTS = [
  'How am I doing this month?',
  'Where can I cut back?',
  "What's my biggest expense this week?",
];

export default function ChatPanel({ open, onOpenChange }) {
  const { hasKey } = useAiKey();
  const { user, refresh } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const needsConsent = hasKey && !user?.aiConsentAt;

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || streaming) return;

    if (needsConsent) {
      setShowConsent(true);
      return;
    }

    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setInput('');
    setStreaming(true);

    const assistant = { role: 'assistant', text: '' };
    setMessages((m) => [...m, assistant]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        message: msg,
        conversationId,
        signal: controller.signal,
        onEvent: (event, data) => {
          if (event === 'conversation') {
            setConversationId(data.conversationId);
          }
          if (event === 'chunk' && data.text) {
            setMessages((m) => {
              const copy = [...m];
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = { ...last, text: last.text + data.text };
              }
              return copy;
            });
          }
          if (event === 'error') {
            toast.error(data.message || 'Chat failed');
          }
        },
      });
    } catch (e) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Chat failed');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      <AiConsentDialog
        open={showConsent}
        onOpenChange={setShowConsent}
        onAccepted={() => refresh()}
      />

      <AnimatePresence>
        {open && (
          <>
            {/* Mobile overlay */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              type="button"
              className="fixed inset-0 z-40 bg-black/40 md:bg-black/20"
              aria-label="Close overlay"
              onClick={() => onOpenChange(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'fixed z-50 flex flex-col border-l border-border/40 bg-background shadow-2xl shadow-black/30',
                'inset-x-0 bottom-0 top-auto max-h-[85vh] rounded-t-2xl md:rounded-none',
                'md:inset-y-0 md:right-0 md:left-auto md:top-0 md:max-h-none md:w-[380px]'
              )}
            >
              <header className="flex items-center justify-between border-b border-border/40 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">AI Coach</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-secondary hover:text-foreground"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[200px]">
                {!hasKey ? (
                  <AiUnavailable />
                ) : messages.length === 0 ? (
                  <div className="space-y-2.5 pt-6">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Ask about your spending — I use your real data.
                    </p>
                    {PROMPTS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => sendMessage(p)}
                        className="w-full rounded-xl border border-border/40 bg-secondary/30 px-4 py-3 text-left text-sm transition-all hover:bg-secondary/60 hover:border-border/60 min-h-[44px]"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'rounded-2xl px-4 py-2.5 text-sm max-w-[88%]',
                        m.role === 'user'
                          ? 'ml-auto bg-primary text-primary-foreground rounded-br-md'
                          : 'mr-auto bg-secondary/50 prose prose-invert prose-sm max-w-none rounded-bl-md'
                      )}
                    >
                      {m.role === 'user' ? (
                        m.text
                      ) : (
                        <ReactMarkdown>{m.text || (streaming && i === messages.length - 1 ? '…' : '')}</ReactMarkdown>
                      )}
                    </motion.div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {hasKey && (
                <footer className="border-t border-border/40 p-3 flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                    placeholder="Ask about your finances…"
                    className="flex-1 min-h-[44px] rounded-xl border border-border/50 bg-secondary/30 px-3.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40"
                    disabled={streaming}
                  />
                  {streaming ? (
                    <button
                      type="button"
                      onClick={() => abortRef.current?.abort()}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-all active:scale-95"
                      aria-label="Stop"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendMessage(input)}
                      disabled={!input.trim()}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-all active:scale-95"
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
