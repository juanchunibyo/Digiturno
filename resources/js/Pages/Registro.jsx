import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Edit3, Delete, XCircle, CheckCircle2 } from 'lucide-react';

export default function Registro() {
    const { tipo_poblacion } = usePage().props;
    const [docType, setDocType] = useState('C.C.');
    const [docNumber, setDocNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [activeInput, setActiveInput] = useState('docNumber');
    const [processing, setProcessing] = useState(false);

    const [showTurno, setShowTurno] = useState(false);
    const [generatedTurn, setGeneratedTurn] = useState({ numero: '', tipo: '', hora: '' });

    const handleGenerarTurno = () => {
        if (docNumber.length < 6 || processing) return;
        setProcessing(true);
        
        // Simulación de delay de red (500ms)
        setTimeout(() => {
            const prefijos = {
                'General':     'N',
                'Prioritaria': 'P',
                'Víctimas':    'V',
                'Empresa':     'E',
            };
            const prefijo = prefijos[tipo_poblacion] || 'N';
            // Generamos un número aleatorio para el mock para que no siempre sea el mismo
            const randomNum = Math.floor(Math.random() * 900) + 100;
            const numero = `${prefijo}-${randomNum}`;
            const now = new Date();
            
            setGeneratedTurn({
                numero: numero,
                tipo: tipo_poblacion || 'General',
                hora: now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
                fecha: now.toLocaleDateString('es-CO')
            });
            setShowTurno(true);
            setProcessing(false);

            // Reseteo automático después de 30s (igual que en la pantalla real)
            setTimeout(() => {
                window.location.href = '/';
            }, 30000);
        }, 800);
    };

    if (showTurno) {
        const tipoConfig = {
            'General':     { color: '#4B5563', label: 'Atención General'     },
            'Prioritaria': { color: '#EA580C', label: 'Atención Prioritaria' },
            'Víctimas':    { color: '#7C3AED', label: 'Atención Víctimas'    },
            'Empresa':     { color: '#1D4ED8', label: 'Empresa'              },
        };
        const cfg = tipoConfig[generatedTurn.tipo] || tipoConfig['General'];

        return (
            <div className="relative min-h-screen flex flex-col font-['Inter',sans-serif] select-none overflow-hidden bg-[#1B4332]">
                <Head title="Turno Generado | SENA APE" />
                <div className="absolute inset-0 z-0">
                    <img alt="Fondo SENA" className="w-full h-full object-cover" src="/ape-bg.png" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-[#1B4332]/80 to-black/70 backdrop-blur-[4px]" />
                </div>
                <header className="relative w-full flex justify-between items-center px-10 py-6 z-20">
                    <div className="flex items-center bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                        <img src="/logo-ape.png" alt="SENA APE" className="h-[46px] object-contain brightness-0 invert" />
                    </div>
                    <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                        <span className="text-[#5ceb00] text-xs font-black uppercase tracking-widest">Turno Generado (Mock Mode)</span>
                    </div>
                </header>
                <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                        className="w-full max-w-2xl bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="bg-[#39A900] py-8 flex flex-col items-center gap-3">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}>
                                <CheckCircle2 size={64} className="text-white drop-shadow-lg" />
                            </motion.div>
                            <h1 className="text-white font-black text-2xl uppercase tracking-widest">¡Turno Generado!</h1>
                            <p className="text-white/80 text-sm font-medium">Su turno ha sido registrado exitosamente</p>
                        </div>
                        <div className="flex flex-col items-center py-12 px-10 gap-6">
                            <p className="text-gray-400 font-black uppercase tracking-[0.4em] text-sm">Su número de turno es</p>
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.3 }}
                                className="font-black text-white tracking-tighter leading-none"
                                style={{ fontSize: '10rem' }}
                            >
                                {generatedTurn.numero}
                            </motion.div>
                            <span className="text-white font-black uppercase tracking-widest text-sm px-6 py-2 rounded-full" style={{ background: cfg.color }}>{cfg.label}</span>
                            <div className="w-full grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                                    <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Documento</span>
                                    <span className="text-white font-black text-xl font-mono">{docNumber}</span>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
                                    <span className="text-gray-500 text-xs font-black uppercase tracking-widest">Hora de registro</span>
                                    <span className="text-white font-black text-xl">{generatedTurn.hora}</span>
                                </div>
                            </div>
                            <div className="w-full bg-[#39A900]/10 border border-[#39A900]/30 rounded-2xl p-5 text-center mt-2">
                                <p className="text-[#5ceb00] font-bold text-base leading-relaxed">Por favor espere en sala. Cuando su turno sea llamado en la pantalla, diríjase al módulo indicado.</p>
                            </div>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mt-2">Esta pantalla se reiniciará automáticamente en 30 segundos</p>
                        </div>
                    </motion.div>
                </main>
                <div className="relative z-20 p-6 bg-black/40 backdrop-blur-xl border-t border-white/10">
                    <div className="max-w-2xl mx-auto">
                        <Link href="/" className="w-full py-5 px-10 bg-white/5 text-white rounded-2xl text-xl font-bold flex items-center justify-center gap-4 hover:bg-white/10 border border-white/10 transition-all active:scale-95">
                            <ArrowLeft size={26} className="text-gray-400" /> Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
            <main className="flex-1 flex items-center justify-center p-6 relative z-10">
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="w-full max-w-7xl h-[70vh] min-h-[600px] flex flex-col md:flex-row rounded-[40px] overflow-hidden bg-white/5 backdrop-blur-3xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.5)]">
                    
                    {/* LEFT SECTION: Document Form */}
                    <motion.section variants={itemVariants} className="w-full md:w-1/2 border-r border-white/10 flex flex-col justify-center p-10 lg:p-14 relative overflow-hidden">
                        
                        <h2 className="text-4xl lg:text-5xl font-black mb-10 text-white tracking-tight drop-shadow-lg">Identificación</h2>
                        
                        <div className="space-y-8 relative z-10">
                            {/* Tipo de Documento */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase mb-4 tracking-widest">
                                    <Edit3 size={16} className="text-[#5ceb00]" /> Tipo de Documento
                                </label>
                                <div className="grid gap-4 grid-cols-4">
                                    {['C.C.', 'T.I.', 'C.E.', 'PEP'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) window.navigator.vibrate([20]);
                                                setDocType(type);
                                            }}
                                            className={`flex items-center justify-center rounded-2xl font-black text-xl lg:text-2xl transition-all duration-200 p-4 border-2 touch-manipulation active:scale-95 ${
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
                                    className={`w-full font-mono font-bold tracking-[0.2em] text-center border-b-4 outline-none transition-all duration-300 rounded-t-2xl cursor-pointer p-6 text-4xl lg:text-5xl shadow-inner touch-manipulation ${
                                        activeInput === 'docNumber' ? 'border-[#5ceb00] bg-white/10 text-white' : 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/40'
                                    }`}
                                    placeholder="Toca para ingresar" 
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
                                    className={`w-full font-mono font-bold tracking-[0.2em] text-center border-b-4 outline-none transition-all duration-300 rounded-t-2xl cursor-pointer p-6 text-3xl lg:text-4xl shadow-inner touch-manipulation flex items-center justify-center ${
                                        activeInput === 'phoneNumber' ? 'border-[#5ceb00] bg-white/10 text-white' : 'border-white/10 bg-black/20 text-gray-300 hover:bg-black/40'
                                    }`}
                                    placeholder="---- --- ---" 
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* RIGHT SECTION: Numerical Keypad Galsmorphism */}
                    <motion.section variants={itemVariants} className="w-full md:w-1/2 bg-black/30 p-10 lg:p-14 flex flex-col justify-center items-center relative shadow-inner">
                        <div className="absolute inset-0 bg-[#39A900]/5 blur-3xl pointer-events-none rounded-full scale-150"></div>
                        
                        <div className="grid grid-cols-3 gap-5 lg:gap-6 w-full max-w-[420px] relative z-10">
                            {['1','2','3','4','5','6','7','8','9'].map(num => (
                                <button 
                                    key={num} 
                                    onClick={() => handleKeypadPress(num)}
                                    className="bg-white/10 backdrop-blur-md text-white text-4xl lg:text-5xl font-black py-7 lg:py-8 rounded-3xl shadow-sm border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all active:scale-90 active:bg-white/5 active:border-[#39A900] touch-manipulation flex items-center justify-center"
                                >
                                    {num}
                                </button>
                            ))}
                            
                            <button 
                                onClick={handleClear}
                                className="bg-red-500/20 text-red-400 text-lg font-black py-7 lg:py-8 rounded-3xl shadow-sm border border-red-500/30 hover:bg-red-500/30 hover:text-red-300 transition-all active:scale-90 flex flex-col items-center justify-center gap-1 touch-manipulation"
                            >
                                <XCircle size={24} /> LIMPIAR
                            </button>
                            
                            <button 
                                onClick={() => handleKeypadPress('0')}
                                className="bg-white/10 backdrop-blur-md text-white text-4xl lg:text-5xl font-black py-7 lg:py-8 rounded-3xl shadow-sm border border-white/20 hover:bg-white/20 hover:border-white/40 hover:scale-105 transition-all active:scale-90 active:bg-white/5 active:border-[#39A900] touch-manipulation flex items-center justify-center"
                            >
                                0
                            </button>
                            
                            <button 
                                onClick={handleBackspace}
                                className="bg-orange-500/20 text-orange-400 text-lg font-black py-7 lg:py-8 rounded-3xl shadow-sm border border-orange-500/30 hover:bg-orange-500/30 hover:text-orange-300 transition-all active:scale-90 flex flex-col items-center justify-center gap-1 touch-manipulation"
                            >
                                <Delete size={24} /> BORRAR
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
                
                <div className="max-w-7xl mx-auto flex justify-between gap-6 py-2">
                    {/* Botón Volver - Usando a tag para asegurar routing */}
                    <Link href="/" className="flex-1 py-5 px-10 bg-white/5 text-white rounded-2xl text-xl lg:text-2xl font-bold flex items-center justify-center gap-4 hover:bg-white/10 hover:border-white/30 transition-all active:scale-95 border border-white/10 touch-manipulation z-50 cursor-pointer">
                        <ArrowLeft size={30} className="text-gray-400 pointer-events-none" />
                        <span className="pointer-events-none">Volver al Inicio</span>
                    </Link>
                    
                    {/* Botón Generar Turno */}
                    <button
                        onClick={handleGenerarTurno}
                        disabled={docNumber.length < 6 || processing}
                        className={`flex-[2] py-5 px-10 rounded-2xl text-2xl lg:text-3xl font-black flex items-center justify-center gap-4 transition-all z-50 touch-manipulation ${
                            docNumber.length >= 6 && !processing
                            ? 'bg-gradient-to-r from-[#39A900] to-[#266e00] text-white shadow-[0_10px_30px_rgba(57,169,0,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(57,169,0,0.6)] cursor-pointer active:scale-95'
                            : 'bg-white/5 text-gray-600 border border-white/5 pointer-events-none'
                        }`}>
                        <span>{processing ? 'GENERANDO...' : 'GENERAR TURNO AHORA'}</span>
                        <ArrowRight size={36} className={docNumber.length >= 6 ? 'text-white' : 'text-gray-600'} />
                    </button>
                </div>
            </motion.footer>
        </div>
    );
}
