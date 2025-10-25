
import React, { useState, useRef, useEffect } from 'react';
import { createChat } from '../services/geminiService';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { Icon } from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hi! I'm your B-Roll Studio assistant. How can I help you today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createChat();
    }
  }, [isOpen]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      if (!chatRef.current) {
        throw new Error("Chat not initialized");
      }
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userInput });
      const aiMessage: Message = { sender: 'ai', text: response.text };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: "Sorry, I'm having trouble connecting right now." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xl hover:bg-indigo-500 transition-transform duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open support chat"
      >
        <Icon name="chat" className="w-8 h-8" />
      </button>

      <div className={`fixed bottom-6 right-6 w-full max-w-sm h-[70vh] max-h-[600px] bg-gray-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 z-50 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <header className="flex items-center justify-between p-4 bg-gray-900 rounded-t-2xl">
          <h3 className="font-bold text-white">Support Chat</h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
            {messages.map((msg, index) => (
                <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'ai' && <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"><Icon name="logo" className="w-5 h-5 text-white"/></div>}
                <div className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                    <p className="text-sm">{msg.text}</p>
                </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0"><Icon name="logo" className="w-5 h-5 text-white"/></div>
                    <div className="px-4 py-3 rounded-2xl bg-gray-700 rounded-bl-none">
                        <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full bg-gray-700 border-gray-600 rounded-full py-2 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-500 transition" disabled={isLoading || !userInput.trim()}>
              <Icon name="send" className="w-5 h-5 text-white" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
