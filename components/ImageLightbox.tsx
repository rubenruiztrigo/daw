import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
    images: string[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    images,
    initialIndex,
    isOpen,
    onClose,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, initialIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleNext, handlePrev, onClose]);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
        setTouchStart(null);
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300"
            onClick={onClose}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            <button
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[210] backdrop-blur-md"
                onClick={onClose}
            >
                <X size={24} />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        className="absolute left-4 p-4 text-white/50 hover:text-white transition-all z-[210] hidden md:block"
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    >
                        <ChevronLeft size={48} strokeWidth={1} />
                    </button>
                    <button
                        className="absolute right-4 p-4 text-white/50 hover:text-white transition-all z-[210] hidden md:block"
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    >
                        <ChevronRight size={48} strokeWidth={1} />
                    </button>

                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70 font-black tracking-widest text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-md z-[210]">
                        {currentIndex + 1} / {images.length}
                    </div>
                </>
            )}

            <div
                className="relative w-full h-full flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
            // No stopPropagation here, so clicks on empty space close the lightbox
            >
                <img
                    src={images[currentIndex]}
                    alt=""
                    className="max-w-full max-h-full object-contain select-none animate-in zoom-in-95 duration-300 cursor-default"
                    onClick={(e) => e.stopPropagation()} // Stop propagation on the image itself
                />
            </div>
        </div>,
        document.body
    );
};
