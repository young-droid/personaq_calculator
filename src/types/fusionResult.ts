import type { Persona } from './persona';

export type FusionResult =
    | {
          ok: true;
          spreadType:
              | 'normal'
              | 'sameArcana'
              | 'triangle'
              | 'sameArcanaTriangle'
              | 'special';
          resultPersona: Persona;
          resultArcana: string;
          baseAvg?: number;
          capped?: boolean;
      }
    | {
          ok: false;
          reason: string;
      };
