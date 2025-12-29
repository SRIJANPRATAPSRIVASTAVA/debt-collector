import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestScenario {
  id: string;
  name: string;
  description: string;
  messages: Array<{ role: string; content: string | null }>;
  expected_outcomes: string[];
  category: string;
}

interface TestResult {
  scenario_id: string;
  scenario_name: string;
  success: boolean;
  response_time_ms: number;
  transcript: Array<{ role: string; content: string }>;
  outcomes_met: string[];
  outcomes_missed: string[];
  error?: string;
}

const outcomePatterns: Record<string, RegExp[]> = {
  identification_confirmed: [/confirm/i, /identit/i, /date de naissance/i, /vérifié/i],
  proceed_to_payment: [/paiement/i, /solde/i, /montant/i, /facture/i],
  wrong_person_handled: [/merci/i, /bonne journée/i, /excus/i],
  polite_closure: [/merci/i, /bonne journée/i, /au revoir/i, /à bientôt/i],
  human_like_response: [/conseill/i, /je suis/i, /pas un robot/i, /humain/i],
  continue_conversation: [/puis-je/i, /comment/i, /aider/i],
  payment_link_offered: [/lien/i, /sécurisé/i, /email/i, /sms/i],
  email_confirmation: [/email/i, /envoy/i, /confirm/i],
  empathy_shown: [/comprends/i, /difficile/i, /solution/i, /accompagner/i],
  callback_offered: [/rappel/i, /moment/i, /convien/i],
  clarification_provided: [/expliqu/i, /concern/i, /facture/i, /compte/i],
  understanding_confirmed: [/d'accord/i, /compris/i, /parfait/i],
  calm_response: [/comprends/i, /frustration/i, /calme/i],
  deescalation: [/solution/i, /aider/i, /ensemble/i],
  french_maintained: [/français/i, /désolé/i, /disponible/i],
  polite_redirect: [/puis-je/i, /aider/i, /français/i],
  dispute_acknowledged: [/comprends/i, /point de vue/i, /examiner/i],
  escalation_offered: [/responsable/i, /rappel/i, /dossier/i],
  callback_scheduled: [/heure/i, /rappel/i, /noté/i, /confirm/i],
  partial_payment_discussed: [/partiel/i, /moitié/i, /possible/i, /arrangement/i],
  options_provided: [/option/i, /alternative/i, /possib/i],
  privacy_addressed: [/coordonnées/i, /relation commerciale/i, /légal/i],
  legitimacy_explained: [/cadre/i, /relation/i, /commerciale/i],
};

const checkOutcomes = (response: string, expectedOutcomes: string[]): { met: string[]; missed: string[] } => {
  const met: string[] = [];
  const missed: string[] = [];

  for (const outcome of expectedOutcomes) {
    const patterns = outcomePatterns[outcome] || [];
    const isMatched = patterns.some(pattern => pattern.test(response));
    if (isMatched) {
      met.push(outcome);
    } else {
      missed.push(outcome);
    }
  }

  return { met, missed };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { scenarios, systemPrompt }: { scenarios: TestScenario[]; systemPrompt: string } = await req.json();

    console.log(`Running ${scenarios.length} test scenarios`);

    const results: TestResult[] = [];
    const responseTimes: number[] = [];

    for (const scenario of scenarios) {
      const transcript: Array<{ role: string; content: string }> = [];
      let lastAssistantResponse = "";
      
      try {
        const startTime = Date.now();
        
        // Build conversation history from scenario messages
        const conversationMessages = [];
        for (const msg of scenario.messages) {
          if (msg.role === "user" && msg.content) {
            conversationMessages.push({ role: "user", content: msg.content });
            transcript.push({ role: "user", content: msg.content });
          }
        }

        // Get AI response for the full conversation
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationMessages,
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        if (!response.ok) {
          throw new Error(`AI Gateway error: ${response.status}`);
        }

        const data = await response.json();
        lastAssistantResponse = data.choices?.[0]?.message?.content || "";
        transcript.push({ role: "assistant", content: lastAssistantResponse });

        const { met, missed } = checkOutcomes(lastAssistantResponse, scenario.expected_outcomes);
        const success = missed.length === 0 || met.length >= scenario.expected_outcomes.length * 0.5;

        results.push({
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          success,
          response_time_ms: responseTime,
          transcript,
          outcomes_met: met,
          outcomes_missed: missed,
        });

        console.log(`Scenario ${scenario.id}: ${success ? 'PASS' : 'FAIL'} (${responseTime}ms)`);

      } catch (error) {
        results.push({
          scenario_id: scenario.id,
          scenario_name: scenario.name,
          success: false,
          response_time_ms: 0,
          transcript,
          outcomes_met: [],
          outcomes_missed: scenario.expected_outcomes,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error(`Scenario ${scenario.id} error:`, error);
      }
    }

    // Calculate summary statistics
    const successful = results.filter(r => r.success).length;
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const handoffScenarios = results.filter(r => 
      r.outcomes_met.includes("escalation_offered") || 
      r.outcomes_met.includes("callback_offered")
    );

    const summary = {
      total_scenarios: scenarios.length,
      successful,
      failed: scenarios.length - successful,
      success_rate: successful / scenarios.length,
      avg_response_time_ms: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      p95_response_time_ms: sortedTimes[p95Index] || 0,
      handoff_rate: handoffScenarios.length / scenarios.length,
      results,
      notable_failures: results.filter(r => !r.success).slice(0, 3),
      example_transcripts: results.filter(r => r.success).slice(0, 3),
      run_at: new Date().toISOString(),
    };

    console.log(`Test run complete: ${successful}/${scenarios.length} passed`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Test run error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
