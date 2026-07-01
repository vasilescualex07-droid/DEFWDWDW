import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare, Users, Crown } from 'lucide-react';

interface Message {
  id: string;
  user: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export const ChatSystem = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      user: 'System',
      text: 'Welcome to StakeLite Casino! Good luck!',
      timestamp: new Date(),
      isSystem: true
    }
  ]);
  const [input, setInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      user: 'You',
      text: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30"
        size="icon"
      >
        <MessageSquare className="w-5 h-5" />
      </Button>

      {isChatOpen && (
        <Card className="fixed bottom-16 right-4 z-40 w-80 h-96 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/50 backdrop-blur-sm flex flex-col">
          <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white">Live Chat</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isSystem ? 'items-center' : 'items-start'}`}
              >
                {msg.isSystem ? (
                  <div className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                    {msg.text}
                  </div>
                ) : (
                  <div className="flex flex-col items-start max-w-[90%]">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs font-semibold text-purple-300">
                        {msg.user}
                      </span>
                      {msg.user === 'Admin' && <Crown className="w-3 h-3 text-yellow-400" />}
                    </div>
                    <div className="bg-slate-700/50 text-white text-sm px-3 py-2 rounded-lg">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <Button
                onClick={sendMessage}
                size="icon"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
};
