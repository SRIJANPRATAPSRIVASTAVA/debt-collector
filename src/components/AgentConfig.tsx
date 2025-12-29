import { useState } from "react";
import { Settings, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AgentConfigProps {
  agentId: string;
  onAgentIdChange: (id: string) => void;
}

export const AgentConfig = ({ agentId, onAgentIdChange }: AgentConfigProps) => {
  const [tempAgentId, setTempAgentId] = useState(agentId);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onAgentIdChange(tempAgentId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Configuration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuration de l'Agent</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="agent-id">ElevenLabs Agent ID</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Créez un agent sur{" "}
                    <a
                      href="https://elevenlabs.io/app/conversational-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      ElevenLabs Conversational AI
                    </a>{" "}
                    et copiez l'ID de l'agent.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="agent-id"
              placeholder="agent_xxxxxxxxxxxxxxxx"
              value={tempAgentId}
              onChange={(e) => setTempAgentId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              L'agent doit être configuré avec le système prompt français approprié sur ElevenLabs.
            </p>
          </div>
          <Button onClick={handleSave} className="w-full">
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
