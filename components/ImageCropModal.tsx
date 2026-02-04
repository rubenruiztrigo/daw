
import React, { useState, useRef, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface ImageCropModalProps {
  image: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ image, onClose, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0, renderedWidth: 0, renderedHeight: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgDimensions.renderedWidth > 0 && imgDimensions.renderedHeight > 0) {
      // Initialize crop box to 80% of the minor dimension, centered
      const size = Math.min(imgDimensions.renderedWidth, imgDimensions.renderedHeight) * 0.8;
      setCrop({
        x: (imgDimensions.renderedWidth - size) / 2,
        y: (imgDimensions.renderedHeight - size) / 2,
        width: size,
        height: size
      });
    }
  }, [imgDimensions]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setImgDimensions({ width: naturalWidth, height: naturalHeight, renderedWidth: width, renderedHeight: height });
  };

  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: (e as any).clientX, y: (e as any).clientY };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, action: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragAction(action);
    const pos = getClientPos(e);
    setStartPos(pos);
    setStartCrop({ ...crop });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragAction) return;

    const currentPos = getClientPos(e);
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;

    let newCrop = { ...startCrop };

    if (dragAction === 'move') {
      newCrop.x = Math.max(0, Math.min(imgDimensions.renderedWidth - newCrop.width, startCrop.x + deltaX));
      newCrop.y = Math.max(0, Math.min(imgDimensions.renderedHeight - newCrop.height, startCrop.y + deltaY));
    } else {
      // Corner resize logic with 1:1 aspect ratio constraint
      if (dragAction === 'se') {
        const maxSize = Math.min(imgDimensions.renderedWidth - startCrop.x, imgDimensions.renderedHeight - startCrop.y);
        const newSize = Math.max(50, Math.min(maxSize, startCrop.width + deltaX));
        newCrop.width = newSize;
        newCrop.height = newSize;
      } else if (dragAction === 'sw') {
        const maxSize = Math.min(startCrop.x + startCrop.width, imgDimensions.renderedHeight - startCrop.y);
        const newSize = Math.max(50, Math.min(maxSize, startCrop.width - deltaX));
        newCrop.x = startCrop.x + (startCrop.width - newSize);
        newCrop.width = newSize;
        newCrop.height = newSize;
      } else if (dragAction === 'ne') {
        const maxSize = Math.min(imgDimensions.renderedWidth - startCrop.x, startCrop.y + startCrop.height);
        const newSize = Math.max(50, Math.min(maxSize, startCrop.width + deltaX));
        newCrop.y = startCrop.y + (startCrop.height - newSize);
        newCrop.width = newSize;
        newCrop.height = newSize;
      } else if (dragAction === 'nw') {
        const maxSize = Math.min(startCrop.x + startCrop.width, startCrop.y + startCrop.height);
        const newSize = Math.max(50, Math.min(maxSize, startCrop.width - deltaX));
        newCrop.x = startCrop.x + (startCrop.width - newSize);
        newCrop.y = startCrop.y + (startCrop.height - newSize);
        newCrop.width = newSize;
        newCrop.height = newSize;
      }
    }
    setCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  const handleSave = () => {
    if (!imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgDimensions.width / imgDimensions.renderedWidth;
    const scaleY = imgDimensions.height / imgDimensions.renderedHeight;

    // Output size (high quality)
    const outputSize = 600;
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      outputSize,
      outputSize
    );

    onSave(canvas.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      <div
        className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/10 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-[#0a0a0a] shrink-0">
          <h3 className="text-base font-black text-gray-900 dark:text-white">Ajustar foto</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full text-gray-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="relative bg-zinc-900 flex flex-col items-center justify-center p-4 overflow-hidden select-none min-h-[250px]">
          <div className="relative" ref={containerRef}>
            <img
              ref={imgRef}
              src={image}
              className="max-w-full max-h-[50vh] object-contain pointer-events-none display-block"
              alt="Crop target"
              onLoad={onImageLoad}
            />
            {/* Overlay darker outside selection */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none">
              <div
                style={{
                  position: 'absolute',
                  left: crop.x,
                  top: crop.y,
                  width: crop.width,
                  height: crop.height,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }}
              />
            </div>

            {/* Selection Box */}
            <div
              className="absolute border-2 border-white shadow-sm cursor-move touch-none"
              style={{
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
              onTouchStart={(e) => handleMouseDown(e, 'move')}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-white/50" />
                <div className="border-r border-white/50" />
                <div />
              </div>

              {/* Handles */}
              <div
                className="absolute -top-2 -left-2 w-5 h-5 border-2 border-white bg-blue-600 rounded-full cursor-nw-resize z-20 shadow-lg"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
                onTouchStart={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute -top-2 -right-2 w-5 h-5 border-2 border-white bg-blue-600 rounded-full cursor-ne-resize z-20 shadow-lg"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
                onTouchStart={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute -bottom-2 -left-2 w-5 h-5 border-2 border-white bg-blue-600 rounded-full cursor-sw-resize z-20 shadow-lg"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
                onTouchStart={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                className="absolute -bottom-2 -right-2 w-5 h-5 border-2 border-white bg-blue-600 rounded-full cursor-se-resize z-20 shadow-lg"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
                onTouchStart={(e) => handleMouseDown(e, 'se')}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#0a0a0a] flex space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <Check size={16} />
            <span>Guardar Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
