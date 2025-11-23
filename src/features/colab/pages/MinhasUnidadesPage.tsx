import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUnidadesInternacao, UnidadeInternacao } from "@/lib/api";
import { Link, useParams } from "react-router-dom";
import { Building } from "lucide-react";

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
              <Link
                to={`/hospital/${hospitalId}/unidade/${unidade.id}/leitos`}
                key={unidade.id}
                className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-lg hover:border-secondary transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-secondary/10 p-3 rounded-full">
                    <Building className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-primary">
                      {unidade.nome}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {unidade.leitos?.length || 0} leitos
                    </p>
                  </div>
                </div>
              </Link>
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
