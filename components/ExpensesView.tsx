
import React, { useState, useRef } from 'react';
import { MiscExpense } from '../types';
import { 
  Plus, 
  Receipt, 
  Coffee, 
  Droplets, 
  Landmark, 
  MoreHorizontal, 
  Calendar, 
  Trash2, 
  X, 
  Save,
  PackageOpen,
  Users,
  Zap,
  Wrench,
  Layers,
  Link,
  Coins,
  Camera,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

const CurrencyInputField: React.FC<{ 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
}> = ({ label, value, onChange }) => {
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
      <input 
        type="tel" 
        className="bg-gray-100 rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300 w-full"
        value={formatBRL(value)}
        onChange={handleChange}
      />
    </div>
  );
};

interface ExpensesViewProps {
  expenses: MiscExpense[];
  onAddExpense: (expense: MiscExpense) => void;
  onDeleteExpense: (id: string) => void;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAttachment, setShowAttachment] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MiscExpense>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Outros',
    description: '',
    value: 0,
    attachment: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalMonthly = expenses.reduce((acc, exp) => acc + exp.value, 0);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
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
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
    });
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const base64 = await resizeImage(file);
      setForm(prev => ({ ...prev, attachment: base64 }));
      setIsProcessing(false);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'Borracharia': return <Wrench size={20} />;
      case 'Lavagem': return <Droplets size={20} />;
      case 'Alimentação': return <Coffee size={20} />;
      case 'Pedágio': return <Landmark size={20} />;
      case 'Descarga': return <PackageOpen size={20} />;
      case 'Serviços de chapa': return <Users size={20} />;
      case 'Eletricista': return <Zap size={20} />;
      case 'Mecânica': return <Wrench size={20} />;
      case 'Enlonamento': return <Layers size={20} />;
      case 'Amarração de carga': return <Link size={20} />;
      case 'Gorjetas': return <Coins size={20} />;
      default: return <MoreHorizontal size={20} />;
    }
  };

  const handleSave = () => {
    if (!form.value || form.value <= 0) {
      alert("Por favor, insira um valor válido.");
      return;
    }

    const newExpense: MiscExpense = {
      id: Date.now().toString(),
      date: form.date || new Date().toISOString().split('T')[0],
      category: (form.category as any) || 'Outros',
      description: form.description?.trim() || form.category || 'Despesa',
      value: Number(form.value),
      attachment: form.attachment
    };

    onAddExpense(newExpense);
    setShowModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Outros', description: '', value: 0, attachment: '' });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500 pb-32">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <Receipt size={32} />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total acumulado</p>
        <h2 className="text-3xl font-black text-gray-900">
          {totalMonthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </h2>
      </div>

      <div className="flex justify-between items-center px-2">
        <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Lançamentos Recentes</h3>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-all">
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma despesa registrada</p>
          </div>
        ) : (
          expenses.slice().reverse().map(expense => (
            <div key={expense.id} className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="relative">
                <div className="bg-gray-50 p-3 rounded-2xl text-gray-600">
                  {getIcon(expense.category)}
                </div>
                {expense.attachment && (
                  <button onClick={() => setShowAttachment(expense.attachment!)} className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                    <ImageIcon size={10} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-gray-900 leading-tight truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md truncate">
                    {expense.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end shrink-0">
                <p className="font-black text-red-500">
                  - {expense.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <button onClick={() => onDeleteExpense(expense.id)} className="text-gray-300 p-1 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 pb-12 space-y-6 animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-xl font-black text-gray-900">Nova Despesa</h3>
              <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Data</label>
                  <input type="date" className="bg-gray-100 rounded-2xl p-4 font-bold outline-none text-black" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <CurrencyInputField label="Valor (R$)" value={form.value || 0} onChange={v => setForm({...form, value: v})} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Categoria</label>
                <select className="bg-gray-100 border-none rounded-2xl p-4 font-bold outline-none appearance-none" value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Amarração">Amarração</option>
                  <option value="Borracharia">Borracharia</option>
                  <option value="Descarga">Descarga</option>
                  <option value="Mecânica">Mecânica</option>
                  <option value="Pedágio">Pedágio</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Descrição</label>
                <input type="text" className="bg-gray-100 rounded-2xl p-4 font-bold outline-none" placeholder="O que foi pago?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Anexar Comprovante</label>
                <div onClick={() => fileInputRef.current?.click()} className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${form.attachment ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  {isProcessing ? <Loader2 className="animate-spin text-blue-600"/> : form.attachment ? <img src={form.attachment} className="h-full w-full object-cover rounded-2xl" /> : (
                    <>
                      <Camera size={32} className="text-gray-300" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">Tirar Foto do Recibo</span>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
              </div>
            </div>

            <button onClick={handleSave} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase tracking-widest text-xs">Salvar Despesa</button>
          </div>
        </div>
      )}

      {showAttachment && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6" onClick={() => setShowAttachment(null)}>
           <img src={showAttachment} className="max-w-full max-h-full rounded-2xl shadow-2xl" />
           <button className="absolute top-10 right-10 text-white p-4"><X size={32}/></button>
        </div>
      )}
    </div>
  );
};

export default ExpensesView;
