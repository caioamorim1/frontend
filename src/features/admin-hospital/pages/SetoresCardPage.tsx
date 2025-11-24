import { useParams } from "react-router-dom";
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
import UnidadeCard from "@/components/shared/UnidadeCard";

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Setores</h1>

      {/* Setores de Internação */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
          <Hospital className="h-6 w-6" />
          Setores de Internação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setoresInternacao.length > 0 ? (
            setoresInternacao.map((setor) => (
              <UnidadeCard
                key={setor.id}
                to={`/hospital/${hospitalId}/setores/${setor.id}`}
                icon={Hospital}
                title={setor.nome}
                subtitle={`${setor.leitos?.length || 0} leitos`}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Nenhum setor de internação cadastrado.
            </p>
          )}
        </div>
      </div>

      {/* Setores de Não Internação */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-primary flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          Setores de Não Internação
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {setoresNaoInternacao.length > 0 ? (
            setoresNaoInternacao.map((setor) => (
              <UnidadeCard
                key={setor.id}
                to={`/hospital/${hospitalId}/setores/${setor.id}`}
                icon={Building2}
                title={setor.nome}
                subtitle={`${sitiosCounts[setor.id] || 0} sítios funcionais`}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Nenhum setor de não internação cadastrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
