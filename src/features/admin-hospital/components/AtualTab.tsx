import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Unidade,
  Cargo,
  getCargosByHospitalId,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AtualTabProps {
  unidade: Unidade;
  hospitalId: string;
  onUpdate: () => void; // Função para recarregar os dados da unidade
}

interface CargoUnidadeParaEdicao {
  cargoId: string;
  quantidade_funcionarios: number;
  nome?: string;
}

export default function AtualTab({ unidade, hospitalId, onUpdate }: AtualTabProps) {
  const { toast } = useToast();
  const [cargosHospital, setCargosHospital] = useState<Cargo[]>([]);
  const [cargosNaUnidade, setCargosNaUnidade] = useState<CargoUnidadeParaEdicao[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o formulário de adição
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    const carregarCargos = async () => {
      try {
        const cargosDoHospital = await getCargosByHospitalId(hospitalId);
        setCargosHospital(cargosDoHospital);
        
        const cargosAtuaisFormatados = (unidade.cargos_unidade || []).map(cu => ({
            cargoId: cu.cargo.id,
            quantidade_funcionarios: cu.quantidade_funcionarios,
            nome: cu.cargo.nome,
        }));
        setCargosNaUnidade(cargosAtuaisFormatados);

      } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar cargos do hospital.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    carregarCargos();
  }, [hospitalId, unidade.cargos_unidade, toast]);

  const handleAddCargo = () => {
    if (!selectedCargoId || quantidade <= 0) {
      toast({ title: "Atenção", description: "Selecione um cargo e uma quantidade válida.", variant: "destructive" });
      return;
    }

    if (cargosNaUnidade.find(c => c.cargoId === selectedCargoId)) {
      toast({ title: "Atenção", description: "Este cargo já foi adicionado à unidade.", variant: "destructive" });
      return;
    }

    const cargoInfo = cargosHospital.find(c => c.id === selectedCargoId);
    setCargosNaUnidade(prev => [
      ...prev,
      {
        cargoId: selectedCargoId,
        quantidade_funcionarios: quantidade,
        nome: cargoInfo?.nome || "Desconhecido",
      },
    ]);
    setSelectedCargoId("");
    setQuantidade(1);
  };

  const handleRemoveCargo = (cargoId: string) => {
    setCargosNaUnidade(prev => prev.filter(c => c.cargoId !== cargoId));
  };
  
  const handleSaveChanges = async () => {
    const payloadCargos = cargosNaUnidade.map(({ nome, ...resto }) => resto);

    try {
        if (unidade.tipo === 'internacao') {
            await updateUnidadeInternacao(unidade.id, { cargos_unidade: payloadCargos });
        } else {
            await updateUnidadeNaoInternacao(unidade.id, { cargos_unidade: payloadCargos });
        }
        toast({ title: "Sucesso!", description: "Quadro de cargos atualizado com sucesso." });
        onUpdate(); // Recarrega os dados na página pai
    } catch (error) {
        toast({ title: "Erro", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    }
  }

  const cargosDisponiveis = cargosHospital.filter(ch => !cargosNaUnidade.some(cu => cu.cargoId === ch.id));

  return (
    <div className="space-y-6">
      <div className="space-y-3 pt-4">
        <h3 className="font-semibold text-lg text-primary">
          Adicionar Cargos na Unidade
        </h3>
        <div className="flex items-center gap-4">
          <Select onValueChange={setSelectedCargoId} value={selectedCargoId} disabled={cargosDisponiveis.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cargo..." />
            </SelectTrigger>
            <SelectContent>
              {cargosDisponiveis.map((cargo) => (
                <SelectItem key={cargo.id} value={cargo.id}>
                  {cargo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            min="1"
            className="w-24"
            placeholder="Qtd."
          />
          <Button type="button" onClick={handleAddCargo} size="icon" disabled={!selectedCargoId}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg text-primary mb-2">
          Cargos Atuais na Unidade
        </h3>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cargosNaUnidade.map((cargo) => (
                        <TableRow key={cargo.cargoId}>
                            <TableCell>{cargo.nome}</TableCell>
                            <TableCell>{cargo.quantidade_funcionarios}</TableCell>
                            <TableCell className="text-right">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveCargo(cargo.cargoId)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                     {cargosNaUnidade.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                Nenhum cargo adicionado a esta unidade.
                            </TableCell>
                        </TableRow>
                     )}
                </TableBody>
            </Table>
        </div>
      </div>
      <div className="flex justify-end">
          <Button onClick={handleSaveChanges}>
              Salvar Alterações
          </Button>
      </div>
    </div>
  );
}