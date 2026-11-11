import React from 'react';
import { ChatMessage } from '../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function formatMessageTime(createdAt?: any): string {
  if (!createdAt) return '';
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const timeStr = formatMessageTime(message.createdAt);

  return (
    <article
      aria-label={`${isUser ? 'You' : 'AI Companion'} at ${timeStr || 'recently'}`}
      className={`flex w-full mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] md:max-w-[70%] p-4 text-sm md:text-base leading-relaxed ${
          isUser
            ? 'bg-midnight text-daylight rounded-card rounded-br-sm'
            : 'bg-daylight text-ink rounded-card rounded-bl-sm border border-midnight/5'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1 text-[11px] opacity-75">
          <span className="font-semibold uppercase tracking-wider">
            {isUser ? 'You' : 'AI Companion'}
          </span>
          {timeStr && (
            <time dateTime={message.createdAt instanceof Date ? message.createdAt.toISOString() : undefined}>
              {timeStr}
            </time>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </article>
  );
};
