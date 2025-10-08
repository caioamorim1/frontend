

interface CareLevelPercentage {
    minimumCare: number;
    intermediateCare: number;
    highDependency: number;
    semiIntensive: number;
    intensive: number;
}


// Generic interface for items in a list
interface DataItem {
    id: string;
    descr: string;
    value: number;
}

interface BedStatus {
    evaluated: number;
    vacant: number;
    inactive: number;
}

interface CareLevel {
    minimumCare: number;
    intermediateCare: number;
    highDependency: number;
    semiIntensive: number;
    intensive: number;
}

interface StaffItem {
    id: string;
    role: string;
    quantity: number;
}

interface SectorInternation {
    id: string;
    name: string;
    descr: string;
    costAmount: number;
    bedCount: number;
    CareLevel: CareLevel;
    bedStatus: BedStatus;
    staff: StaffItem[];
}


const unit1: SectorInternation = {
    id: '1',
    name: 'UTI Pediátrica',
    descr: 'Unidade de Terapia Intensiva Pediátrica',
    costAmount: 500000,
    bedCount: 10,
    CareLevel: {
        minimumCare: 2,
        intermediateCare: 5,
        highDependency: 3,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 8,
        vacant: 2,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Enfermeiro', quantity: 4 },
        { id: '2', role: 'Médico', quantity: 2 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 3 },
    ],
};

export interface DashboardAnalytics {
    totalBeds: number;
    assessmentsCompletedPercentage: number;
    averageOccupancyPercentage: number;
    bedStatus: BedStatus;
    scpCareLevels: CareLevelPercentage; // SCP might stand for "Sistema de Classificação de Pacientes" (Patient Classification System)
    staffDistribution: DataItem[];
    staffByRole: DataItem[];
    costBySector: DataItem[];
}

export const hospitalDashboardMock: DashboardAnalytics = {
    totalBeds: 85,
    assessmentsCompletedPercentage: 62,
    averageOccupancyPercentage: 75,
    bedStatus: {
        evaluated: 2,
        vacant: 9,
        inactive: 8,
    },
    scpCareLevels: {
        minimumCare: 20,
        intermediateCare: 35,
        highDependency: 10,
        semiIntensive: 30,
        intensive: 5,
    },
    // Updated staffDistribution structure
    staffDistribution: [
        { id: 'pediatricICU', descr: 'UTI Pediátrica', value: 12 },
        { id: 'adultICU', descr: 'UTI Adulto', value: 8 },
        { id: 'infirmary', descr: 'Enfermaria', value: 3 },
        { id: 'emergencyRoom', descr: 'Pronto Atendimento', value: 11 },
    ],
    // Updated staffByRole structure
    staffByRole: [
        { id: 'nurse', descr: 'Enfermeiro', value: 8 },
        { id: 'stretcherBearer', descr: 'Maqueiro', value: 2 },
        { id: 'nursingTechnician', descr: 'Téc. Enfermagem', value: 3 },
        { id: 'receptionist', descr: 'Recepcionista', value: 1 },
    ],
    costBySector: [
        { id: 'pediatricICU', descr: 'UTI Pediátrica', value: 375000 },
        { id: 'adultICU', descr: 'UTI Adulta', value: 355000 },
        { id: 'infirmary', descr: 'Enfermaria', value: 285000 },
        { id: 'emergencyRoom', descr: 'Pronto Atendimento', value: 240000 },
        { id: 'surgicalCenter', descr: 'Centro Cirúrgico', value: 165000 },
        { id: 'reception', descr: 'Recepção', value: 125000 },
        { id: 'pharmacy', descr: 'Farmácia', value: 90000 },
        { id: 'maintenance', descr: 'Manutenção', value: 70000 },
        { id: 'cme', descr: 'CME', value: 45000 },
    ],
};