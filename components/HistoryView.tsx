
import React, { useState, useMemo } from 'react';
import { Trip, User } from '../types';
import { FileText, Printer, ChevronDown, ChevronUp, MapPin, Fuel, Calculator } from 'lucide-react';

interface HistoryViewProps {
  trips: Trip[];
  user: User;
}

const HistoryView: React.FC<HistoryViewProps> = ({ trips, user }) => {
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Histórico de Viagens</h2>
        <button 
          onClick={handlePrint}
          className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Printer size={22} />
        </button>
      </div>

      <div className="space-y-4">
        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-300">
            <p className="text-gray-400 font-medium">Nenhuma viagem finalizada.</p>
          </div>
        ) : (
          trips.map(trip => (
            <TripSummaryCard 
              key={trip.id} 
              trip={trip} 
              isExpanded={expandedTripId === trip.id} 
              onToggle={() => setExpandedTripId(expandedTripId === trip.id ? null : trip.id)} 
            />
          ))
        )}
      </div>

      {/* Print View Only */}
      <div className="print-only p-10 bg-white">
        <h1 className="text-3xl font-bold mb-4">Relatório de Gestão de Caminhão</h1>
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-gray-500 uppercase font-bold text-xs">Motorista</p>
            <p className="text-xl font-bold">{user.driverName}</p>
          </div>
          <div>
            <p className="text-gray-500 uppercase font-bold text-xs">Placa</p>
            <p className="text-xl font-bold">{user.plate}</p>
          </div>
        </div>
        {/* Simplified table for print */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left">
              <th className="py-2">Data</th>
              <th className="py-2">Trajeto</th>
              <th className="py-2">Total Fretes</th>
              <th className="py-2">Result. Líquido</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(t => (
              <tr key={t.id} className="border-b border-gray-100">
                <td className="py-2">{new Date(t.outbound.date).toLocaleDateString('pt-BR')}</td>
                <td className="py-2">{t.outbound.destinations}</td>
                <td className="py-2">{(t.outbound.value + t.inbound.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="py-2">{(t.outbound.advance + t.inbound.advance - t.diesel.reduce((acc, d) => acc + d.totalCost, 0) - (
                  t.expenses.tireShop + t.expenses.binding + t.expenses.unloading + t.expenses.tip + t.expenses.wash + t.expenses.cashToll + t.expenses.othersValue
                )).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TripSummaryCard: React.FC<{ trip: Trip; isExpanded: boolean; onToggle: () => void }> = ({ trip, isExpanded, onToggle }) => {
  const totalFreight = trip.outbound.value + trip.inbound.value;
  const totalAdvances = trip.outbound.advance + trip.inbound.advance;
  const totalDiesel = trip.diesel.reduce((acc, d) => acc + d.totalCost, 0);
  const totalLitersDiesel = trip.diesel.reduce((acc, d) => acc + d.litersDiesel, 0);
  const totalLitersArla = trip.diesel.reduce((acc, d) => acc + d.litersArla, 0);
  const totalExpenses = (
    trip.expenses.tireShop + trip.expenses.binding + trip.expenses.unloading + 
    trip.expenses.tip + trip.expenses.wash + trip.expenses.cashToll + trip.expenses.othersValue
  );
  
  const tripResult = totalAdvances - totalDiesel - totalExpenses;
  
  // Calculate average KM/L (Simplification using last diesel entry KM - start KM)
  const lastKm = trip.diesel.length > 0 ? trip.diesel[trip.diesel.length - 1].arrivalKm : trip.outbound.startKm;
  const totalKm = lastKm - trip.outbound.startKm;
  const avgKmL = totalLitersDiesel > 0 ? (totalKm / totalLitersDiesel).toFixed(2) : "0.00";

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 transition-all">
      <div 
        onClick={onToggle}
        className="p-6 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white">
            <MapPin size={22} />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{trip.outbound.destinations.split(',')[0]} (Ida/Volta)</h4>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{new Date(trip.outbound.date).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="font-bold text-blue-600">{totalFreight.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Faturamento</p>
          </div>
          {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-8 animate-in slide-in-from-top-2 duration-300 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Resultado Líquido</p>
              <p className={`text-xl font-extrabold ${tripResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tripResult.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
              <p className="text-[9px] text-gray-400 font-medium">Fórmula: Adiantamentos - Diesel - Despesas</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estatísticas</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold text-gray-800">{totalKm} KM Total</p>
                <p className="text-sm font-bold text-blue-600">{avgKmL} KM/L Média</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-[11px] font-bold uppercase text-gray-400 tracking-widest border-b pb-2 flex items-center gap-2">
              <Calculator size={14} /> Detalhamento de Custos
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Diesel ({totalLitersDiesel}L)</span>
                <span className="font-bold text-gray-800">{totalDiesel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Arla ({totalLitersArla}L)</span>
                <span className="font-bold text-gray-800">Incluso no Abastec.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Despesas Operacionais</span>
                <span className="font-bold text-gray-800">{totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pedágio Tag (Não dedutível)</span>
                <span className="font-bold text-gray-500">{(trip.outbound.tollTag + trip.inbound.tollTag).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-blue-50 text-blue-600 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2">
            <Printer size={16} /> Imprimir Comprovante
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryView;
