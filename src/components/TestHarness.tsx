import { useState } from "react";
import { Play, Loader2, CheckCircle, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { ClientPreset, TestSummary } from "@/types/client";
import { generateSystemPrompt } from "@/lib/systemPrompt";
import scenariosData from "@/config/test-scenarios.json";
import { useToast } from "@/hooks/use-toast";

interface TestHarnessProps {
  clientPreset: ClientPreset;
}

export const TestHarness = ({ clientPreset }: TestHarnessProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setSummary(null);

    try {
      const systemPrompt = generateSystemPrompt(clientPreset);

      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke("run-tests", {
        body: {
          scenarios: scenariosData.scenarios,
          systemPrompt,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        throw new Error(error.message);
      }

      setSummary(data as TestSummary);
      toast({
        title: "Tests terminés",
        description: `${data.successful}/${data.total_scenarios} scénarios réussis`,
      });
    } catch (error) {
      console.error("Test run error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'exécuter les tests.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadReport = () => {
    if (!summary) return;

    const report = generateMarkdownReport(summary);
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Test Automatisé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Exécute {scenariosData.scenarios.length} scénarios de test contre l'agent pour {clientPreset.name}.
          </p>

          <Button
            onClick={runTests}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exécution en cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Lancer les tests
              </>
            )}
          </Button>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                {progress}% complété
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {summary && (
        <>
          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-primary">
                    {(summary.success_rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taux de succès</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {summary.successful}
                  </div>
                  <div className="text-sm text-muted-foreground">Réussis</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold text-destructive">
                    {summary.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Échoués</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">
                    {summary.avg_response_time_ms.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Temps moyen</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Temps P95:</span>
                  <span className="font-medium">{summary.p95_response_time_ms.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span>Taux de transfert:</span>
                  <span className="font-medium">{(summary.handoff_rate * 100).toFixed(0)}%</span>
                </div>
              </div>

              <Button onClick={downloadReport} variant="outline" className="w-full mt-4">
                <FileText className="w-4 h-4 mr-2" />
                Télécharger le rapport (Markdown)
              </Button>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Détails des scénarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary.results.map((result) => (
                  <div
                    key={result.scenario_id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <div>
                        <div className="font-medium">{result.scenario_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.outcomes_met.length}/{result.outcomes_met.length + result.outcomes_missed.length} objectifs atteints
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {result.response_time_ms}ms
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Example Transcripts */}
          {summary.example_transcripts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Exemples de conversations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summary.example_transcripts.slice(0, 2).map((result) => (
                  <div key={result.scenario_id} className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">{result.scenario_name}</div>
                    <div className="space-y-2">
                      {result.transcript.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`text-sm p-2 rounded ${
                            msg.role === "user"
                              ? "bg-muted ml-8"
                              : "bg-primary/10 mr-8"
                          }`}
                        >
                          <span className="font-medium">
                            {msg.role === "user" ? "Utilisateur" : "Agent"}:
                          </span>{" "}
                          {msg.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

function generateMarkdownReport(summary: TestSummary): string {
  return `# Rapport de Test - Agent de Recouvrement

**Date:** ${new Date(summary.run_at).toLocaleString("fr-FR")}

## Résumé

| Métrique | Valeur |
|----------|--------|
| Scénarios totaux | ${summary.total_scenarios} |
| Réussis | ${summary.successful} |
| Échoués | ${summary.failed} |
| **Taux de succès** | **${(summary.success_rate * 100).toFixed(1)}%** |
| Temps de réponse moyen | ${summary.avg_response_time_ms.toFixed(0)}ms |
| Temps de réponse P95 | ${summary.p95_response_time_ms.toFixed(0)}ms |
| Taux de transfert | ${(summary.handoff_rate * 100).toFixed(1)}% |

## Justification des scénarios

Les ${summary.total_scenarios} scénarios couvrent:
- **Identification** : Vérification d'identité réussie et mauvaise personne
- **Paiement** : Acceptation, demande de délai, paiement partiel
- **Émotions** : Appelant en colère, confus, stressé
- **Cas limites** : Question robot, changement de langue, vie privée
- **Escalade** : Contestation de dette, demande de rappel

Cette couverture assure que l'agent gère correctement les situations courantes ET exceptionnelles.

## Résultats détaillés

${summary.results.map(r => `### ${r.scenario_name}
- **Statut:** ${r.success ? "✅ Réussi" : "❌ Échoué"}
- **Temps de réponse:** ${r.response_time_ms}ms
- **Objectifs atteints:** ${r.outcomes_met.join(", ") || "Aucun"}
- **Objectifs manqués:** ${r.outcomes_missed.join(", ") || "Aucun"}
${r.error ? `- **Erreur:** ${r.error}` : ""}
`).join("\n")}

## Exemples de transcriptions

${summary.example_transcripts.slice(0, 3).map(t => `### ${t.scenario_name}

${t.transcript.map(m => `**${m.role === "user" ? "Utilisateur" : "Agent"}:** ${m.content}`).join("\n\n")}
`).join("\n---\n\n")}

## Échecs notables

${summary.notable_failures.length === 0 ? "Aucun échec notable." : summary.notable_failures.map(f => `### ${f.scenario_name}
- **Objectifs manqués:** ${f.outcomes_missed.join(", ")}
${f.error ? `- **Erreur:** ${f.error}` : ""}
`).join("\n")}

---
*Rapport généré automatiquement par le système de test*
`;
}
