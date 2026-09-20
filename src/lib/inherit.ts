// pq-app(바닐라 JS 버전)의 js/inherit.js에 있던 로직을 TypeScript로 그대로 옮김.
// 재료 카드에서 페르소나를 새로 고를 때 "보유 스킬" 초기값을 채우는 용도.

import { MaterialSlot } from '@/types/material';
import type { Persona } from '@/types/persona';
import type { Skill } from '@/types/skill';

export const MAX_MATERIAL_SKILLS = 6;

/** acquiredAt 값을 레벨 숫자로 변환. "initial" → 0, 숫자 → 그대로, 그 외 → 뽑아낼 수 있으면 숫자, 아니면 null */
function parseAcquiredAt(raw: Skill['acquiredAt']): number | null {
    if (raw === 'initial') return 0;
    if (typeof raw === 'number') return raw;
    const m = String(raw ?? '').match(/\d+/);
    if (m) return parseInt(m[0], 10);
    return null;
}

/** 원본 데이터 파싱 잔재로 생긴 "빈 슬롯" 스킬(이름이 "-") 걸러내기 */
export function isPlaceholderSkill(skill: Skill): boolean {
    return skill.name?.kr === '-' && !skill.name?.jp;
}

/** 페르소나가 특정 "현재 레벨"까지 배운 스킬만 골라서 반환 (재료 카드 초기값용) */
export function getOwnedSkills(
    persona: Persona,
    currentLevel: number,
): Skill[] {
    return persona.skills.filter((skill) => {
        if (isPlaceholderSkill(skill)) return false;
        const lvl = parseAcquiredAt(skill.acquiredAt);
        if (lvl === null) return true; // 레벨 정보가 깨진 원본 데이터 — 안전하게 보유한 것으로 취급
        return lvl <= currentLevel;
    });
}

/** 스킬 표시용 레벨 태그 ("초기" | 숫자 | "-") */
export function skillLevelTag(skill: Skill): string {
    if (skill.acquiredAt === 'initial') return '초기';
    if (typeof skill.acquiredAt === 'number') return String(skill.acquiredAt);
    return '-';
}

/** 스킬 중복 판정 키 (jp 이름 우선, 없으면 kr, 그것도 없으면 en) */
export function skillKey(skill: Skill): string {
    return skill.name.jp || skill.name.kr || skill.name.en || '';
}

/** 화면에 표시할 스킬 이름 (kr 우선, 없으면 jp, 그것도 없으면 en) */
export function skillDisplayName(skill: Skill): string {
    return skill.name.kr || skill.name.jp || skill.name.en || '(이름 없음)';
}

export type InheritCandidate = {
    skill: Skill;
    fromMaterialIndex: number;
    eligible: boolean;
};

export type SkillInheritanceThreshold = {
    totalMaterialSkillsMin?: number;
    totalMaterialSkillsMax?: number;
    slots: number;
};

/** 스킬 하나가 결과 페르소나에게 계승 가능한지 판정 */
export function isSkilInheritable(
    skill: Skill,
    resultPersona: Persona,
): boolean {
    if (skill.everInheritable === false) return false;
    if (skill.alwaysInheritable) return true;
    const banned = resultPersona.nonInheritableCategories ?? [];
    if (!skill.category) return true;
    return !banned.includes(skill.category);
}

/** 재료들의 보유 스킬을 모아(중복 제거) 계승 후보 목록을 만든다 */
export function buildInheritCandidates(
    materials: MaterialSlot[],
    resultPersona: Persona,
): InheritCandidate[] {
    const seen = new Map<string, InheritCandidate>();
    materials.forEach((mat, idx) => {
        for (const skill of mat.skills) {
            const key = skillKey(skill);
            if (seen.has(key)) continue;
            if (skill.name.kr === resultPersona.skillCard) continue;
            seen.set(key, {
                skill,
                fromMaterialIndex: idx,
                eligible: isSkilInheritable(skill, resultPersona),
            });
        }
    });
    return Array.from(seen.values());
}

/** 재료 스킬 총합 개수로 계승 슬롯 수 계산 */
export function computeInheritSlotCount(
    thresholds: SkillInheritanceThreshold[],
    totalSkillCount: number,
): number {
    for (const t of thresholds) {
        const min = t.totalMaterialSkillsMin ?? -Infinity;
        const max = t.totalMaterialSkillsMax ?? Infinity;
        if (totalSkillCount >= min && totalSkillCount <= max) return t.slots;
    }
    return thresholds[thresholds.length - 1].slots;
}
