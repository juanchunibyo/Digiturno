import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Zap, ArrowRight, X, Check } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import axios from 'axios';

export default function LoginApe({ status }) {
    const mainRef = useRef(null);
    const [isLogin, setIsLogin] = useState(true);
    const [authStatus, setAuthStatus] = useState('idle');
    const [userName, setUserName] = useState('');

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '', email: '', password: '', password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        
        if (isLogin) {
            // Ingreso directo sin animaciones para usuarios que ya tienen cuenta
            post(route('login'));
        } else {
            setAuthStatus('loading');
            
            // Simular tiempo de conexión para la animación SOLO en registro
            setTimeout(() => {
                post(route('register'), {
                    onSuccess: () => {
                        setAuthStatus('success');
                        setTimeout(() => {
                            setAuthStatus('idle');
                            setIsLogin(true); // Forza el regreso visual al formulario de inicio de sesión
                            reset('password', 'password_confirmation'); // Borra contraseñas por seguridad
                        }, 2500);
                    },
                    onError: () => {
                        setAuthStatus('error');
                        setTimeout(() => setAuthStatus('idle'), 2500);
                    }
                });
            }, 1500);
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        reset();
        clearErrors();
    };

    const renderAuthForm = (mode) => {
        const isLg = mode === 'login';
        return (
            <div className="w-full max-w-md mx-auto p-4 lg:p-0">
                <div className="text-center lg:text-left mb-8">
                    <h2 className="text-4xl font-extrabold text-[#1B4332] mb-2">{isLg ? 'Portal Interno' : 'Solicitar Acceso'}</h2>
                    <p className="text-[#2D6A4F] font-medium">{isLg ? 'Acceso exclusivo para Asesores y Coordinadores.' : 'Registro de nuevo personal administrativo.'}</p>
                </div>
                {status && isLg && <div className="mb-4 text-sm font-medium text-[#40916C] bg-[#40916C]/10 p-3 rounded-lg">{status}</div>}

                <form onSubmit={(e) => submit(e, mode)} className="space-y-4 relative z-20">
                    {!isLg && (
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required={!isLg}
                            className="w-full px-5 py-3.5 bg-white/80 border border-[#2D6A4F]/20 rounded-xl focus:ring-2 focus:ring-[#40916C] focus:bg-white transition-all text-[#1B4332] shadow-sm" placeholder="Nombre Completo" />
                    )}
                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required
                        className="w-full px-5 py-3.5 bg-white/80 border border-[#2D6A4F]/20 rounded-xl focus:ring-2 focus:ring-[#40916C] focus:bg-white transition-all text-[#1B4332] shadow-sm" placeholder="Correo Electrónico" />
                    {errors.email && <span className="text-xs text-red-500 font-semibold">{errors.email}</span>}

                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} required
                        className="w-full px-5 py-3.5 bg-white/80 border border-[#2D6A4F]/20 rounded-xl focus:ring-2 focus:ring-[#40916C] focus:bg-white transition-all text-[#1B4332] shadow-sm font-sans text-lg tracking-[0.2em] placeholder:tracking-normal placeholder:text-base placeholder:font-['Inter']" placeholder="Contraseña" />
                    {errors.password && <span className="text-xs text-red-500 font-semibold">{errors.password}</span>}

                    {!isLg && (
                        <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} required={!isLg}
                            className="w-full px-5 py-3.5 bg-white/80 border border-[#2D6A4F]/20 rounded-xl focus:ring-2 focus:ring-[#40916C] focus:bg-white transition-all text-[#1B4332] shadow-sm font-sans text-lg tracking-[0.2em] placeholder:tracking-normal placeholder:text-base placeholder:font-['Inter']" placeholder="Confirmar Contraseña" />
                    )}

                    <button type="submit" disabled={processing} className="w-full py-4 mt-2 bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold rounded-xl transition-all duration-300 shadow-[0_8px_20px_rgba(27,67,50,0.2)] hover:shadow-[0_12px_25px_rgba(27,67,50,0.3)] hover:-translate-y-1">
                        {isLg ? 'Entrar al Panel de Control' : 'Crear Perfil de Asesor'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm font-semibold relative z-20 block lg:hidden">
                    <span className="text-[#2D6A4F]"> {isLg ? '¿No cuentas con acceso?' : '¿Ya tienes credenciales?'} </span>
                    <button type="button" onClick={toggleForm} className="text-[#BC6C25] hover:text-[#1B4332] transition-colors ml-2 underline decoration-2 underline-offset-4">
                        {isLg ? 'Solicitar uno' : 'Inicia Sesión'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div ref={mainRef} className="bg-[#F1FAEE] min-h-screen text-[#1B4332] font-['Inter',sans-serif] selection:bg-[#40916C] selection:text-white relative overflow-hidden">
            <Head>
                <title>Agencia Pública de Empleo | SENA</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet" />
            </Head>
            <style>{`
                h1, h2, h3, h4, h5 { font-family: 'Poppins', sans-serif !important; }
                @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .scale-in { animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                .cubic-transition { transition-timing-function: cubic-bezier(0.76, 0, 0.24, 1); }
                @keyframes fadeUpDesvanecido {
                    0% { opacity: 0; transform: translateY(20px); filter: blur(10px); }
                    100% { opacity: 1; transform: translateY(0); filter: blur(0px); }
                }
                @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
            `}</style>

            <header className="absolute top-0 w-full p-6 lg:p-10 z-50 pointer-events-none">
                <img src="/logo-ape.png" alt="APE SENA" className="h-14 lg:h-16 drop-shadow-lg pointer-events-auto cursor-pointer filter hover:brightness-110 transition-all" />
            </header>

            {/* OVERLAY AUTH ANIMADO CINEMATOGRÁFICO */}
            {authStatus !== 'idle' && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center transition-all duration-700 opacity-0 animate-[fadeIn_0.5s_forwards]">
                    {/* Logo Flotante Intacto */}
                    <div className="relative flex flex-col items-center justify-center mb-6">
                        <img 
                            src="/logo-ape.png" 
                            alt="APE SENA" 
                            className={`w-56 lg:w-64 transition-all duration-1000 ease-out ${authStatus === 'loading' ? 'scale-100 opacity-90 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] animate-pulse' : 'scale-110 opacity-100'}`} 
                        />
                        
                        {/* Iconos de Verificación Elegantes */}
                        {authStatus === 'success' && (
                            <div className="absolute -bottom-2 right-0 bg-[#40916C] text-white rounded-full p-3 shadow-[0_0_40px_rgba(64,145,108,0.8)] scale-in ring-4 ring-black/50">
                                <Check size={36} strokeWidth={3} />
                            </div>
                        )}
                        {authStatus === 'error' && (
                            <div className="absolute -bottom-2 right-0 bg-red-600 text-white rounded-full p-3 shadow-[0_0_40px_rgba(220,38,38,0.8)] scale-in ring-4 ring-black/50">
                                <X size={36} strokeWidth={3} />
                            </div>
                        )}
                    </div>

                    {/* Tipografía desvanecida imitando imagen o resultado */}
                    <div className="mt-8 flex flex-col items-center justify-center h-20 text-center">
                        {authStatus === 'loading' && (
                            <div className="flex flex-col items-center justify-center opacity-0 animate-[fadeUpDesvanecido_1.5s_ease-out_0.2s_forwards] font-['Inter']">
                                <span className="text-[#F1FAEE] text-xl lg:text-2xl font-normal tracking-wide leading-tight">Agencia Pública</span>
                                <span className="text-white text-4xl lg:text-5xl font-extrabold tracking-tight uppercase leading-none mt-[-5px] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">DE EMPLEO</span>
                            </div>
                        )}
                        {authStatus === 'success' && isLogin && (
                            <div className="flex flex-col items-center justify-center text-center mt-2 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                                <h3 className="text-[#40916C] text-sm lg:text-lg font-bold tracking-[0.2em] font-['Inter'] uppercase mb-1 drop-shadow-sm">
                                    Credenciales Correctas
                                </h3>
                                <h3 className="text-[#2D6A4F] text-xl lg:text-3xl font-extrabold tracking-wide font-['Inter'] drop-shadow-md">
                                    BIENVENIDO, {userName.toUpperCase()}
                                </h3>
                            </div>
                        )}
                        {authStatus === 'success' && !isLogin && (
                            <h3 className="text-[#40916C] text-xl lg:text-2xl font-bold tracking-[0.1em] font-['Inter'] opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] uppercase mt-1">
                                Se ha registrado correctamente
                            </h3>
                        )}
                        {authStatus === 'error' && (
                            <h3 className="text-red-500 text-xl lg:text-3xl font-semibold tracking-[0.2em] font-['Inter'] opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                                ACCESO DENEGADO
                            </h3>
                        )}
                    </div>
                </div>
            )}

            {/* ==== MOBILE LAYOUT ==== */}
            <div className="flex lg:hidden flex-col h-screen overflow-y-auto">
                <div className="h-[40vh] w-full relative shrink-0 overflow-hidden bg-[#1B4332]">
                    <iframe 
                        src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=LXb3EKWsInQ&playsinline=1&rel=0&disablekb=1&start=40&end=100&vq=hd1080"
                        className="absolute top-1/2 left-1/2 w-[250vw] h-[250vh] max-w-none -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        allow="autoplay; encrypted-media"
                    ></iframe>
                    {/* Sombra neutral para legibilidad, sin tonos verdes */}
                    <div className="absolute inset-0 bg-black/30 pointer-events-none mix-blend-multiply"></div>
                </div>
                <div className="bg-[#F1FAEE] shrink-0 min-h-[60vh] flex flex-col justify-center -mt-10 rounded-t-3xl relative z-10 p-6 shadow-[-5px_-20px_30px_rgba(27,67,50,0.1)]">
                    {renderAuthForm(isLogin ? 'login' : 'register')}
                </div>
            </div>

            {/* ==== DESKTOP GHOST MASK SLIDER ==== */}
            <div className="hidden lg:block relative w-full h-screen">
                {/* Formulario Izquierda (Fijo) - REGISTRO */}
                <div className="absolute top-0 left-0 w-1/2 h-full flex items-center justify-center bg-[#F1FAEE]">
                    <div className="w-[80%] opacity-100 transition-opacity duration-300">
                        {renderAuthForm('register')}
                    </div>
                </div>

                {/* Formulario Derecha (Fijo) - LOGIN */}
                <div className="absolute top-0 right-0 w-1/2 h-full flex items-center justify-center bg-[#F1FAEE]">
                    <div className="w-[80%] opacity-100 transition-opacity duration-300">
                        {renderAuthForm('login')}
                    </div>
                </div>

                {/* OVERLAY DESLIZANTE (LA "PUERTA" FLOTANTE) */}
                <div className={`absolute top-0 left-0 h-full w-1/2 z-40 cubic-transition duration-[1200ms] overflow-hidden shadow-[0_0_80px_rgba(27,67,50,0.3)] ${
                    isLogin ? 'translate-x-0' : 'translate-x-full'
                }`}>
                    
                    {/* Interior del Overlay: 200% de ancho, se mueve en sentido contrario al Overlay para simular un fondo estático revelado */}
                    <div className={`relative w-[200%] h-full cubic-transition duration-[1200ms] bg-[#1B4332] ${
                        isLogin ? 'translate-x-0' : '-translate-x-1/2'
                    }`}>
                        
                        {/* Video de Fondo Continuo */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none bg-[#0a0a0a]">
                            <iframe 
                                src="https://www.youtube.com/embed/LXb3EKWsInQ?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=LXb3EKWsInQ&playsinline=1&rel=0&disablekb=1&start=40&end=100&vq=hd1080"
                                className="absolute top-1/2 left-1/2 w-[180vw] h-[150vh] lg:w-[150vw] lg:h-[150vh] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-90"
                                allow="autoplay; encrypted-media"
                            ></iframe>
                            {/* Filtro oscuro sumamente neutro para asegurar que las letras blancas no se pierdan en cielos claros */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none mix-blend-multiply"></div>
                        </div>

                        {/* Texto Izquierdo (Visible cuando el overlay tapa el Registro) */}
                        <div className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center px-12 lg:px-24 2xl:px-32 transition-all duration-[800ms] delay-300 ${isLogin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-white text-sm font-semibold max-w-max shadow-xl">
                                <Zap size={18} className="text-[#4ADE80]" /> Centro de Comando APE
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#F1FAEE] leading-[1.1] mb-6 tracking-tight drop-shadow-2xl">
                                Conectando <br/> el talento con el <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#39A900]">FUTURO DE<br/>COLOMBIA.</span>
                            </h1>
                            <p className="text-xl text-[#F1FAEE]/90 leading-relaxed font-medium mb-10 max-w-lg">
                                Dirige, coordina y optimiza los procesos de intermediación laboral. Acceso restringido para el núcleo administrativo del SENA.
                            </p>
                            <button onClick={toggleForm} className="px-8 py-5 rounded-2xl bg-transparent border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 hover:border-white transition-all w-max flex items-center gap-3 group">
                                Solicitar perfil administrativo <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>

                        {/* Texto Derecho (Visible cuando el overlay tapa el Login) */}
                        <div className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center px-12 lg:px-24 2xl:px-32 transition-all duration-[800ms] delay-300 ${!isLogin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-white text-sm font-semibold max-w-max shadow-xl">
                                <Check size={18} className="text-[#4ADE80]" /> Sistema de Gestión
                            </div>
                            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#F1FAEE] leading-[1.1] mb-6 tracking-tight drop-shadow-2xl">
                                Inteligencia <br/> y agilidad en <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ADE80] to-[#39A900]">CADA NUEVA<br/>ATENCIÓN.</span>
                            </h1>
                            <p className="text-xl text-[#F1FAEE]/90 leading-relaxed font-medium mb-10 max-w-lg">
                                Entra a tu estación de trabajo para monitorear en tiempo real los flujos de atención y procesos empresariales.
                            </p>
                            <button onClick={toggleForm} className="px-8 py-5 rounded-2xl bg-transparent border-2 border-white/30 text-white font-bold text-lg hover:bg-white/10 hover:border-white transition-all w-max flex items-center gap-3 group">
                                Ingresar al sistema <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
