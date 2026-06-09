/**
 * Chat with audit results using Gemini AI.
 * Enabled after any analysis (Demo Mode or live audit).
 * Requires Gemini API key on the backend.
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, Bot, User, Lock } from 'lucide-react';
import { apiChat } from '../api/endpoints';

interface Message {
  role: 'user' | 'ai';
  text: string;
  error?: boolean;
}

interface Props {
  enabled: boolean;          // true once a report exists (demo or live)
  geminiConfigured: boolean; // true if backend has GEMINI_API_KEY
}

export const ChatPanel: React.FC<Props> = ({ enabled, geminiConfigured }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Determine why the input is disabled so we can show the right hint
  const canChat = enabled && geminiConfigured;

  const getHintText = () => {
    if (!enabled) return 'Click Demo Mode or run an analysis to activate chat.';
    if (!geminiConfigured) return 'Add GEMINI_API_KEY to .env and restart the backend.';
    return 'Ask anything about your audit results…';
  };

  const getPlaceholder = () => {
    if (!enabled) return 'Run Demo Mode or analysis first…';
    if (!geminiConfigured) return 'Gemini API key not configured…';
    return 'e.g. Why is root login dangerous?';
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || isLoading || !canChat) return;

    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await apiChat(q);
      
      // Check if the response contains error indicators in the answer text
      const answer = res.data.answer || '';
      
      // Detect if the answer is actually an error message
      if (answer.includes('[GoogleGenerativeAI Error]') || 
          answer.includes('429') && answer.includes('Too Many Requests') ||
          answer.includes('quota exceeded') ||
          answer.includes('BadRequestError')) {
        
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          text: '⚠️ Gemini API quota exceeded. Your free tier limit has been reached. The quota resets daily. Try again tomorrow or upgrade your API plan at ai.google.dev',
          error: true 
        }]);
        return;
      }
      
      // Check if response indicates failure
      if (!res.data.success && res.data.error) {
        setMessages((prev) => [...prev, { 
          role: 'ai', 
          text: res.data.error,
          error: true 
        }]);
        return;
      }
      
      // Normal successful response
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err: unknown) {
      let errorText = 'Chat request failed. Please try again.';
      
      // Extract error message from the response
      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as any).response;
        
        // Check if response has error field in data
        if (response?.data?.error) {
          errorText = response.data.error;
        } else if (response?.status === 429) {
          errorText = '⚠️ Gemini API quota exceeded. Your free tier limit has been reached. The quota resets daily. Try again tomorrow or upgrade your API plan at ai.google.dev';
        } else if (response?.status === 503) {
          errorText = '⚠️ Chat service temporarily unavailable. Please try again in a moment.';
        } else if (response?.data) {
          // Try to extract any error content from the response data
          const dataStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          
          // Check if it's the quota error pattern
          if (dataStr.includes('429') || dataStr.includes('quota') || dataStr.includes('Too Many Requests')) {
            errorText = '⚠️ Gemini API quota exceeded. Your free tier limit has been reached. The quota resets daily. Try again tomorrow or upgrade your API plan at ai.google.dev';
          } else {
            errorText = `⚠️ ${dataStr.substring(0, 200)}...`;
          }
        }
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorText = String(err.message);
      }
      
      setMessages((prev) => [...prev, { role: 'ai', text: errorText, error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header justify-between">
        <span className="flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" /> Chat With Audit Results
        </span>
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
          canChat
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
        }`}>
          {canChat
            ? <><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Ready</>
            : <><Lock className="h-3 w-3" /> {!enabled ? 'No report yet' : 'No API key'}</>
          }
        </span>
      </div>

      {/* Status hint when not ready */}
      {!canChat && (
        <div className={`mx-3 mt-3 rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
          !enabled
            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
        }`}>
          <span className="text-base leading-none mt-0.5">{!enabled ? 'ℹ️' : '⚠️'}</span>
          <span>{getHintText()}</span>
        </div>
      )}

      {/* Messages area */}
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
        {messages.length === 0 && canChat && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Ask questions about your audit — e.g. "Why is root login dangerous?" or "How do I fix the firewall?"
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <Bot className="h-4 w-4 shrink-0 mt-1 text-indigo-500" />
            )}
            <div className={`
              max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed
              ${msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : msg.error
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
              }
            `}>
              {msg.text.split('\n').map((line, j) => (
                <React.Fragment key={j}>
                  {line}
                  {j < msg.text.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
              {msg.error && msg.text.includes('quota') && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/rate-limits" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-amber-700 dark:text-amber-300 underline hover:no-underline text-xs"
                  >
                    Learn more about quotas →
                  </a>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <User className="h-4 w-4 shrink-0 mt-1 text-gray-400" />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 items-center text-xs text-gray-400">
            <Bot className="h-4 w-4 text-indigo-500" />
            <span className="flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="form-input flex-1 text-xs"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={!canChat || isLoading}
            autoComplete="off"
          />
          <button
            type="submit"
            className={`btn px-3 transition-all ${
              canChat && input.trim()
                ? 'btn-primary'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canChat || isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </form>
      </div>
    </div>
  );
};
