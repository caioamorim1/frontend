import { useState, useEffect, useMemo } from "react";
import {
  Unidade,
  Cargo,
  getCargosByHospitalId,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MinusCircle, PlusCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import _ from 'lodash'; // Import lodash for deep comparison

interface AtualTabProps {
  unidade: Unidade;
  hospitalId: string;
  onUpdate: () => void; // Função para recarregar os dados da unidade
}

interface CargoUnidadeState {
  cargoId: string;
  quantidade_funcionarios: number;
}

// Componente para o input de ajuste
const AjusteInput = ({ value, onChange }: { value: number, onChange: (newValue: number) => void }) => (
    <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(value - 1)} disabled={value <= 0}>
            <MinusCircle className="h-5 w-5 text-red-500"/>
        </Button>
        <span className="font-bold text-lg w-10 text-center">{value}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(value + 1)}>
            <PlusCircle className="h-5 w-5 text-green-500"/>
        </Button>
    </div>
);


export default function AtualTab({ unidade, hospitalId, onUpdate }: AtualTabProps) {
  const { toast } = useToast();
  const [cargosHospital, setCargosHospital] = useState<Cargo[]>([]);
  const [cargosNaUnidade, setCargosNaUnidade] = useState<CargoUnidadeState[]>([]);
  const [initialState, setInitialState] = useState<CargoUnidadeState[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    // Compara o estado atual com o inicial para ver se há mudanças
    return !_.isEqual(
        _.sortBy(cargosNaUnidade, 'cargoId'), 
        _.sortBy(initialState, 'cargoId')
    );
  }, [cargosNaUnidade, initialState]);

  useEffect(() => {
    const carregarCargos = async () => {
      setLoading(true);
      try {
        const cargosDoHospital = await getCargosByHospitalId(hospitalId);
        setCargosHospital(cargosDoHospital);
        
        const cargosAtuaisFormatados = (unidade.cargos_unidade || []).map(cu => ({
            cargoId: cu.cargo.id,
            quantidade_funcionarios: cu.quantidade_funcionarios,
        }));
        
        setCargosNaUnidade(cargosAtuaisFormatados);
        setInitialState(_.cloneDeep(cargosAtuaisFormatados)); // Salva o estado inicial

      } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar cargos do hospital.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    carregarCargos();
  }, [hospitalId, unidade.cargos_unidade, toast]);

  const handleQuantidadeChange = (cargoId: string, novaQuantidade: number) => {
    const novaQtd = Math.max(0, novaQuantidade); // Garante que não seja negativo
    
    setCargosNaUnidade(prev => {
        const cargoExistente = prev.find(c => c.cargoId === cargoId);
        if (cargoExistente) {
            // Se a nova quantidade for 0, remove o cargo da lista
            if (novaQtd === 0) {
                return prev.filter(c => c.cargoId !== cargoId);
            }
            // Se já existe, atualiza a quantidade
            return prev.map(c => c.cargoId === cargoId ? { ...c, quantidade_funcionarios: novaQtd } : c);
        } else if (novaQtd > 0) {
            // Se não existe e a quantidade é maior que 0, adiciona
            return [...prev, { cargoId, quantidade_funcionarios: novaQtd }];
        }
        return prev; // Se não mudou, retorna o estado anterior
    });
  };
  
  const handleSaveChanges = async () => {
    setSaving(true);
    const payloadCargos = cargosNaUnidade.map(({ ...resto }) => resto);

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
    } finally {
        setSaving(false);
    }
  }

  if (loading) {
      return <Skeleton className="h-64 w-full" />
  }

  return (
    <div className="space-y-6 animate-fade-in-down">
        <h3 className="font-semibold text-lg text-primary">
          Gerenciar Quadro de Funcionários
        </h3>
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60%]">Cargo</TableHead>
                        <TableHead className="text-center">Quantidade</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cargosHospital.map((cargo) => {
                        const naUnidade = cargosNaUnidade.find(c => c.cargoId === cargo.id);
                        const quantidade = naUnidade ? naUnidade.quantidade_funcionarios : 0;
                        return (
                            <TableRow key={cargo.id}>
                                <TableCell className="font-medium">{cargo.nome}</TableCell>
                                <TableCell>
                                    <AjusteInput 
                                        value={quantidade}
                                        onChange={(novaQtd) => handleQuantidadeChange(cargo.id, novaQtd)}
                                    />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                     {cargosHospital.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                Nenhum cargo cadastrado neste hospital.
                            </TableCell>
                        </TableRow>
                     )}
                </TableBody>
            </Table>
        </div>
      
      {hasChanges && (
        <div className="flex justify-end sticky bottom-4">
          <Button onClick={handleSaveChanges} disabled={saving} className="shadow-lg animate-in fade-in-0 zoom-in-95">
              <Save className="mr-2 h-4 w-4"/>
              {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
      </div>
      )}
    </div>
  );
}