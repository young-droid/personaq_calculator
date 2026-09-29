import type { Persona } from './persona';

// 계산 결과에는 번역된 문장 대신 코드와 ID를 보관한다.
export type FusionFailureReason =
    | { code: 'forbiddenMaterials'; personaIds: string[] }
    | { code: 'missingSpecialResult'; personaId: string }
    | { code: 'noResultInArcana'; arcanaId: string }
    | { code: 'sameArcanaNoResult' | 'normalUnavailable' | 'sameArcanaTriangleNoResult' | 'triangleStep1Unavailable' | 'triangleStep2Unavailable' };

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
          reason: FusionFailureReason;
      };
