import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Edit3, Delete, XCircle } from 'lucide-react';

export default function Registro() {
    const { tipo_poblacion } = usePage().props;
    const [docType, setDocType] = useState('C.C.');
    const [docNumber, setDocNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [activeInput, setActiveInput] = useState('docNumber');
    const [processing, setProcessing] = useState(false);

    const handleGenerarTurno = () => {
        if (docNumber.length < 6 || processing) return;
        setProcessing(true);
        router.post(route('turno.generar'), {
            tipo_documento: docType,
            documento: docNumber,
            telefono: phoneNumber || null,
            tipo: tipo_poblacion || 'General',
        }, {
            onError: () => setProcessing(false),
        });
    };

    const handleKeypadPress = (val) => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
        if (activeInput === 'docNumber') {
            if (docNumber.length < 15) setDocNumber(prev => prev + val);
        } else {
            if (phoneNumber.length < 10) setPhoneNumber(prev => prev + val);
        }
    };

    const handleClear = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
        if (activeInput === 'docNumber') setDocNumber('');
        else setPhoneNumber('');
    };

    const handleBackspace = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
        if (activeInput === 'docNumber') setDocNumber(prev => prev.slice(0, -1));
        else setPhoneNumber(prev => prev.slice(0, -1));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", bounce: 0.4, duration: 0.4 } }
    };

    return (
        <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#1B4332] selection:bg-[#39A900] selection:text-white">
            <Head title="Registro de Datos | SENA APE" />

            {/* Background Imagen Igual al Welcome/Seleccion */}
            <div className="absolute inset-0 z-0">
                <motion.img
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    alt="Fondo SENA"
                    className="w-full h-full object-cover"
                    src="/ape-bg.png" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-[#1B4332]/80 to-black/70 backdrop-blur-[4px]"></div>
            </div>

            {/* Top Navigation - Glassmorphism */}
            <header className="relative w-full flex justify-between items-center px-10 py-6 z-20">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                    <img src="/logo-ape.png" alt="SENA Agencia Pública de Empleo" className="h-[46px] object-contain drop-shadow-md brightness-0 invert" />
                </motion.div>

                <motion.div 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}
                    className="flex flex-col items-end gap-3 z-10 w-[300px] bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] uppercase font-bold text-[#5ceb00] tracking-widest">Paso: Registro de Datos</span>
                        <span className="text-[10px] font-bold text-white/70">2 de 2</span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                        <motion.div 
                            initial={{ width: "50%" }} animate={{ width: "100%" }} transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="bg-gradient-to-r from-[#39A900] to-[#5ceb00] h-full rounded-full drop-shadow-md"
                        ></motion.div>
                    </div>
                </motion.div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 lg:p-6 relative z-10 overflow-hidden">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="w-full max-w-6xl h-auto md:h-[75vh] min-h-[500px] flex flex-col md:flex-row rounded-[30px] md:rounded-[40px] overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
                    
                    {/* LEFT SECTION: Document Form */}
                    <motion.section variants={itemVariants} className="w-full md:w-1/2 border-r border-white/10 flex flex-col justify-center p-6 lg:p-10 relative overflow-hidden">
                        
                        <h2 className="text-3xl lg:text-4xl font-black mb-6 text-white tracking-tight drop-shadow-lg">Identificación</h2>
                        
                        <div className="space-y-8 relative z-10">
                            {/* Tipo de Documento */}
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">
                                    <Edit3 size={14} className="text-[#5ceb00]" /> Tipo de Documento
                                </label>
                                <div className="grid gap-2 md:gap-3 grid-cols-4">
                                    {['C.C.', 'T.I.', 'C.E.', 'PEP'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
                                                setDocType(type);
                                            }}
                                            className={`flex items-center justify-center rounded-xl font-black text-lg lg:text-xl transition-all duration-200 p-2 md:p-3 border-2 touch-manipulation active:scale-95 ${
                                                docType === type 
                                                ? 'border-[#39A900] bg-[#39A900]/20 text-white shadow-[0_0_15px_rgba(57,169,0,0.3)]' 
                                                : 'border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Número de Documento */}
                            <div className="mt-8 relative group">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase mb-3 tracking-widest">
                                    <div className={`w-2 h-2 rounded-full ${activeInput === 'docNumber' ? 'bg-[#5ceb00] animate-pulse' : 'bg-transparent'}`}></div>
                                    Número de Documento
                                </label>
                                <input 
                                    readOnly
                                    value={docNumber}
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
                                        setActiveInput('docNumber');
                                    }}
                                    className={`w-full font-mono font-bold tracking-[0.2em] text-center border-b-4 outline-none transition-all duration-300 rounded-t-xl cursor-pointer p-3 md:p-4 text-3xl lg:text-4xl shadow-inner touch-manipulation ${
                                        activeInput === 'docNumber' ? 'border-[#5ceb00] bg-white/10 text-white' : 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/40'
                                    }`}
                                    placeholder="Toca aquí" 
                                />
                                {activeInput === 'docNumber' && docNumber === '' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-3 pointer-events-none opacity-50 flex items-center gap-2 text-sm text-[#5ceb00]">
                                        <span>Use el teclado <ArrowRight size={14} className="inline ml-1" /></span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Número de Teléfono */}
                            <div className="mt-6">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase mb-3 tracking-widest">
                                    <div className={`w-2 h-2 rounded-full ${activeInput === 'phoneNumber' ? 'bg-[#5ceb00] animate-pulse' : 'bg-transparent'}`}></div>
                                    Teléfono (Opcional)
                                </label>
                                <input 
                                    readOnly
                                    value={phoneNumber}
                                    onClick={() => {
                                        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
                                        setActiveInput('phoneNumber');
                                    }}
                                    className={`w-full font-mono font-bold tracking-[0.2em] text-center border-b-4 outline-none transition-all duration-300 rounded-t-xl cursor-pointer p-3 md:p-4 text-2xl lg:text-3xl shadow-inner touch-manipulation flex items-center justify-center ${
                                        activeInput === 'phoneNumber' ? 'border-[#5ceb00] bg-white/10 text-white' : 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/40'
                                    }`}
                                    placeholder="---- --- ---" 
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* RIGHT SECTION: Numerical Keypad Galsmorphism */}
                    <motion.section variants={itemVariants} className="w-full md:w-1/2 bg-black/30 p-6 lg:p-10 flex flex-col justify-center items-center relative shadow-inner">
                        <div className="absolute inset-0 bg-[#39A900]/5 blur-3xl pointer-events-none rounded-full scale-150"></div>
                        
                        <div className="grid grid-cols-3 gap-5 lg:gap-6 w-full max-w-[420px] relative z-10">
                            {['1','2','3','4','5','6','7','8','9'].map(num => (
                                <button 
                                    key={num} 
                                    onClick={() => handleKeypadPress(num)}
                                    className="bg-white/10 backdrop-blur-md text-white text-3xl lg:text-4xl font-black py-4 md:py-6 lg:py-7 rounded-2xl md:rounded-3xl shadow-sm border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all active:scale-90 active:bg-white/5 active:border-[#39A900] touch-manipulation flex items-center justify-center"
                                >
                                    {num}
                                </button>
                            ))}
                            
                            <button 
                                onClick={handleClear}
                                className="bg-red-500/20 text-red-400 text-sm font-black py-4 md:py-6 lg:py-7 rounded-2xl md:rounded-3xl shadow-sm border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition-all active:scale-90 flex flex-col items-center justify-center gap-1 touch-manipulation"
                            >
                                <XCircle size={20} /> LIMPIAR
                            </button>
                            
                            <button 
                                onClick={() => handleKeypadPress('0')}
                                className="bg-white/10 backdrop-blur-md text-white text-3xl lg:text-4xl font-black py-4 md:py-6 lg:py-7 rounded-2xl md:rounded-3xl shadow-sm border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all active:scale-90 active:bg-white/5 active:border-[#39A900] touch-manipulation flex items-center justify-center"
                            >
                                0
                            </button>
                            
                            <button 
                                onClick={handleBackspace}
                                className="bg-orange-500/20 text-orange-400 text-sm font-black py-4 md:py-6 lg:py-7 rounded-2xl md:rounded-3xl shadow-sm border border-orange-500/30 hover:bg-orange-500/30 hover:text-orange-300 transition-all active:scale-90 flex flex-col items-center justify-center gap-1 touch-manipulation"
                            >
                                <Delete size={20} /> BORRAR
                            </button>
                        </div>
                    </motion.section>
                </motion.div>
            </main>

            {/* Footer Navigation */}
            <motion.footer 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative z-20 p-6 lg:p-8 bg-black/40 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
                
                <div className="max-w-6xl mx-auto flex justify-between gap-4 py-1">
                    {/* Botón Volver - Usando a tag para asegurar routing */}
                    <a href="/seleccion" className="flex-1 py-4 px-6 bg-white/5 text-white rounded-xl text-lg lg:text-xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 border border-white/10 touch-manipulation z-50 cursor-pointer">
                        <ArrowLeft size={24} className="text-gray-400 pointer-events-none" />
                        <span className="pointer-events-none">Volver</span>
                    </a>
                    
                    {/* Botón Generar Turno */}
                    <button
                        onClick={handleGenerarTurno}
                        disabled={docNumber.length < 6 || processing}
                        className={`flex-[2] py-4 px-6 rounded-xl text-xl lg:text-2xl font-black flex items-center justify-center gap-3 transition-all z-50 touch-manipulation ${
                            docNumber.length >= 6 && !processing
                            ? 'bg-gradient-to-r from-[#39A900] to-[#266e00] text-white shadow-[0_10px_30px_rgba(57,169,0,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(57,169,0,0.6)] cursor-pointer active:scale-95'
                            : 'bg-white/5 text-gray-600 border border-white/5 pointer-events-none'
                        }`}>
                        <span>{processing ? 'GENERANDO...' : 'GENERAR TURNO'}</span>
                        <ArrowRight size={28} className={docNumber.length >= 6 ? 'text-white' : 'text-gray-600'} />
                    </button>
                </div>
            </motion.footer>
        </div>
    );
}
