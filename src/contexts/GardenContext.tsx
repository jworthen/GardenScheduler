import { createContext, useContext } from 'react';
import { GardenMeta } from '../lib/gardens';

export interface GardenContextValue {
  gardens: GardenMeta[];
  activeGardenId: string | null;
  switching: boolean;
  switchGarden: (id: string) => Promise<void>;
  createGarden: (name: string) => Promise<void>;
  renameGarden: (id: string, name: string) => Promise<void>;
  deleteGarden: (id: string) => Promise<void>;
}

export const GardenContext = createContext<GardenContextValue>({
  gardens: [],
  activeGardenId: null,
  switching: false,
  switchGarden: async () => {},
  createGarden: async () => {},
  renameGarden: async () => {},
  deleteGarden: async () => {},
});

export const useGardenContext = () => useContext(GardenContext);
