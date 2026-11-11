import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { RotateCcw, ArrowDown } from 'lucide-react';
import { UrgentSafetyPanel } from './UrgentSafetyPanel';

interface ChatWindowProps {
  messages: ChatMessage[];
  isSending: boolean;
  errorMessage: string | null;
  onSendMessage: (text: string) => void;
  onRetry?: () => void;
  sessionRiskLevel?: string;
  onOpenUrgentHelp?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isSending,
  errorMessage,
  onSendMessage,
  onRetry,
  sessionRiskLevel,
  onOpenUrgentHelp,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isUserScrolledUpRef = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distanceFromBottom > 120;
    setShowScrollBottom(isUp);
    isUserScrolledUpRef.current = isUp;
  };

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, isSending]);

  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  const hasCrisisMessage = messages.some((m) => m.safetyFlag || m.riskLevel === 'crisis');
  const isCrisisActive = sessionRiskLevel === 'crisis' || hasCrisisMessage;
  const latestCrisisType = [...messages].reverse().find((m) => m.crisisType)?.crisisType;

  return (
    <main
      className="flex-1 flex flex-col h-full bg-paper relative overflow-hidden"
      role="main"
      aria-label="Chat conversation"
    >
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Conversation history"
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 focus:outline-none"
      >
        {isCrisisActive && (
          <div className="max-w-3xl mx-auto w-full">
            <UrgentSafetyPanel
              crisisType={latestCrisisType}
              onOpenUrgentHelp={onOpenUrgentHelp}
            />
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
            <div
              className="w-16 h-16 rounded-card bg-daylight flex items-center justify-center text-2xl mb-4"
              aria-hidden="true"
            >
              🌿
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-midnight mb-2">
              How are you feeling today?
            </h2>
            <p className="text-sm md:text-base text-ink/70 leading-relaxed mb-6">
              This is a safe, non-judgmental space to express your thoughts, untangle feelings, or explore grounding exercises.
            </p>
            <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Suggested conversation starters">
              {[
                'I am feeling a little stressed',
                'Help me ground myself right now',
                'I need to talk through my day',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt)}
                  disabled={isSending}
                  className="bg-daylight hover:bg-sky/30 text-midnight text-xs md:text-sm font-medium py-2 px-4 rounded-pill transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full">
            {messages.map((message, index) => (
              <MessageBubble key={message.id || index} message={message} />
            ))}

            {isSending && (
              <div
                className="flex justify-start mb-4"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="bg-daylight rounded-card rounded-bl-sm p-4 flex items-center gap-2 border border-midnight/5">
                  <span className="sr-only">AI Companion is thinking...</span>
                  <span className="w-2 h-2 rounded-full bg-midnight/40 animate-bounce"></span>
                  <span
                    className="w-2 h-2 rounded-full bg-midnight/40 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-midnight/40 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></span>
                  <span className="text-xs text-ink/60 font-medium ml-1">Reflecting...</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="my-4 p-4 bg-bubblegum/20 rounded-card flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-midnight"
              >
                <span>{errorMessage}</span>
                {lastUserMessage && (
                  <button
                    onClick={() => onRetry ? onRetry() : onSendMessage(lastUserMessage.text)}
                    className="flex items-center gap-1.5 bg-midnight text-daylight px-4 py-2 rounded-pill font-semibold text-xs hover:bg-midnight/90 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry message</span>
                  </button>
                )}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {showScrollBottom && (
        <button
          onClick={() => {
            isUserScrolledUpRef.current = false;
            scrollToBottom('smooth');
          }}
          className="absolute bottom-24 right-6 bg-midnight text-daylight shadow-md hover:bg-midnight/90 py-2 px-3.5 rounded-pill text-xs font-semibold flex items-center gap-1.5 transition-all z-20 focus:outline-none focus:ring-2 focus:ring-sky"
          aria-label="Jump to latest message"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>Latest message</span>
        </button>
      )}

      <div className="p-4 md:px-8 border-t border-midnight/5 bg-paper">
        <div className="max-w-3xl mx-auto w-full">
          <ChatInput onSendMessage={onSendMessage} disabled={isSending} />
        </div>
      </div>
    </main>
  );
};
