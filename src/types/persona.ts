// 페르소나 데이터 하나의 모양(shape)을 TypeScript 타입으로 정의.
// 이렇게 타입을 정의해두면, personas.map(p => p.nmae) 처럼 오타를 내면
// 에디터가 바로 빨간 줄로 알려줘 (JS였으면 실행해봐야 알 수 있었던 것).
export type Persona = {
    id: string; // "ps_001"
    arcana: string;
    level: number;
    hpBonus: number | null;
    spBonus: number | null;
    skillCard: string | null;
    skills: PersonaSkill[];
    nonInheritable: string[] | null;
};

export type PersonaSkill = {
    skill: string;
    learnLevel: number | null;
};
