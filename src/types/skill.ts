// 스킬 데이터(src/data/skills.json) 하나의 모양.
// 이름·효과 같은 글자는 여기 없고, 언어 파일(src/locales/*.json)의 skill[id]에 있다.
export type Skill = {
    id: string;
    category: string;
    subCategory: string | null;
    kind: string;
    range: string | null;
    cost: SkillCost | null;
    inherit: {
        type: string | null;
        inheritable: boolean | null;
        exclusiveTo: string[];
    };
};

export type SkillCost = {
    type: string;
    amount?: number;
};
