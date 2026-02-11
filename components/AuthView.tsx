import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Truck, User as UserIcon, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

const AuthView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [driverName, setDriverName] = useState('');
    const [plate, setPlate] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (loginError) throw loginError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            driver_name: driverName,
                            plate: plate.toUpperCase(),
                        },
                    },
                });
                if (signUpError) throw signUpError;
                alert("Cadastro realizado! Verifique seu e-mail ou faça login (se o auto-confirm estiver ativado no Supabase).");
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro na autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-6 max-w-lg mx-auto">
            <div className="flex flex-col items-center mt-12 mb-10">
                <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 mb-6">
                    <Truck size={40} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2 text-center leading-tight">Becker e Mendonça</h1>
                <p className="text-gray-400 text-center font-bold text-xs uppercase tracking-widest">Gestão de Frotas Pro</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    {isLogin ? <Lock size={14} /> : <UserIcon size={14} />}
                    {isLogin ? 'Acessar Sistema' : 'Novo Cadastro'}
                </h3>

                <form onSubmit={handleAuth} className="space-y-6">
                    {!isLogin && (
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                                    placeholder="Nome do motorista"
                                    value={driverName}
                                    onChange={e => setDriverName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Placa do Caminhão</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none uppercase text-black font-bold placeholder:text-gray-300"
                                    placeholder="ABC-1234"
                                    value={plate}
                                    onChange={e => setPlate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">E-mail</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-5 top-4.5 text-gray-400" />
                            <input
                                type="email"
                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Senha</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-10 text-gray-300"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

                    <div className="space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar no Sistema' : 'Finalizar Cadastro')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest"
                        >
                            {isLogin ? 'Ainda não tem conta? Cadastrar-se' : 'Já tenho uma conta. Fazer Login'}
                        </button>
                    </div>
                </form>
            </div>

            <p className="mt-8 text-center text-[10px] text-gray-300 uppercase tracking-[0.4em] font-black pb-8">
                Becker e Mendonça Pro
            </p>
        </div>
    );
};

export default AuthView;
