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
  Unidade,
  ScpMetodo,
  createSnapshotHospitalSectors,
} from "@/lib/api";
import { Trash2, Edit, Hospital, Building2 } from "lucide-react";
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
import ConfirmationModal from "../components/ConfirmationModal";

export default function SetoresPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [scpMetodos, setScpMetodos] = useState<ScpMetodo[]>([]);
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
  const [isModalOpen, setModalOpen] = useState(false);

  const handleConfirm = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      await createSnapshotHospitalSectors(hospitalId);

      // Opcional: recarregar os dados após criar o snapshot
      await fetchData();
      return true;
    } catch (error: any) {
      console.error("❌ Erro ao criar snapshot:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Erro ao criar snapshot";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  const fetchData = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const [internacaoData, naoInternacaoData, scpData] = await Promise.all([
        getUnidadesInternacao(hospitalId),
        getUnidadesNaoInternacao(hospitalId),
        getScpMetodos(),
      ]);
      setUnidades([...internacaoData, ...naoInternacaoData]);
      setScpMetodos(scpData);
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
    // Sanitiza valores vindos da API
    const reaisRaw = (unidade.horas_extra_reais || "").toString();
    const reais = reaisRaw.includes(",")
      ? reaisRaw.replace(/\./g, "").replace(/,/g, ".")
      : reaisRaw;
    setHorasExtraReais(reais);
    const proj = (unidade.horas_extra_projetadas || "")
      .toString()
      .replace(/\D/g, "");
    setHorasExtraProjetadas(proj);

    if (unidade.tipo === "internacao") {
      setNumeroLeitos(unidade.leitos?.length || 0);
      setScpMetodoId(unidade.scpMetodoKey || "");
    } else {
      setDescricao(unidade.descricao || "");
    }

    setIsFormVisible(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !tipoUnidade) return;

    try {
      // Normaliza os valores antes de enviar
      const normalizedHorasExtraReais =
        horas_extra_reais && horas_extra_reais.trim() !== ""
          ? horas_extra_reais
          : "0.00";
      const onlyDigitsProj = (horas_extra_projetadas || "").replace(/\D/g, "");
      const normalizedHorasExtraProjetadas =
        onlyDigitsProj === "" ? "0" : String(parseInt(onlyDigitsProj, 10));

      if (editingUnidade) {
        if (tipoUnidade === "internacao") {
          await updateUnidadeInternacao(editingUnidade.id, {
            nome,
            scpMetodoId,
            horas_extra_reais: normalizedHorasExtraReais,
            horas_extra_projetadas: normalizedHorasExtraProjetadas,
          });
        } else {
          await updateUnidadeNaoInternacao(editingUnidade.id, {
            nome,
            descricao,
            horas_extra_reais: normalizedHorasExtraReais,
            horas_extra_projetadas: normalizedHorasExtraProjetadas,
          });
        }
      } else {
        if (tipoUnidade === "internacao") {
          await createUnidadeInternacao({
            hospitalId,
            nome,
            numeroLeitos,
            scpMetodoId,
            horas_extra_reais: normalizedHorasExtraReais,
            horas_extra_projetadas: normalizedHorasExtraProjetadas,
            cargos_unidade: [], // Inicia sem cargos
          });
        } else {
          await createUnidadeNaoInternacao({
            hospitalId,
            nome,
            descricao,
            horas_extra_reais: normalizedHorasExtraReais,
            horas_extra_projetadas: normalizedHorasExtraProjetadas,
            cargos_unidade: [], // Inicia sem cargos..
          });
        }
      }

      resetForm();
      fetchData();
    } catch (err) {
      const action = editingUnidade ? "atualizar" : "criar";
      setError(`Falha ao ${action} o setor.`);
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
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            onClick={isFormVisible ? resetForm : handleAddNew}
            variant={isFormVisible ? "outline" : "default"}
          >
            {isFormVisible ? "Cancelar" : "+ Novo Setor"}
          </Button>
          <Button onClick={() => setModalOpen(true)} variant={"default"}>
            {"Gerar Baseline"}
          </Button>
        </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horas_extra_reais">Horas Extra (R$)</Label>
                    <CurrencyInput
                      id="horas_extra_reais"
                      name="horas_extra_reais"
                      value={horas_extra_reais}
                      onChange={(val) => setHorasExtraReais(val)}
                      placeholder="R$ 0,00"
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="horas_extra_projetadas">
                      Horas Extra Projetadas (horas)
                    </Label>
                    <Input
                      id="horas_extra_projetadas"
                      name="horas_extra_projetadas"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={horas_extra_projetadas}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, "");
                        setHorasExtraProjetadas(onlyDigits);
                      }}
                      placeholder="Ex: 100"
                      className="mt-1"
                    />
                  </div>
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
                      <Label htmlFor="scpMetodoId">Método SCP (Opcional)</Label>
                      <Select
                        onValueChange={setScpMetodoId}
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
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
        title="Confirmar Nova Baseline"
        description="Deseja gerar a baseline com os dados atuais do hospital? Atenção: esta ação irá sobrescrever qualquer versão salva anteriormente."
      />
    </div>
  );
}
