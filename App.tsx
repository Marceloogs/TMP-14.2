
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

    return () => subscription.unsubscribe();
  }, []);

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
      }
    } else {
      setCurrentUser(null);
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

  const saveTrip = (updatedTrip: Trip, shouldExit: boolean = false) => {
    let finalTrip = { ...updatedTrip };

    if (updatedTrip.status === 'completed') {
      finalTrip.miscExpenses = [...miscExpenses];
      setMiscExpenses([]);
    }

    setTrips(prev => {
      const index = prev.findIndex(t => t.id === finalTrip.id);
      if (index > -1) {
        const newTrips = [...prev];
        newTrips[index] = finalTrip;
        return newTrips;
      }
      return [finalTrip, ...prev];
    });

    if (currentUser) {
      const tripEndKm = Number(updatedTrip.endKm) || 0;
      const tripStartKm = Number(updatedTrip.outbound.startKm) || 0;
      const highestKm = Math.max(tripEndKm, tripStartKm);

      if (highestKm > (currentUser.truckCurrentKm || 0)) {
        const updatedUser = { ...currentUser, truckCurrentKm: highestKm };
        setCurrentUser(updatedUser);
        setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      }
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
