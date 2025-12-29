# French Debt Recovery Voice Agent

A respectful, brand-safe debt recovery voice agent for large enterprises in France.

## Features

- **Real-time Voice Conversations** - Powered by ElevenLabs Conversational AI
- **French-only Operation** - Agent operates exclusively in French
- **Client Presets** - Configure tone and phrasing for different clients (Amazon Business, Dell, Microsoft)
- **Automated Testing** - 12 test scenarios with success metrics
- **Brand-safe Interactions** - Polite, never threatening, always offering alternatives

## Quick Start

### Prerequisites

- Node.js 18+
- ElevenLabs API key with Conversational AI access

### Steps : 

* Clone the repo.
* run `npm install` inside the project directory.
* run `npm run dev` and follow the link in terminal.
* add the `ELEVENLABS_API_KEY` in .env.
* add the `agent_id` in configuration.
* click the phone button to chat with agent.

### Environment Variables

The following secrets must be configured in the backend:

| Variable               | Description                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `ELEVENLABS_API_KEY` | [Your ElevenLabs API key](https://elevenlabs.io/app/developers/api-keys)  |
| `LOVABLE_API_KEY`    | Auto-configured by Lovable                                              |

### Running the Agent

1. Open the app in your browser
2. Click **Configuration** and enter your ElevenLabs Agent ID
3. Select a client preset (Amazon, Dell, or Microsoft)
4. Click the phone button to start a conversation

### Creating an ElevenLabs Agent

1. Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
2. Create a new agent
3. Configure the agent with:
   - **Language**: French
   - **Voice**: Choose a professional French voice
   - **System Prompt**: Copy from `src/lib/systemPrompt.ts`
4. Copy the Agent ID and paste it in the app configuration (TOP RIGHT CORNER IN THE UI)

## Running the Self-Test

The test harness runs 12 synthetic conversation scenarios:

```bash
# Via the web interface:
1. Go to the "Tests" tab
2. Click "Lancer les tests"
3. View results and download the Markdown report
```

### Test Scenarios

| Category       | Scenarios                                         |
| -------------- | ------------------------------------------------- |
| Identification | Successful ID, Wrong person                       |
| Payment        | Acceptance, Delay request, Partial payment        |
| Emotion        | Angry caller, Confused caller                     |
| Edge Cases     | Robot question, Language switch, Privacy concerns |
| Escalation     | Dispute, Callback request                         |

### Why These Scenarios?

1. **Coverage** - Tests all major conversation paths
2. **Realism** - Based on actual debt recovery interactions
3. **Edge Cases** - Ensures graceful handling of unusual situations
4. **Metrics** - Provides quantifiable success criteria

## Client Presets

Edit `src/config/client-presets.json` to customize:

```json
{
  "clients": {
    "your_client": {
      "name": "Client Name",
      "greeting": "Bonjour, je suis conseillère pour...",
      "tone": "formal|tech_friendly|supportive",
      "company_mention": "Client",
      "payment_intro": "Concerning your account...",
      "payment_link_text": "I can send you a secure payment link...",
      "followup_text": "Would you like a callback?",
      "closing": "Thank you for your time...",
      "primary_color": "#hexcolor"
    }
  },
  "default_client": "your_client"
}
```

### Changing the Active Client

- **Web UI**: Click on the client buttons at the top
- **Default**: Edit `default_client` in `client-presets.json`

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── VoiceAgent.tsx      # Main voice interface
│   │   ├── ClientSelector.tsx  # Client preset switcher
│   │   ├── TestHarness.tsx     # Automated test runner
│   │   └── AgentConfig.tsx     # Agent ID configuration
│   ├── config/
│   │   ├── client-presets.json # Client configurations
│   │   └── test-scenarios.json # Test scenario definitions
│   ├── hooks/
│   │   └── useClientPresets.ts # Client preset management
│   ├── lib/
│   │   └── systemPrompt.ts     # System prompt generator
│   └── types/
│       └── client.ts           # TypeScript definitions
├── supabase/functions/
│   ├── elevenlabs-token/       # Token generation
│   ├── ai-conversation/        # AI conversation logic
│   └── run-tests/              # Test execution
└── README.md
```

## API Endpoints

All endpoints are Edge Functions deployed automatically:

| Endpoint                           | Purpose                      |
| ---------------------------------- | ---------------------------- |
| `/functions/v1/elevenlabs-token` | Generate conversation tokens |
| `/functions/v1/ai-conversation`  | Process AI conversations     |
| `/functions/v1/run-tests`        | Execute test scenarios       |

## Privacy & Security

- No real debtor data is used
- Personal data is masked in all logs
- Agent never stores conversation content
- All communications are encrypted

## Guardrails

The agent is programmed to:

- ✅ Always speak French
- ✅ Use polite, professional language
- ✅ Offer payment links or follow-up options
- ✅ Escalate on request
- ❌ Never use pressure or threats
- ❌ Never use legal intimidation terms
- ❌ Never disclose sensitive information

## Demo

**Web Demo**:

Click the phone button to start a voice conversation with the agent. [[https://bonjour-collect.vercel.app](https://bonjour-collect.vercel.app/)/ [use this agent id : agent_3301kdn6mpsxe1qrwznh0abvegf7 ]]
