
import React, { useMemo } from 'react';
import { Trip, User, MaintenanceFilters, MiscExpense, DieselRecord } from '../types';
import {
  TrendingUp,
  Fuel,
  AlertCircle,
  ChevronRight,
  PlusCircle,
  DollarSign,
  BarChart3,
  Truck,
  Receipt,
  AlertTriangle,
  Wallet,
  Wrench,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  User as UserIcon,
  Activity,
  ThumbsDown,
  ThumbsUp,
  MapPin,
  Navigation2,
  PieChart
} from 'lucide-react';

interface DashboardViewProps {
  trips: Trip[];
  user: User;
  filters: MaintenanceFilters;
  onNewTrip: () => void;
  onRegisterDiesel: () => void;
  onManageExpenses: () => void;
  onOpenMaintenance: () => void;
  onViewHistory: () => void;
  miscExpenses: MiscExpense[];
}

const DashboardView: React.FC<DashboardViewProps> = ({
  trips,
  user,
  filters,
  onNewTrip,
  onRegisterDiesel,
  onManageExpenses,
  onOpenMaintenance,
  onViewHistory,
  miscExpenses
}) => {
  const activeTrip = useMemo(() => trips.find(t => t.status === 'active'), [trips]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const currentKm = useMemo(() => {
    const tripsForPlate = trips.filter(t => t.plate === user.plate);
    let kmFromTrips = 0;
    if (tripsForPlate.length > 0) {
      kmFromTrips = Math.max(...tripsForPlate.map(t => {
        const dieselKm = t.diesel && t.diesel.length > 0 ? Math.max(...t.diesel.map(d => d.arrivalKm)) : 0;
        const tripEndKm = t.endKm || 0;
        return Math.max(t.outbound?.startKm || 0, dieselKm, t.inbound?.startKm || 0, tripEndKm);
      }));
    }
    return Math.max(kmFromTrips, user.truckCurrentKm || 0, user.truckInitialKm || 0);
  }, [trips, user.truckCurrentKm, user.truckInitialKm, user.plate]);

  const activeStats = useMemo(() => {
    if (!activeTrip) return { freight: 0, diesel: 0, expenses: 0, net: 0, percentExpenses: 0 };
    const freight = (activeTrip.outbound?.value || 0) + (activeTrip.inbound?.value || 0);
    const diesel = activeTrip.diesel?.reduce((acc, d) => acc + (d.totalCost || 0), 0) || 0;
    const tripFormExpenses = (activeTrip.expenses?.othersValue || 0);
    const tripStartDate = new Date(activeTrip.outbound.date + 'T00:00:00');
    const totalMiscValue = miscExpenses.filter(exp => new Date(exp.date + 'T12:00:00') >= tripStartDate).reduce((acc, exp) => acc + (exp.value || 0), 0);
    const totalCosts = diesel + tripFormExpenses + totalMiscValue;
    const percentExpenses = freight > 0 ? Math.min((totalCosts / freight) * 100, 100) : 0;
    return { freight, diesel, expenses: tripFormExpenses + totalMiscValue, net: freight - totalCosts, percentExpenses };
  }, [activeTrip, miscExpenses]);

  // Status de Manutenção Visual
  const maintenanceStatus = useMemo(() => {
    const items = [
      { name: 'Racor', current: currentKm - filters.racorFilter.installKm, limit: 10000 },
      { name: 'Óleo Motor', current: currentKm - filters.engineOil.installKm, limit: 20000 }
    ];
    return items.map(i => ({
      ...i,
      percent: Math.min((i.current / i.limit) * 100, 100),
      isCritical: i.current >= i.limit
    }));
  }, [filters, currentKm]);

  return (
    <div className="p-4 space-y-6 pb-28 animate-in fade-in duration-500">

      {/* Saudação e KM */}
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
            {user.driverPhoto ? <img src={user.driverPhoto} className="w-full h-full object-cover rounded-2xl" /> : <UserIcon size={24} />}
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-none">Olá, {user.driverName.split(' ')[0]}</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gerecie sua frota</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hodômetro</p>
          <p className="text-base font-black text-blue-600">{currentKm.toLocaleString()} KM</p>
        </div>
      </div>

      {/* Card Principal de Performance Visual */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <PieChart size={120} />
        </div>

        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Activity size={14} className="text-blue-600" /> Resumo da Operação
        </h3>

        {activeTrip ? (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resultado Projetado</p>
                <h4 className={`text-4xl font-black tracking-tighter ${activeStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(activeStats.net)}
                </h4>
              </div>
              <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase ${activeStats.net >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {activeStats.net >= 0 ? 'Lucro' : 'Prejuízo'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Faturamento</p>
                <p className="text-base font-black text-gray-900">{formatCurrency(activeStats.freight)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Custos Totais</p>
                <p className="text-base font-black text-red-500">{formatCurrency(activeStats.diesel + activeStats.expenses)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Eficiência Financeira</span>
                <span className="text-xs font-black text-gray-900">{(100 - activeStats.percentExpenses).toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${100 - activeStats.percentExpenses}%` }}></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
            <PlusCircle size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhuma viagem ativa</p>
            <button onClick={onNewTrip} className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all">Iniciar Viagem</button>
          </div>
        )}
      </div>

      {/* Saúde da Manutenção (Indicadores Circulares ou de Barra) */}
      <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Wrench size={14} className="text-orange-600" /> Saúde da Manutenção
          </h3>
          <button onClick={onOpenMaintenance} className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Oficina <ChevronRight size={12} className="inline" /></button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {maintenanceStatus.map(item => (
            <div key={item.name} className="space-y-3">
              <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                <span>{item.name}</span>
                <span className={item.isCritical ? 'text-red-600' : ''}>{item.percent.toFixed(0)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${item.isCritical ? 'bg-red-600' : 'bg-orange-500'}`} style={{ width: `${item.percent}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={onRegisterDiesel} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all text-center">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Fuel size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-900 leading-none">Diesel</p>
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Abastecer</p>
          </div>
        </button>
        <button onClick={onManageExpenses} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all text-center">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl"><Receipt size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-900 leading-none">Despesas</p>
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Lançar</p>
          </div>
        </button>
        <button onClick={onNewTrip} className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-all text-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Truck size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-gray-900 leading-none">Viagens</p>
            <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-1">Gerenciar</p>
          </div>
        </button>
      </div>

    </div>
  );
};

export default DashboardView;
