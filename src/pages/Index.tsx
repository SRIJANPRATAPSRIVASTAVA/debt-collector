import { useState, useEffect } from "react";
import { Phone, TestTube, FileJson } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAgent } from "@/components/VoiceAgent";
import { ClientSelector } from "@/components/ClientSelector";
import { TestHarness } from "@/components/TestHarness";
import { AgentConfig } from "@/components/AgentConfig";
import { useClientPresets } from "@/hooks/useClientPresets";

const Index = () => {
  const { currentPreset, selectedClientId, selectClient, getClientList } = useClientPresets();
  const [agentId, setAgentId] = useState("");

  useEffect(() => {
    const savedAgentId = localStorage.getItem("elevenlabs_agent_id");
    if (savedAgentId) {
      setAgentId(savedAgentId);
    }
  }, []);

  const handleAgentIdChange = (id: string) => {
    setAgentId(id);
    localStorage.setItem("elevenlabs_agent_id", id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agent de Recouvrement</h1>
            <p className="text-sm text-muted-foreground">Recouvrement respectueux et professionnel</p>
          </div>
          <AgentConfig agentId={agentId} onAgentIdChange={handleAgentIdChange} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              Client Actif
            </CardTitle>
            <CardDescription>Sélectionnez le client pour adapter le ton et les formulations</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientSelector clients={getClientList()} selectedId={selectedClientId} onSelect={selectClient} />
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Salutation:</span>{" "}
                <span className="text-muted-foreground">{currentPreset.greeting}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="voice" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Agent Vocal
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <TestTube className="w-4 h-4" />
              Tests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Démonstration Vocale</CardTitle>
                <CardDescription>Cliquez sur le bouton pour démarrer une conversation</CardDescription>
              </CardHeader>
              <CardContent className="py-8">
                <VoiceAgent clientPreset={currentPreset} agentId={agentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <TestHarness clientPreset={currentPreset} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
