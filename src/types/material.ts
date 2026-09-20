import type { Persona } from "./persona";
import type { Skill } from "./skill";

// 재료 슬롯 하나의 상태. 아직 페르소나를 안 골랐으면 persona는 null.
export type MaterialSlot = {
  persona: Persona | null;
  level: number | null;
  // 재료가 실제로 "들고 있는" 스킬 목록. 페르소나 선택 시 레벨 기준으로 자동 채워지고,
  // 그 뒤엔 사용자가 카드에서 직접 추가/삭제해서 편집할 수 있음 (게임에서 실제 장착 스킬이
  // 레벨상 "배울 수 있는" 스킬과 항상 같지는 않기 때문).
  skills: Skill[];
};
