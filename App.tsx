
import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  Settings,
  LogOut,
  LayoutDashboard,
  Receipt,
  UserPlus,
  FileBarChart,
  Flag,
  Loader2
} from 'lucide-react';
import { Trip, User, TireRecord, MaintenanceFilters, Station, RetiredTireRecord, MiscExpense } from './types.ts';

import { supabase } from './lib/supabase';
import AuthView from './components/AuthView.tsx';

// Views
import DashboardView from './components/DashboardView.tsx';
import TripForm from './components/TripForm.tsx';
import MaintenanceView from './components/MaintenanceView.tsx';
import HistoryView from './components/HistoryView.tsx';
import ExpensesView from './components/ExpensesView.tsx';
import RegistrationView from './components/RegistrationView.tsx';
import ReportsView from './components/ReportsView.tsx';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'expenses' | 'maintenance' | 'reports' | 'registration'>('dashboard');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tripStep, setTripStep] = useState<number>(1);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [companies, setCompanies] = useState<Station[]>([]);
  const [tires, setTires] = useState<TireRecord[]>([]);
  const [retiredTires, setRetiredTires] = useState<RetiredTireRecord[]>([]);
  const [filters, setFilters] = useState<MaintenanceFilters>({
    airFilter: { installKm: 0, installDate: '', history: [] },
    racorFilter: { installKm: 0, installDate: '', history: [] },
    engineOil: { installKm: 0, installDate: '', history: [] },
    gearboxOil: { installKm: 0, installDate: '', history: [] },
    diffOil: { installKm: 0, installDate: '', history: [] },
    others: ''
  });

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    // Load other data from localStorage
    try {
      const savedMiscExpenses = localStorage.getItem('truck_misc_expenses');
      const savedTires = localStorage.getItem('truck_tires');
      const savedRetiredTires = localStorage.getItem('truck_retired_tires');
      const savedFilters = localStorage.getItem('truck_filters');
      const savedStations = localStorage.getItem('truck_stations');
      const savedCompanies = localStorage.getItem('truck_companies');

      if (savedMiscExpenses) setMiscExpenses(JSON.parse(savedMiscExpenses));
      if (savedTires) setTires(JSON.parse(savedTires));
      if (savedRetiredTires) setRetiredTires(JSON.parse(savedRetiredTires));
      if (savedFilters) setFilters(JSON.parse(savedFilters));
      if (savedStations) setStations(JSON.parse(savedStations));
      if (savedCompanies) setCompanies(JSON.parse(savedCompanies));
    } catch (e) {
      console.error("Error loading from localStorage", e);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('truck_misc_expenses', JSON.stringify(miscExpenses));
    localStorage.setItem('truck_tires', JSON.stringify(tires));
    localStorage.setItem('truck_retired_tires', JSON.stringify(retiredTires));
    localStorage.setItem('truck_filters', JSON.stringify(filters));
    localStorage.setItem('truck_stations', JSON.stringify(stations));
    localStorage.setItem('truck_companies', JSON.stringify(companies));
  }, [miscExpenses, tires, retiredTires, filters, stations, companies]);

  const fetchTrips = async (userId: string) => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro ao carregar viagens:", error);
      return;
    }

    if (data) {
      const mappedTrips: Trip[] = data.map(t => ({
        id: t.id,
        driverName: t.driver_name,
        plate: t.plate,
        outbound: t.outbound,
        inbound: t.inbound,
        diesel: t.diesel,
        expenses: t.expenses,
        status: t.status,
        createdAt: t.created_at,
        endDate: t.end_date,
        endKm: t.end_km,
        miscExpenses: t.misc_expenses
      }));
      setTrips(mappedTrips);
    }
  };

  const handleAuthChange = async (session: any) => {
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setCurrentUser({
          id: profile.id,
          driverName: profile.driver_name,
          plate: profile.plate,
          companyName: profile.company_name,
          driverPhoto: profile.driver_photo,
          truckPhoto: profile.truck_photo,
          truckRegistrationDate: profile.truck_registration_date,
          truckInitialKm: profile.truck_initial_km,
          truckCurrentKm: profile.truck_current_km
        });
        fetchTrips(session.user.id);
      }
    } else {
      setCurrentUser(null);
      setTrips([]);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('dashboard');
  };

  const activeTrip = useMemo(() => trips.find(t => t.status === 'active'), [trips]);

  const openTripForm = (step: number = 1) => {
    setTripStep(step);
    setActiveTab('trips');
  };

  const saveTrip = async (updatedTrip: Trip, shouldExit: boolean = false) => {
    if (!currentUser) return;

    let finalTrip = { ...updatedTrip };

    if (updatedTrip.status === 'completed') {
      finalTrip.miscExpenses = [...miscExpenses];
      setMiscExpenses([]);
    }

    try {
      const { data: savedData, error: upsertError } = await supabase
        .from('trips')
        .upsert({
          id: finalTrip.id.length > 30 ? finalTrip.id : undefined,
          user_id: currentUser.id,
          driver_name: finalTrip.driverName,
          plate: finalTrip.plate,
          outbound: finalTrip.outbound,
          inbound: finalTrip.inbound,
          diesel: finalTrip.diesel,
          expenses: finalTrip.expenses,
          status: finalTrip.status,
          created_at: finalTrip.createdAt,
          end_date: finalTrip.endDate,
          end_km: finalTrip.endKm,
          misc_expenses: finalTrip.miscExpenses
        }, { onConflict: 'id' })
        .select()
        .single();

      if (upsertError) throw upsertError;

      if (savedData) {
        // Use the returned data to update local state (especially the ID)
        const tripFromDb: Trip = {
          id: savedData.id,
          driverName: savedData.driver_name,
          plate: savedData.plate,
          outbound: savedData.outbound,
          inbound: savedData.inbound,
          diesel: savedData.diesel,
          expenses: savedData.expenses,
          status: savedData.status,
          createdAt: savedData.created_at,
          endDate: savedData.end_date,
          endKm: savedData.end_km,
          miscExpenses: savedData.misc_expenses
        };

        setTrips(prev => {
          const index = prev.findIndex(t => t.id === finalTrip.id || t.id === tripFromDb.id);
          if (index > -1) {
            const newTrips = [...prev];
            newTrips[index] = tripFromDb;
            return newTrips;
          }
          return [tripFromDb, ...prev];
        });
      }

      // Update truck KM if needed
      const tripEndKm = Number(updatedTrip.endKm) || 0;
      const tripStartKm = Number(updatedTrip.outbound.startKm) || 0;
      const highestKm = Math.max(tripEndKm, tripStartKm);

      if (highestKm > (currentUser.truckCurrentKm || 0)) {
        const updatedUser = { ...currentUser, truckCurrentKm: highestKm };
        setCurrentUser(updatedUser);

        await supabase
          .from('profiles')
          .update({ truck_current_km: highestKm })
          .eq('id', currentUser.id);
      }

    } catch (err: any) {
      console.error("Erro ao salvar viagem no Supabase:", err);
      alert("Erro ao salvar no servidor. Verifique sua conexão.");
    }

    if (updatedTrip.status === 'completed' || shouldExit) {
      setActiveTab('dashboard');
    }
  };

  const addMiscExpense = (expense: MiscExpense) => {
    setMiscExpenses(prev => [...prev, expense]);
  };

  const deleteMiscExpense = (id: string) => {
    setMiscExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addStation = (name: string) => {
    const newStation: Station = { id: Date.now().toString(), name };
    setStations([...stations, newStation]);
  };

  const addCompany = (name: string) => {
    const newCompany: Station = { id: Date.now().toString(), name };
    setCompanies([...companies, newCompany]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            trips={trips}
            user={currentUser}
            filters={filters}
            miscExpenses={miscExpenses}
            onNewTrip={() => openTripForm(1)}
            onRegisterDiesel={() => openTripForm(3)}
            onManageExpenses={() => setActiveTab('expenses')}
            onOpenMaintenance={() => setActiveTab('maintenance')}
            onViewHistory={() => setActiveTab('reports')}
          />
        );
      case 'trips':
        return (
          <TripForm
            onSave={saveTrip}
            user={currentUser}
            initialStep={tripStep}
            stations={stations}
            onAddStation={addStation}
            companies={companies}
            onAddCompany={addCompany}
            existingTrip={activeTrip}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={miscExpenses}
            onAddExpense={addMiscExpense}
            onDeleteExpense={deleteMiscExpense}
          />
        );
      case 'maintenance':
        return (
          <MaintenanceView
            tires={tires}
            setTires={setTires}
            retiredTires={retiredTires}
            setRetiredTires={setRetiredTires}
            filters={filters}
            setFilters={setFilters}
            trips={trips}
            user={currentUser}
          />
        );
      case 'reports':
        return <ReportsView trips={trips} miscExpenses={miscExpenses} user={currentUser} />;
      case 'registration':
        return (
          <RegistrationView
            user={currentUser}
            onUpdateUser={setCurrentUser}
            onLogout={handleLogout}
          />
        );
      default:
        return <DashboardView trips={trips} user={currentUser} filters={filters} miscExpenses={miscExpenses} onNewTrip={() => openTripForm(1)} onRegisterDiesel={() => openTripForm(3)} onManageExpenses={() => setActiveTab('expenses')} onOpenMaintenance={() => setActiveTab('maintenance')} onViewHistory={() => setActiveTab('reports')} />;
    }
  };

  return (
    <div className="min-h-screen pb-32 max-w-lg mx-auto bg-gray-50 relative shadow-2xl border-x border-gray-200 print:min-h-0 print:pb-0 print:shadow-none print:border-none print:bg-white print:max-w-none">
      <header className="sticky top-0 z-40 bg-white/80 ios-blur border-b border-gray-200 px-6 py-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">
          {activeTab === 'dashboard' ? 'Becker e Mendonça' :
            activeTab === 'trips' ? 'Frete' :
              activeTab === 'expenses' ? 'Despesas' :
                activeTab === 'maintenance' ? 'Manutenção' :
                  activeTab === 'reports' ? 'Relatórios' :
                    activeTab === 'registration' ? 'Cadastro' : 'Perfil'}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Truck size={14} />
            {currentUser.plate}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-3 -mr-2 text-gray-400 hover:text-red-500 active:scale-90 active:text-red-600 transition-all"
            aria-label="Sair"
          >
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <main className="animate-in fade-in duration-300 print:block print:opacity-100">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/90 ios-blur border-t border-gray-200 px-2 pt-3 pb-8 flex justify-between items-center z-50 no-print">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Início" />
        <NavButton active={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} icon={<Receipt size={24} />} label="Despesas" />
        <NavButton
          active={activeTab === 'trips'}
          onClick={() => {
            if (activeTrip) {
              openTripForm(4);
            } else {
              openTripForm(1);
            }
          }}
          icon={<Flag size={24} />}
          label="Finalizar"
        />
        <NavButton active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} icon={<Settings size={24} />} label="Oficina" />
        <NavButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<FileBarChart size={24} />} label="Relatório" />
        <NavButton active={activeTab === 'registration'} onClick={() => setActiveTab('registration')} icon={<UserPlus size={24} />} label="Cadastro" />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[50px]">
    <div className={`${active ? 'text-blue-600 scale-110' : 'text-gray-400'} transition-all duration-200`}>
      {icon}
    </div>
    <span className={`text-[8px] font-bold uppercase tracking-wider ${active ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
  </button>
);

export default App;
