import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Edit3, Delete, XCircle, CreditCard, Phone, CheckCircle2 } from 'lucide-react';

export default function Registro() {
    const { tipo_poblacion } = usePage().props;
    const [docType, setDocType] = useState('C.C.');
    const [docNumber, setDocNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [activeInput, setActiveInput] = useState('docNumber');
    const [processing, setProcessing] = useState(false);

    // Mapeo de colores ACTUALIZADO
    const getThemeColor = () => {
        const t = tipo_poblacion?.toLowerCase() || '';
        if (t.includes('víctima')) return { primary: '#F97316', secondary: '#EA580C', text: 'text-orange-400', bg: 'bg-orange-500/10' };
        if (t.includes('priorit')) return { primary: '#EAB308', secondary: '#CA8A04', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        if (t.includes('empresa')) return { primary: '#0EA5E9', secondary: '#0284C7', text: 'text-blue-400', bg: 'bg-blue-500/10' };
        return { primary: '#39A900', secondary: '#266e00', text: 'text-[#5ceb00]', bg: 'bg-[#39A900]/10' };
    };

    const theme = getThemeColor();

    const DOC_LIMITS = {
        'C.C.': 10,
        'T.I.': 11,
        'C.E.': 7,
        'PEP': 15,
        'PA': 15, // Por si se agrega después
    };

    const isDocValid = (docType?.includes('C.C') || docType?.includes('CC'))
        ? (docNumber.length >= 7 && docNumber.length <= 12)
        : (docNumber.length === DOC_LIMITS[docType]);

    const handleGenerarTurno = () => {
        if (processing || !isDocValid) return;

        setProcessing(true);
        router.post(route('turno.generar'), {
            tipo_documento: docType,
            documento: docNumber,
            telefono: phoneNumber || null,
            tipo: tipo_poblacion || 'General',
        }, {
            onSuccess: () => console.log("Turno generado"),
            onError: () => setProcessing(false),
            onFinish: () => setProcessing(false)
        });
    };

    const handleKeypadPress = (val) => {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) window.navigator.vibrate([15]);
        
        if (activeInput === 'docNumber') {
            const limit = DOC_LIMITS[docType] || 15;
            if (docNumber.length < limit) {
                setDocNumber(prev => prev + val);
            }
        } else {
            if (phoneNumber.length < 10) setPhoneNumber(prev => prev + val);
        }
    };

    const handleClear = () => {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) window.navigator.vibrate([30]);
        if (activeInput === 'docNumber') setDocNumber('');
        else setPhoneNumber('');
    };

    const handleBackspace = () => {
        if (typeof window !== 'undefined' && window.navigator?.vibrate) window.navigator.vibrate([15]);
        if (activeInput === 'docNumber') setDocNumber(prev => prev.slice(0, -1));
        else setPhoneNumber(prev => prev.slice(0, -1));
    };

    return (
        <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#0a1a14] text-white">
            <Head title="Registro de Datos | SENA APE" />

            <div className="absolute inset-0 z-0">
                <motion.img initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.3 }} transition={{ duration: 1.5 }} alt="Fondo SENA" className="w-full h-full object-cover" src="/ape-bg.png" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1a14] via-[#0B3D2E]/90 to-black/95 backdrop-blur-[2px]"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 animate-pulse" style={{ backgroundColor: theme.primary }}></div>
            </div>

            <header className="relative w-full flex justify-between items-center px-10 py-8 z-20">
                <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center bg-white/[0.03] backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-2xl">
                    <img src="/logo-ape.png" alt="SENA" className="h-10 object-contain brightness-0 invert" />
                </motion.div>
                <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="hidden md:flex flex-col items-end gap-3 bg-black/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl min-w-[300px]">
                    <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] uppercase font-black tracking-[0.2em] ${theme.text}`}>Paso 2: Registro de Datos</span>
                        <span className="text-[10px] font-black text-white/30">Progreso 100%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden flex border border-white/5 p-[1px]">
                        <motion.div initial={{ width: "50%" }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: theme.primary }} />
                    </div>
                </motion.div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-hidden">
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full max-w-6xl flex flex-col md:flex-row rounded-[50px] overflow-hidden bg-white/[0.03] backdrop-blur-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                    <section className="w-full md:w-1/2 border-r border-white/5 flex flex-col justify-center p-10 lg:p-14 relative overflow-hidden">
                        <div className="mb-12">
                            <span className={`inline-block px-4 py-1.5 rounded-full ${theme.bg} border border-white/5 ${theme.text} text-[10px] font-black uppercase tracking-[0.3em] mb-4`}>{tipo_poblacion || 'Atención General'}</span>
                            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">Complete sus Datos</h2>
                        </div>
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase mb-4 tracking-[0.2em]"><CreditCard size={14} style={{ color: theme.primary }} /> Seleccione Tipo de Documento</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {['C.C.', 'T.I.', 'C.E.', 'PEP'].map(type => (
                                        <button key={type} onClick={() => { setDocType(type); setDocNumber(''); }}
                                            className={`flex items-center justify-center rounded-2xl font-black text-xl py-4 border-2 transition-all active:scale-95 ${docType === type ? 'bg-white text-black border-white shadow-xl scale-105' : 'border-white/10 text-gray-500 hover:border-white/30 hover:bg-white/5 hover:text-white'}`}>{type}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="relative">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="flex items-center gap-3 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeInput === 'docNumber' ? 'scale-125 shadow-[0_0_10px]' : 'opacity-30'}`} style={{ backgroundColor: theme.primary }}></div>
                                        Número de Identificación
                                    </label>
                                    <span className="text-[10px] font-black text-white/40 tracking-widest">{docNumber.length} / {docType === 'C.C.' ? '8-10' : DOC_LIMITS[docType]}</span>
                                </div>
                                <div 
                                    onClick={() => setActiveInput('docNumber')} 
                                    className={`w-full font-mono font-black tracking-[0.3em] text-center rounded-[30px] border-2 transition-all duration-300 p-4 lg:p-6 text-4xl lg:text-5xl shadow-2xl cursor-pointer relative ${
                                        isDocValid 
                                            ? 'border-[#39A900] bg-[#39A900]/10 text-white shadow-[0_0_30px_rgba(57,169,0,0.4)]'
                                            : activeInput === 'docNumber' 
                                                ? 'border-white bg-white/5 text-white ring-4 ring-white/5' 
                                                : 'border-white/5 bg-black/40 text-gray-600'
                                    }`}
                                >
                                    {docNumber || '--------'}
                                    <AnimatePresence>
                                        {isDocValid && (
                                            <motion.div 
                                                initial={{ scale: 0, opacity: 0 }} 
                                                animate={{ scale: 1, opacity: 1 }} 
                                                exit={{ scale: 0, opacity: 0 }}
                                                className="absolute -right-4 -top-4 bg-[#39A900] p-3 rounded-full shadow-[0_0_20px_rgba(57,169,0,0.6)] border-4 border-[#0a1a14] z-30"
                                            >
                                                <CheckCircle2 size={24} className="text-white" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="flex items-center gap-3 text-xs font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeInput === 'phoneNumber' ? 'scale-125 shadow-[0_0_10px]' : 'opacity-30'}`} style={{ backgroundColor: theme.primary }}></div>
                                        Teléfono Celular (Opcional)
                                    </label>
                                    <span className="text-[10px] font-black text-white/40 tracking-widest">{phoneNumber.length} / 10</span>
                                </div>
                                <div onClick={() => setActiveInput('phoneNumber')} className={`w-full font-mono font-black tracking-[0.3em] text-center rounded-[30px] border-2 transition-all duration-300 p-4 lg:p-6 text-2xl lg:text-3xl shadow-2xl cursor-pointer ${activeInput === 'phoneNumber' ? 'border-white bg-white/5 text-white ring-4 ring-white/5' : 'border-white/5 bg-black/40 text-gray-600'}`}>{phoneNumber || '----------'}</div>
                            </div>
                        </div>
                    </section>
                    <section className="w-full md:w-1/2 bg-black/40 p-10 lg:p-14 flex flex-col justify-center items-center shadow-inner relative">
                        <div className="grid grid-cols-3 gap-6 w-full max-w-[450px] relative z-10">
                            {['1','2','3','4','5','6','7','8','9'].map(num => (
                                <button key={num} onClick={() => handleKeypadPress(num)} className="aspect-square bg-white/[0.05] backdrop-blur-2xl text-white text-4xl lg:text-5xl font-black rounded-3xl border border-white/10 shadow-xl hover:bg-white hover:text-black hover:scale-105 transition-all active:scale-90 flex items-center justify-center">{num}</button>
                            ))}
                            <button onClick={handleClear} className="bg-red-500/10 text-red-500 font-black rounded-3xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-90 flex flex-col items-center justify-center gap-2"><XCircle size={24} /> <span className="text-[10px] tracking-widest">LIMPIAR</span></button>
                            <button onClick={() => handleKeypadPress('0')} className="aspect-square bg-white/[0.05] backdrop-blur-2xl text-white text-4xl lg:text-5xl font-black rounded-3xl border border-white/10 shadow-xl hover:bg-white hover:text-black hover:scale-105 transition-all active:scale-90 flex items-center justify-center">0</button>
                            <button onClick={handleBackspace} className="bg-orange-500/10 text-orange-500 font-black rounded-3xl border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all active:scale-90 flex flex-col items-center justify-center gap-2"><Delete size={24} /> <span className="text-[10px] tracking-widest">BORRAR</span></button>
                        </div>
                    </section>

                </motion.div>
            </main>

            <footer className="relative z-20 p-8 bg-black/60 backdrop-blur-3xl border-t border-white/5 shadow-2xl">
                <div className="max-w-6xl mx-auto flex gap-8">
                    <Link href="/seleccion" className="flex-1 py-6 bg-white/[0.03] text-white rounded-2xl text-xl font-black border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 uppercase tracking-widest"><ArrowLeft size={24} /> Volver</Link>
                    <button 
                        onClick={handleGenerarTurno} 
                        disabled={!isDocValid || processing} 
                        className={`flex-[2] py-6 rounded-2xl text-2xl font-black flex items-center justify-center gap-4 transition-all uppercase tracking-[0.2em] shadow-2xl ${
                            isDocValid && !processing 
                                ? 'bg-[#39A900] text-white hover:bg-[#2d8500] hover:-translate-y-1 active:scale-95' 
                                : 'bg-white/5 text-gray-700 border border-white/5 cursor-not-allowed'
                        }`}
                    >
                        {processing ? 'Generando...' : 'Generar Turno'}
                        {!processing && <ArrowRight size={32} />}
                    </button>
                </div>
            </footer>
        </div>
    );
}
