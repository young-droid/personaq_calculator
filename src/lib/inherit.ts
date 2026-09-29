// pq-app(바닐라 JS 버전)의 js/inherit.js에 있던 로직을 TypeScript로 그대로 옮김.
// 재료 카드에서 페르소나를 새로 고를 때 "보유 스킬" 초기값을 채우는 용도.

import { MaterialSlot } from '@/types/material';
import type { Persona } from '@/types/persona';
import type { Skill } from '@/types/skill';

export const MAX_MATERIAL_SKILLS = 6;

// 스킬 정의와 페르소나별 습득 레벨은 분리되어 있다.
import skillsData from '@/data/skills.json';
import { skillName } from '@/lib/i18n';

export type LearnedSkill = Skill & { learnLevel?: number | null };
const skillsById = new Map<string, Skill>(skillsData.map((s) => [s.id, s]));

export function getPersonaSkills(persona: Persona): LearnedSkill[] {
    return persona.skills.flatMap(({ skill, learnLevel }) => {
        const definition = skillsById.get(skill);
        return definition ? [{ ...definition, learnLevel }] : [];
    });
}

export function getOwnedSkills(persona: Persona, currentLevel: number): LearnedSkill[] {
    return getPersonaSkills(persona).filter(
        (skill) => skill.learnLevel === null || (skill.learnLevel !== undefined && skill.learnLevel <= currentLevel),
    );
}

export function skillLevelTag(skill: LearnedSkill): string {
    if (skill.learnLevel === null) return '초기';
    return skill.learnLevel === undefined ? '-' : String(skill.learnLevel);
}

export function skillKey(skill: Skill): string {
    return skill.id;
}

export function skillDisplayName(skill: Skill): string {
    return skillName(skill.id);
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
    if (skill.inherit.inheritable === false || skill.inherit.exclusiveTo.length > 0) return false;
    const banned = resultPersona.nonInheritable ?? [];
    return skill.inherit.type === null || !banned.includes(skill.inherit.type);
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
            if (skill.id === resultPersona.skillCard) continue;
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

export function getInitialSkills(persona: Persona): Skill[] {
    return getPersonaSkills(persona).filter((skill) => skill.learnLevel === null);
}
