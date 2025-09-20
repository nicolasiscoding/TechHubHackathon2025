declare module 'ngeohash' {
  export function encode(lat: number, lng: number, precision?: number): string;
  export function decode(geohash: string): { latitude: number; longitude: number };
  export function neighbor(geohash: string, direction: string): string;
  export function neighbors(geohash: string): any;
  export function bboxes(minlat: number, minlon: number, maxlat: number, maxlon: number, precision?: number): string[];
}

declare module '@agentuity/sdk' {
  export interface AgentuityConfig {
    apiKey: string;
  }

  export interface KeyValueStore {
    set(storeName: string, key: string, value: any): Promise<void>;
    get(storeName: string, key: string): Promise<any>;
    delete(storeName: string, key: string): Promise<void>;
    list(storeName: string, pattern?: string): Promise<string[]>;
  }

  export class Agentuity {
    kv: KeyValueStore;
    constructor(config: AgentuityConfig);
  }
}