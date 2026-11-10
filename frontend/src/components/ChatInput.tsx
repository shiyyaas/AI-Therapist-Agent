import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
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
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-end gap-2 w-full">
      <div className="relative flex-1 bg-daylight rounded-3xl p-2 focus-within:ring-2 focus-within:ring-sky transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type what is on your mind... (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm text-midnight placeholder:text-midnight/40 focus:outline-none max-h-40 overflow-y-auto"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-12 h-12 bg-midnight text-daylight rounded-full flex items-center justify-center shrink-0 hover:bg-midnight/90 disabled:opacity-40 transition-colors"
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};
