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
  /** Generate a shareable invite code for one of your own gardens. */
  shareGarden: (gardenId: string) => Promise<string>;
  /** Join a shared garden using an invite code. */
  joinGarden: (code: string) => Promise<void>;
  /** Leave a shared garden (member only). */
  leaveGarden: (gardenId: string) => Promise<void>;
}

export const GardenContext = createContext<GardenContextValue>({
  gardens: [],
  activeGardenId: null,
  switching: false,
  switchGarden: async () => {},
  createGarden: async () => {},
  renameGarden: async () => {},
  deleteGarden: async () => {},
  shareGarden: async () => '',
  joinGarden: async () => {},
  leaveGarden: async () => {},
});

export const useGardenContext = () => useContext(GardenContext);
