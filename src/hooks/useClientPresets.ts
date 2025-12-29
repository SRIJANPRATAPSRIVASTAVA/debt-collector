import { useState, useEffect } from 'react';
import type { ClientPreset, ClientPresetsConfig } from '@/types/client';
import presetsData from '@/config/client-presets.json';

export const useClientPresets = () => {
  const [config] = useState<ClientPresetsConfig>(presetsData as ClientPresetsConfig);
  const [selectedClientId, setSelectedClientId] = useState<string>(presetsData.default_client);
  const [currentPreset, setCurrentPreset] = useState<ClientPreset>(
    presetsData.clients[presetsData.default_client] as ClientPreset
  );

  useEffect(() => {
    const preset = config.clients[selectedClientId];
    if (preset) {
      setCurrentPreset(preset as ClientPreset);
    }
  }, [selectedClientId, config.clients]);

  const selectClient = (clientId: string) => {
    if (config.clients[clientId]) {
      setSelectedClientId(clientId);
    }
  };

  const getClientList = () => {
    return Object.entries(config.clients).map(([id, preset]) => ({
      id,
      name: (preset as ClientPreset).name,
      color: (preset as ClientPreset).primary_color,
    }));
  };

  return {
    currentPreset,
    selectedClientId,
    selectClient,
    getClientList,
    config,
  };
};
