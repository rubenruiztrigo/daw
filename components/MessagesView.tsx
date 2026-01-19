
import React, { useState } from 'react';
import { Search, Send, Info } from 'lucide-react';

const MOCK_CHATS = [
  { id: 'c1', name: 'Roberto Sánchez', position: 'Recursos Humanos', avatar: 'https://i.pravatar.cc/150?u=roberto', last: '¿Pudiste revisar el borrador del nuevo protocolo?', time: '12:45' },
  { id: 'c2', name: 'Marta López', position: 'Técnico IT', avatar: 'https://i.pravatar.cc/150?u=marta', last: 'El acceso VPN ya está configurado.', time: 'Ayer' },
  { id: 'c3', name: 'Grupo Innovación', position: 'Proyecto Nova', avatar: 'https://i.pravatar.cc/150?u=grupo', last: 'Mañana reunión a las 10:00.', time: 'Lun' }
];

export const MessagesView: React.FC = () => {
  const [selected, setSelected] = useState(MOCK_CHATS[0]);
  const [msg, setMsg] = useState('');

  return (
    <div className="h-[calc(100vh-180px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex">
      {/* Sidebar Chats */}
      <div className="w-80 border-r border-gray-100 flex flex-col hidden lg:flex">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-xl font-black text-gray-900 mb-4">Mensajes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversaciones..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {MOCK_CHATS.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelected(chat)}
              className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-all ${selected.id === chat.id ? 'bg-blue-50/50 border-r-4 border-blue-600' : ''}`}
            >
              <img src={chat.avatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
              <div className="flex-1 text-left">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-bold text-gray-900 text-sm">{chat.name}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{chat.last}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={selected.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
            <div>
              <h4 className="font-bold text-gray-900 text-sm">{selected.name}</h4>
              <p className="text-[10px] text-green-500 font-black uppercase tracking-tighter">En línea</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <button className="p-2 hover:bg-gray-50 rounded-lg" title="Información del contacto">
              <Info size={20}/>
            </button>
          </div>
        </div>

        {/* Messages Content */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto flex flex-col justify-end">
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-md border border-gray-50">
              <p className="text-sm text-gray-800">Hola Ana, ¿cómo va el progreso con el nuevo sistema de IA?</p>
              <span className="text-[10px] text-gray-400 mt-1 block">12:30</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg shadow-blue-100 max-w-md">
              <p className="text-sm">¡Hola! Muy bien, estamos integrando los últimos módulos esta tarde.</p>
              <span className="text-[10px] text-blue-200 mt-1 block">12:32</span>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-2xl">
            <input 
              type="text" 
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Escribe un mensaje colaborativo..." 
              className="flex-1 bg-transparent border-none px-4 text-sm focus:ring-0 outline-none"
            />
            <button className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
