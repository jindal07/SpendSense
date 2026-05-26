import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Square, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { streamChat } from '@/api/ai';
import { useAiKey } from '@/hooks/useAiKey';
import { useAuth } from '@/auth/AuthContext';
import AiConsentDialog from './AiConsentDialog';
import AiUnavailable from './AiUnavailable';
import { cn } from '@/lib/utils';
import { friendlyError } from '@/utils/friendlyError';

const PROMPTS = [
  'How am I doing this month?',
  'Where can I cut back?',
  "What's my biggest expense this week?",
];

function DotTyping() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80" />
      <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80 [animation-delay:120ms]" />
      <span className="inline-flex h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80 [animation-delay:240ms]" />
    </div>
  );
}

export default function ChatPanel({ open, onOpenChange }) {
  const { hasKey } = useAiKey();
  const { user, refresh } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const needsConsent = hasKey && !user?.aiConsentAt;

  const showChatError = useCallback((errorText) => {
    setMessages((m) => {
      const copy = [...m];
      const last = copy[copy.length - 1];
      if (last?.role === 'assistant') {
        copy[copy.length - 1] = { role: 'assistant', text: '', error: errorText };
      } else {
        copy.push({ role: 'assistant', text: '', error: errorText });
      }
      return copy;
    });
  }, []);

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
    setFollowUps([]);

    setMessages((m) => [...m, { role: 'assistant', text: '' }]);

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
              if (last?.role === 'assistant' && !last.error) {
                copy[copy.length - 1] = { ...last, text: last.text + data.text };
              }
              return copy;
            });
          }
          if (event === 'suggestions' && Array.isArray(data.suggestions)) {
            setFollowUps(data.suggestions.slice(0, 3));
          }
          if (event === 'error') {
            const errObj = { message: data.message, status: data.status, code: data.code };
            let text = friendlyError(errObj);
            if (data.retryAfter) {
              text += ` You can retry in about ${data.retryAfter} seconds.`;
            }
            showChatError(text);
          }
        },
      });
    } catch (e) {
      if (e.name === 'AbortError') {
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant' && !last.text?.trim() && !last.error) {
            copy.pop();
          }
          return copy;
        });
      } else {
        showChatError(friendlyError(e));
      }
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
                          : m.error
                            ? 'mr-auto rounded-bl-md border border-destructive/25 bg-destructive/10 text-destructive-foreground'
                            : 'mr-auto bg-secondary/50 prose prose-invert prose-sm max-w-none rounded-bl-md'
                      )}
                    >
                      {m.role === 'user' ? (
                        m.text
                      ) : m.error ? (
                        <div className="flex gap-2.5 items-start not-prose">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-destructive" />
                          <p className="text-sm leading-relaxed">{m.error}</p>
                        </div>
                      ) : streaming && i === messages.length - 1 && !m.text ? (
                        <DotTyping />
                      ) : (
                        <ReactMarkdown>
                          {m.text}
                        </ReactMarkdown>
                      )}
                    </motion.div>
                  ))
                )}

                {!streaming && followUps.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.1 }}
                    className="flex flex-wrap gap-2 pt-1"
                  >
                    {followUps.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/15 hover:border-primary/40 active:scale-95"
                      >
                        {q}
                      </button>
                    ))}
                  </motion.div>
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
