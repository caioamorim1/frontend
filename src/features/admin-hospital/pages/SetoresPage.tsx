import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getUnidadesInternacao,
  getUnidadesNaoInternacao,
  createUnidadeInternacao,
  createUnidadeNaoInternacao,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
  deleteUnidadeInternacao,
  deleteUnidadeNaoInternacao,
  getScpMetodos,
  getCargosByHospitalId,
  Unidade,
  ScpMetodo,
  Cargo,
} from "@/lib/api";
import { Trash2, Edit, Hospital, Building2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CargoUnidadeParaCriacao {
  cargoId: string;
  quantidade_funcionarios: number;
  nome?: string; // Usado apenas para exibição no frontend
}

export default function SetoresPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [scpMetodos, setScpMetodos] = useState<ScpMetodo[]>([]);
  const [cargosHospital, setCargosHospital] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tipoUnidade, setTipoUnidade] = useState<
    "internacao" | "nao-internacao" | null
  >(null);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);

  // Estados para os formulários
  const [nome, setNome] = useState("");
  const [numeroLeitos, setNumeroLeitos] = useState(0);
  const [scpMetodoId, setScpMetodoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horas_extra_reais, setHorasExtraReais] = useState("");
  const [horas_extra_projetadas, setHorasExtraProjetadas] = useState("");
  const [cargos_unidade, setCargosUnidade] = useState<
    CargoUnidadeParaCriacao[]
  >([]);

  // Estados para adicionar novo cargo
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [quantidadeFuncionarios, setQuantidadeFuncionarios] = useState(1);

  const fetchData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const [internacaoData, naoInternacaoData, scpData, cargosData] =
        await Promise.all([
          getUnidadesInternacao(hospitalId),
          getUnidadesNaoInternacao(hospitalId),
          getScpMetodos(),
          getCargosByHospitalId(hospitalId),
        ]);
      setUnidades([...internacaoData, ...naoInternacaoData]);
      setScpMetodos(scpData);
      setCargosHospital(cargosData);
    } catch (err) {
      setError("Falha ao carregar os setores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const resetForm = () => {
    setNome("");
    setNumeroLeitos(0);
    setScpMetodoId("");
    setDescricao("");
    setHorasExtraReais("");
    setHorasExtraProjetadas("");
    setCargosUnidade([]);
    setTipoUnidade(null);
    setIsFormVisible(false);
    setEditingUnidade(null);
    setSelectedCargoId("");
    setQuantidadeFuncionarios(1);
  };

  const handleAddNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleEdit = (unidade: Unidade) => {
    resetForm();

    setEditingUnidade(unidade);
    console.log("Unidade :", unidade);
    setTipoUnidade(unidade.tipo);
    setNome(unidade.nome);
    setHorasExtraReais(unidade.horas_extra_reais || "");
    setHorasExtraProjetadas(unidade.horas_extra_projetadas || "");

    const cargosFormatados = (unidade.cargos_unidade || []).map((cu) => {
      const cargoInfo = cargosHospital.find(
        (c) => c.id === (cu.cargoId || cu.cargoId)
      );
      return {
        cargoId: cu.cargoId || cu.cargoId,
        quantidade_funcionarios: cu.quantidade_funcionarios,
        nome: cargoInfo?.nome || "Cargo desconhecido",
      };
    });
    setCargosUnidade(cargosFormatados);

    if (unidade.tipo === "internacao") {
      setNumeroLeitos(unidade.leitos?.length || 0);
      setScpMetodoId(unidade.scpMetodoKey || "");
    } else {
      setDescricao(unidade.descricao || "");
    }

    setIsFormVisible(true);
  };

  const handleAddCargo = () => {
    console.log("ANTES DE ADICIONAR. Estado atual:", cargos_unidade);
    if (!selectedCargoId || quantidadeFuncionarios <= 0) {
      alert("Selecione um cargo e informe uma quantidade válida.");
      return;
    }
    if (cargos_unidade.find((c) => c.cargoId === selectedCargoId)) {
      alert("Este cargo já foi adicionado.");
      return;
    }
    const cargoSelecionado = cargosHospital.find(
      (c) => c.id === selectedCargoId
    );

    setCargosUnidade([
      ...cargos_unidade,
      {
        cargoId: selectedCargoId,
        quantidade_funcionarios: quantidadeFuncionarios,
        nome: cargoSelecionado?.nome || "Cargo desconhecido",
      },
    ]);
    setSelectedCargoId("");
    setQuantidadeFuncionarios(1);
  };

  const handleRemoveCargo = (cargoId: string) => {
    setCargosUnidade(cargos_unidade.filter((c) => c.cargoId !== cargoId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !tipoUnidade) return;

    try {
      const isEditing = !!editingUnidade;
      // Prepara o payload dos cargos, removendo a propriedade 'nome' que é só para o frontend
      const payloadCargos = cargos_unidade.map(({ nome, ...resto }) => resto);
      console.log("Payload Cargos:", payloadCargos);
      if (isEditing) {
        // LÓGICA DE ATUALIZAÇÃO (já estava correta)
        if (tipoUnidade === "internacao") {
          await updateUnidadeInternacao(editingUnidade!.id, {
            nome,
            scpMetodoId,
            horas_extra_reais,
            horas_extra_projetadas,
            cargos_unidade: payloadCargos,
          });
        } else {
          await updateUnidadeNaoInternacao(editingUnidade!.id, {
            nome,
            descricao,
            horas_extra_reais,
            horas_extra_projetadas,
            cargos_unidade: payloadCargos,
          });
        }
      } else {
        // [CORRIGIDO] LÓGICA DE CRIAÇÃO (agora em uma única etapa)
        if (tipoUnidade === "internacao") {
          await createUnidadeInternacao({
            hospitalId,
            nome,
            numeroLeitos,
            scpMetodoId,
            horas_extra_reais,
            horas_extra_projetadas,
            // Envia o payload de cargos diretamente na criação
            cargos_unidade: payloadCargos,
          });
        } else {
          await createUnidadeNaoInternacao({
            hospitalId,
            nome,
            descricao,
            horas_extra_reais,
            horas_extra_projetadas,
            // Envia o payload de cargos diretamente na criação
            cargos_unidade: payloadCargos,
          });
        }
      }

      resetForm();
      fetchData();
    } catch (err) {
      const action = editingUnidade ? "atualizar" : "criar";
      setError(
        `Falha ao ${action} o setor. Detalhes: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  };

  const handleDelete = async (unidade: Unidade) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o setor "${unidade.nome}"?`
      )
    ) {
      try {
        if (unidade.tipo === "internacao") {
          await deleteUnidadeInternacao(unidade.id);
        } else {
          await deleteUnidadeNaoInternacao(unidade.id);
        }
        fetchData();
      } catch (err) {
        setError(`Falha ao excluir o setor.`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Setores
        </h1>
        <Button
          onClick={isFormVisible ? resetForm : handleAddNew}
          variant={isFormVisible ? "outline" : "default"}
        >
          {isFormVisible ? "Cancelar" : "+ Novo Setor"}
        </Button>
      </div>

      {isFormVisible && (
        <Card className="animate-fade-in-down">
          <CardHeader>
            <CardTitle>
              {editingUnidade
                ? `Editando Unidade de ${
                    tipoUnidade === "internacao"
                      ? "Internação"
                      : "Não Internação"
                  }`
                : !tipoUnidade
                ? "Qual tipo de setor deseja criar?"
                : `Adicionar Nova Unidade de ${
                    tipoUnidade === "internacao"
                      ? "Internação"
                      : "Não Internação"
                  }`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!tipoUnidade ? (
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setTipoUnidade("internacao")}
                  className="flex-1 h-24 flex-col"
                >
                  <Hospital className="h-8 w-8 text-secondary mb-2" />
                  <span>Unidade de Internação</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTipoUnidade("nao-internacao")}
                  className="flex-1 h-24 flex-col"
                >
                  <Building2 className="h-8 w-8 text-secondary mb-2" />
                  <span>Unidade de Não Internação</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  name="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do Setor"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="horas_extra_reais"
                    value={horas_extra_reais}
                    onChange={(e) => setHorasExtraReais(e.target.value)}
                    placeholder="Horas Extra (R$)"
                  />
                  <Input
                    name="horas_extra_projetadas"
                    value={horas_extra_projetadas}
                    onChange={(e) => setHorasExtraProjetadas(e.target.value)}
                    placeholder="Horas Extra Projetadas (horas)"
                  />
                </div>

                {tipoUnidade === "internacao" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="numeroLeitos"
                      type="number"
                      value={numeroLeitos}
                      onChange={(e) => setNumeroLeitos(Number(e.target.value))}
                      placeholder="Número de Leitos"
                      required
                      disabled={!!editingUnidade}
                    />
                    <Select onValueChange={setScpMetodoId} value={scpMetodoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um método SCP (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {scpMetodos.map((metodo) => (
                          <SelectItem key={metodo.id} value={metodo.id}>
                            {metodo.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {editingUnidade && tipoUnidade === "internacao" && (
                  <p className="text-xs text-gray-500">
                    O número de leitos não pode ser alterado na edição.
                  </p>
                )}

                {tipoUnidade === "nao-internacao" && (
                  <Textarea
                    name="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descrição (opcional)"
                    rows={3}
                  />
                )}

                <div className="space-y-3 pt-4">
                  <h3 className="font-semibold text-lg text-primary">
                    Adicionar Cargos na Unidade
                  </h3>
                  <div className="flex items-center gap-4">
                    <Select
                      onValueChange={setSelectedCargoId}
                      value={selectedCargoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargosHospital.map((cargo) => (
                          <SelectItem key={cargo.id} value={cargo.id}>
                            {cargo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={quantidadeFuncionarios}
                      onChange={(e) =>
                        setQuantidadeFuncionarios(Number(e.target.value))
                      }
                      min="1"
                      className="w-24"
                      placeholder="Qtd."
                    />
                    <Button type="button" onClick={handleAddCargo} size="icon">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {cargos_unidade.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {cargos_unidade.map((cargo) => (
                        <div
                          key={cargo.cargoId}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                        >
                          <span>
                            {cargo.nome} (Qtd: {cargo.quantidade_funcionarios})
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCargo(cargo.cargoId)}
                            className="text-red-500 hover:text-red-700 h-6 w-6"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    {editingUnidade ? "Cancelar Edição" : "Voltar"}
                  </Button>
                  <Button type="submit">
                    {editingUnidade ? "Salvar Alterações" : "Salvar Setor"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          {loading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unidades.length > 0 ? (
                  unidades.map((unidade) => (
                    <TableRow key={unidade.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/hospital/${hospitalId}/setores/${unidade.id}`}
                          className="hover:underline text-primary"
                        >
                          {unidade.nome}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            unidade.tipo === "internacao"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {unidade.tipo === "internacao"
                            ? "Internação"
                            : "Não Internação"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(unidade)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(unidade)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-sm text-gray-500"
                    >
                      Nenhum setor cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
