export interface ClientPreset {
  name: string;
  greeting: string;
  tone: 'formal' | 'tech_friendly' | 'supportive';
  company_mention: string;
  payment_intro: string;
  payment_link_text: string;
  followup_text: string;
  closing: string;
  primary_color: string;
}

export interface ClientPresetsConfig {
  clients: Record<string, ClientPreset>;
  default_client: string;
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string | null }>;
  expected_outcomes: string[];
  category: string;
}

export interface TestResult {
  scenario_id: string;
  scenario_name: string;
  success: boolean;
  response_time_ms: number;
  transcript: Array<{ role: string; content: string }>;
  outcomes_met: string[];
  outcomes_missed: string[];
  error?: string;
}

export interface TestSummary {
  total_scenarios: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  handoff_rate: number;
  results: TestResult[];
  notable_failures: TestResult[];
  example_transcripts: TestResult[];
  run_at: string;
}
