import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Hand } from 'lucide-react';

export default function Welcome() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#F4F6F9] font-['Inter',sans-serif] selection:bg-[#39A900] selection:text-white">
            <Head title="Bienvenido | SENA APE" />

            {/* Background Image & Overlays */}
            <div className="absolute inset-0 z-0">
                <motion.img
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    alt="Oficina moderna"
                    className="w-full h-full object-cover"
                    src="/ape-bg.png" 
                />
                {/* Gradiente oscuro/verde para darle el toque institucional SENA y mejorar legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-[#1B4332]/40 backdrop-blur-sm"></div>
            </div>

            {/* Top Branding */}
            <div className="absolute top-0 left-0 right-0 p-8 md:p-12 z-20 flex justify-between items-center">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-lg">
                    <img src="/logo-ape.png" alt="SENA APE" className="h-10 object-contain drop-shadow-md brightness-0 invert" />
                    <div className="border-l border-white/30 pl-4">
                        <p className="text-white font-black text-sm tracking-widest uppercase">Servicio Público</p>
                        <p className="text-gray-300 text-xs tracking-wider">de Empleo</p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="hidden md:flex items-center gap-2 bg-[#39A900] text-white px-5 py-2.5 rounded-full font-bold text-xs tracking-widest shadow-lg shadow-[#39A900]/20">
                    <ShieldCheck size={16} /> PORTAL OFICIAL DEL GOBIERNO
                </motion.div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
                <div className="max-w-5xl space-y-10">
                    
                    {/* Welcome Text */}
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
                        className="space-y-6">
                        
                        <h1 className="font-black text-6xl md:text-8xl lg:text-[110px] text-white leading-[0.95] tracking-tight drop-shadow-2xl">
                            Bienvenido al <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39A900] to-[#5ceb00]">Servicio Público</span> <br/>
                            <span className="text-white/90">de Empleo</span>
                        </h1>
                        
                        <p className="text-xl md:text-3xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg [text-shadow:_0_2px_10px_rgb(0_0_0_/_60%)]">
                            Conectamos tu talento con las mejores oportunidades del país.
                        </p>
                    </motion.div>

                    {/* Massive Touch CTA */}
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="pt-12 relative flex flex-col items-center">
                        
                        {/* Indicador táctil flotante */}
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="absolute -top-8 text-[#5ceb00] drop-shadow-[0_0_15px_rgba(57,169,0,0.8)]">
                            <Hand size={40} className="transform -rotate-12" />
                        </motion.div>

                        <a 
                            href="/seleccion" 
                            className="group relative z-50 inline-flex items-center justify-center px-14 py-8 bg-gradient-to-b from-[#39A900] to-[#266e00] hover:from-[#43c400] hover:to-[#2e8500] text-white rounded-3xl shadow-[0_20px_50px_rgba(57,169,0,0.5)] active:shadow-none active:scale-95 transition-all duration-200 overflow-hidden touch-manipulation border border-[#5ceb00]/30 cursor-pointer">
                            
                            {/* Brillo interno del botón */}
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                            
                            <span className="relative font-black text-3xl md:text-5xl tracking-wide flex items-center gap-6 pointer-events-none">
                                Empezar ahora
                                <div className="bg-white/20 p-2 rounded-full group-hover:translate-x-3 transition-transform duration-300">
                                    <ChevronRight size={40} strokeWidth={3} className="text-white" />
                                </div>
                            </span>
                        </a>

                        <p className="mt-8 text-sm md:text-base font-bold text-gray-400 tracking-widest uppercase flex items-center justify-center gap-2">
                            <span className="w-12 h-px bg-gray-500"></span>
                            Toque la pantalla para continuar
                            <span className="w-12 h-px bg-gray-500"></span>
                        </p>
                    </motion.div>
                </div>
            </main>

            {/* Decorative bottom lines */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#39A900] to-transparent opacity-50"></div>
        </div>
    );
}
