
import React, { useState, useMemo, useEffect } from 'react';
import { TireRecord, MaintenanceFilters, Trip, RetiredTireRecord, MaintenanceHistoryItem, TireEvent, PositionHistoryItem, MaintenanceRecord, User } from '../types';
import { 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  Calendar, 
  X, 
  Save, 
  Wrench, 
  BarChart3, 
  History, 
  Info, 
  AlertTriangle, 
  FileText, 
  Hash, 
  Tag, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ClipboardList, 
  Flag,
  Printer,
  Download,
  Activity,
  Trash2,
  RefreshCcw,
  ArrowRightLeft,
  Move,
  Layers,
  Droplets,
  MapPin,
  ArrowRight,
  ClipboardCheck
} from 'lucide-react';

interface MaintenanceViewProps {
  tires: TireRecord[];
  setTires: React.Dispatch<React.SetStateAction<TireRecord[]>>;
  retiredTires: RetiredTireRecord[];
  setRetiredTires: React.Dispatch<React.SetStateAction<RetiredTireRecord[]>>;
  filters: MaintenanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<MaintenanceFilters>>;
  trips: Trip[];
  user: User;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ tires, setTires, retiredTires, setRetiredTires, filters, setFilters, trips, user }) => {
  const [activeTab, setActiveTab] = useState<'tires' | 'filters' | 'retired'>('tires');
  const [editingTirePos, setEditingTirePos] = useState<string | null>(null);
  const [tireForm, setTireForm] = useState<Partial<TireRecord>>({ events: [], positionHistory: [] });
  const [isConfirmingRetire, setIsConfirmingRetire] = useState(false);
  const [sentToRetread, setSentToRetread] = useState(false);
  
  // Estados para Rodízio
  const [rotationSource, setRotationSource] = useState<{ pos: string, tire: TireRecord } | null>(null);
  const [rotationTargetPos, setRotationTargetPos] = useState<string | null>(null);
  const [rotationDetails, setRotationDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    km: 0
  });

  const [newEvent, setNewEvent] = useState<Partial<TireEvent>>({
    date: new Date().toISOString().split('T')[0],
    km: 0,
    description: ''
  });

  const currentKm = useMemo(() => {
    const tripsForPlate = trips.filter(t => t.plate === user.plate);
    let kmFromTrips = 0;
    
    if (tripsForPlate.length > 0) {
      kmFromTrips = Math.max(...tripsForPlate.map(t => {
        const dieselKm = t.diesel && t.diesel.length > 0 ? Math.max(...t.diesel.map(d => d.arrivalKm)) : 0;
        const tEndKm = t.endKm || 0;
        return Math.max(t.outbound?.startKm || 0, dieselKm, t.inbound?.startKm || 0, tEndKm);
      }));
    }
    
    return Math.max(kmFromTrips, user.truckCurrentKm || 0, user.truckInitialKm || 0);
  }, [trips, user]);

  useEffect(() => {
    if (currentKm > 0 && (newEvent.km === 0 || newEvent.km === undefined)) {
      setNewEvent(prev => ({ ...prev, km: currentKm }));
    }
    if (currentKm > 0 && rotationDetails.km === 0) {
      setRotationDetails(prev => ({ ...prev, km: currentKm }));
    }
  }, [currentKm]);

  const calculateTireMileage = (tire: TireRecord, odometer: number, finalKm?: number) => {
    if (!tire.positionHistory || tire.positionHistory.length === 0) return 0;
    
    const endPoint = finalKm || odometer;
    
    return tire.positionHistory.reduce((acc, segment) => {
      const isSparePos = segment.position.toLowerCase().includes('estepe');
      if (isSparePos) return acc;
      
      const start = segment.startKm;
      const end = segment.endKm || endPoint;
      const diff = end - start;
      return acc + (diff > 0 ? diff : 0);
    }, 0);
  };

  const handleOpenTire = (position: string) => {
    if (rotationSource) {
      if (rotationSource.pos === position) {
        setRotationSource(null);
        return;
      }
      setRotationTargetPos(position);
      setRotationDetails({
        date: new Date().toISOString().split('T')[0],
        km: currentKm
      });
      return;
    }

    const existing = tires.find(t => t.position === position);
    setIsConfirmingRetire(false);
    setSentToRetread(false);
    setEditingTirePos(position);
    
    setTireForm({
      position,
      date: new Date().toISOString().split('T')[0],
      brand: '',
      tireCode: '',
      condition: 'novo',
      installationKm: 0,
      removalKm: currentKm,
      removalDate: new Date().toISOString().split('T')[0],
      events: [],
      positionHistory: [],
      ...existing
    });
  };

  const handleStartRotation = () => {
    const existing = tires.find(t => t.position === editingTirePos);
    if (existing) {
      setRotationSource({ pos: editingTirePos!, tire: existing });
      setEditingTirePos(null);
    }
  };

  const executeRotation = () => {
    if (!rotationSource || !rotationTargetPos) return;
    
    const targetPos = rotationTargetPos;
    const rotKm = Number(rotationDetails.km);
    const rotDate = rotationDetails.date;

    const targetHasTire = tires.find(t => t.position === targetPos);
    
    if (targetHasTire) {
      if (!confirm(`A posição ${targetPos} já possui um pneu (${targetHasTire.brand}). Deseja realizar a troca (rodízio entre ambos) no KM ${rotKm.toLocaleString()}?`)) {
        return;
      }
      
      setTires(prev => {
        const otherTires = prev.filter(t => t.position !== rotationSource.pos && t.position !== targetPos);
        
        // Pneu que estava na origem indo para o destino
        const sourceTireUpdated = { ...rotationSource.tire };
        const sourceHistory = [...(sourceTireUpdated.positionHistory || [])];
        if (sourceHistory.length > 0) sourceHistory[sourceHistory.length - 1].endKm = rotKm;
        sourceHistory.push({ position: targetPos, startKm: rotKm, date: rotDate });
        sourceTireUpdated.position = targetPos;
        sourceTireUpdated.positionHistory = sourceHistory;

        // Pneu que estava no destino indo para a origem
        const targetTireUpdated = { ...targetHasTire };
        const targetHistory = [...(targetTireUpdated.positionHistory || [])];
        if (targetHistory.length > 0) targetHistory[targetHistory.length - 1].endKm = rotKm;
        targetHistory.push({ position: rotationSource.pos, startKm: rotKm, date: rotDate });
        targetTireUpdated.position = rotationSource.pos;
        targetTireUpdated.positionHistory = targetHistory;

        return [...otherTires, sourceTireUpdated, targetTireUpdated];
      });
    } else {
      setTires(prev => {
        const otherTires = prev.filter(t => t.position !== rotationSource.pos);
        
        const movedTire = { ...rotationSource.tire };
        const history = [...(movedTire.positionHistory || [])];
        if (history.length > 0) history[history.length - 1].endKm = rotKm;
        history.push({ position: targetPos, startKm: rotKm, date: rotDate });
        
        movedTire.position = targetPos;
        movedTire.positionHistory = history;
        
        return [...otherTires, movedTire];
      });
    }

    setRotationSource(null);
    setRotationTargetPos(null);
  };

  const handleSaveTire = () => {
    const currentPos = editingTirePos;
    if (!currentPos) return;

    const brand = tireForm.brand?.trim();
    const code = tireForm.tireCode?.trim();

    if (!brand || !code) {
      alert("Atenção: A 'Marca' e o 'Código do Pneu' são obrigatórios.");
      return;
    }

    setTires(prev => {
      const others = prev.filter(t => t.position !== currentPos);
      const isNew = !prev.find(t => t.position === currentPos);
      
      let finalHistory = [...(tireForm.positionHistory || [])];
      if (isNew && finalHistory.length === 0) {
        finalHistory = [{ 
          position: currentPos, 
          startKm: Number(tireForm.installationKm || 0), 
          date: tireForm.date || new Date().toISOString().split('T')[0] 
        }];
      }

      const newTire: TireRecord = {
        ...tireForm,
        id: tireForm.id || Date.now().toString(),
        position: currentPos,
        brand: brand,
        tireCode: code,
        condition: tireForm.condition || 'novo',
        installationKm: Number(tireForm.installationKm || 0),
        date: tireForm.date || new Date().toISOString().split('T')[0],
        events: tireForm.events || [],
        positionHistory: finalHistory
      } as TireRecord;
      return [...others, newTire];
    });

    setEditingTirePos(null);
  };

  const addEvent = () => {
    if (!newEvent.description) return;
    const event: TireEvent = {
      id: Date.now().toString(),
      date: newEvent.date || new Date().toISOString().split('T')[0],
      km: Number(newEvent.km || 0),
      description: newEvent.description
    };
    setTireForm(prev => ({
      ...prev,
      events: [...(prev.events || []), event]
    }));
    setNewEvent({
      date: new Date().toISOString().split('T')[0],
      km: currentKm,
      description: ''
    });
  };

  const removeEvent = (id: string) => {
    setTireForm(prev => ({
      ...prev,
      events: (prev.events || []).filter(e => e.id !== id)
    }));
  };

  const updateFilter = (key: keyof MaintenanceFilters, km: number, date: string) => {
    if (key === 'others') return;
    setFilters(prev => {
      const current = prev[key] as MaintenanceRecord;
      const newHistory: MaintenanceHistoryItem[] = [...(current.history || [])];
      if (current.installKm > 0) {
        newHistory.unshift({ date: current.installDate, km: current.installKm });
      }
      return {
        ...prev,
        [key]: { installKm: km, installDate: date, history: newHistory }
      };
    });
  };

  const executeRetire = () => {
    const posToRemove = editingTirePos;
    if (!posToRemove) return;
    
    const removalKmVal = Number(tireForm.removalKm) || currentKm;
    const mileage = calculateTireMileage(tireForm as TireRecord, currentKm, removalKmVal);

    // Fecha o histórico da última posição antes de retirar
    const updatedPosHistory = [...(tireForm.positionHistory || [])];
    if (updatedPosHistory.length > 0) {
      updatedPosHistory[updatedPosHistory.length - 1].endKm = removalKmVal;
    }

    const retiredRecord: RetiredTireRecord = {
      ...tireForm as TireRecord,
      position: posToRemove,
      totalKmRan: mileage,
      durationMonths: 0,
      durationDays: 0,
      retiredAt: tireForm.removalDate || new Date().toISOString().split('T')[0],
      sentToRetread: sentToRetread,
      positionHistory: updatedPosHistory,
      events: [...(tireForm.events || [])]
    };
    setRetiredTires(prev => [retiredRecord, ...prev]);
    setTires(prev => prev.filter(t => t.position !== posToRemove));
    setEditingTirePos(null);
    setIsConfirmingRetire(false);
  };

  const cavalinhoLayout = [
    { label: "Eixo Dianteiro", type: 'single', positions: ["LE Diant", "LD Diant"] },
    { label: "Tração", type: 'double', positions: ["Tração LE Fora", "Tração LE Dentro", "Tração LD Dentro", "Tração LD Fora"] },
    { label: "Truck", type: 'double', positions: ["Truck LE Fora", "Truck LE Dentro", "Truck LD Dentro", "Truck LD Fora"] },
  ];

  const carretaLayout = [
    { label: "1º Eixo Carreta", type: 'double', positions: ["C1 LE F", "C1 LE D", "C1 LD D", "C1 LD F"] },
    { label: "Eixo do Meio", type: 'double', positions: ["C2 LE F", "C2 LE D", "C2 LD D", "C2 LD F"] },
    { label: "Último Eixo", type: 'double', positions: ["C3 LE F", "C3 LE D", "C3 LD D", "C3 LD F"] },
  ];

  const sparePositions = ["Estepe 1", "Estepe 2"];

  const getConditionLabel = (condition?: string) => {
    switch(condition) {
      case 'novo': return 'PNEU NOVO';
      case 'recapado': return 'PNEU RECAPADO';
      case 'usado': return 'PNEU USADO';
      default: return 'PNEU NOVO';
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex p-1 bg-gray-200 rounded-2xl overflow-x-auto no-print">
        <button type="button" className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all text-xs ${activeTab === 'tires' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('tires')}>Pneus Ativos</button>
        <button type="button" className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all text-xs ${activeTab === 'filters' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('filters')}>Filtros / Óleo</button>
        <button type="button" className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all text-xs ${activeTab === 'retired' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`} onClick={() => setActiveTab('retired')}>Histórico Pneus</button>
      </div>

      {activeTab === 'tires' && (
        <div className="space-y-12 pb-24 no-print relative">
          {rotationSource && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
               <div className="bg-orange-600 text-white p-5 rounded-[2rem] shadow-2xl flex items-center justify-between border-4 border-white">
                  <div className="flex items-center gap-3">
                     <Move size={20} className="animate-pulse" />
                     <p className="text-xs font-bold">Mover pneu de {rotationSource.pos} para...</p>
                  </div>
                  <button onClick={() => setRotationSource(null)} className="p-2 bg-black/10 rounded-full"><X size={18} /></button>
               </div>
            </div>
          )}

          <section className="space-y-6">
             <div className="flex items-center gap-3 px-2 border-b-2 border-gray-200 pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Cavalinho</h3>
             </div>
             {cavalinhoLayout.map((eixo, idx) => (
               <div key={idx} className="space-y-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">{eixo.label}</p>
                 <div className="flex justify-center gap-2 items-center">
                    {eixo.type === 'single' ? (
                      <>
                        <TireButton pos={eixo.positions[0]} tires={tires} onClick={handleOpenTire} isSource={rotationSource?.pos === eixo.positions[0]} isRotating={!!rotationSource} />
                        <div className="w-16 h-1 border-b-2 border-dashed border-gray-300 mx-2"></div>
                        <TireButton pos={eixo.positions[1]} tires={tires} onClick={handleOpenTire} isSource={rotationSource?.pos === eixo.positions[1]} isRotating={!!rotationSource} />
                      </>
                    ) : (
                      <div className="flex items-center w-full justify-between max-w-[320px] mx-auto">
                        <div className="flex gap-1.5">
                           <TireButton pos={eixo.positions[0]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[0]} isRotating={!!rotationSource} />
                           <TireButton pos={eixo.positions[1]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[1]} isRotating={!!rotationSource} />
                        </div>
                        <div className="w-12 h-1 border-b-2 border-gray-300 opacity-20"></div>
                        <div className="flex gap-1.5">
                           <TireButton pos={eixo.positions[2]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[2]} isRotating={!!rotationSource} />
                           <TireButton pos={eixo.positions[3]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[3]} isRotating={!!rotationSource} />
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             ))}
          </section>

          <section className="space-y-8 bg-gray-100/50 p-4 rounded-[3rem] border border-gray-100">
             <div className="flex items-center gap-3 px-2 border-b-2 border-gray-200 pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Carreta</h3>
             </div>
             {carretaLayout.map((eixo, idx) => (
               <div key={idx} className="space-y-2">
                 <p className="text-[10px] font-black text-gray-400 uppercase text-center tracking-widest">{eixo.label}</p>
                 <div className="flex items-center w-full justify-between max-w-[320px] mx-auto">
                    <div className="flex gap-1.5">
                        <TireButton pos={eixo.positions[0]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[0]} isRotating={!!rotationSource} />
                        <TireButton pos={eixo.positions[1]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[1]} isRotating={!!rotationSource} />
                    </div>
                    <div className="w-12 h-1 border-b-2 border-gray-300 opacity-20"></div>
                    <div className="flex gap-1.5">
                        <TireButton pos={eixo.positions[2]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[2]} isRotating={!!rotationSource} />
                        <TireButton pos={eixo.positions[3]} tires={tires} onClick={handleOpenTire} mini isSource={rotationSource?.pos === eixo.positions[3]} isRotating={!!rotationSource} />
                    </div>
                 </div>
               </div>
             ))}

             <div className="pt-8 pb-4 space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase text-center tracking-widest border-t border-gray-200 pt-4">Estepes Disponíveis</p>
                <div className="flex justify-center gap-12">
                   {sparePositions.map(pos => (
                      <div key={pos} className="flex flex-col items-center gap-2">
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{pos}</p>
                         <TireButton 
                           pos={pos} 
                           tires={tires} 
                           onClick={handleOpenTire} 
                           isSpare 
                           isSource={rotationSource?.pos === pos} 
                           isRotating={!!rotationSource} 
                         />
                      </div>
                   ))}
                </div>
             </div>
          </section>
        </div>
      )}

      {activeTab === 'filters' && (
        <div className="space-y-6 pb-24 no-print animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-blue-600 rounded-[2.5rem] p-7 text-white shadow-xl shadow-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2.5 rounded-2xl">
                <Droplets size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight leading-none">Status de Óleos e Filtros</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Gestão de Fluídos</p>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-white/20 pt-4">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Hodômetro Atual</p>
                <p className="text-xl font-black">{currentKm.toLocaleString()} KM</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-70">Saúde da Frota</p>
                <p className="text-sm font-black uppercase">Excelente</p>
              </div>
            </div>
          </div>

          <FilterCard title="Filtro Racor / Diesel" installDate={filters.racorFilter.installDate} installKm={filters.racorFilter.installKm} history={filters.racorFilter.history} alertThreshold={10000} currentKm={currentKm} onSave={(km, date) => updateFilter('racorFilter', km, date)} />
          <FilterCard title="Óleo do Motor / Filtro Óleo" installDate={filters.engineOil.installDate} installKm={filters.engineOil.installKm} history={filters.engineOil.history} alertThreshold={20000} currentKm={currentKm} onSave={(km, date) => updateFilter('engineOil', km, date)} />
          <FilterCard title="Filtro de Ar" installDate={filters.airFilter.installDate} installKm={filters.airFilter.installKm} history={filters.airFilter.history} alertThreshold={40000} currentKm={currentKm} onSave={(km, date) => updateFilter('airFilter', km, date)} />
          <FilterCard title="Óleo Câmbio" installDate={filters.gearboxOil.installDate} installKm={filters.gearboxOil.installKm} history={filters.gearboxOil.history} alertThreshold={80000} currentKm={currentKm} onSave={(km, date) => updateFilter('gearboxOil', km, date)} />
          <FilterCard title="Óleo Diferencial" installDate={filters.diffOil.installDate} installKm={filters.diffOil.installKm} history={filters.diffOil.history} alertThreshold={80000} currentKm={currentKm} onSave={(km, date) => updateFilter('diffOil', km, date)} />
        </div>
      )}

      {activeTab === 'retired' && (
        <div className="space-y-6 pb-20 no-print animate-in fade-in duration-500">
          <div className="flex items-center gap-3 px-2">
            <History size={20} className="text-gray-400" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Ciclo de Vida de Pneus</h3>
          </div>
          
          {retiredTires.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
               <ClipboardList size={40} className="mx-auto text-gray-200 mb-2" />
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Nenhum histórico disponível</p>
            </div>
          ) : (
            retiredTires.map((tire, idx) => (
              <div key={idx} className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 space-y-5 avoid-break">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight">{tire.position}</h4>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                      {tire.brand} • {tire.tireCode}
                    </p>
                    <span className="inline-block mt-2 text-[8px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {getConditionLabel(tire.condition)}
                    </span>
                  </div>
                  <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-100 flex flex-col items-center">
                    <span className="opacity-70 text-[8px] uppercase">Rodados</span>
                    <span className="leading-none mt-1">{tire.totalKmRan.toLocaleString()} KM</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Entrada na Frota</p>
                    <p className="text-[11px] font-bold text-gray-700">{new Date(tire.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="text-[10px] font-black text-gray-400">{tire.installationKm.toLocaleString()} KM</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Retirada Definitiva</p>
                    <p className="text-[11px] font-bold text-gray-700">{new Date(tire.retiredAt + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <p className="text-[10px] font-black text-red-500">{(tire.removalKm || 0).toLocaleString()} KM</p>
                  </div>
                </div>

                {tire.positionHistory && tire.positionHistory.length > 1 && (
                  <div className="bg-gray-50 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-2">
                       <RotateCcw size={14} className="text-orange-500" />
                       <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Percurso do Pneu (Rodízios)</h5>
                    </div>
                    <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-200">
                      {tire.positionHistory.map((seg, sIdx) => {
                        const segmentKm = (seg.endKm || tire.removalKm || 0) - seg.startKm;
                        const isLast = sIdx === tire.positionHistory!.length - 1;
                        const isSpare = seg.position.toLowerCase().includes('estepe');
                        
                        return (
                          <div key={sIdx} className="flex items-start gap-4 relative z-10">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isLast ? 'bg-orange-600 text-white' : 'bg-white text-orange-400 border border-orange-200'}`}>
                               {isLast ? <Flag size={12} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-center">
                                  <p className="text-[11px] font-black text-gray-800 uppercase tracking-tight">{seg.position}</p>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${isSpare ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                                    {isSpare ? 'PAUSADO' : `${segmentKm.toLocaleString()} KM`}
                                  </span>
                               </div>
                               <div className="flex justify-between text-[9px] text-gray-400 font-bold uppercase mt-1">
                                  <span>{new Date(seg.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                  <span>{seg.startKm.toLocaleString()} KM <ArrowRight size={8} className="inline mx-0.5"/> {seg.endKm?.toLocaleString() || 'Atual'}</span>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tire.events && tire.events.length > 0 && (
                  <div className="bg-red-50/50 rounded-3xl p-5 space-y-4 border border-red-50">
                    <div className="flex items-center gap-2">
                       <AlertCircle size={14} className="text-red-500" />
                       <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">Ocorrências Registradas</h5>
                    </div>
                    <div className="space-y-3">
                      {tire.events.map((ev, eIdx) => (
                        <div key={eIdx} className="bg-white p-3 rounded-2xl border border-red-50 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md">{new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                            <span className="text-[10px] font-black text-gray-900">{ev.km.toLocaleString()} KM</span>
                          </div>
                          <p className="text-[11px] font-bold text-gray-700">{ev.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {tire.sentToRetread && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-100 text-green-700">
                    <RefreshCcw size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Enviado para Recapagem</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Detalhes do Pneu Ativo */}
      {editingTirePos && !rotationTargetPos && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 no-print">
          <div className="bg-white w-full max-md:max-w-none max-w-md sm:rounded-[3rem] h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-[2.5rem] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b p-6 bg-white z-10 shrink-0">
              <h3 className="text-xl font-black text-gray-900">{editingTirePos}</h3>
              <button type="button" onClick={() => setEditingTirePos(null)} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
              {!isConfirmingRetire ? (
                <div className="space-y-6">
                    <div className="p-5 bg-blue-50 rounded-[2rem] flex items-center justify-between border border-blue-100">
                       <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">KM Rodado (Histórico)</p>
                          <p className="text-2xl font-black text-gray-900 leading-none mt-1">{calculateTireMileage(tireForm as TireRecord, currentKm).toLocaleString()} KM</p>
                       </div>
                       {editingTirePos.toLowerCase().includes('estepe') && (
                          <div className="bg-white text-orange-600 p-3 rounded-2xl flex flex-col items-center gap-1 shadow-sm border border-orange-100">
                             <Clock size={20} className="animate-pulse" />
                             <span className="text-[8px] font-black uppercase tracking-tighter">KM Pausado</span>
                          </div>
                       )}
                    </div>

                    {/* Novo Seletor de Estado do Pneu */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Estado do Pneu</label>
                       <div className="flex p-1 bg-gray-100 rounded-2xl">
                          <button 
                             onClick={() => setTireForm({...tireForm, condition: 'novo'})}
                             className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${tireForm.condition === 'novo' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                          >Novo</button>
                          <button 
                             onClick={() => setTireForm({...tireForm, condition: 'recapado'})}
                             className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${tireForm.condition === 'recapado' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                          >Recapado</button>
                          <button 
                             onClick={() => setTireForm({...tireForm, condition: 'usado'})}
                             className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${tireForm.condition === 'usado' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}
                          >Usado</button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Marca" value={tireForm.brand || ''} onChange={v => setTireForm({...tireForm, brand: v})} placeholder="Ex: Michelin" />
                      <InputField label="Cód Pneu" value={tireForm.tireCode || ''} onChange={v => setTireForm({...tireForm, tireCode: v})} placeholder="Ex: AX-102" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField label="Data Instalação" type="date" value={tireForm.date || ''} onChange={v => setTireForm({...tireForm, date: v})} />
                      <InputField label="KM Instalação" type="number" value={tireForm.installationKm?.toString() || ''} onChange={v => setTireForm({...tireForm, installationKm: Number(v)})} />
                    </div>
                    <button type="button" onClick={handleStartRotation} className="w-full py-4 bg-orange-50 text-orange-700 border border-orange-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                       <Move size={18} /> Iniciar Rodízio / Trocar Eixo
                    </button>
                    <div className="p-5 bg-orange-50/30 rounded-3xl border border-orange-100 space-y-4">
                      <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest flex items-center gap-2"><AlertCircle size={14}/> Ocorrências (Furos/Reparos)</h4>
                      
                      <div className="bg-white p-4 rounded-2xl border border-orange-100 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <InputField label="Data" type="date" value={newEvent.date || ''} onChange={v => setNewEvent({...newEvent, date: v})} />
                          <InputField label="KM" type="number" value={newEvent.km?.toString() || ''} onChange={v => setNewEvent({...newEvent, km: Number(v)})} />
                        </div>
                        <div className="flex gap-2">
                          <input type="text" className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3.5 outline-none font-bold text-black text-xs placeholder:text-gray-300" placeholder="Ex: Conserto furo..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                          <button type="button" onClick={addEvent} disabled={!newEvent.description} className="bg-orange-600 text-white p-3.5 rounded-xl disabled:opacity-50 active:scale-90 transition-all"><Plus size={20} /></button>
                        </div>
                      </div>

                      {tireForm.events && tireForm.events.length > 0 && (
                        <div className="space-y-2 mt-4">
                           {tireForm.events.map(ev => (
                             <div key={ev.id} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-orange-50">
                                <div className="flex-1">
                                   <div className="flex gap-2 text-[8px] font-black text-gray-400 uppercase"><span>{new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span><span>{ev.km.toLocaleString()} KM</span></div>
                                   <p className="text-[11px] font-bold text-gray-800">{ev.description}</p>
                                </div>
                                <button type="button" onClick={() => removeEvent(ev.id)} className="text-gray-300 p-2 hover:text-red-500 active:scale-90 transition-all"><Trash2 size={16} /></button>
                             </div>
                           ))}
                        </div>
                      )}
                    </div>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <h4 className="text-xl font-bold text-gray-900 text-center">Finalizar Uso do Pneu</h4>
                  <p className="text-sm text-gray-500 text-center px-4">Informe os dados reais de retirada para fechar o histórico de quilometragem.</p>
                  
                  <div className="grid grid-cols-2 gap-4 px-2">
                    <InputField label="Data Retirada" type="date" value={tireForm.removalDate || ''} onChange={v => setTireForm({...tireForm, removalDate: v})} />
                    <InputField label="KM Retirada" type="number" value={tireForm.removalKm?.toString() || ''} onChange={v => setTireForm({...tireForm, removalKm: Number(v)})} />
                  </div>

                  <div onClick={() => setSentToRetread(!sentToRetread)} className={`flex items-center gap-4 p-5 rounded-2xl border-2 mx-2 transition-all cursor-pointer ${sentToRetread ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sentToRetread ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}><RefreshCcw size={22} /></div>
                    <p className={`font-black uppercase text-[11px] ${sentToRetread ? 'text-orange-700' : 'text-gray-600'}`}>Enviar para Recapagem</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex flex-col gap-3 shrink-0">
              {!isConfirmingRetire ? (
                <>
                  <button type="button" onClick={handleSaveTire} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={20}/> Salvar Pneu</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setEditingTirePos(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl active:scale-95">Voltar</button>
                    <button type="button" onClick={() => setIsConfirmingRetire(true)} className="flex-1 py-4 bg-red-50 text-red-600 font-bold rounded-2xl active:scale-95">Retirar</button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={executeRetire} className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">CONFIRMAR RETIRADA</button>
                  <button type="button" onClick={() => setIsConfirmingRetire(false)} className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95">CANCELAR</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Rodízio com Data e KM */}
      {rotationTargetPos && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
               <div>
                  <h4 className="text-xl font-black text-gray-900 leading-tight">Confirmar Rodízio</h4>
                  <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Origem: {rotationSource?.pos} → Destino: {rotationTargetPos}</p>
               </div>
               <button onClick={() => setRotationTargetPos(null)} className="p-2 bg-gray-100 rounded-full text-gray-400 active:scale-90"><X size={18} /></button>
            </div>
            
            <p className="text-xs text-gray-500 font-medium">Informe a data e o hodômetro exato do momento da troca para manter o cálculo preciso.</p>
            
            <div className="space-y-4">
               <div className="grid grid-cols-1 gap-4">
                  <InputField 
                    label="Data da Troca" 
                    type="date" 
                    value={rotationDetails.date} 
                    onChange={v => setRotationDetails({...rotationDetails, date: v})} 
                  />
                  <InputField 
                    label="KM da Troca" 
                    type="number" 
                    value={rotationDetails.km.toString()} 
                    onChange={v => setRotationDetails({...rotationDetails, km: Number(v)})} 
                    placeholder="Ex: 90000"
                  />
               </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
               <button 
                 onClick={executeRotation} 
                 className="w-full py-5 bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-100 active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
               >
                 <CheckCircle2 size={18} /> Confirmar Troca de Eixo
               </button>
               <button 
                 onClick={() => setRotationTargetPos(null)} 
                 className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 uppercase text-[10px] tracking-widest"
               >
                 Cancelar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TireButton: React.FC<{ 
  pos: string; 
  tires: any[]; 
  onClick: (p: string) => void; 
  mini?: boolean; 
  isSource?: boolean; 
  isRotating?: boolean; 
  isSpare?: boolean;
}> = ({ pos, tires, onClick, mini, isSource, isRotating, isSpare }) => {
  const tire = tires.find(t => t.position === pos);
  
  const containerClasses = isSpare 
    ? `rounded-full flex flex-col items-center justify-center transition-all active:scale-90 border-4 w-24 h-24 p-3`
    : `rounded-2xl flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${mini ? 'w-14 h-24 p-1' : 'w-20 h-28 p-2'}`;

  const stateClasses = isSource 
    ? 'border-orange-600 bg-orange-50 ring-4 ring-orange-200 scale-105 z-10' 
    : isRotating 
      ? 'border-orange-300 bg-white animate-pulse' 
      : tire 
        ? 'border-blue-500 bg-blue-50 shadow-md' 
        : 'border-dashed border-gray-300 shadow-none bg-white';

  return (
    <button type="button" onClick={() => onClick(pos)} className={`${containerClasses} ${stateClasses}`}>
       <div className={`flex items-center justify-center mb-1 ${isSpare ? 'rounded-full w-12 h-12 border-2' : `rounded-md border-2 ${mini ? 'w-8 h-12' : 'w-10 h-14'}`} ${isSource ? 'border-orange-600 bg-orange-600/10' : tire ? 'border-blue-600 bg-blue-600/10' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`${isSpare ? 'rounded-full w-8 h-8' : `rounded-sm ${mini ? 'w-5 h-8' : 'w-7 h-10'}`} ${isSource ? 'bg-orange-600 shadow-md' : tire ? 'bg-blue-600 shadow-md' : 'bg-gray-300'}`}></div>
       </div>
       {!isSpare && <span className={`font-black uppercase text-center leading-none mt-1 ${mini ? 'text-[8px]' : 'text-[10px]'} ${isSource ? 'text-orange-700' : tire ? 'text-blue-700' : 'text-gray-400'}`}>{pos}</span>}
    </button>
  );
};

const InputField: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-[10px] font-extrabold text-gray-400 uppercase ml-2 tracking-widest">{label}</label>
    <input type={type} className="bg-gray-100/80 border-none rounded-2xl px-4 py-4 outline-none font-bold text-black focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-300 w-full" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
  </div>
);

const FilterCard: React.FC<{ 
  title: string; 
  installDate: string; 
  installKm: number; 
  history?: MaintenanceHistoryItem[]; 
  alertThreshold?: number; 
  currentKm: number; 
  onSave: (km: number, date: string) => void; 
}> = ({ title, installDate, installKm, history = [], alertThreshold, currentKm, onSave }) => {
  const [localKm, setLocalKm] = useState(installKm);
  const [localDate, setLocalDate] = useState(installDate);
  const [isSaved, setIsSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { 
    setLocalKm(installKm); 
    setLocalDate(installDate); 
  }, [installKm, installDate]);

  const handleSave = () => { 
    onSave(localKm, localDate); 
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const usedKm = currentKm > installKm ? currentKm - installKm : 0;
  const isAlert = alertThreshold ? usedKm >= alertThreshold : false;
  const progressPercent = alertThreshold ? Math.min((usedKm / alertThreshold) * 100, 100) : 0;

  return (
    <div className={`rounded-[2.5rem] p-7 shadow-sm border transition-all avoid-break ${isAlert ? 'bg-red-50 border-red-200 ring-2 ring-red-100/50' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-black text-gray-900 leading-tight">{title}</h4>
          {isAlert && <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 animate-pulse">Troca Obrigatória!</p>}
        </div>
        {alertThreshold && (
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${isAlert ? 'bg-red-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
            LIMITE: {alertThreshold.toLocaleString()} KM
          </span>
        )}
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
          <span>USO: {usedKm.toLocaleString()} KM</span>
          <span>PRÓXIMA TROCA: {alertThreshold ? (installKm + alertThreshold).toLocaleString() : '---'} KM</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${isAlert ? 'bg-red-600' : 'bg-blue-600'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-gray-400 uppercase ml-2 tracking-widest">DATA ÚLT. TROCA</label>
          <input 
            type="date" 
            value={localDate} 
            onChange={e => setLocalDate(e.target.value)} 
            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-extrabold text-gray-400 uppercase ml-2 tracking-widest">KM ÚLT. TROCA</label>
          <input 
            type="number" 
            value={localKm || ''} 
            onChange={e => setLocalKm(Number(e.target.value))} 
            className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold outline-none" 
            placeholder="Ex: 120500" 
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button 
          onClick={handleSave} 
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
        >
          {isSaved ? <CheckCircle2 size={16}/> : <Save size={16}/>}
          {isSaved ? 'REGISTRO SALVO' : 'SALVAR NOVA TROCA'}
        </button>
        <button 
          onClick={() => setShowHistory(true)}
          className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
        >
          <Clock size={14} /> VER HISTÓRICO DE REGISTROS
        </button>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-black text-gray-900 leading-tight">{title}</h4>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Histórico de Trocas</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-gray-100 rounded-full text-gray-400 active:scale-90"><X size={18} /></button>
            </div>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Registro Atual</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-700">{installDate ? new Date(installDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</span>
                  <span className="text-sm font-black text-blue-700">{installKm.toLocaleString()} KM</span>
                </div>
              </div>

              {history.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Anteriores</p>
                  {history.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-xs font-bold text-gray-600">{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <span className="text-xs font-black text-gray-900">{item.km.toLocaleString()} KM</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-300 font-bold uppercase text-[10px] tracking-widest">Sem registros anteriores</p>
              )}
            </div>
            
            <button onClick={() => setShowHistory(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceView;
