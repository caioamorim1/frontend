// src/components/shared/AnaliseFinanceira.tsx
import { useMemo, Fragment } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface LinhaAnalise {
  cargoId: string;
  cargoNome: string;
  isScpCargo: boolean;
  salario: number;
  adicionais: number;
  valorHorasExtras: number;
  custoPorFuncionario: number;
  cargaHoraria: number;
  quantidadeAtual: number;
  quantidadeProjetada: number;
}

export interface GrupoDeCargos {
  id: string;
  nome: string;
  cargos: LinhaAnalise[];
}

interface AnaliseFinanceiraProps {
  tipo: "internacao" | "nao-internacao";
  dados: LinhaAnalise[] | GrupoDeCargos[];
  horasExtrasProjetadas?: number;
  onQuantidadeChange?: (
    cargoId: string,
    novaQuantidade: number,
    grupoId?: string
  ) => void;
}

export default function AnaliseFinanceira({
  tipo,
  dados,
  horasExtrasProjetadas = 0,
  onQuantidadeChange,
}: AnaliseFinanceiraProps) {
  const calcularTotaisGrupo = (cargos: LinhaAnalise[]) => {
    return cargos.reduce(
      (acc, linha) => {
        const custoTotalAtual =
          linha.quantidadeAtual * linha.custoPorFuncionario;
        const custoTotalProjetado =
          linha.quantidadeProjetada * linha.custoPorFuncionario;
        const horasReais = linha.quantidadeAtual * linha.cargaHoraria;
        const horasCalculadas = linha.quantidadeProjetada * linha.cargaHoraria;

        acc.quantidadeAtual += linha.quantidadeAtual;
        acc.custoTotalAtual += custoTotalAtual;
        acc.quantidadeProjetada += linha.quantidadeProjetada;
        acc.custoTotalProjetado += custoTotalProjetado;
        acc.horasReais += horasReais;
        acc.horasCalculadas += horasCalculadas;
        return acc;
      },
      {
        quantidadeAtual: 0,
        custoTotalAtual: 0,
        quantidadeProjetada: 0,
        custoTotalProjetado: 0,
        horasReais: 0,
        horasCalculadas: 0,
      }
    );
  };

  const totaisGerais = useMemo(() => {
    if (!dados || !Array.isArray(dados)) {
      return {
        quantidadeAtual: 0,
        custoTotalAtual: 0,
        quantidadeProjetada: 0,
        custoTotalProjetado: 0,
        horasReais: 0,
        horasCalculadas: 0,
      };
    }

    if (tipo === "internacao") {
      return calcularTotaisGrupo(dados as LinhaAnalise[]);
    }

    // Para não-internação, agora todos os cargos (incluindo enfermeiros/técnicos)
    // são dimensionados por sítio, então não precisa mais dedupilicar
    const grupos = dados as GrupoDeCargos[];
    const todosCargos: LinhaAnalise[] = [];

    console.log("=== CALCULANDO TOTAIS GERAIS ===");

    grupos.forEach((grupo) => {
      console.log(`Processando grupo: ${grupo.nome}`);
      grupo.cargos.forEach((cargo) => {
        console.log(
          `  ✓ Adicionando ${cargo.cargoNome} - Atual: ${cargo.quantidadeAtual}, Projetada: ${cargo.quantidadeProjetada}`
        );
        todosCargos.push(cargo);
      });
    });

    const totais = calcularTotaisGrupo(todosCargos);
    console.log("=== TOTAIS FINAIS ===", totais);
    return totais;
  }, [dados, tipo]);

  const renderLinha = (linha: LinhaAnalise, grupoId?: string) => {
    const custoTotalAtual = linha.quantidadeAtual * linha.custoPorFuncionario;
    const custoTotalProjetado =
      linha.quantidadeProjetada * linha.custoPorFuncionario;
    const variacaoQtd = linha.quantidadeProjetada - linha.quantidadeAtual;
    const variacaoCusto = custoTotalProjetado - custoTotalAtual;
    const variacaoPercent =
      linha.quantidadeAtual > 0
        ? (variacaoQtd / linha.quantidadeAtual) * 100
        : linha.quantidadeProjetada > 0
        ? Infinity
        : 0;
    const horasReais = linha.quantidadeAtual * linha.cargaHoraria;
    const horasCalculadas = linha.quantidadeProjetada * linha.cargaHoraria;
    const variacaoHoras = horasCalculadas - horasReais;

    return (
      <TableRow key={`${grupoId || "internacao"}-${linha.cargoId}`}>
        <TableCell className="font-medium sticky left-0 bg-white z-10">
          {linha.cargoNome}
        </TableCell>
        <TableCell>
          {linha.salario.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>
          {linha.adicionais.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>
          {linha.valorHorasExtras.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell className="font-semibold">
          {linha.custoPorFuncionario.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>{linha.quantidadeAtual}</TableCell>
        <TableCell>
          {custoTotalAtual.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell className="bg-blue-50">
          <div className="text-center font-bold">
            {linha.quantidadeProjetada}
          </div>
        </TableCell>
        <TableCell className="bg-blue-50 font-semibold">
          {custoTotalProjetado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell
          className={`font-medium ${
            variacaoQtd > 0
              ? "text-red-600"
              : variacaoQtd < 0
              ? "text-green-600"
              : ""
          }`}
        >
          {variacaoQtd}
        </TableCell>
        <TableCell
          className={`font-medium ${
            variacaoPercent > 0
              ? "text-red-600"
              : variacaoPercent < 0
              ? "text-green-600"
              : ""
          }`}
        >
          {variacaoPercent === Infinity
            ? "N/A"
            : `${variacaoPercent.toFixed(0)}%`}
        </TableCell>
        <TableCell
          className={`font-medium ${
            variacaoCusto > 0
              ? "text-red-600"
              : variacaoCusto < 0
              ? "text-green-600"
              : ""
          }`}
        >
          {variacaoCusto.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell>{horasReais.toFixed(0)}h</TableCell>
        <TableCell>{horasCalculadas.toFixed(0)}h</TableCell>
        <TableCell
          className={`font-medium ${
            variacaoHoras > 0
              ? "text-red-600"
              : variacaoHoras < 0
              ? "text-green-600"
              : ""
          }`}
        >
          {variacaoHoras.toFixed(0)}h
        </TableCell>
        <TableCell>{horasExtrasProjetadas.toFixed(0)}h</TableCell>
      </TableRow>
    );
  };

  const renderSubtotal = (grupo: GrupoDeCargos) => {
    const subtotal = calcularTotaisGrupo(grupo.cargos);
    return (
      <TableRow key={`subtotal-${grupo.id}`} className="font-bold bg-gray-100">
        <TableCell className="sticky left-0 bg-gray-100 z-10">
          Subtotal - {grupo.nome}
        </TableCell>
        <TableCell colSpan={4}></TableCell>
        <TableCell>{subtotal.quantidadeAtual}</TableCell>
        <TableCell>
          {subtotal.custoTotalAtual.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell className="bg-blue-100">
          {subtotal.quantidadeProjetada}
        </TableCell>
        <TableCell className="bg-blue-100">
          {subtotal.custoTotalProjetado.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </TableCell>
        <TableCell colSpan={7}></TableCell>
      </TableRow>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Financeira e de Pessoal</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white z-10 min-w-[200px]">
                Função
              </TableHead>
              <TableHead>Salário Médio</TableHead>
              <TableHead>Adicionais/Tributos</TableHead>
              <TableHead>Valor Horas Extras</TableHead>
              <TableHead>Custo/Funcionário</TableHead>
              <TableHead>Atual (Qtd)</TableHead>
              <TableHead>Custo Total Atual</TableHead>
              <TableHead className="bg-blue-50">Projetado (Qtd)</TableHead>
              <TableHead className="bg-blue-50">
                Custo Total Calculado
              </TableHead>
              <TableHead>Variação Profiss.</TableHead>
              <TableHead>Variação (%)</TableHead>
              <TableHead>Variação (R$)</TableHead>
              <TableHead>Horas Reais (Atual)</TableHead>
              <TableHead>Horas Calculadas</TableHead>
              <TableHead>Variação Horas</TableHead>
              <TableHead>Horas Extras Projetadas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tipo === "internacao"
              ? (dados as LinhaAnalise[]).map((linha) => renderLinha(linha))
              : (() => {
                  const grupos = dados as GrupoDeCargos[];

                  return (
                    <>
                      {grupos.map((grupo) => (
                        <Fragment key={grupo.id}>
                          <TableRow>
                            <TableCell
                              colSpan={16}
                              className="p-2 bg-slate-200 font-semibold text-slate-800"
                            >
                              {grupo.nome}
                            </TableCell>
                          </TableRow>
                          {grupo.cargos.map((cargo) =>
                            renderLinha(cargo, grupo.id)
                          )}
                          {renderSubtotal(grupo)}
                        </Fragment>
                      ))}
                    </>
                  );
                })()}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold bg-gray-200 text-base">
              <TableCell className="sticky left-0 bg-gray-200 z-10">
                TOTAL GERAL
              </TableCell>
              <TableCell colSpan={4}></TableCell>
              <TableCell>{totaisGerais.quantidadeAtual}</TableCell>
              <TableCell>
                {totaisGerais.custoTotalAtual.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell className="bg-blue-200">
                <div className="text-center font-bold">
                  {totaisGerais.quantidadeProjetada}
                </div>
              </TableCell>
              <TableCell className="bg-blue-200">
                {totaisGerais.custoTotalProjetado.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell
                colSpan={3}
                className={`text-center ${
                  totaisGerais.custoTotalProjetado -
                    totaisGerais.custoTotalAtual >
                  0
                    ? "text-red-600"
                    : totaisGerais.custoTotalProjetado -
                        totaisGerais.custoTotalAtual <
                      0
                    ? "text-green-600"
                    : ""
                }`}
              >
                {(
                  totaisGerais.custoTotalProjetado -
                  totaisGerais.custoTotalAtual
                ).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </TableCell>
              <TableCell>{totaisGerais.horasReais.toFixed(0)}h</TableCell>
              <TableCell>{totaisGerais.horasCalculadas.toFixed(0)}h</TableCell>
              <TableCell
                className={`text-center ${
                  totaisGerais.horasCalculadas - totaisGerais.horasReais > 0
                    ? "text-red-600"
                    : totaisGerais.horasCalculadas - totaisGerais.horasReais < 0
                    ? "text-green-600"
                    : ""
                }`}
              >
                {(
                  totaisGerais.horasCalculadas - totaisGerais.horasReais
                ).toFixed(0)}
                h
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
