import { useEffect, useState } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import { APIError } from 'openai';
import { onyx } from '../lib/openaiClient';

const SYSTEM_PROMPT =
  'You are a concise, helpful assistant. Keep answers short and focused.';

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ConversationEntry = {
  id: string;
  sender: 'You' | 'Onyx';
  direction: 'incoming' | 'outgoing';
  content: string;
};

type CompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function buildCompletionMessages(history: ConversationEntry[]): CompletionMessage[] {
  const base: CompletionMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  history.forEach((item) => {
    base.push({
      role: item.sender === 'You' ? 'user' : 'assistant',
      content: item.content,
    });
  });
  return base;
}

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    const texts = content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const value = (part as { text?: string }).text;
          return typeof value === 'string' ? value : '';
        }
        return '';
      })
      .filter(Boolean);
    return texts.join(' ').trim();
  }
  return '';
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ConversationEntry[]>([
    {
      id: uid(),
      sender: 'Onyx',
      direction: 'incoming',
      content: 'Ask me anything. I will reply via the Onyx Chat API.',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('onyx');
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await onyx.models.list();
        const names = (response.data ?? []).map((m) => m.id).filter(Boolean);
        if (cancelled) return;
        setModels(names);
        if (names.includes('onyx')) {
          setSelectedModel('onyx');
        } else if (names.length > 0) {
          setSelectedModel(names[0]);
        }
      } catch (error) {
        if (cancelled) return;
        setModelsError('Failed to load models (check API key/permissions).');
        console.error('Failed to list models', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userEntry: ConversationEntry = {
      id: uid(),
      sender: 'You',
      direction: 'outgoing',
      content: text,
    };

    setMessages((prev) => [...prev, userEntry]);
    setIsTyping(true);

    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        sender: 'Onyx',
        direction: 'incoming',
        content: '',
      },
    ]);

    try {
      const completion = await onyx.chat.completions.create({
        model: selectedModel,
        messages: buildCompletionMessages([...messages, userEntry]),
        temperature: 0.3,
        stream: true,
      });

      let buffer = '';

      for await (const chunk of completion) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (!delta) continue;
        buffer += extractText(delta);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: buffer,
                }
              : msg,
          ),
        );
      }

      if (!buffer) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId ? { ...msg, content: 'I could not generate a reply.' } : msg,
          ),
        );
      }
    } catch (error) {
      let detail = 'Sorry, I could not reach Onyx. Check your API key and network.';
      if (error instanceof APIError) {
        detail = `Onyx error ${error.status ?? ''}: ${error.message}`;
        // Log structured info for debugging
        console.error('Onyx chat API error', {
          status: error.status,
          message: error.message,
          body: error.error,
        });
      } else if (error instanceof Error) {
        detail = error.message;
        console.error('Onyx chat error', error);
      } else {
        console.error('Onyx chat unknown error', error);
      }
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantId ? { ...msg, content: detail } : msg)),
      );
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="model-bar">
        <label htmlFor="model-select">Model</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.length === 0 && <option value={selectedModel}>{selectedModel}</option>}
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        {modelsError && <span className="model-error">{modelsError}</span>}
      </div>
      <MainContainer className="chat-shell">
        <ChatContainer>
          <MessageList
            typingIndicator={
              isTyping ? <TypingIndicator content="Onyx is thinking..." /> : null
            }
          >
            {messages.map((msg) => (
              <Message
                key={msg.id}
                model={{
                  message: msg.content,
                  sender: msg.sender,
                  direction: msg.direction,
                  position: 'single',
                }}
              />
            ))}
          </MessageList>
          <MessageInput
            placeholder="Type a message and hit Enter"
            attachButton={false}
            onSend={sendMessage}
            sendButton={true}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}
