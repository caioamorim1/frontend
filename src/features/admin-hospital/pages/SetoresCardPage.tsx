import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Hospital } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getUnidadesInternacao,
  getUnidadesNaoInternacao,
  Unidade,
} from "@/lib/api";

export default function SetoresCardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [setoresInternacao, setSetoresInternacao] = useState<Unidade[]>([]);
  const [setoresNaoInternacao, setSetoresNaoInternacao] = useState<Unidade[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSetores = async () => {
      if (!hospitalId) return;
      setLoading(true);
      try {
        const [internacao, naoInternacao] = await Promise.all([
          getUnidadesInternacao(hospitalId),
          getUnidadesNaoInternacao(hospitalId),
        ]);
        setSetoresInternacao(internacao);
        setSetoresNaoInternacao(naoInternacao);
      } catch (error) {
        console.error("Erro ao carregar setores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSetores();
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando setores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Building2 /> Setores
        </h2>
      </div>

      {/* Setores de Internação */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
          <Hospital className="h-6 w-6" />
          Setores de Internação
        </h3>
        {setoresInternacao.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum setor de internação cadastrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setoresInternacao.map((setor) => (
              <Link
                key={setor.id}
                to={`/hospital/${hospitalId}/gerir-setores/${setor.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-secondary h-full">
                  <CardContent className="flex items-center justify-between p-6">
                    <CardTitle className="text-lg font-bold">
                      {setor.nome}
                    </CardTitle>
                    <Hospital className="h-6 w-6 text-secondary flex-shrink-0 ml-4" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Setores de Não Internação */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Setores de Não Internação
        </h3>
        {setoresNaoInternacao.length === 0 ? (
          <p className="text-muted-foreground">
            Nenhum setor de não internação cadastrado.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {setoresNaoInternacao.map((setor) => (
              <Link
                key={setor.id}
                to={`/hospital/${hospitalId}/gerir-setores/${setor.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-secondary h-full">
                  <CardContent className="flex items-center justify-between p-6">
                    <CardTitle className="text-lg font-bold">
                      {setor.nome}
                    </CardTitle>
                    <Building2 className="h-6 w-6 text-secondary flex-shrink-0 ml-4" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
