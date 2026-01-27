
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, Maximize, Square, RectangleHorizontal, RectangleVertical, Move } from 'lucide-react';

interface ImageCropModalProps {
  image: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

type AspectRatio = '1:1' | '4:3' | '16:9';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ image, onClose, onSave }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPos({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - startPos.x,
      y: clientY - startPos.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getAspectClass = () => {
    switch(aspectRatio) {
      case '4:3': return 'aspect-[4/3]';
      case '16:9': return 'aspect-[16/9]';
      default: return 'aspect-square';
    }
  };

  const handleSave = () => {
    // En producción aquí se usaría un HTMLCanvasElement para realizar el recorte real
    // basado en el offset, zoom y rotación. Para este prototipo, guardamos la imagen.
    onSave(image);
  };

  return (
    <div 
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      <div 
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Maximize size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Ajustar foto de perfil</h3>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Usa la cuadrícula para centrar tu rostro</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-gray-400 transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Workspace - El área donde se ve la imagen y la cuadrícula */}
        <div 
          className="relative bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center p-12 overflow-hidden"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
        >
          {/* Contenedor de Recorte (El marco) */}
          <div 
            className={`relative w-full max-w-md bg-black overflow-hidden shadow-2xl rounded-2xl cursor-move transition-all duration-300 ${getAspectClass()}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            ref={containerRef}
          >
            {/* Capa de Imagen */}
            <div 
              className="absolute inset-0 transition-transform duration-75 ease-out pointer-events-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              <img src={image} className="w-full h-full object-contain" alt="Preview" />
            </div>

            {/* Cuadrícula Flexible de Regla de Tercios */}
            <div className="absolute inset-0 pointer-events-none border-2 border-white/80 ring-[100vmax] ring-black/60">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-r border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-r border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-r border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-b border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-r border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="border-r border-white/30 shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
                <div className="shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"></div>
              </div>
            </div>

            {/* Icono de movimiento centrado */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
              <Move className="text-white" size={48} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-8 space-y-8 bg-white dark:bg-[#0a0a0a]">
          {/* Selectores de Tamaño/Proporción */}
          <div className="flex flex-col space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Seleccionar Tamaño</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setAspectRatio('1:1')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 transition-all ${aspectRatio === '1:1' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-200'}`}
              >
                <Square size={16} />
                <span className="text-xs font-black">1:1 Cuadrado</span>
              </button>
              <button 
                onClick={() => setAspectRatio('4:3')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 transition-all ${aspectRatio === '4:3' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-200'}`}
              >
                <RectangleVertical size={16} className="rotate-90" />
                <span className="text-xs font-black">4:3 Clásico</span>
              </button>
              <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 transition-all ${aspectRatio === '16:9' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-600' : 'border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-200'}`}
              >
                <RectangleHorizontal size={16} />
                <span className="text-xs font-black">16:9 Panorámico</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex-1 flex flex-col space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zoom de imagen</label>
              <div className="flex items-center space-x-4">
                <ZoomOut size={18} className="text-gray-400" />
                <input 
                  type="range" 
                  min="0.5" 
                  max="4" 
                  step="0.01" 
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <ZoomIn size={18} className="text-gray-400" />
              </div>
            </div>
            
            <div className="flex flex-col space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rotar</label>
              <button 
                onClick={() => setRotation(r => r + 90)}
                className="p-4 bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
              >
                <RotateCw size={22} />
              </button>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 py-5 bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm shadow-2xl shadow-blue-100 dark:shadow-none hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 transform active:scale-95"
            >
              <Check size={20} strokeWidth={3} />
              <span>Establecer como foto de perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
