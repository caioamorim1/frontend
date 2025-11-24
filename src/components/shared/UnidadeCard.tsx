import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface UnidadeCardProps {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export default function UnidadeCard({
  to,
  icon: Icon,
  title,
  subtitle,
}: UnidadeCardProps) {
  return (
    <Link
      to={to}
      className="block p-6 bg-white border rounded-lg shadow-sm hover:shadow-lg hover:border-secondary transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="bg-secondary/10 p-3 rounded-full">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-primary">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
