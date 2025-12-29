import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientSelectorProps {
  clients: Array<{ id: string; name: string; color: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export const ClientSelector = ({ clients, selectedId, onSelect }: ClientSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {clients.map((client) => (
        <button
          key={client.id}
          onClick={() => onSelect(client.id)}
          className={cn(
            "relative px-4 py-2 rounded-full border-2 transition-all duration-200",
            "hover:shadow-md transform hover:scale-105",
            selectedId === client.id
              ? "border-transparent text-white shadow-lg"
              : "border-muted bg-background text-foreground hover:border-primary/50"
          )}
          style={{
            backgroundColor: selectedId === client.id ? client.color : undefined,
          }}
        >
          <span className="font-medium">{client.name}</span>
          {selectedId === client.id && (
            <Check className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary rounded-full p-0.5" />
          )}
        </button>
      ))}
    </div>
  );
};
