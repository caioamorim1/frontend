import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Hospital, Bed, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getUnidadesInternacao,
  getUnidadesNaoInternacao,
  Unidade,
  UnidadeInternacao,
  UnidadeNaoInternacao,
  getSitiosFuncionaisByUnidadeId,
} from "@/lib/api";

export default function SetoresCardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [setoresInternacao, setSetoresInternacao] = useState<UnidadeInternacao[]>([]);
  const [setoresNaoInternacao, setSetoresNaoInternacao] = useState<UnidadeNaoInternacao[]>([]);
  const [sitiosCounts, setSitiosCounts] = useState<Record<string, number>>({});
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

        // Buscar quantidade de sítios para cada setor de não-internação
        const sitiosPromises = naoInternacao.map(async (setor) => {
          try {
            const sitios = await getSitiosFuncionaisByUnidadeId(setor.id);
            return { id: setor.id, count: sitios.length };
          } catch {
            return { id: setor.id, count: 0 };
          }
        });

        const sitiosResults = await Promise.all(sitiosPromises);
        const sitiosMap = sitiosResults.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {} as Record<string, number>);
        
        setSitiosCounts(sitiosMap);
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
                to={`/hospital/${hospitalId}/setores/${setor.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-secondary h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-lg font-bold">
                        {setor.nome}
                      </CardTitle>
                      <Hospital className="h-6 w-6 text-secondary flex-shrink-0 ml-4" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      <span>{setor.leitos?.length || 0} leitos</span>
                    </div>
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
                to={`/hospital/${hospitalId}/setores/${setor.id}`}
              >
                <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-secondary h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-lg font-bold">
                        {setor.nome}
                      </CardTitle>
                      <Building2 className="h-6 w-6 text-secondary flex-shrink-0 ml-4" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{sitiosCounts[setor.id] || 0} sítios funcionais</span>
                    </div>
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
