import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUnidadesInternacao, UnidadeInternacao } from "@/lib/api";
import { useParams } from "react-router-dom";
import { Building } from "lucide-react";
import UnidadeCard from "@/components/shared/UnidadeCard";

export default function MinhasUnidadesPage() {
  const { user } = useAuth();
  const { hospitalId: hospitalIdFromParams } = useParams<{
    hospitalId: string;
  }>();
  const [unidades, setUnidades] = useState<UnidadeInternacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usa o ID do hospital da URL se for um admin, ou do utilizador se for um colaborador
  const hospitalId = hospitalIdFromParams || user?.hospital?.id;

  useEffect(() => {
    if (hospitalId) {
      const fetchUnidades = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getUnidadesInternacao(hospitalId);
          setUnidades(data);
        } catch (err) {
          console.error("Falha ao buscar unidades", err);
          setError("Não foi possível carregar as unidades.");
        } finally {
          setLoading(false);
        }
      };
      fetchUnidades();
    } else {
      setLoading(false);
      setError("Hospital não identificado.");
    }
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        Unidades de Internação
      </h1>

      {loading && <p>A carregar unidades...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unidades.length > 0 ? (
            unidades.map((unidade) => (
              <UnidadeCard
                key={unidade.id}
                to={`/hospital/${hospitalId}/unidade/${unidade.id}/leitos`}
                icon={Building}
                title={unidade.nome}
                subtitle={`${unidade.leitos?.length || 0} leitos`}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Nenhuma unidade de internação encontrada para este hospital.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
