import { useState } from 'react';
import type { Skill } from '@/types/skill';
import type { MaterialSlot } from '@/types/material';
import type { FusionResult } from '@/types/fusionResult';
import {
    buildInheritCandidates,
    computeInheritSlotCount,
    isPlaceholderSkill,
    getInitialSkills,
    skillDisplayName,
    skillKey,
    skillLevelTag,
    type SkillInheritanceThreshold,
} from '@/lib/inherit';
import formulasData from '@/data/fusionFormulas.json';

type Props = {
    result: FusionResult | null;
    requiredSelected: boolean;
    materials: MaterialSlot[];
};

const SPREAD_LABELS: Record<string, string> = {
    normal: '노말 스프레드',
    sameArcana: '동일 아르카나 합체',
    triangle: '트라이앵글 스프레드',
    sameArcanaTriangle: '동일 아르카나 트라이앵글',
    special: '특수합체',
};

export default function ResultCard({
    result,
    requiredSelected,
    materials,
}: Props) {
    const [selectedInheritKeys, setSelectedInheritKeys] = useState<string[]>(
        [],
    );
    const totalSkillCount = materials.reduce(
        (sum, m) => sum + m.skills.length,
        0,
    );

    const inheritSlotCount = computeInheritSlotCount(
        formulasData.skillInheritanceSlots
            .thresholds as SkillInheritanceThreshold[],
        totalSkillCount,
    );

    const inheritCandidates =
        result?.ok === true
            ? buildInheritCandidates(materials, result.resultPersona)
            : [];

    const baseSkills =
        result?.ok === true
            ? result.resultPersona.skills.filter((s) => !isPlaceholderSkill(s))
            : [];

    const initialSkills =
        result?.ok === true ? getInitialSkills(result.resultPersona) : [];

    const finalSkills: Skill[] = [...initialSkills];

    if (result?.ok === true) {
        const finalKeys = new Set(initialSkills.map(skillKey));
        for (const c of inheritCandidates) {
            const key = skillKey(c.skill);
            if (selectedInheritKeys.includes(key) && !finalKeys.has(key)) {
                finalSkills.push(c.skill);
                finalKeys.add(key);
            }
        }
    }

    function toggleInherit(key: string) {
        setSelectedInheritKeys((prev) => {
            if (prev.includes(key)) {
                return prev.filter((k) => k !== key);
            }
            if (prev.length >= inheritSlotCount) return prev; // 슬롯 꽉 찼으면 무시하고 그대로
            return [...prev, key]; // 새로 체크
        });
    }

    return (
        <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm  dark:border-zinc-700">
            {!requiredSelected && (
                <span className="text-zinc-400">
                    재료 2개를 선택하면 결과가 여기 표시될 예정
                </span>
            )}
            {result?.ok === true && (
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {result.resultPersona.name.kr}
                        </span>
                        <span className="text-xs text-zinc-400">
                            {SPREAD_LABELS[result.spreadType]}
                        </span>
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-400">
                        {result.resultArcana} · Lv.
                        {result.resultPersona.level}
                        {result.resultPersona.hpBonus != null &&
                            ` · HP+${result.resultPersona.hpBonus}`}
                        {result.resultPersona.spBonus != null &&
                            ` · SP+${result.resultPersona.spBonus}`}
                    </div>
                    {result.capped && (
                        <div className="text-xs text-zinc-400">
                            (평균보다 높은 페르소나가 없어 최고 레벨로 대체됨)
                        </div>
                    )}
                    {baseSkills.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="text-xs font-semibold text-zinc-500">
                                기본 획득 스킬
                            </div>
                            <ul className="flex flex-wrap gap-1">
                                {baseSkills.map((s) => {
                                    const isSkillCard =
                                        s.name.kr ===
                                        result.resultPersona.skillCard;
                                    return (
                                        <li
                                            key={skillKey(s)}
                                            className={
                                                isSkillCard
                                                    ? 'rounded-md border border-b-blue-400 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200'
                                                    : 'rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                            }
                                        >
                                            {skillDisplayName(s)}{' '}
                                            <span
                                                className={
                                                    isSkillCard
                                                        ? 'text-blue-500'
                                                        : 'text-zinc-400'
                                                }
                                            >
                                                ({skillLevelTag(s)})
                                            </span>
                                            {isSkillCard && (
                                                <span className="ml-1 text-[10px] text-blue-500">
                                                    ★스킬카드
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            {inheritCandidates.length > 0 && (
                <div className="mt-1 flex flex-col gap-1">
                    <div className="text-xs font-semibold text-zinc-500">
                        계승 스킬 선택 ({selectedInheritKeys.length}/
                        {inheritSlotCount})
                    </div>
                    <ul className="flex flex-col gap-0.5">
                        {inheritCandidates.map((c) => {
                            const key = skillKey(c.skill);
                            const checked = selectedInheritKeys.includes(key);
                            const slotsFull =
                                !checked &&
                                selectedInheritKeys.length >= inheritSlotCount;
                            const disabled = !c.eligible || slotsFull;
                            return (
                                <li key={key}>
                                    <label
                                        className={`flex items-center gap-1.5 text-xs ${
                                            disabled
                                                ? 'text-zinc-300 dark:text-zinc-600'
                                                : 'text-zinc-700 dark:text-zinc-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={disabled}
                                            onChange={() => toggleInherit(key)}
                                        />
                                        <span
                                            className={
                                                !c.eligible
                                                    ? 'line-through'
                                                    : ''
                                            }
                                        >
                                            {skillDisplayName(c.skill)}
                                        </span>
                                        {!c.eligible && (
                                            <span className="text-[10px]">
                                                (계승 불가)
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            {result?.ok === true && (
                <div className="mt-2 flex flex-col gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                    <div className="text-xs font-semibold text-zinc-500">
                        최종 스킬 리스트 ({finalSkills.length}개)
                    </div>
                    <ul className="flex flex-wrap gap-1">
                        {finalSkills.map((s) => (
                            <li
                                key={skillKey(s)}
                                className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                            >
                                {skillDisplayName(s)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {result?.ok === false && (
                <span className="text-red-500">{result.reason}</span>
            )}
        </div>
    );
}
