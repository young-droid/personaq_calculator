// 스킬 데이터 하나의 모양. personas.json의 skills[] 안 항목과 skills.json 전체 목록이 같은 모양을 씀.
export type Skill = {
  // kr/jp 둘 다 null인 경우가 실제로 있음 (한국어 번역이 없거나, 일본판 전용 표기가 없는 등).
  // 그래서 셋 다 null 허용 — 화면에 보여줄 땐 pickName처럼 "kr 없으면 jp, 그것도 없으면 en" 순으로 골라써야 함.
  name: {
    kr: string | null;
    en: string | null;
    jp: string | null;
  };
  // "initial"(초기 습득) | 레벨 숫자 | 그 외 원본 데이터 잔재(깨진 문자열)
  acquiredAt?: string | number;
  category?: string | null;
  alwaysInheritable?: boolean;
  everInheritable?: boolean;
  inheritRestrictionNote?: string | null;
};
