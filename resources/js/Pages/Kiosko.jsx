import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    HeartHandshake, Accessibility, Users, Building2, 
    ChevronRight, ArrowLeft, ArrowRight, CreditCard, 
    Delete, XCircle, CheckCircle2, Ticket
} from 'lucide-react';

export default function Kiosko({ flash }) {
    const [step, setStep] = useState(0); // 0: Welcome, 1: Seleccion, 2: Registro, 3: Success
    const [tipoPoblacion, setTipoPoblacion] = useState('General');
    const [docType, setDocType] = useState('C.C.');
    const [docNumber, setDocNumber] = useState('');
    const [processing, setProcessing] = useState(false);
    const [lastTurn, setLastTurn] = useState(null);

    const cards = [
        { title: "Población Víctima", icon: HeartHandshake, type: "Víctimas", color: "#F97316", gradient: "from-orange-500 to-red-600" },
        { title: "Población Prioridad", icon: Accessibility, type: "Prioritaria", color: "#EAB308", gradient: "from-yellow-500 to-amber-600" },
        { title: "Población General", icon: Users, type: "General", color: "#39A900", gradient: "from-[#39A900] to-[#1B4332]" },
        { title: "Atención Empresas", icon: Building2, type: "Empresa", color: "#0EA5E9", gradient: "from-blue-500 to-cyan-600" }
    ];

    const DOC_LIMITS = { 'C.C.': 10, 'T.I.': 11, 'C.E.': 7, 'PEP': 15 };

    const getTheme = () => {
        const t = tipoPoblacion.toLowerCase();
        if (t.includes('víctima')) return { primary: '#F97316', text: 'text-orange-400', bg: 'bg-orange-500/10' };
        if (t.includes('priorit')) return { primary: '#EAB308', text: 'text-yellow-400', bg: 'bg-yellow-500/10' };
        if (t.includes('empresa')) return { primary: '#0EA5E9', text: 'text-blue-400', bg: 'bg-blue-500/10' };
        return { primary: '#39A900', text: 'text-[#5ceb00]', bg: 'bg-[#39A900]/10' };
    };

    const theme = getTheme();

    const handleGenerate = async () => {
        if (docNumber.length < 6 || processing) return;
        setProcessing(true);
        try {
            const res = await axios.post(route('turno.generar'), {
                tipo_documento: docType,
                documento: docNumber,
                tipo: tipoPoblacion
            });
            setLastTurn(res.data.turno_numero || 'T-000');
            setStep(3);
        } catch (error) {
            console.error("Error al generar el turno:", error);
        } finally {
            setProcessing(false);
        }
    };

    const nextStep = (type) => {
        if (type) setTipoPoblacion(type);
        setStep(prev => prev + 1);
    };

    const resetKiosko = () => {
        setStep(0);
        setDocNumber('');
        setLastTurn(null);
    };

    React.useEffect(() => {
        let timer;
        if (step === 3) {
            timer = setTimeout(() => {
                resetKiosko();
            }, 10000); // 10 segundos
        }
        return () => clearTimeout(timer);
    }, [step]);

    const handleKeypad = (val) => {
        const limit = DOC_LIMITS[docType] || 15;
        if (docNumber.length < limit) setDocNumber(prev => prev + val);
    };

    // VISTAS
    const WelcomeView = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center text-center max-w-4xl px-6">
            <motion.img initial={{ y: 20 }} animate={{ y: 0 }} src="/logo-ape.png" alt="SENA" className="h-24 mb-12 brightness-0 invert" />
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">BIENVENIDO A<br/><span className="text-[#39A900]">SENA APE</span></h1>
            <p className="text-xl text-white/40 mb-16 font-medium uppercase tracking-[0.3em]">Agencia Pública de Empleo</p>
            <button onClick={() => nextStep()} className="group relative px-16 py-8 bg-[#39A900] rounded-full text-2xl font-black text-white shadow-2xl hover:bg-[#45cc00] transition-all flex items-center gap-6 active:scale-95">
                OBTENER MI TURNO <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
            </button>
        </motion.div>
    );

    const SeleccionView = () => (
        <div className="w-full max-w-[90vw] px-6">
            <h2 className="text-5xl md:text-8xl font-black text-white text-center mb-20 tracking-tighter drop-shadow-2xl">¿Cómo podemos <span className="text-[#39A900]">ayudarte?</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {cards.map((c, i) => (
                    <motion.button key={i} whileHover={{ y: -15, scale: 1.02 }} onClick={() => nextStep(c.type)} className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[60px] p-12 flex flex-col items-center text-center shadow-2xl group transition-all hover:border-white/20 min-h-[500px]">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] flex items-center justify-center mb-10 border border-white/10 relative overflow-hidden shadow-inner">
                            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-20`} />
                            <c.icon size={80} style={{ color: c.color }} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black text-white mb-8 uppercase tracking-tighter leading-none">{c.title}</h3>
                        <div className="mt-auto py-6 w-full bg-white/5 rounded-3xl text-xs font-black uppercase tracking-[0.3em] text-white/40 group-hover:bg-[#39A900] group-hover:text-white transition-all shadow-lg">Seleccionar</div>
                    </motion.button>
                ))}
            </div>
        </div>
    );

    const RegistroView = () => (
        <div className="w-full max-w-[95vw] px-6">
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col md:flex-row shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <div className="p-16 md:w-[55%] border-r border-white/5">
                    <span className={`inline-block px-6 py-2 rounded-full ${theme.bg} ${theme.text} text-xs font-black uppercase mb-8 tracking-[0.2em] border border-white/5`}>{tipoPoblacion}</span>
                    <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-16 leading-none">Ingrese sus Datos</h2>
                    <div className="space-y-12">
                        <div className="grid grid-cols-4 gap-4">
                            {['C.C.', 'T.I.', 'C.E.', 'PEP'].map(t => (
                                <button key={t} onClick={() => { setDocType(t); setDocNumber(''); }} className={`py-6 rounded-3xl font-black text-2xl border-2 transition-all active:scale-95 ${docType === t ? 'bg-white text-black border-white shadow-xl scale-105' : 'border-white/10 text-white/30 hover:border-white/30'}`}>{t}</button>
                            ))}
                        </div>
                        <div className="p-12 bg-black/40 rounded-[40px] border-2 border-white/10 text-center relative overflow-hidden">
                            <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em] mb-6">Número de Documento</p>
                            <div className="flex items-center justify-center min-h-[100px]">
                                <span className={`font-mono font-black tracking-widest text-white leading-none ${docNumber.length > 10 ? 'text-5xl md:text-6xl' : 'text-6xl md:text-8xl'}`}>
                                    {docNumber || '----------'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-16 md:w-[45%] bg-black/20 grid grid-cols-3 gap-6">
                    {[1,2,3,4,5,6,7,8,9].map(n => (
                        <button key={n} onClick={() => handleKeypad(n)} className="h-28 bg-white/[0.07] rounded-3xl text-5xl font-black text-white border border-white/10 hover:bg-white hover:text-black hover:scale-105 transition-all shadow-lg">{n}</button>
                    ))}
                    <button onClick={() => setDocNumber('')} className="h-28 bg-red-500/10 text-red-500 rounded-3xl font-black text-sm border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">LIMPIAR</button>
                    <button onClick={() => handleKeypad(0)} className="h-28 bg-white/[0.07] rounded-3xl text-5xl font-black text-white border border-white/10 hover:bg-white hover:text-black hover:scale-105 transition-all shadow-lg">0</button>
                    <button onClick={() => setDocNumber(p => p.slice(0,-1))} className="h-28 bg-orange-500/10 text-orange-500 rounded-3xl font-black text-sm border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all">BORRAR</button>
                </div>
            </div>
            <div className="mt-10 flex gap-8">
                <button onClick={() => setStep(1)} className="flex-1 py-10 bg-white/5 rounded-[30px] text-2xl font-black text-white/40 border border-white/5 flex items-center justify-center gap-4 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest active:scale-95"><ArrowLeft size={32}/> VOLVER</button>
                <button onClick={handleGenerate} disabled={docNumber.length < 6 || processing} className={`flex-[2] py-10 rounded-[30px] text-3xl font-black flex items-center justify-center gap-6 transition-all uppercase tracking-[0.2em] shadow-2xl active:scale-95 ${docNumber.length >= 6 ? 'bg-[#39A900] text-white hover:bg-[#45cc00]' : 'bg-white/5 text-white/10 border border-white/5'}`}>{processing ? 'GENERANDO...' : 'OBTENER TURNO'} <ArrowRight size={40}/></button>
            </div>
        </div>
    );

    const SuccessView = () => (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center px-6">
            <div className="w-40 h-40 bg-[#39A900]/20 rounded-full flex items-center justify-center mb-10 border-4 border-[#39A900]/30">
                <CheckCircle2 size={80} className="text-[#39A900]" />
            </div>
            <h2 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase">¡Turno Generado!</h2>
            <p className="text-white/40 text-lg mb-12 uppercase tracking-widest">Su turno ha sido registrado correctamente</p>
            <div className="bg-white p-12 rounded-[50px] shadow-2xl border-b-[15px] border-gray-200 flex flex-col items-center mb-16 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2">
                   {[1,2,3,4,5,6].map(i => <div key={i} className="w-4 h-4 bg-[#0a1a14] rounded-full" />)}
                </div>
                <Ticket size={40} className="text-[#39A900] mb-6" />
                <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-2">Pase a Sala de Espera</span>
                <span className={`text-8xl md:text-9xl font-black tracking-tighter ${theme.text}`}>{lastTurn}</span>
                <p className="text-[10px] font-bold text-gray-300 mt-8 uppercase">{tipoPoblacion} | {new Date().toLocaleTimeString()}</p>
            </div>
            <button onClick={resetKiosko} className="px-16 py-6 bg-white/5 text-white rounded-full font-black text-xl hover:bg-white/10 border border-white/10 transition-all uppercase tracking-widest">Finalizar</button>
        </motion.div>
    );

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center font-['Inter',sans-serif] select-none overflow-hidden bg-[#0a1a14]">
            <Head title="Kiosko SENA APE" />
            <div className="absolute inset-0 z-0">
                <motion.img animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 20, repeat: Infinity }} src="/ape-bg.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a1a14]/80 to-[#0a1a14]" />
            </div>

            <div className="relative z-10 w-full flex flex-col items-center py-20">
                <AnimatePresence mode="wait">
                    {step === 0 && <WelcomeView key="welcome" />}
                    {step === 1 && <SeleccionView key="seleccion" />}
                    {step === 2 && <RegistroView key="registro" />}
                    {step === 3 && <SuccessView key="success" />}
                </AnimatePresence>
            </div>

            <footer className="absolute bottom-8 z-10 text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                SENA Agencia Pública de Empleo | Cerca de lo que quieres ser
            </footer>
        </div>
    );
}
