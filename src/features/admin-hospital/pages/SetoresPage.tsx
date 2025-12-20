import { useState, useEffect, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getUnidadesInternacao,
  getUnidadesNaoInternacao,
  getUnidadesNeutras,
  createUnidadeInternacao,
  createUnidadeNaoInternacao,
  createUnidadeNeutra,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
  updateUnidadeNeutra,
  deleteUnidadeInternacao,
  deleteUnidadeNaoInternacao,
  deleteUnidadeNeutra,
  getScpMetodos,
  Unidade,
  ScpMetodo,
  createSnapshotHospitalSectors,
} from "@/lib/api";
import { Trash2, Edit, Hospital, Building2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Importando o Label
import CurrencyInput from "@/components/shared/CurrencyInput";
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
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

export default function SetoresPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [scpMetodos, setScpMetodos] = useState<ScpMetodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [tipoUnidade, setTipoUnidade] = useState<
    "internacao" | "nao-internacao" | "neutro" | null
  >(null);
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para os formulários
  const [nome, setNome] = useState("");
  const [numeroLeitos, setNumeroLeitos] = useState(0);
  const [scpMetodoId, setScpMetodoId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [custoTotal, setCustoTotal] = useState("");
  const [status, setStatus] = useState("inativo");

  const handleGenerateBaselineConfirm = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      await createSnapshotHospitalSectors(hospitalId);
      await fetchData();
      showAlert("success", "Sucesso", "Baseline gerada com sucesso.");
    } catch (error: any) {
      console.error("❌ Erro ao criar snapshot:", error);

      // Verifica se é o erro de setores pendentes
      if (error?.response?.data?.setoresPendentes) {
        const setoresPendentes = error.response.data.setoresPendentes;
        const mensagemSetores = setoresPendentes.join(", ");
        const errorMessage = `Não é possível criar o baseline. Os seguintes setores não estão com status concluído: ${mensagemSetores}`;
        showAlert("destructive", "Setores Pendentes", errorMessage);
      } else {
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Erro ao criar snapshot";
        showAlert("destructive", "Erro", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Map scpMetodoKey to scpMetodoId to prefill select when editing
  const resolveScpMetodoId = (
    unidade: Unidade | null,
    metodos: ScpMetodo[]
  ): string => {
    if (!unidade || unidade.tipo !== "internacao") return "";
    const rawKey = (unidade.scpMetodoKey ?? "").toString().trim().toLowerCase();
    if (rawKey) {
      const m = metodos.find(
        (mm) => (mm.key ?? "").toString().trim().toLowerCase() === rawKey
      );
      if (m) return m.id;
    }
    const possibleId = (unidade as any).scpMetodoId as string | undefined;
    if (possibleId && metodos.some((m) => m.id === possibleId))
      return possibleId;
    return "";
  };
  useEffect(() => {
    if (!editingUnidade || editingUnidade.tipo !== "internacao") return;
    const resolved = resolveScpMetodoId(editingUnidade, scpMetodos);
    if (resolved) setScpMetodoId(resolved);
  }, [editingUnidade, scpMetodos]);

  const fetchData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const [internacaoData, naoInternacaoData, neutrasData, scpData] =
        await Promise.all([
          getUnidadesInternacao(hospitalId),
          getUnidadesNaoInternacao(hospitalId),
          getUnidadesNeutras(hospitalId),
          getScpMetodos(),
        ]);
      setUnidades([...internacaoData, ...naoInternacaoData, ...neutrasData]);
      setScpMetodos(scpData);
    } catch (err) {
      showAlert("destructive", "Erro", "Falha ao carregar os setores.");
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
    setCustoTotal("");
    setStatus("inativo");
    setTipoUnidade(null);
    setIsFormVisible(false);
    setEditingUnidade(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const handleEdit = (unidade: Unidade) => {
    resetForm();
    setEditingUnidade(unidade);
    setTipoUnidade(unidade.tipo);
    setNome(unidade.nome);

    if (unidade.tipo === "internacao") {
      setNumeroLeitos(unidade.leitos?.length || 0);
      // Map scpMetodoKey (stored on unidade) to the actual scp metodo id so the Select shows correctly
      const resolved = resolveScpMetodoId(unidade, scpMetodos);
      setScpMetodoId(resolved);
    } else if (unidade.tipo === "nao-internacao") {
      setDescricao(unidade.descricao || "");
    } else if (unidade.tipo === "neutro") {
      setDescricao(unidade.descricao || "");
      setCustoTotal(unidade.custoTotal?.toString() || "0");
      setStatus("inativo");
    }

    setIsFormVisible(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !tipoUnidade) return;

    try {
      if (editingUnidade) {
        if (tipoUnidade === "internacao") {
          // Must have an SCP method selected for internacao
          if (!scpMetodoId || scpMetodoId.trim() === "") {
            showAlert(
              "destructive",
              "Erro",
              "Selecione um método SCP para unidades de internação."
            );
            return;
          }
          await updateUnidadeInternacao(editingUnidade.id, {
            nome,
            scpMetodoId,
            horas_extra_reais: "0.00",
            horas_extra_projetadas: "0",
          });
        } else if (tipoUnidade === "nao-internacao") {
          await updateUnidadeNaoInternacao(editingUnidade.id, {
            nome,
            descricao,
            horas_extra_reais: "0.00",
            horas_extra_projetadas: "0",
          });
        } else if (tipoUnidade === "neutro") {
          await updateUnidadeNeutra(editingUnidade.id, {
            nome,
            custoTotal: parseFloat(custoTotal) || 0,
            status,
            descricao,
          });
        }
      } else {
        if (tipoUnidade === "internacao") {
          if (!scpMetodoId || scpMetodoId.trim() === "") {
            showAlert(
              "destructive",
              "Erro",
              "Selecione um método SCP para unidades de internação."
            );
            return;
          }
          await createUnidadeInternacao({
            hospitalId,
            nome,
            numeroLeitos,
            scpMetodoId,
            horas_extra_reais: "0.00",
            horas_extra_projetadas: "0",
            cargos_unidade: [], // Inicia sem cargos
          });
        } else if (tipoUnidade === "nao-internacao") {
          await createUnidadeNaoInternacao({
            hospitalId,
            nome,
            descricao,
            horas_extra_reais: "0.00",
            horas_extra_projetadas: "0",
            cargos_unidade: [], // Inicia sem cargos..
          });
        } else if (tipoUnidade === "neutro") {
          await createUnidadeNeutra({
            hospitalId,
            nome,
            custoTotal: parseFloat(custoTotal) || 0,
            status,
            descricao,
          });
        }
      }

      resetForm();
      fetchData();
      showAlert(
        "success",
        "Sucesso",
        editingUnidade
          ? "Setor atualizado com sucesso."
          : "Setor criado com sucesso."
      );
    } catch (err) {
      const action = editingUnidade ? "atualizar" : "criar";
      setError(`Falha ao ${action} o setor.`);
      showAlert("destructive", "Erro", `Falha ao ${action} o setor.`);
    }
  };

  const handleDelete = async (unidade: Unidade) => {
    showModal({
      type: "confirm",
      title: "Excluir setor",
      message: `Tem certeza que deseja excluir o setor "${unidade.nome}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          if (unidade.tipo === "internacao") {
            await deleteUnidadeInternacao(unidade.id);
          } else if (unidade.tipo === "nao-internacao") {
            await deleteUnidadeNaoInternacao(unidade.id);
          } else if (unidade.tipo === "neutro") {
            await deleteUnidadeNeutra(unidade.id);
          }
          fetchData();
          showAlert("success", "Sucesso", "Setor excluído com sucesso.");
        } catch (err) {
          showAlert("destructive", "Erro", "Falha ao excluir o setor.");
        }
      },
    });
  };

  // Filtrar unidades baseado na busca
  const filteredUnidades = unidades.filter((unidade) => {
    const search = searchTerm.toLowerCase();
    return (
      unidade.nome.toLowerCase().includes(search) ||
      (unidade.tipo === "internacao" && "internação".includes(search)) ||
      (unidade.tipo === "nao-internacao" &&
        "não internação".includes(search)) ||
      (unidade.tipo === "neutro" && "neutro".includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Setores
        </h1>
        <button
          onClick={isFormVisible ? resetForm : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Setor"}
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Buscar por nome ou tipo de setor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary"
        />
      </div>

      {isFormVisible && (
        <Card className="animate-fade-in-down">
          <CardHeader>
            <CardTitle>
              {editingUnidade
                ? `Editando Setor`
                : !tipoUnidade
                ? "Qual tipo de setor deseja criar?"
                : `Adicionar Novo Setor`}
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
                <Button
                  variant="outline"
                  onClick={() => setTipoUnidade("neutro")}
                  className="flex-1 h-24 flex-col"
                >
                  <DollarSign className="h-8 w-8 text-secondary mb-2" />
                  <span>Setor Neutro</span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Setor</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome do Setor"
                    required
                    className="mt-1"
                  />
                </div>

                {tipoUnidade === "internacao" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroLeitos">Número de Leitos</Label>
                      <Input
                        id="numeroLeitos"
                        name="numeroLeitos"
                        type="number"
                        value={numeroLeitos}
                        onChange={(e) =>
                          setNumeroLeitos(Number(e.target.value))
                        }
                        placeholder="0"
                        required
                        disabled={!!editingUnidade}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="scpMetodoId">
                        Método SCP (Obrigatório)
                      </Label>
                      <Select
                        onValueChange={(val) => {
                          setScpMetodoId(val);
                          setError(null);
                        }}
                        value={scpMetodoId}
                      >
                        <SelectTrigger id="scpMetodoId" className="mt-1">
                          <SelectValue placeholder="Selecione um método" />
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
                  </div>
                )}
                {editingUnidade && tipoUnidade === "internacao" && (
                  <p className="text-xs text-gray-500 -mt-2">
                    O número de leitos não pode ser alterado na edição.
                  </p>
                )}

                {tipoUnidade === "nao-internacao" && (
                  <div>
                    <Label htmlFor="descricao">Descrição (Opcional)</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva brevemente o setor..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                )}

                {tipoUnidade === "neutro" && (
                  <>
                    <div className="flex flex-col">
                      <Label htmlFor="custoTotal">
                        Custo Total Mensal (R$)
                      </Label>
                      <CurrencyInput
                        value={custoTotal}
                        onChange={(val) => setCustoTotal(val)}
                        placeholder="R$ 0,00"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descricao">Descrição (Opcional)</Label>
                      <Textarea
                        id="descricao"
                        name="descricao"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva brevemente o setor..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t">
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
          {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUnidades.length > 0 ? (
                  filteredUnidades.map((unidade) => (
                    <TableRow key={unidade.id}>
                      <TableCell className="font-medium">
                        <span className="text-gray-800">{unidade.nome}</span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            unidade.tipo === "internacao"
                              ? "bg-blue-100 text-blue-800"
                              : unidade.tipo === "nao-internacao"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {unidade.tipo === "internacao"
                            ? "Internação"
                            : unidade.tipo === "nao-internacao"
                            ? "Não Internação"
                            : "Neutro"}
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
                      {searchTerm
                        ? "Nenhum setor encontrado com esse filtro."
                        : "Nenhum setor cadastrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {null}
    </div>
  );
}
