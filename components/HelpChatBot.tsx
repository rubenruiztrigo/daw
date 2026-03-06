
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import ReactDOM from 'react-dom';
import { useScrollLock } from '../hooks/useScrollLock';

interface Message {
    id: string;
    text: string;
    sender: 'bot' | 'user';
    timestamp: Date;
}

interface HelpChatBotProps {
    onClose: () => void;
    userName: string;
}

export const HelpChatBot: React.FC<HelpChatBotProps> = ({ onClose, userName }) => {
    useScrollLock();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: `¡Hola ${userName}! Soy el asistente virtual de NovaGob. ¿En qué puedo ayudarte hoy?`,
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsTyping(true);

        // Mock bot response logic
        setTimeout(() => {
            const botResponse = getBotResponse(inputText);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const getBotResponse = (text: string): string => {
        const input = text.toLowerCase();
        if (input.includes('hola') || input.includes('buenos días')) return '¡Hola de nuevo! ¿Tienes alguna duda específica sobre la plataforma?';
        if (input.includes('perfil')) return 'Puedes editar tu perfil desde la sección "Datos Personales" en Configuración. Allí puedes cambiar tu nombre, avatar e intereses.';
        if (input.includes('contraseña')) return 'Para cambiar tu contraseña, ve a Configuración > Datos Personales y rellena la sección de "Seguridad y Acceso".';
        if (input.includes('insignia') || input.includes('badges')) return 'Las insignias se otorgan por tus méritos y participación. Puedes ver todas las disponibles y cuáles has desbloqueado en Configuración > Insignias.';
        if (input.includes('ranking')) return 'El ranking se actualiza semanalmente. Los Top 3 NovaGobers reciben insignias especiales cada lunes.';
        if (input.includes('error') || input.includes('problema')) return 'Lamento que estés experimentando problemas. Por favor, detalla lo que sucede para que pueda ayudarte mejor o elevar tu caso al equipo técnico.';

        return 'Entiendo. Como asistente virtual todavía estoy aprendiendo, pero puedo ayudarte con temas de perfil, insignias, ranking o configuración básica. ¿Deseas que profundice en alguno de estos temas?';
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white dark:bg-[#111] w-full max-w-lg h-[600px] rounded-[2.5rem] overflow-hidden flex flex-col border border-white dark:border-zinc-800 animate-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#111] shrink-0">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Asistente NovaGob</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">En línea</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Message Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-slate-50 dark:bg-black/20">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`flex items-end space-x-2 max-w-[80%] ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.sender === 'user' ? 'bg-blue-600' : 'bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700'}`}>
                                    {m.sender === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-blue-600" />}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm font-medium ${m.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-100 dark:border-zinc-700 rounded-tl-none'
                                    }`}>
                                    {m.text}
                                    <div className={`text-[9px] mt-1 font-bold uppercase tracking-wider opacity-50 ${m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="flex items-end space-x-2">
                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-blue-600" />
                                </div>
                                <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-none">
                                    <Loader2 size={16} className="animate-spin text-blue-600" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white dark:bg-[#111] border-t border-slate-50 dark:border-zinc-900 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Escribe tu duda aquí..."
                            className="w-full pl-6 pr-14 py-4 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale transform active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                    <div className="mt-3 flex items-center justify-center space-x-4">
                        <button onClick={() => setInputText('¿Cómo cambio mi contraseña?')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Contraseña</button>
                        <button onClick={() => setInputText('¿Qué son las insignias?')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Insignias</button>
                        <button onClick={() => setInputText('¿Cómo funciona el ranking?')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest">Ranking</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
