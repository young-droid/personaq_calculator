import type { Skill } from "./skill";

// 페르소나 데이터 하나의 모양(shape)을 TypeScript 타입으로 정의.
// 이렇게 타입을 정의해두면, personas.map(p => p.nmae) 처럼 오타를 내면
// 에디터가 바로 빨간 줄로 알려줘 (JS였으면 실행해봐야 알 수 있었던 것).
export type Persona = {
  id: string;
  name: {
    kr: string;
    en: string | null;
    jp: string;
  };
  arcana: string;
  level: number;
  // 원본 데이터에 hpBonus/spBonus가 없는(null) 페르소나가 실제로 있어서
  // number만이 아니라 number | null 로 정직하게 표시해야 함.
  // (이걸 number로만 적었으면 방금 본 빌드 에러가 바로 그 이유로 났던 것)
  hpBonus: number | null;
  spBonus: number | null;
  skillCard: string;
  skills: Skill[];
  nonInheritableCategories?: string[] | null;
};
