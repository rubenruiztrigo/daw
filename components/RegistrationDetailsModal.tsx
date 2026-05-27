import React from 'react';
import { X, User as UserIcon, Briefcase, MapPin, Target, Sparkles, Building2, Calendar, Mail, Info, AtSign } from 'lucide-react';
import { User } from '../types';
import { getSafeAvatar } from '../utils/avatarUtils';
import { decodeEmail } from '../utils/emailUtils';

interface RegistrationDetailsModalProps {
    user: User;
    users?: User[];
    onClose: () => void;
}

export const RegistrationDetailsModal: React.FC<RegistrationDetailsModalProps> = ({ user, users, onClose }) => {
    if (!user) return null;

    const isOrg = user.isOrganization;

    // Find linked organization name if linkedOrganizationId exists
    const linkedOrg = users?.find(u => u.id === user.linkedOrganizationId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Info size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                {isOrg ? 'Cuenta organizativa' : 'Cuenta personal'}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 mb-2 scrollbar-modal">
                    {/* Premium Profile Header with Profile Picture */}
                    <div className="flex flex-col items-center pb-6 border-b border-slate-100 dark:border-zinc-800">
                        <img
                            src={getSafeAvatar(user.avatar)}
                            alt="Avatar"
                            className="w-24 h-24 rounded-[1.75rem] object-cover border-4 border-purple-100 dark:border-purple-900/30 shadow-md mb-3"
                        />
                        <h4 className="text-xl font-black text-slate-900 dark:text-white text-center">
                            {user.name} {user.lastName || ''}
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-zinc-500 font-bold">
                            @{user.username}
                        </p>
                    </div>

                    {/* Main Info Section */}
                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <UserIcon size={18} className="text-purple-500" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                {isOrg ? 'Datos de la Organización' : 'Información Personal'}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl">
                            {isOrg ? (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Nombre de la Organización</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.name || 'No proporcionado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Nombre de usuario</p>
                                        <p className="text-slate-900 dark:text-white font-bold flex items-center space-x-2">
                                            <AtSign size={14} className="text-slate-400" />
                                            <span>{user.username}</span>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Tipo de organización</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.administrationType || 'No especificado'}</p>
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Correo electrónico</p>
                                        <p className="text-slate-900 dark:text-white font-bold flex items-center space-x-2">
                                            <Mail size={14} className="text-slate-400" />
                                            <span>{decodeEmail(user.email) || 'No proporcionado'}</span>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Nombre</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Apellidos</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.lastName || 'No proporcionado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Nombre de usuario</p>
                                        <p className="text-slate-900 dark:text-white font-bold flex items-center space-x-2">
                                            <AtSign size={14} className="text-slate-400" />
                                            <span>{user.username}</span>
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Fecha de nacimiento</p>
                                        <p className="text-slate-900 dark:text-white font-bold flex items-center space-x-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>
                                                {user.birthDate ? new Date(user.birthDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No proporcionada'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="col-span-full space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Correo electrónico</p>
                                        <p className="text-slate-900 dark:text-white font-bold flex items-center space-x-2">
                                            <Mail size={14} className="text-slate-400" />
                                            <span>{decodeEmail(user.email) || 'No proporcionado'}</span>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </section>

                    {/* Professional Info Section (Only for Personal) */}
                    {!isOrg && (
                        <section>
                            <div className="flex items-center space-x-2 mb-4">
                                <Briefcase size={18} className="text-purple-500" />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Información Profesional</h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Tipo de puesto</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.jobCategory || 'No especificado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Tipo de organización</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.administrationType || 'No especificado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Especialización</p>
                                        <p className="text-slate-900 dark:text-white font-bold">{user.position || 'No especificado'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Nombre de la organización</p>
                                        <div className="flex items-center space-x-2">
                                            <Building2 size={14} className="text-slate-400" />
                                            <p className="text-slate-900 dark:text-white font-bold">{user.institution || 'No especificado'}</p>
                                        </div>
                                    </div>
                                    {linkedOrg && (
                                        <div className="col-span-full space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Organización vinculada</p>
                                            <div className="flex items-center space-x-2">
                                                <Building2 size={14} className="text-blue-500" />
                                                <p className="text-blue-600 dark:text-blue-400 font-bold">{linkedOrg.name}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Bio (For Org always) */}
                    {isOrg && (
                        <section>
                            <div className="flex items-center space-x-2 mb-4">
                                <Sparkles size={18} className="text-purple-500" />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    Biografía
                                </h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-6">
                                <div className="space-y-1">
                                    <p className="text-slate-900 dark:text-white font-medium leading-relaxed italic">
                                        "{user.bio || 'Sin biografía proporcionada.'}"
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Ubicación (Both Personal and Org) */}
                    <section>
                        <div className="flex items-center space-x-2 mb-4">
                            <MapPin size={18} className="text-purple-500" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Ubicación</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">País</p>
                                <p className="text-slate-900 dark:text-white font-bold">{user.country || 'No especificado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-tighter">Región / Comunidad</p>
                                <p className="text-slate-900 dark:text-white font-bold">{user.region || 'No especificada'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Interests Section */}
                    {user.interests && user.interests.length > 0 && (
                        <section>
                            <div className="flex items-center space-x-2 mb-4">
                                <Target size={18} className="text-purple-500" />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                    {isOrg ? 'Intereses de la organización' : 'Intereses'}
                                </h3>
                            </div>
                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-6 rounded-3xl flex flex-wrap gap-2">
                                {user.interests.map((topic, i) => (
                                    <span
                                        key={i}
                                        className="px-3.5 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black shadow-sm"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
