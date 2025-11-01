'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { sendMessageStream, getMessages, setAuthToken } from '@/lib/api';
import type { ToolCallEvent } from '@/lib/agents/coachAgent';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface ToolActivity {
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: 'calling' | 'completed';
}

export default function ChatInterface() {
  const { getAccessTokenSilently } = useAuth0();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toolActivities, setToolActivities] = useState<ToolActivity[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setToolActivities([]);
    setStreamingContent('');

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const token = await getAccessTokenSilently();
      setAuthToken(token);

      let newConversationId = conversationId;
      let accumulatedContent = '';

      // Process streaming events
      for await (const event of sendMessageStream(
        userMessage,
        conversationId || undefined,
        token
      )) {
        switch (event.type) {
          case 'tool_call':
            // Add new tool activity
            setToolActivities((prev) => [
              ...prev,
              {
                name: event.data.name,
                args: event.data.args,
                status: 'calling',
              },
            ]);
            break;

          case 'tool_result':
            // Update tool activity with result
            setToolActivities((prev) =>
              prev.map((activity) =>
                activity.name === event.data.name && activity.status === 'calling'
                  ? { ...activity, result: event.data.result, status: 'completed' as const }
                  : activity
              )
            );
            break;

          case 'content':
            // Accumulate content for streaming display
            accumulatedContent += event.data;
            setStreamingContent(accumulatedContent);
            break;

          case 'done':
            // Stream is complete
            break;

          default:
            // Handle conversation_id event
            if ('conversationId' in (event as any).data) {
              newConversationId = (event as any).data.conversationId;
              if (!conversationId) {
                setConversationId(newConversationId);
              }
            }
        }
      }

      // Remove temp message and fetch updated messages
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));

      if (newConversationId) {
        const updatedMessages = await getMessages(newConversationId);
        setMessages(updatedMessages);
      }

      // Clear streaming state
      setToolActivities([]);
      setStreamingContent('');
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setToolActivities([]);
      setStreamingContent('');
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <h2 className="text-2xl font-bold mb-2">Welcome to Your Personal Coach</h2>
            <p>Start a conversation to set goals, track progress, and get motivated!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))
        )}
        {/* Tool Activities */}
        {toolActivities.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 max-w-[70%]">
              <div className="text-sm font-semibold text-blue-900 mb-2">Agent Activity</div>
              <div className="space-y-2">
                {toolActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    {activity.status === 'calling' ? (
                      <div className="mt-1">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="mt-1 text-green-600">✓</div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">
                          {activity.name === 'create_goal' && 'Creating goal'}
                          {activity.name === 'update_goal' && 'Updating goal'}
                          {activity.name === 'add_progress' && 'Recording progress'}
                          {activity.name === 'list_goals' && 'Fetching goals'}
                        </span>
                        {activity.args.title && (
                          <span className="text-gray-600">: {activity.args.title as string}</span>
                        )}
                        {activity.args.notes && (
                          <span className="text-gray-600">: {(activity.args.notes as string).substring(0, 50)}...</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Streaming Content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2 max-w-[70%]">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></span>
            </div>
          </div>
        )}
        {/* Loading Indicator */}
        {isLoading && !streamingContent && toolActivities.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-300 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
