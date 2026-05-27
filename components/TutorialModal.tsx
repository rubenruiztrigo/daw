import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronRight, ChevronLeft, Star, Bell, MessageCircle, Newspaper, Calendar, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TutorialModalProps {
  onClose: () => void;
  onStepChange?: (targetId: string | null) => void;
  language?: 'es' | 'en';
}

interface Step {
  targetId: string | null;
  mobileTargetId?: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  videoUrl?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ onClose, onStepChange, language = 'es' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const steps: Step[] = [
    {
      targetId: null,
      title: language === 'es' ? '¡Te damos la bienvenida!' : 'Welcome to NovaGob!',
      description: language === 'es' 
        ? 'Estamos encantados de tenerte aquí. Explora las herramientas diseñadas para potenciar tu labor en el sector público.'
        : 'We are delighted to have you here. Explore the tools designed to enhance your work in the public sector.',
      icon: Star,
      color: 'text-blue-600 bg-blue-50',
      position: 'center'
    },
    {
      targetId: 'tour-sidebar',
      title: language === 'es' ? 'Barra Lateral' : 'Sidebar',
      description: language === 'es'
        ? 'Desde aquí puedes gestionar tu perfil y acceder rápidamente a todas las herramientas.'
        : 'From here you can manage your profile and quickly access all tools.',
      icon: Info,
      color: 'text-blue-600 bg-blue-50',
      position: 'center'
    },
    {
      targetId: isMobile ? 'tour-mobile-home' : 'tour-home',
      title: language === 'es' ? 'Inicio' : 'Home',
      description: language === 'es'
        ? 'Tu muro principal donde verás las publicaciones y actualizaciones de tus compañeros.'
        : 'Your main wall where you will see posts and updates from your colleagues.',
      icon: Newspaper,
      color: 'text-emerald-600 bg-emerald-50',
      position: isMobile ? 'top' : 'right'
    },
    {
      targetId: isMobile ? 'tour-mobile-news' : 'tour-news',
      title: language === 'es' ? 'Noticias' : 'News',
      description: language === 'es'
        ? 'Mantente informado con las novedades más relevantes del ecosistema público.'
        : 'Stay informed with the most relevant news from the public ecosystem.',
      icon: Newspaper,
      color: 'text-orange-600 bg-orange-50',
      position: isMobile ? 'top' : 'right'
    },
    {
      targetId: isMobile ? 'tour-mobile-calendar' : 'tour-calendar',
      title: language === 'es' ? 'Calendario' : 'Calendar',
      description: language === 'es'
        ? 'Consulta los próximos eventos publicados por la comunidad.'
        : 'Check upcoming events, training and community meetings.',
      icon: Calendar,
      color: 'text-amber-600 bg-amber-50',
      position: isMobile ? 'top' : 'right'
    },
    {
      targetId: isMobile ? 'tour-mobile-messages' : 'tour-messages',
      title: language === 'es' ? 'Mensajes' : 'Messages',
      description: language === 'es'
        ? 'Conecta y colabora en tiempo real con otros profesionales del sector.'
        : 'Connect and collaborate in real time with other professionals in the sector.',
      icon: MessageCircle,
      color: 'text-purple-600 bg-purple-50',
      position: isMobile ? 'top' : 'right'
    },
    {
      targetId: isMobile ? 'tour-mobile-notifications' : 'tour-notifications',
      title: language === 'es' ? 'Notificaciones' : 'Notifications',
      description: language === 'es'
        ? 'Recibe interacciones de otros usuarios y actualizaciones de tu cuenta.'
        : 'Keep track of who interacts with you or important mentions.',
      icon: Bell,
      color: 'text-blue-600 bg-blue-50',
      position: isMobile ? 'top' : 'right'
    }
  ];

  useEffect(() => {
    const updatePosition = () => {
      setIsMobile(window.innerWidth < 768);
      const step = steps[currentStep];
      if (step.targetId) {
        const el = document.getElementById(step.targetId);
        if (el) {
          setTargetRect(el.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();
    if (onStepChange) {
      onStepChange(steps[currentStep].targetId);
    }
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isMobile, onStepChange]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-hidden">
      {/* Spotlight Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={targetRect.x - 8} 
                y={targetRect.y - 8} 
                width={targetRect.width + 16} 
                height={targetRect.height + 16} 
                rx="16" 
                fill="black" 
                className="transition-all duration-300 ease-in-out"
              />
            )}
          </mask>
        </defs>
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(0, 0, 0, 0.7)" 
          mask="url(#spotlight-mask)" 
          className="pointer-events-none"
        />
      </svg>

      {/* Content Area */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div 
          className={`bg-white dark:bg-[#0a0a0a] w-full max-w-sm md:max-w-md rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-2xl transition-all duration-500 ease-in-out ${
            !targetRect ? 'scale-100' : 'fixed'
          }`}
          style={targetRect ? {
            top: currentStepData.position === 'top' ? `${targetRect.y - 280}px` : 
                 currentStepData.position === 'bottom' ? `${targetRect.y + targetRect.height + 20}px` :
                 currentStepData.position === 'left' ? `${targetRect.y}px` :
                 currentStepData.position === 'right' ? `${targetRect.y}px` : 'auto',
            left: currentStepData.position === 'left' ? `${targetRect.x - 420}px` :
                  currentStepData.position === 'right' ? `${targetRect.x + targetRect.width + 40}px` :
                  currentStepData.position === 'top' || currentStepData.position === 'bottom' ? `${targetRect.x + targetRect.width/2 - 200}px` : 'auto',
            // Fallback for mobile and edge cases
            ...(isMobile ? {
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: 'calc(100vw - 32px)'
            } : {})
          } : {}}
        >
          <div className="flex flex-col">
            {/* Progress */}
            <div className="flex w-full h-1 bg-slate-100 dark:bg-zinc-800">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-blue-600' : ''}`}
                />
              ))}
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-2xl ${currentStepData.color}`}>
                  {React.createElement(currentStepData.icon, { size: 24 })}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentStepData.title}
                </h3>
              </div>

              <p className="text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                {currentStepData.description}
              </p>

              {currentStepData.videoUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mt-4">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={currentStepData.videoUrl} 
                    title="Introduction"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 px-4 py-2 font-bold text-sm transition-all rounded-xl text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <ChevronLeft size={16} />
                    <span>{language === 'es' ? 'Atrás' : 'Back'}</span>
                  </button>
                )}
                {currentStep === 0 && <div />}

                <div className="flex items-center space-x-3">
                  {currentStep === 0 && (
                    <button 
                      onClick={onClose}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold transition-colors"
                    >
                      {language === 'es' ? 'Saltar' : 'Skip'}
                    </button>
                  )}
                  <button 
                    onClick={handleNext}
                    className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl transition-all"
                  >
                    <span>{currentStep === steps.length - 1 ? (language === 'es' ? 'Entrar' : 'Enter') : (language === 'es' ? 'Siguiente' : 'Next')}</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
