
export interface Station {
  id: string;
  name: string;
  location?: string;
}

export interface TireEvent {
  id: string;
  date: string;
  km: number;
  description: string;
}

export interface PositionHistoryItem {
  position: string;
  startKm: number;
  endKm?: number;
  date: string;
}

export interface TireRecord {
  id: string;
  position: string;
  installationKm: number;
  removalKm?: number;
  date: string; // Data de instalação
  removalDate?: string; // Data de retirada
  brand: string;
  tireCode: string; // Código de identificação do pneu
  condition: 'novo' | 'recapado' | 'usado'; // Estado do pneu
  repairDesc?: string;
  repairKm?: number;
  events?: TireEvent[]; // Histórico de ocorrências (furo, desgaste, etc)
  positionHistory?: PositionHistoryItem[]; // Histórico de rodízios (posições por onde passou)
}

export interface RetiredTireRecord extends TireRecord {
  totalKmRan: number;
  durationMonths: number;
  durationDays: number;
  retiredAt: string;
  sentToRetread?: boolean; // Se foi enviado para recapagem
}

export interface MaintenanceHistoryItem {
  date: string;
  km: number;
}

export interface MaintenanceRecord {
  installKm: number;
  installDate: string;
  history?: MaintenanceHistoryItem[];
}

export interface MaintenanceFilters {
  airFilter: MaintenanceRecord;
  racorFilter: MaintenanceRecord;
  engineOil: MaintenanceRecord;
  gearboxOil: MaintenanceRecord;
  diffOil: MaintenanceRecord;
  others: string;
}

export interface Freight {
  date: string;
  company: string;
  destinations: string;
  value: number;
  advance: number;
  advanceMaintenance: number; 
  advanceDiesel: number;      
  balance: number;
  tollTag: number;
  weightTons: number;
  startKm: number;
}

export interface DieselRecord {
  station: string;
  arrivalKm: number;
  litersDiesel: number;
  litersArla: number;
  totalCost: number;
}

export interface Expenses {
  tireShop: number;
  binding: number;
  unloading: number;
  tip: number;
  wash: number;
  cashToll: number;
  othersDesc: string;
  othersValue: number;
}

export interface MiscExpense {
  id: string;
  date: string;
  category: 'Borracharia' | 'Lavagem' | 'Alimentação' | 'Pedágio' | 'Descarga' | 'Serviços de chapa' | 'Eletricista' | 'Mecânica' | 'Enlonamento' | 'Amarração de carga' | 'Gorjetas' | 'Outros';
  description: string;
  value: number;
  attachment?: string; // Foto do comprovante (base64)
}

export interface Trip {
  id: string;
  driverName: string;
  plate: string;
  outbound: Freight;
  inbound: Freight;
  diesel: DieselRecord[];
  expenses: Expenses;
  status: 'active' | 'completed';
  createdAt: string;
  endDate?: string;
  endKm?: number;
  miscExpenses?: MiscExpense[]; 
}

export interface User {
  id: string;
  companyName: string;
  driverName: string;
  plate: string;
  password?: string;
  driverPhoto?: string; 
  truckPhoto?: string;  
  truckRegistrationDate?: string;
  truckInitialKm?: number;
  truckCurrentKm?: number;
}
