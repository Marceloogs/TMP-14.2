import React, { useState, useRef, useEffect } from 'react';
import { User, MiscExpense } from '../types';
import {
  Save,
  User as UserIcon,
  Truck,
  LogOut,
  CheckCircle,
  Edit2,
  Trash2,
  X,
  Camera,
  Loader2,
  Download,
  Upload,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RegistrationViewProps {
  user: User;
  onUpdateUser: (user: User | null) => void;
  onLogout: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState<User>({
    ...user,
    truckRegistrationDate: user.truckRegistrationDate || new Date().toISOString().split('T')[0],
    truckInitialKm: user.truckInitialKm || 0,
    truckCurrentKm: user.truckCurrentKm || 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      ...user,
      truckRegistrationDate: user.truckRegistrationDate || new Date().toISOString().split('T')[0],
      truckInitialKm: user.truckInitialKm || 0,
      truckCurrentKm: user.truckCurrentKm || 0
    });
  }, [user]);

  const driverPhotoRef = useRef<HTMLInputElement>(null);
  const truckPhotoRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Erro');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>, type: 'driver' | 'truck') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingPhoto(type);
        const compressedBase64 = await resizeImage(file);
        if (type === 'driver') setFormData(prev => ({ ...prev, driverPhoto: compressedBase64 }));
        else setFormData(prev => ({ ...prev, truckPhoto: compressedBase64 }));
      } catch (err) {
        alert("Erro ao processar foto.");
      } finally {
        setIsProcessingPhoto(null);
        e.target.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverName || !formData.plate) {
      alert("Preencha o nome e a placa.");
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          driver_name: formData.driverName,
          plate: formData.plate.toUpperCase(),
          company_name: formData.companyName,
          driver_photo: formData.driverPhoto,
          truck_photo: formData.truckPhoto,
          truck_registration_date: formData.truckRegistrationDate,
          truck_initial_km: Number(formData.truckInitialKm) || 0,
          truck_current_km: Number(formData.truckCurrentKm) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdateUser({
        ...user,
        ...formData,
        truckInitialKm: Number(formData.truckInitialKm) || 0,
        truckCurrentKm: Number(formData.truckCurrentKm) || 0
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      alert("Erro ao salvar dados: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (confirm("Isso substituirá TODOS os dados locais (viagens, despesas, filtros). Deseja continuar?")) {
          if (data.trips) localStorage.setItem('truck_trips', JSON.stringify(data.trips));
          if (data.expenses) localStorage.setItem('truck_misc_expenses', JSON.stringify(data.expenses));
          if (data.tires) localStorage.setItem('truck_tires', JSON.stringify(data.tires));
          if (data.retired_tires) localStorage.setItem('truck_retired_tires', JSON.stringify(data.retired_tires));
          if (data.filters) localStorage.setItem('truck_filters', JSON.stringify(data.filters));
          alert("Importação concluída com sucesso! O sistema irá recarregar.");
          window.location.reload();
        }
      } catch (err) {
        alert("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg bg-blue-600 shadow-blue-100">
            <UserIcon size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Meu Perfil</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">DADOS E CONFIGURAÇÕES</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="flex gap-8 items-end justify-center">
            <div className="flex flex-col items-center gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Motorista</label>
              <div onClick={() => driverPhotoRef.current?.click()} className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner">
                {isProcessingPhoto === 'driver' ? <Loader2 className="animate-spin text-blue-600" /> : formData.driverPhoto ? <img src={formData.driverPhoto} className="w-full h-full object-cover" /> : <Camera className="text-gray-400" size={24} />}
              </div>
              <input ref={driverPhotoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handlePhotoCapture(e, 'driver')} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Caminhão</label>
              <div onClick={() => truckPhotoRef.current?.click()} className="relative w-32 h-20 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner">
                {isProcessingPhoto === 'truck' ? <Loader2 className="animate-spin text-blue-600" /> : formData.truckPhoto ? <img src={formData.truckPhoto} className="w-full h-full object-cover" /> : <Truck className="text-gray-400" size={32} />}
              </div>
              <input ref={truckPhotoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoCapture(e, 'truck')} />
            </div>
          </div>

          <div className="space-y-4">
            <InputField label="Empresa" value={formData.companyName} onChange={v => setFormData({ ...formData, companyName: v })} placeholder="Ex: Becker e Mendonça" />
            <InputField label="Nome do Motorista" value={formData.driverName} onChange={v => setFormData({ ...formData, driverName: v })} placeholder="Nome completo" />

            <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 space-y-4">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Truck size={14} /> Detalhes do Caminhão</h4>
              <InputField label="Placa" value={formData.plate} onChange={v => setFormData({ ...formData, plate: v.toUpperCase() })} placeholder="ABC-1234" />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Data Cadastro</label>
                  <input type="date" className="bg-white border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all" value={formData.truckRegistrationDate || ''} onChange={e => setFormData({ ...formData, truckRegistrationDate: e.target.value })} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">KM Inicial</label>
                  <input type="number" className="bg-white border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all" value={formData.truckInitialKm || ''} onChange={e => setFormData({ ...formData, truckInitialKm: Number(e.target.value) })} placeholder="0" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">KM Final / Atual</label>
                <input type="number" className="bg-white border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all" value={formData.truckCurrentKm || ''} onChange={e => setFormData({ ...formData, truckCurrentKm: Number(e.target.value) })} placeholder="0" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-5 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest bg-blue-600 shadow-blue-100`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Atualizar Perfil
          </button>
        </form>

        {showSuccess && (
          <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={16} /> Dados salvos com sucesso no Supabase!
          </div>
        )}
      </div>

      {/* Backup */}
      <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl"><ShieldCheck size={20} /></div>
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Segurança de Dados</h3>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4 px-2 italic">Atenção: Perfis são salvos na nuvem, mas registros de viagens e despesas são locais.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => {
            const data = {
              trips: JSON.parse(localStorage.getItem('truck_trips') || '[]'),
              expenses: JSON.parse(localStorage.getItem('truck_misc_expenses') || '[]'),
              tires: JSON.parse(localStorage.getItem('truck_tires') || '[]'),
              retired_tires: JSON.parse(localStorage.getItem('truck_retired_tires') || '[]'),
              filters: JSON.parse(localStorage.getItem('truck_filters') || '{}'),
              exportDate: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_truckmanager_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }} className="flex flex-col items-center gap-2 p-5 bg-gray-50 rounded-2xl active:bg-blue-50 transition-colors border border-gray-100">
            <Download size={24} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase text-gray-500">Exportar Backup</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 p-5 bg-gray-50 rounded-2xl active:bg-green-50 transition-colors border border-gray-100">
            <Upload size={24} className="text-green-600" />
            <span className="text-[10px] font-black uppercase text-gray-500">Importar Backup</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportData} />
        </div>
      </div>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-5 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs tracking-widest active:bg-red-100 transition-colors">
        <LogOut size={20} /> Encerrar Sessão
      </button>
    </div>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; placeholder: string }> = ({ label, value, onChange, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
    <input type="text" className="bg-gray-100/80 border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default RegistrationView;
