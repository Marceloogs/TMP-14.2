
import React, { useState, useMemo } from 'react';
import { Trip, User, MiscExpense, TireRecord, DieselRecord } from '../types';
import { 
  Printer, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  ArrowRightLeft, 
  Fuel, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Wallet, 
  Gauge, 
  Calendar,
  Truck,
  Receipt,
  Flag,
  MapPin,
  Download,
  FileText,
  Activity,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Navigation2,
  HandCoins,
  Percent,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';

interface ReportsViewProps {
  trips: Trip[];
  miscExpenses: MiscExpense[];
  user: User;
}

type Period = 'Weekly' | 'Monthly' | 'Yearly' | 'All';

const ReportsView: React.FC<ReportsViewProps> = ({ trips, miscExpenses, user }) => {
  const [period, setPeriod] = useState<Period>('Monthly');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const filteredTrips = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filtered = [...trips].filter(t => t.status === 'completed');

    if (period !== 'All') {
      if (period === 'Weekly') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(t => new Date(t.outbound.date + 'T12:00:00') >= lastWeek);
      } else if (period === 'Monthly') {
        filtered = filtered.filter(t => {
          const d = new Date(t.outbound.date + 'T12:00:00');
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
      } else if (period === 'Yearly') {
        filtered = filtered.filter(t => {
          const d = new Date(t.outbound.date + 'T12:00:00');
          return d.getFullYear() === currentYear;
        });
      }
    }

    return filtered.sort((a, b) => new Date(b.outbound.date).getTime() - new Date(a.outbound.date).getTime());
  }, [trips, period]);

  const handlePrint = () => window.print();

  return (
    <div className="p-4 space-y-6 pb-28 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 no-print">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Relatórios Detalhados</h2>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="bg-gray-100 text-gray-600 p-3 rounded-2xl active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              <span className="text-[10px] font-black uppercase">PDF</span>
            </button>
            <button 
              onClick={handlePrint}
              className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all flex items-center gap-2"
            >
              <Printer size={18} />
              <span className="text-[10px] font-black uppercase">Imprimir</span>
            </button>
          </div>
        </div>

        <div className="flex bg-gray-200 p-1 rounded-2xl">
          {(['Weekly', 'Monthly', 'Yearly', 'All'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {p === 'Weekly' ? 'Semana' : p === 'Monthly' ? 'Mês' : p === 'Yearly' ? 'Ano' : 'Tudo'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 no-print">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold text-sm">Nenhuma viagem finalizada no período.</p>
          </div>
        ) : (
          filteredTrips.map(trip => (
            <TripReportCard 
              key={trip.id} 
              trip={trip} 
              allMiscExpenses={miscExpenses}
              isExpanded={expandedTripId === trip.id}
              onToggle={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)}
              allTrips={trips}
            />
          ))
        )}
      </div>

      {/* Container de Impressão (Folha A4) */}
      <div className="hidden print:block bg-white text-black font-sans w-full">
        {filteredTrips.map((trip, index) => (
          <div key={trip.id} className={`${index > 0 ? 'page-break mt-12 pt-8 border-t-2 border-dashed border-gray-300' : ''} w-full`}>
             <PrintTripDetail trip={trip} allMiscExpenses={miscExpenses} allTrips={trips} />
          </div>
        ))}
      </div>
    </div>
  );
};

const TripReportCard: React.FC<{ trip: Trip; allMiscExpenses: MiscExpense[]; isExpanded: boolean; onToggle: () => void; allTrips: Trip[] }> = ({ trip, allMiscExpenses, isExpanded, onToggle, allTrips }) => {
  const calculations = useMemo(() => calculateTripData(trip, allMiscExpenses), [trip, allMiscExpenses]);
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const segments = useMemo(() => calculateSegments(trip, allTrips), [trip, allTrips]);

  const tireOccurrences = useMemo(() => {
    const savedTires: TireRecord[] = JSON.parse(localStorage.getItem('truck_tires') || '[]');
    const startDate = new Date(trip.outbound.date + 'T00:00:00');
    const endDate = trip.endDate ? new Date(trip.endDate + 'T23:59:59') : new Date();
    
    return savedTires.flatMap(t => (t.events || []).filter(ev => {
      const evDate = new Date(ev.date + 'T12:00:00');
      return evDate >= startDate && evDate <= endDate;
    }).map(ev => ({ ...ev, tirePos: t.position, tireBrand: t.brand })));
  }, [trip]);

  return (
    <div className={`bg-white rounded-[2.5rem] border overflow-hidden transition-all avoid-break ${isExpanded ? 'shadow-xl border-blue-200' : 'shadow-sm border-gray-100'}`}>
      <div onClick={onToggle} className="p-6 cursor-pointer flex justify-between items-center active:bg-gray-50">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl shadow-lg shadow-blue-100 ${isExpanded ? 'bg-blue-600 text-white' : 'bg-gray-50 text-blue-600'}`}>
            <Truck size={22} />
          </div>
          <div>
            <h4 className="font-black text-gray-900 leading-tight truncate max-w-[160px]">{trip.outbound.company || 'Empresa não informada'}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(trip.outbound.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-md">Finalizada</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-black text-gray-900">{formatCurrency(calculations.totalFreight)}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Fretes</p>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-300" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-4 duration-300">
          
          {/* Acerto de Contas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <HandCoins size={18} className="text-orange-600" />
              <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Acerto de Contas (Viagem)</h5>
            </div>
            
            <div className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm space-y-8">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none">Adiantamentos Totais</p>
                   <p className="text-xl font-black text-gray-900 leading-none mt-2">{formatCurrency(calculations.totalAdvances)}</p>
                 </div>
                 <div className="text-right space-y-1">
                   <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none">Total Gasto (Diesel+Desp)</p>
                   <p className="text-xl font-black text-red-500 leading-none mt-2">{formatCurrency(calculations.totalDieselCost + calculations.totalExpenses)}</p>
                 </div>
              </div>
              
              <div className="bg-gray-50/50 rounded-3xl p-6 flex flex-col items-center justify-center border border-gray-100 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Saldo em Mãos</p>
                 <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-2">(Adiantamentos - Gastos)</p>
                 <span className="text-4xl font-black text-gray-900">
                   {formatCurrency(calculations.settlementResult)}
                 </span>
                 <div className="mt-5 flex items-center gap-2 px-4">
                    <AlertCircle size={14} className="text-orange-600 shrink-0"/>
                    <p className="text-[9px] font-black text-gray-500 uppercase leading-tight">
                      * O motorista deve devolver ou prestar contas de {formatCurrency(Math.abs(calculations.settlementResult))}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          {/* Performance por Trecho */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Navigation2 size={18} className="text-blue-600" />
              <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Performance por Trecho (Posto a Posto)</h5>
            </div>
            <div className="space-y-4">
              {segments.length === 0 ? (
                <p className="text-center py-8 text-gray-300 font-bold uppercase text-[10px] tracking-widest bg-gray-50 rounded-3xl">Nenhum trecho registrado</p>
              ) : (
                segments.map((seg, idx) => (
                  <div key={idx} className="bg-gray-50/30 rounded-[2.5rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Trecho Percorrido</p>
                       {seg.isInefficient && (
                          <span className="text-[8px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">Ineficiente</span>
                       )}
                    </div>
                    <p className="text-sm font-black text-gray-800 mb-5 leading-tight">{seg.label}</p>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Real</p>
                          <p className="text-xs font-black text-gray-900">{seg.real.toFixed(1)}L</p>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                          <p className="text-[8px] font-black text-gray-400 uppercase mb-2">Meta</p>
                          <p className="text-xs font-black text-gray-500">{seg.meta > 0 ? `${seg.meta.toFixed(1)}L` : '---'}</p>
                       </div>
                       <div className="bg-white p-4 rounded-2xl border border-gray-100 text-center shadow-sm">
                          <p className={`text-[8px] font-black uppercase mb-2 ${seg.desvio > 0 ? 'text-red-600' : 'text-green-600'}`}>Desvio</p>
                          <p className={`text-xs font-black ${seg.desvio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {seg.meta > 0 ? `${seg.desvio > 0 ? '+' : ''}${seg.desvio.toFixed(1)}L` : '0.0L'}
                          </p>
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Trajetos */}
          <div className="space-y-4">
            <div className="bg-gray-50/30 rounded-[2.5rem] p-7 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md"><Package size={16} /></div>
                <h6 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Trajeto Ida</h6>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Empresa Carregamento</p>
                   <p className="text-base font-black text-gray-800">{trip.outbound.company || '---'}</p>
                 </div>
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Data Carregamento</p>
                   <p className="text-sm font-black text-gray-800">{new Date(trip.outbound.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                 </div>
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Destino</p>
                   <p className="text-sm font-black text-gray-800 leading-tight">{trip.outbound.destinations || '---'}</p>
                 </div>
              </div>
            </div>

            <div className="bg-gray-50/30 rounded-[2.5rem] p-7 border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-600 text-white rounded-xl shadow-md"><ArrowRightLeft size={16} /></div>
                <h6 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Trajeto Volta</h6>
              </div>
              <div className="space-y-4">
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Empresa Carregamento</p>
                   <p className="text-base font-black text-gray-800">{trip.inbound.company || '---'}</p>
                 </div>
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Data Carregamento</p>
                   <p className="text-sm font-black text-gray-800">{trip.inbound.company ? new Date(trip.inbound.date + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</p>
                 </div>
                 <div className="grid grid-cols-1">
                   <p className="text-[9px] font-black text-gray-400 uppercase">Destino</p>
                   <p className="text-sm font-black text-gray-800 leading-tight">{trip.inbound.destinations || '---'}</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Desempenho */}
          <div className="space-y-4">
            <div className="bg-gray-50/30 rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
               <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-4">
                  <Gauge size={18} className="text-blue-600" />
                  <h6 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Desempenho da Viagem</h6>
               </div>
               <div className="grid grid-cols-2 gap-y-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none">KM Percorrido</p>
                    <p className="text-lg font-black text-gray-900">{calculations.totalKm.toLocaleString()} KM</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Consumo Médio</p>
                    <p className="text-lg font-black text-blue-600">{calculations.avgKmL} KM/L</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Diesel Total</p>
                    <p className="text-lg font-black text-gray-900">{calculations.totalLitersDiesel} L</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase leading-none">Arla Total</p>
                    <p className="text-lg font-black text-gray-900">{calculations.totalLitersArla} L</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Resultado Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Calculator size={18} className="text-blue-600" />
              <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Resultado Empresa</h5>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500">Valor Total Frete (Ida + Volta)</span>
                   <span className="text-base font-black text-gray-900">{formatCurrency(calculations.totalFreight)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500">Comissão Motorista (13%)</span>
                   <span className="text-base font-black text-red-500">- {formatCurrency(calculations.commission)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500">Total Diesel / Arla</span>
                   <span className="text-base font-black text-red-500">- {formatCurrency(calculations.totalDieselCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm font-bold text-gray-500">Total Despesas Diversas</span>
                   <span className="text-base font-black text-red-500">- {formatCurrency(calculations.totalExpenses)}</span>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                 <span className="text-sm font-black uppercase tracking-widest text-gray-400">Resultado Líquido</span>
                 <span className="text-3xl font-black text-green-600">{formatCurrency(calculations.netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para Impressão (Sincronizado com Layout de Tela)
const PrintTripDetail: React.FC<{ trip: Trip; allMiscExpenses: MiscExpense[]; allTrips: Trip[] }> = ({ trip, allMiscExpenses, allTrips }) => {
  const calcs = calculateTripData(trip, allMiscExpenses);
  const segments = calculateSegments(trip, allTrips);
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="p-8 bg-white text-black w-full min-h-screen">
      {/* Cabeçalho Impressão */}
      <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="bg-black text-white p-2 rounded-lg"><Truck size={24} /></div>
             <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Relatório de Gestão Frota</h1>
           </div>
           <p className="text-sm font-black text-gray-600 uppercase">Viagem: {trip.outbound.company}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black uppercase text-gray-400">Emissão em {new Date().toLocaleDateString('pt-BR')}</p>
           <p className="text-lg font-black">{trip.endDate ? new Date(trip.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : '---'}</p>
           <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-md uppercase tracking-widest">FINALIZADA</span>
        </div>
      </div>

      <div className="space-y-10">
        
        {/* Acerto de Contas (IGUAL À TELA) */}
        <section className="space-y-4 avoid-break">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] border-l-4 border-orange-600 pl-3">Acerto de Contas (Viagem)</h2>
          <div className="border-2 border-gray-100 rounded-[2.5rem] p-8 space-y-8 bg-gray-50/20">
            <div className="grid grid-cols-2 gap-8">
               <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Adiantamentos Totais</p>
                  <p className="text-2xl font-black text-gray-900 mt-2">{formatCurrency(calcs.totalAdvances)}</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Total Gasto (Diesel+Desp)</p>
                  <p className="text-2xl font-black text-red-600 mt-2">{formatCurrency(calcs.totalDieselCost + calcs.totalExpenses)}</p>
               </div>
            </div>
            
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center border border-gray-100 text-center shadow-sm">
               <p className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-400 leading-none mb-2">Saldo em Mãos</p>
               <span className="text-5xl font-black text-black">
                 {formatCurrency(calcs.settlementResult)}
               </span>
               <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 w-full justify-center">
                  <AlertCircle size={18} className="text-orange-600 shrink-0"/>
                  <p className="text-[11px] font-black text-gray-600 uppercase leading-tight tracking-tight">
                    * O motorista deve devolver ou prestar contas de {formatCurrency(Math.abs(calcs.settlementResult))}
                  </p>
               </div>
            </div>
          </div>
        </section>

        {/* Performance por Trecho (IGUAL À TELA) */}
        <section className="space-y-4 avoid-break">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-3">Performance por Trecho (Posto a Posto)</h2>
          <div className="grid grid-cols-1 gap-4">
             {segments.map((seg, idx) => (
               <div key={idx} className="bg-gray-50 border border-gray-200 rounded-[2rem] p-6 avoid-break">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-black text-black">{seg.label}</p>
                    {seg.isInefficient && (
                       <span className="text-[9px] font-black bg-red-600 text-white px-3 py-1 rounded-md uppercase tracking-widest">INEFICIENTE</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                     <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Real</p>
                        <p className="text-sm font-black">{seg.real.toFixed(1)}L</p>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Meta</p>
                        <p className="text-sm font-black text-gray-500">{seg.meta > 0 ? `${seg.meta.toFixed(1)}L` : '---'}</p>
                     </div>
                     <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                        <p className={`text-[8px] font-black uppercase mb-1 ${seg.desvio > 0 ? 'text-red-600' : 'text-green-600'}`}>Desvio</p>
                        <p className={`text-sm font-black ${seg.desvio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {seg.meta > 0 ? `${seg.desvio > 0 ? '+' : ''}${seg.desvio.toFixed(1)}L` : '0.0L'}
                        </p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </section>

        {/* Resultado Empresa (IGUAL À TELA) */}
        <section className="space-y-4 avoid-break">
          <h2 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] border-l-4 border-green-600 pl-3">Resultado Empresa</h2>
          <div className="bg-black text-white rounded-[2.5rem] p-10 space-y-8 shadow-xl">
             <div className="grid grid-cols-1 gap-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                   <span className="text-sm font-bold opacity-60">Faturamento Total Bruto</span>
                   <span className="text-lg font-black">{formatCurrency(calcs.totalFreight)}</span>
                </div>
                <div className="flex justify-between items-center opacity-70">
                   <span className="text-sm font-medium">Comissão do Motorista (13%)</span>
                   <span className="text-lg font-bold">- {formatCurrency(calcs.commission)}</span>
                </div>
                <div className="flex justify-between items-center opacity-70">
                   <span className="text-sm font-medium">Combustível e Arla</span>
                   <span className="text-lg font-bold">- {formatCurrency(calcs.totalDieselCost)}</span>
                </div>
                <div className="flex justify-between items-center opacity-70">
                   <span className="text-sm font-medium">Despesas Operacionais Diversas</span>
                   <span className="text-lg font-bold">- {formatCurrency(calcs.totalExpenses)}</span>
                </div>
             </div>
             
             <div className="pt-8 border-t-2 border-white/20 flex justify-between items-center">
                <span className="text-base font-black uppercase tracking-[0.3em] opacity-40">Resultado Líquido</span>
                <span className="text-4xl font-black text-green-400">{formatCurrency(calcs.netProfit)}</span>
             </div>
          </div>
        </section>

        {/* Desempenho e Dados (Consumo) */}
        <section className="grid grid-cols-4 gap-4 pt-10 avoid-break">
           <div className="bg-gray-100 p-6 rounded-3xl text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">KM Rodado</p>
              <p className="text-base font-black">{calcs.totalKm.toLocaleString()} KM</p>
           </div>
           <div className="bg-gray-100 p-6 rounded-3xl text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Média</p>
              <p className="text-base font-black text-blue-600">{calcs.avgKmL} KM/L</p>
           </div>
           <div className="bg-gray-100 p-6 rounded-3xl text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Diesel</p>
              <p className="text-base font-black">{calcs.totalLitersDiesel} L</p>
           </div>
           <div className="bg-gray-100 p-6 rounded-3xl text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Arla</p>
              <p className="text-base font-black">{calcs.totalLitersArla} L</p>
           </div>
        </section>

      </div>
      
      {/* Rodapé Impressão */}
      <div className="mt-20 pt-8 border-t-2 border-black flex justify-between items-center opacity-30 text-[10px] font-black uppercase tracking-widest">
         <span>Becker e Mendonça Transportes</span>
         <span>TruckManager Pro v2.5</span>
         <span>Folha de Controle Analítico de Operação</span>
      </div>
    </div>
  );
};

// Funções auxiliares extraídas para reuso entre tela e impressão
const calculateSegments = (trip: Trip, allTrips: Trip[]) => {
  if (!trip.diesel || trip.diesel.length === 0) return [];
  
  const result = [];
  let prevStation = "Início da Viagem";
  
  const completedHistoricalTrips = allTrips.filter(t => t.status === 'completed' && t.plate === trip.plate && t.id !== trip.id);

  for (const entry of trip.diesel) {
    const startPoint = prevStation;
    const endPoint = entry.station;
    
    let historicalLitersPerTon: number[] = [];
    completedHistoricalTrips.forEach(ht => {
      if (!ht.diesel) return;
      let hPrevS = "Início da Viagem";
      for (const he of ht.diesel) {
        if (hPrevS === startPoint && he.station === endPoint) {
          const hWeight = (ht.outbound.weightTons || 0) + (ht.inbound.weightTons || 0);
          if (hWeight > 0) historicalLitersPerTon.push(he.litersDiesel / hWeight);
        }
        hPrevS = he.station;
      }
    });

    const currentWeight = (trip.outbound.weightTons || 0) + (trip.inbound.weightTons || 0);
    const real = Number(entry.litersDiesel) || 0;
    
    let meta = 0;
    let desvio = 0;
    let isInefficient = false;

    if (historicalLitersPerTon.length > 0) {
      const avgLitersPerTon = historicalLitersPerTon.reduce((a, b) => a + b, 0) / historicalLitersPerTon.length;
      meta = avgLitersPerTon * currentWeight;
      desvio = real - meta;
      isInefficient = desvio > 1;
    }

    result.push({ label: `${startPoint} → ${endPoint}`, real, meta, desvio, isInefficient });
    prevStation = entry.station;
  }
  return result;
};

const calculateTripData = (trip: Trip, allMiscExpenses: MiscExpense[]) => {
  const totalFreight = (Number(trip.outbound?.value) || 0) + (Number(trip.inbound?.value) || 0);
  const totalTollTag = (Number(trip.outbound?.tollTag) || 0) + (Number(trip.inbound?.tollTag) || 0);
  
  const totalAdvances = (
    (Number(trip.outbound?.advance) || 0) + 
    (Number(trip.outbound?.advanceMaintenance) || 0) + 
    (Number(trip.outbound?.advanceDiesel) || 0) +
    (Number(trip.inbound?.advance) || 0) + 
    (Number(trip.inbound?.advanceMaintenance) || 0) + 
    (Number(trip.inbound?.advanceDiesel) || 0)
  );
  
  const commission = (totalFreight + totalTollTag) * 0.13;
  const totalDieselCost = trip.diesel?.reduce((acc, d) => acc + (Number(d.totalCost) || 0), 0) || 0;
  const totalLitersDiesel = trip.diesel?.reduce((acc, d) => acc + (Number(d.litersDiesel) || 0), 0) || 0;
  const totalLitersArla = trip.diesel?.reduce((acc, d) => acc + (Number(d.litersArla) || 0), 0) || 0;

  const tripFormExpenses = (Number(trip.expenses?.othersValue) || 0);
  const linkedMiscExpenses = trip.miscExpenses || [];
  const totalMiscExpenses = linkedMiscExpenses.reduce((acc, exp) => acc + (Number(exp.value) || 0), 0);
  const totalExpenses = tripFormExpenses + totalMiscExpenses;

  const finalKmValue = Number(trip.endKm) || 0;
  const startKmValue = Number(trip.outbound.startKm) || 0;
  const totalKm = finalKmValue > startKmValue ? finalKmValue - startKmValue : 0;
  const avgKmL = totalLitersDiesel > 0 ? (totalKm / totalLitersDiesel).toFixed(2) : "0.00";

  return {
    totalFreight,
    totalAdvances,
    commission,
    totalDieselCost,
    totalLitersDiesel,
    totalLitersArla,
    totalExpenses,
    totalKm,
    avgKmL,
    netProfit: totalFreight - commission - totalDieselCost - totalExpenses,
    settlementResult: totalAdvances - totalDieselCost - totalExpenses
  };
};

export default ReportsView;
