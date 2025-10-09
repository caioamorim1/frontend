import { useState, useEffect } from "react";
import { SitioDistribuicao } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Users } from "lucide-react";

interface DistribuicaoTurnosFormProps {
  distribuicoes: SitioDistribuicao[];
  onChange: (distribuicoes: SitioDistribuicao[]) => void;
  readonly?: boolean;
}

export default function DistribuicaoTurnosForm({
  distribuicoes,
  onChange,
  readonly = false,
}: DistribuicaoTurnosFormProps) {
  const [enfData, setEnfData] = useState<SitioDistribuicao>({
    categoria: "ENF",
    segSexManha: 0,
    segSexTarde: 0,
    segSexNoite1: 0,
    segSexNoite2: 0,
    sabDomManha: 0,
    sabDomTarde: 0,
    sabDomNoite1: 0,
    sabDomNoite2: 0,
  });

  const [tecData, setTecData] = useState<SitioDistribuicao>({
    categoria: "TEC",
    segSexManha: 0,
    segSexTarde: 0,
    segSexNoite1: 0,
    segSexNoite2: 0,
    sabDomManha: 0,
    sabDomTarde: 0,
    sabDomNoite1: 0,
    sabDomNoite2: 0,
  });

  // Inicializa com dados existentes
  useEffect(() => {
    const enfExistente = distribuicoes.find((d) => d.categoria === "ENF");
    const tecExistente = distribuicoes.find((d) => d.categoria === "TEC");

    if (enfExistente) {
      setEnfData(enfExistente);
    }
    if (tecExistente) {
      setTecData(tecExistente);
    }
  }, [distribuicoes]);

  // Função para atualizar o pai quando os dados mudam
  const notifyChange = (
    newEnfData: SitioDistribuicao,
    newTecData: SitioDistribuicao
  ) => {
    onChange([newEnfData, newTecData]);
  };

  const updateField = (
    categoria: "ENF" | "TEC",
    field: keyof Omit<SitioDistribuicao, "id" | "categoria">,
    value: number
  ) => {
    if (readonly) return;

    const newValue = Math.max(0, value);

    if (categoria === "ENF") {
      const newEnfData = { ...enfData, [field]: newValue };
      setEnfData(newEnfData);
      notifyChange(newEnfData, tecData);
    } else {
      const newTecData = { ...tecData, [field]: newValue };
      setTecData(newTecData);
      notifyChange(enfData, newTecData);
    }
  };

  const renderFormGroup = (
    categoria: "ENF" | "TEC",
    data: SitioDistribuicao
  ) => {
    return (
      <div className="space-y-6">
        {/* Segunda a Sexta */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Users className="h-5 w-5" />
            Segunda a Sexta (5 dias)
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor={`${categoria}-seg-manha`}>Manhã</Label>
              <Input
                id={`${categoria}-seg-manha`}
                type="number"
                min="0"
                value={data.segSexManha}
                onChange={(e) =>
                  updateField(categoria, "segSexManha", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-seg-tarde`}>Tarde</Label>
              <Input
                id={`${categoria}-seg-tarde`}
                type="number"
                min="0"
                value={data.segSexTarde}
                onChange={(e) =>
                  updateField(categoria, "segSexTarde", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-seg-noite1`}>
                Noite 1 (19h-1h)
              </Label>
              <Input
                id={`${categoria}-seg-noite1`}
                type="number"
                min="0"
                value={data.segSexNoite1}
                onChange={(e) =>
                  updateField(categoria, "segSexNoite1", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-seg-noite2`}>Noite 2 (1h-7h)</Label>
              <Input
                id={`${categoria}-seg-noite2`}
                type="number"
                min="0"
                value={data.segSexNoite2}
                onChange={(e) =>
                  updateField(categoria, "segSexNoite2", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Sábado e Domingo */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Users className="h-5 w-5" />
            Sábado e Domingo (2 dias)
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor={`${categoria}-sab-manha`}>Manhã</Label>
              <Input
                id={`${categoria}-sab-manha`}
                type="number"
                min="0"
                value={data.sabDomManha}
                onChange={(e) =>
                  updateField(categoria, "sabDomManha", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-sab-tarde`}>Tarde</Label>
              <Input
                id={`${categoria}-sab-tarde`}
                type="number"
                min="0"
                value={data.sabDomTarde}
                onChange={(e) =>
                  updateField(categoria, "sabDomTarde", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-sab-noite1`}>
                Noite 1 (19h-1h)
              </Label>
              <Input
                id={`${categoria}-sab-noite1`}
                type="number"
                min="0"
                value={data.sabDomNoite1}
                onChange={(e) =>
                  updateField(categoria, "sabDomNoite1", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`${categoria}-sab-noite2`}>Noite 2 (1h-7h)</Label>
              <Input
                id={`${categoria}-sab-noite2`}
                type="number"
                min="0"
                value={data.sabDomNoite2}
                onChange={(e) =>
                  updateField(categoria, "sabDomNoite2", Number(e.target.value))
                }
                disabled={readonly}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Aviso importante */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <span className="font-bold">Importante:</span> Informe a quantidade
            de profissionais <span className="font-bold">por turno</span>, não o
            total. O sistema calculará automaticamente o dimensionamento
            semanal.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribuição de Enfermeiros e Técnicos por Turno
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ENF" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ENF" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Enfermeiros
            </TabsTrigger>
            <TabsTrigger value="TEC" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Técnicos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ENF" className="mt-4">
            {renderFormGroup("ENF", enfData)}
          </TabsContent>

          <TabsContent value="TEC" className="mt-4">
            {renderFormGroup("TEC", tecData)}
          </TabsContent>
        </Tabs>

        {!readonly && (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Importante:</strong> Informe a quantidade de profissionais{" "}
              <strong>por turno</strong>, não o total. O sistema calculará
              automaticamente o dimensionamento semanal.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
