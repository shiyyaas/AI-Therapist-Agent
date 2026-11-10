import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  maxLength?: number;
}

export const MAX_MESSAGE_LENGTH = 4000;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled,
  maxLength = MAX_MESSAGE_LENGTH,
}) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (trimmed.length > maxLength) return;

    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const isOverLimit = text.length > maxLength;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex flex-col gap-1 w-full"
      aria-label="Send message form"
    >
      <div className="relative flex items-end gap-2 w-full">
        <div className="relative flex-1 bg-daylight rounded-3xl p-2 focus-within:ring-2 focus-within:ring-sky transition-all">
          <label htmlFor="chat-message-input" className="sr-only">
            Message AI Wellness Companion
          </label>
          <textarea
            id="chat-message-input"
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type what is on your mind... (Enter to send, Shift+Enter for newline)"
            rows={1}
            disabled={disabled}
            maxLength={maxLength + 100}
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-midnight placeholder:text-midnight/40 focus:outline-none max-h-40 overflow-y-auto"
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim() || isOverLimit}
          className="w-12 h-12 bg-midnight text-daylight rounded-full flex items-center justify-center shrink-0 hover:bg-midnight/90 disabled:opacity-40 transition-colors focus:outline-none focus:ring-2 focus:ring-sky"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {text.length > maxLength * 0.8 && (
        <div
          className={`text-[11px] self-end px-3 ${
            isOverLimit ? 'text-tangerine font-bold' : 'text-midnight/50'
          }`}
          aria-live="polite"
        >
          {text.length} / {maxLength} characters {isOverLimit && '(Limit exceeded)'}
        </div>
      )}
    </form>
  );
};
