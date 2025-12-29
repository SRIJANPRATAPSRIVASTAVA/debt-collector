import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useEffect } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { ClientPreset } from "@/types/client";
import { generateSystemPrompt } from "@/lib/systemPrompt";
import { useToast } from "@/hooks/use-toast";

interface VoiceAgentProps {
  clientPreset: ClientPreset;
  agentId?: string;
}

export const VoiceAgent = ({ clientPreset, agentId }: VoiceAgentProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([]);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      toast({
        title: "Connecté",
        description: "L'agent vocal est prêt.",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
      setConversationId(null);
    },
    onMessage: (message: any) => {
      console.log("Message received:", message);
      if (message?.user_transcription_event?.user_transcript) {
        setTranscript(prev => [...prev, { role: "user", content: message.user_transcription_event.user_transcript }]);
      } else if (message?.agent_response_event?.agent_response) {
        setTranscript(prev => [...prev, { role: "assistant", content: message.agent_response_event.agent_response }]);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite. Veuillez réessayer.",
      });
    },
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      toast({
        variant: "destructive",
        title: "Configuration requise",
        description: "Veuillez configurer l'ID de l'agent ElevenLabs.",
      });
      return;
    }

    setIsConnecting(true);
    setTranscript([]);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-token", {
        body: { agentId },
      });

      if (error || !data?.signed_url) {
        throw new Error(error?.message || "Failed to get conversation token");
      }

      // Start the conversation with ElevenLabs
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      setConversationId(data.signed_url);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Échec de connexion",
        description: error instanceof Error ? error.message : "Impossible de démarrer la conversation.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, toast]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setConversationId(null);
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Status Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-3 h-3 rounded-full transition-colors",
            isConnected
              ? conversation.isSpeaking
                ? "bg-green-500 animate-pulse"
                : "bg-blue-500"
              : "bg-muted-foreground"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {isConnecting
            ? "Connexion en cours..."
            : isConnected
            ? conversation.isSpeaking
              ? "L'agent parle..."
              : "En écoute..."
            : "Déconnecté"}
        </span>
      </div>

      {/* Main Call Button */}
      <button
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        className={cn(
          "relative w-32 h-32 rounded-full transition-all duration-300 flex items-center justify-center",
          "shadow-lg hover:shadow-xl transform hover:scale-105",
          isConnected
            ? "bg-destructive hover:bg-destructive/90"
            : "hover:opacity-90",
          isConnecting && "opacity-50 cursor-not-allowed"
        )}
        style={{
          backgroundColor: isConnected ? undefined : clientPreset.primary_color,
        }}
      >
        {isConnecting ? (
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="w-12 h-12 text-white" />
        ) : (
          <Phone className="w-12 h-12 text-white" />
        )}
      </button>

      {/* Action Label */}
      <p className="text-lg font-medium">
        {isConnected ? "Terminer l'appel" : "Démarrer l'appel"}
      </p>

      {/* Audio Indicators */}
      {isConnected && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {conversation.isSpeaking ? (
              <Volume2 className="w-5 h-5 text-green-500 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm text-muted-foreground">
              {conversation.isSpeaking ? "Agent" : "Vous"}
            </span>
          </div>
        </div>
      )}

      {/* Transcript */}
      {transcript.length > 0 && (
        <Card className="w-full max-w-lg mt-4">
          <CardContent className="p-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3">Transcription</h4>
            <div className="space-y-2">
              {transcript.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "text-sm p-2 rounded",
                    msg.role === "user"
                      ? "bg-muted text-right"
                      : "bg-primary/10 text-left"
                  )}
                >
                  <span className="font-medium">
                    {msg.role === "user" ? "Vous" : "Agent"}:
                  </span>{" "}
                  {msg.content}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
