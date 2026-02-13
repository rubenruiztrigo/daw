import React from 'react';
import ReactDOM from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Language, useTranslation } from '../utils/translations';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    language: Language;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, language }) => {
    const t = useTranslation(language);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div
                className="bg-white dark:bg-[#1a1a1a] rounded-[2rem] max-w-sm w-full p-6 border border-slate-100 dark:border-zinc-800 animate-in zoom-in-95 duration-200 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="text-red-500" size={32} />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                        {t('delete_post_confirm_title')}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8">
                        {t('delete_post_confirm_description')}
                    </p>

                    <div className="flex space-x-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                        >
                            {t('delete')}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
