
import React, { useState, useEffect } from 'react';
import { Trip, User, Freight, DieselRecord, Expenses, Station } from '../types';
import { Save, Fuel, Package, Calculator, Plus, ArrowRightLeft, CheckCircle2, ChevronRight, X, ChevronLeft, Flag, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Componente especializado para entrada de valores monetários com máscara R$
 */
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
    // Remove tudo que não é dígito
    const rawValue = e.target.value.replace(/\D/g, '');
    // Transforma em decimal (últimos 2 dígitos são centavos)
    const numericValue = Number(rawValue) / 100;
    onChange(numericValue);
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
      <input 
        type="tel" 
        className="bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300 w-full"
        value={formatBRL(value)}
        onChange={handleChange}
      />
    </div>
  );
};

interface TripFormProps {
  onSave: (trip: Trip, shouldExit?: boolean) => void;
  user: User;
  initialStep?: number;
  stations?: Station[];
  onAddStation?: (name: string) => void;
  companies?: Station[];
  onAddCompany?: (name: string) => void;
  existingTrip?: Trip;
}

const TripForm: React.FC<TripFormProps> = ({ 
  onSave, 
  user, 
  initialStep = 1, 
  stations = [], 
  onAddStation, 
  companies = [], 
  onAddCompany, 
  existingTrip 
}) => {
  const [step, setStep] = useState(initialStep);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showAddStation, setShowAddStation] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');

  const [outbound, setOutbound] = useState<Freight>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    destinations: '',
    value: 0,
    advance: 0,
    advanceMaintenance: 0,
    advanceDiesel: 0,
    balance: 0,
    tollTag: 0,
    weightTons: 0,
    startKm: user.truckCurrentKm || user.truckInitialKm || 0
  });
  
  const [inbound, setInbound] = useState<Freight>({
    date: new Date().toISOString().split('T')[0],
    company: '',
    destinations: '',
    value: 0,
    advance: 0,
    advanceMaintenance: 0,
    advanceDiesel: 0,
    balance: 0,
    tollTag: 0,
    weightTons: 0,
    startKm: 0
  });

  const [dieselRecords, setDieselRecords] = useState<DieselRecord[]>([]);
  const [currentDiesel, setCurrentDiesel] = useState<DieselRecord>({
    station: '',
    arrivalKm: 0,
    litersDiesel: 0,
    litersArla: 0,
    totalCost: 0
  });

  const [expenses, setExpenses] = useState<Expenses>({
    tireShop: 0,
    binding: 0,
    unloading: 0,
    tip: 0,
    wash: 0,
    cashToll: 0,
    othersDesc: '',
    othersValue: 0
  });

  const [endKm, setEndKm] = useState<number>(0);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingTrip) {
      setOutbound(existingTrip.outbound);
      setInbound(existingTrip.inbound);
      setDieselRecords(existingTrip.diesel || []);
      setExpenses(existingTrip.expenses || {
        tireShop: 0,
        binding: 0,
        unloading: 0,
        tip: 0,
        wash: 0,
        cashToll: 0,
        othersDesc: '',
        othersValue: 0
      });
      setEndKm(existingTrip.endKm || 0);
      setEndDate(existingTrip.endDate || new Date().toISOString().split('T')[0]);
    } else {
      setOutbound(prev => ({
        ...prev,
        startKm: user.truckCurrentKm || user.truckInitialKm || 0
      }));
    }
  }, [existingTrip, user]);

  useEffect(() => {
    setStep(initialStep);
  }, [initialStep]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getCurrentTripState = (status: 'active' | 'completed' = 'active'): Trip => ({
    id: existingTrip?.id || Date.now().toString(),
    driverName: user.driverName,
    plate: user.plate,
    outbound: { ...outbound, balance: outbound.value - outbound.advance },
    inbound: { ...inbound, balance: inbound.value - inbound.advance },
    diesel: dieselRecords,
    expenses,
    status,
    createdAt: existingTrip?.createdAt || new Date().toISOString(),
    endKm: Number(endKm),
    endDate: endDate
  });

  const handleStepChange = (targetStep: number) => {
    onSave(getCurrentTripState('active'), false);
    setStep(targetStep);
  };

  const handleSaveAndExit = () => {
    onSave(getCurrentTripState('active'), true);
  };

  const handleAddCompany = () => {
    if (newCompanyName.trim() && onAddCompany) {
      onAddCompany(newCompanyName.trim());
      if (step === 1) setOutbound({...outbound, company: newCompanyName.trim()});
      else if (step === 2) setInbound({...inbound, company: newCompanyName.trim()});
      setNewCompanyName('');
      setShowAddCompany(false);
    }
  };

  const handleAddStation = () => {
    if (newStationName.trim() && onAddStation) {
      onAddStation(newStationName.trim());
      setCurrentDiesel({ ...currentDiesel, station: newStationName.trim() });
      setNewStationName('');
      setShowAddStation(false);
    }
  };

  const addDiesel = () => {
    if (currentDiesel.station && currentDiesel.totalCost > 0) {
      const updatedDiesel = [...dieselRecords, currentDiesel];
      setDieselRecords(updatedDiesel);
      setCurrentDiesel({
        station: '',
        arrivalKm: 0,
        litersDiesel: 0,
        litersArla: 0,
        totalCost: 0
      });
      onSave({...getCurrentTripState('active'), diesel: updatedDiesel}, false);
    } else {
      alert("Por favor, selecione um posto e insira o valor.");
    }
  };

  const removeDiesel = (index: number) => {
    const updatedDiesel = dieselRecords.filter((_, i) => i !== index);
    setDieselRecords(updatedDiesel);
    onSave({...getCurrentTripState('active'), diesel: updatedDiesel}, false);
  };

  const handleFinalizeTrip = async () => {
    if (isFinalizing) return;
    const startKm = Number(outbound.startKm) || 0;
    const currentEndKm = Number(endKm) || 0;
    if (currentEndKm <= 0) {
      alert("Atenção: Você precisa informar o KM Final da viagem para encerrar.");
      return;
    }
    if (currentEndKm <= startKm) {
      alert(`Atenção: O KM Final (${currentEndKm}) deve ser maior que o KM Inicial (${startKm}).`);
      return;
    }
    setIsFinalizing(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    const finalState = getCurrentTripState('completed');
    onSave(finalState, true);
    setIsFinalizing(false);
  };

  const steps = [
    { id: 1, label: 'Ida', icon: <Package size={18} />, completed: !!outbound.company },
    { id: 2, label: 'Volta', icon: <ArrowRightLeft size={18} />, completed: !!inbound.company },
    { id: 3, label: 'Diesel', icon: <Fuel size={18} />, completed: dieselRecords.length > 0 },
    { id: 4, label: 'Resumo', icon: <Calculator size={18} />, completed: false },
  ];

  const renderStepHeader = () => (
    <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
      <div className="flex justify-between items-center mb-4">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => handleStepChange(s.id)}
            className={`flex flex-col items-center gap-1 transition-all ${step === s.id ? 'text-blue-600' : s.completed ? 'text-green-500' : 'text-gray-300'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step === s.id ? 'border-blue-600 bg-blue-50' : s.completed ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
              {s.completed && step !== s.id ? <CheckCircle2 size={20} /> : s.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFreightForm = (data: Freight, setData: React.Dispatch<React.SetStateAction<Freight>>, isOutbound: boolean) => (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Empresa</label>
          <div className="flex gap-2">
            <select 
              className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none appearance-none"
              value={data.company}
              onChange={e => setData({...data, company: e.target.value})}
            >
              <option value="">Selecione a Empresa</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowAddCompany(true)} className="bg-blue-50 text-blue-600 p-4 rounded-2xl active:scale-95 transition-all"><Plus size={24} /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <InputField label="Data" type="date" value={data.date} onChange={v => setData({...data, date: v})} />
          <InputField label="Peso (Ton)" type="number" value={data.weightTons.toString()} onChange={v => setData({...data, weightTons: Number(v)})} />
        </div>

        <InputField label="Destinos (Cidades)" value={data.destinations} onChange={v => setData({...data, destinations: v})} placeholder="Ex: Maringá, Cascavel..." />

        {isOutbound && (
          <InputField label="KM Inicial" type="number" value={data.startKm.toString()} onChange={v => setData({...data, startKm: Number(v)})} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInputField label="Valor do Frete" value={data.value} onChange={v => setData({...data, value: v})} />
          <CurrencyInputField label="Tag Pedágio" value={data.tollTag} onChange={v => setData({...data, tollTag: v})} />
        </div>

        <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-4">
          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Calculator size={14}/> Adiantamentos</h4>
          <div className="grid grid-cols-1 gap-4">
            <CurrencyInputField label="Adiant. Pessoal (R$)" value={data.advance} onChange={v => setData({...data, advance: v})} />
            <CurrencyInputField label="Adiant. Diesel (R$)" value={data.advanceDiesel} onChange={v => setData({...data, advanceDiesel: v})} />
            <CurrencyInputField label="Adiant. Manutenção (R$)" value={data.advanceMaintenance} onChange={v => setData({...data, advanceMaintenance: v})} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-0 pb-24 space-y-0 min-h-screen bg-white">
      {renderStepHeader()}

      {step === 1 && renderFreightForm(outbound, setOutbound, true)}
      {step === 2 && renderFreightForm(inbound, setInbound, false)}
      
      {step === 3 && (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
          <div className="space-y-6">
            <div className="bg-orange-50/30 p-6 rounded-[2.5rem] border border-orange-100 space-y-4">
              <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2"><Fuel size={14}/> Novo Abastecimento</h4>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Posto</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-white border-none rounded-2xl px-5 py-4 font-bold outline-none appearance-none"
                    value={currentDiesel.station}
                    onChange={e => setCurrentDiesel({...currentDiesel, station: e.target.value})}
                  >
                    <option value="">Selecione o Posto</option>
                    {stations.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <button onClick={() => setShowAddStation(true)} className="bg-orange-600 text-white p-4 rounded-2xl active:scale-95 transition-all"><Plus size={24} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="KM Chegada" type="number" value={currentDiesel.arrivalKm.toString()} onChange={v => setCurrentDiesel({...currentDiesel, arrivalKm: Number(v)})} />
                <CurrencyInputField label="Valor Total (R$)" value={currentDiesel.totalCost} onChange={v => setCurrentDiesel({...currentDiesel, totalCost: v})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Litros Diesel" type="number" value={currentDiesel.litersDiesel.toString()} onChange={v => setCurrentDiesel({...currentDiesel, litersDiesel: Number(v)})} />
                <InputField label="Litros Arla" type="number" value={currentDiesel.litersArla.toString()} onChange={v => setCurrentDiesel({...currentDiesel, litersArla: Number(v)})} />
              </div>
              <button onClick={addDiesel} className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-[10px] tracking-widest"><Plus size={18}/> Adicionar Posto</button>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Postos na Viagem</h3>
              {dieselRecords.length === 0 ? (
                <p className="text-center py-8 text-gray-300 font-bold uppercase text-[10px] tracking-widest">Nenhum abastecimento</p>
              ) : (
                dieselRecords.map((d, i) => (
                  <div key={i} className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-900 leading-tight">{d.station}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.arrivalKm.toLocaleString()} KM • {d.litersDiesel}L</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-black text-orange-600">{formatCurrency(d.totalCost)}</p>
                      <button onClick={() => removeDiesel(i)} className="text-gray-300 p-1 hover:text-red-500"><X size={20}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 pb-32">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total de Fretes Bruto</p>
            <h3 className="text-4xl font-black tracking-tight">{formatCurrency(outbound.value + inbound.value)}</h3>
          </div>

          <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 pb-3 border-b border-gray-100"><Flag size={18} className="text-blue-600"/> Encerramento da Viagem</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Data de Chegada" type="date" value={endDate} onChange={setEndDate} />
              <InputField label="KM Final de Viagem" type="number" value={endKm.toString()} onChange={v => setEndKm(Number(v))} />
            </div>

            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-orange-700 uppercase leading-tight">Ao finalizar, o sistema calculará as médias e o lucro líquido para o relatório mensal.</p>
            </div>

            <button 
              onClick={handleFinalizeTrip} 
              disabled={isFinalizing}
              className="w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs tracking-widest"
            >
              {isFinalizing ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20}/>}
              Finalizar e Fechar Viagem
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 ios-blur border-t border-gray-100 p-4 flex gap-3 z-40 no-print">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-[10px] tracking-widest"><ChevronLeft size={18}/> Anterior</button>
        )}
        {step < 4 ? (
          <button onClick={() => handleStepChange(step + 1)} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-[10px] tracking-widest">Próximo Passo <ChevronRight size={18}/></button>
        ) : (
          <button onClick={handleSaveAndExit} className="flex-1 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-[10px] tracking-widest"><Save size={18}/> Salvar e Sair</button>
        )}
      </div>

      {showAddCompany && (
        <Modal title="Nova Empresa" onClose={() => setShowAddCompany(false)}>
          <InputField label="Nome da Empresa" value={newCompanyName} onChange={setNewCompanyName} placeholder="Ex: Ambev" />
          <button onClick={handleAddCompany} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest mt-4">Salvar Empresa</button>
        </Modal>
      )}

      {showAddStation && (
        <Modal title="Novo Posto" onClose={() => setShowAddStation(false)}>
          <InputField label="Novo Posto" value={newStationName} onChange={setNewStationName} placeholder="Ex: Posto Ipiranga" />
          <button onClick={handleAddStation} className="w-full py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg uppercase text-[10px] tracking-widest mt-4">Salvar Posto</button>
        </Modal>
      )}
    </div>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">{label}</label>
    <input 
      type={type} 
      className="bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold outline-none text-black focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300 w-full"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900">{title}</h3>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400 active:scale-90"><X size={18} /></button>
      </div>
      {children}
    </div>
  </div>
);

export default TripForm;
