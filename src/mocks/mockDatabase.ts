// ---------------------------------------------------
// 1. INTERFACES (TIPOS) PARA ORGANIZAR OS DADOS
// ---------------------------------------------------

export interface Setor {
    id: string;
    nome: string;
    tipo: 'Internacao' | 'NaoInternacao';
}

export interface Questionario {
    id: string;
    nome: string;
    numeroDePerguntas: number;
}

export interface Avaliacao {
    id: string;
    setorId: string; // "Chave estrangeira" para o Setor
    questionarioId: string; // "Chave estrangeira" para o Questionário
    pontosAtual: number;
    pontosProjetado: number; // Adicionei uma meta para enriquecer os dados
}

// ---------------------------------------------------
// 2. DADOS MOCADOS
// ---------------------------------------------------

// --- Tabela de Setores ---
export const setores: Setor[] = [
    { id: 'uti-adulto', nome: 'UTI Adulto', tipo: 'Internacao' },
    { id: 'enfermaria', nome: 'Enfermaria', tipo: 'Internacao' },
    { id: 'uti-pediatrica', nome: 'UTI Pediátrica', tipo: 'Internacao' },
    { id: 'centro-cirurgico', nome: 'Centro Cirúrgico', tipo: 'NaoInternacao' },
    { id: 'pronto-atendimento', nome: 'Pronto atendimento', tipo: 'NaoInternacao' },
];

// --- Tabela de Questionários ---
export const questionarios: Questionario[] = [
    { id: 'equipe-medica', nome: 'EQUIPE MÉDICA', numeroDePerguntas: 2 },
    { id: 'gestao-pessoas', nome: 'GESTÃO DE PESSOAS', numeroDePerguntas: 4 },
    { id: 'atividades-suporte', nome: 'ATIVIDADES DE SUPORTE', numeroDePerguntas: 4 },
    { id: 'processos-rotinas', nome: 'PROCESSOS E ROTINAS', numeroDePerguntas: 3 },
    { id: 'gestao-enfermagem', nome: 'GESTÃO DE ENFERMAGEM', numeroDePerguntas: 2 },
    { id: 'interacao-processos', nome: 'INTERAÇÃO DE PROCESSOS', numeroDePerguntas: 7 },
];

// --- Tabela de Avaliações (onde tudo se conecta) ---
export const avaliacoes: Avaliacao[] = [
    // --- UTI Adulto ---
    { id: 'aval-01', setorId: 'uti-adulto', questionarioId: 'interacao-processos', pontosAtual: 3, pontosProjetado: 8 },
    { id: 'aval-02', setorId: 'uti-adulto', questionarioId: 'gestao-enfermagem', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-03', setorId: 'uti-adulto', questionarioId: 'processos-rotinas', pontosAtual: 6, pontosProjetado: 8 },
    { id: 'aval-04', setorId: 'uti-adulto', questionarioId: 'atividades-suporte', pontosAtual: 6, pontosProjetado: 8 },
    { id: 'aval-05', setorId: 'uti-adulto', questionarioId: 'gestao-pessoas', pontosAtual: 7, pontosProjetado: 11 },
    { id: 'aval-06', setorId: 'uti-adulto', questionarioId: 'equipe-medica', pontosAtual: 8, pontosProjetado: 13 },

    // --- UTI Pediátrica ---
    { id: 'aval-07', setorId: 'uti-pediatrica', questionarioId: 'interacao-processos', pontosAtual: 5, pontosProjetado: 8 },
    { id: 'aval-08', setorId: 'uti-pediatrica', questionarioId: 'gestao-enfermagem', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-09', setorId: 'uti-pediatrica', questionarioId: 'processos-rotinas', pontosAtual: 3, pontosProjetado: 8 },
    { id: 'aval-10', setorId: 'uti-pediatrica', questionarioId: 'atividades-suporte', pontosAtual: 2, pontosProjetado: 8 },
    { id: 'aval-11', setorId: 'uti-pediatrica', questionarioId: 'gestao-pessoas', pontosAtual: 4, pontosProjetado: 11 },
    { id: 'aval-12', setorId: 'uti-pediatrica', questionarioId: 'equipe-medica', pontosAtual: 6, pontosProjetado: 13 },

    // --- Pronto Atendimento ---
    { id: 'aval-13', setorId: 'pronto-atendimento', questionarioId: 'interacao-processos', pontosAtual: 3, pontosProjetado: 8 },
    { id: 'aval-14', setorId: 'pronto-atendimento', questionarioId: 'gestao-enfermagem', pontosAtual: 7, pontosProjetado: 8 },
    { id: 'aval-15', setorId: 'pronto-atendimento', questionarioId: 'processos-rotinas', pontosAtual: 1, pontosProjetado: 8 },
    { id: 'aval-16', setorId: 'pronto-atendimento', questionarioId: 'atividades-suporte', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-17', setorId: 'pronto-atendimento', questionarioId: 'gestao-pessoas', pontosAtual: 6, pontosProjetado: 11 },
    { id: 'aval-18', setorId: 'pronto-atendimento', questionarioId: 'equipe-medica', pontosAtual: 5, pontosProjetado: 13 },

    // --- Centro Cirúrgico ---
    { id: 'aval-19', setorId: 'centro-cirurgico', questionarioId: 'interacao-processos', pontosAtual: 6, pontosProjetado: 8 },
    { id: 'aval-20', setorId: 'centro-cirurgico', questionarioId: 'gestao-enfermagem', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-21', setorId: 'centro-cirurgico', questionarioId: 'processos-rotinas', pontosAtual: 5, pontosProjetado: 8 },
    { id: 'aval-22', setorId: 'centro-cirurgico', questionarioId: 'atividades-suporte', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-23', setorId: 'centro-cirurgico', questionarioId: 'gestao-pessoas', pontosAtual: 6, pontosProjetado: 11 },
    { id: 'aval-24', setorId: 'centro-cirurgico', questionarioId: 'equipe-medica', pontosAtual: 6, pontosProjetado: 13 },

    // Adicionei a Enfermaria com dados fictícios para completar
    { id: 'aval-25', setorId: 'enfermaria', questionarioId: 'interacao-processos', pontosAtual: 5, pontosProjetado: 8 },
    { id: 'aval-26', setorId: 'enfermaria', questionarioId: 'gestao-enfermagem', pontosAtual: 6, pontosProjetado: 8 },
    { id: 'aval-27', setorId: 'enfermaria', questionarioId: 'processos-rotinas', pontosAtual: 4, pontosProjetado: 8 },
    { id: 'aval-28', setorId: 'enfermaria', questionarioId: 'atividades-suporte', pontosAtual: 5, pontosProjetado: 8 },
    { id: 'aval-29', setorId: 'enfermaria', questionarioId: 'gestao-pessoas', pontosAtual: 8, pontosProjetado: 11 },
    { id: 'aval-30', setorId: 'enfermaria', questionarioId: 'equipe-medica', pontosAtual: 7, pontosProjetado: 13 },
];