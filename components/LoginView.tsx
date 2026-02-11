
import React, { useState } from 'react';
import { User } from '../types.ts';
import { Truck, User as UserIcon, ChevronRight, UserPlus, Eye, EyeOff, Lock } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
  allUsers?: User[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, allUsers = [] }) => {
  const [formData, setFormData] = useState({
    driverName: '',
    plate: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewForm, setShowNewForm] = useState(allUsers.length === 0);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  const [authPassword, setAuthPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.driverName && formData.plate && formData.password) {
      const existing = allUsers.find(u => u.plate === formData.plate);
      
      if (existing) {
        if (existing.password === formData.password) {
          onLogin(existing);
        } else {
          setError('A placa informada já possui cadastro com outra senha.');
        }
        return;
      }

      onLogin({
        id: Date.now().toString(),
        companyName: 'Becker e Mendonça transportes',
        ...formData
      });
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (selectedUserForPassword && authPassword) {
      if (selectedUserForPassword.password === authPassword) {
        onLogin(selectedUserForPassword);
      } else {
        setError('Senha incorreta. Tente novamente.');
      }
    }
  };

  // Renderização condicional isolada para evitar erros de parsing no Antigravity
  const renderContent = () => {
    // 1. Caso esteja autenticando um usuário selecionado
    if (selectedUserForPassword) {
      return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <UserIcon size={24} />
            </div>
            <div className="text-left">
              <p className="font-black text-gray-900 text-base leading-tight">{selectedUserForPassword.driverName}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{selectedUserForPassword.plate}</p>
            </div>
          </div>

          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock size={14} /> Digite sua senha
          </h3>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div className="flex flex-col gap-1 relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                placeholder="Sua senha"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

            <div className="space-y-3">
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
              >
                Confirmar Acesso
              </button>
              <button 
                type="button"
                onClick={() => { setSelectedUserForPassword(null); setAuthPassword(''); setError(''); }}
                className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest"
              >
                Voltar
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 2. Caso haja usuários salvos e não esteja no form de novo cadastro
    if (allUsers.length > 0 && !showNewForm) {
      return (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Acessar com Perfil Salvo</h3>
          <div className="space-y-3">
            {allUsers.map(user => (
              <button 
                key={user.id}
                onClick={() => setSelectedUserForPassword(user)}
                className="w-full bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <UserIcon size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 text-base leading-tight">{user.driverName}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{user.plate}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-active:text-blue-600" />
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowNewForm(true)}
            className="w-full py-5 border-2 border-dashed border-gray-200 text-gray-400 font-black rounded-[2rem] flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-400 transition-all text-xs uppercase tracking-widest"
          >
            <UserPlus size={18} /> Cadastrar Outro Perfil
          </button>
        </div>
      );
    }

    // 3. Formulário de Novo Cadastro
    return (
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <UserPlus size={14} /> Novo Acesso
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Motorista</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                placeholder="Nome completo"
                value={formData.driverName}
                onChange={e => setFormData({...formData, driverName: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Placa do Caminhão</label>
              <input 
                type="text" 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none uppercase text-black font-bold placeholder:text-gray-300"
                placeholder="ABC-1234"
                value={formData.plate}
                onChange={e => setFormData({...formData, plate: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Definir Senha de Acesso</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none text-black font-bold placeholder:text-gray-300"
                placeholder="Sua senha"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
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
          </div>

          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}

          <div className="space-y-3">
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
            >
              Entrar no Sistema
            </button>
            {allUsers.length > 0 && (
              <button 
                type="button"
                onClick={() => setShowNewForm(false)}
                className="w-full py-4 text-gray-400 font-bold text-xs uppercase tracking-widest"
              >
                Voltar para perfis salvos
              </button>
            )}
          </div>
        </form>
      </div>
    );
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

      <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderContent()}
      </div>
      
      <p className="mt-8 text-center text-[10px] text-gray-300 uppercase tracking-[0.4em] font-black pb-8">
        Becker e Mendonça Pro
      </p>
    </div>
  );
};

export default LoginView;
