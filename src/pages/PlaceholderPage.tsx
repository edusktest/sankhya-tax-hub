import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const location = useLocation();
  const name = location.pathname.replace("/", "").replace(/-/g, " ");

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
      <Construction className="h-12 w-12 mb-4 text-primary/40" />
      <h2 className="text-lg font-medium capitalize">{name}</h2>
      <p className="text-sm mt-1">Em desenvolvimento</p>
    </div>
  );
}
