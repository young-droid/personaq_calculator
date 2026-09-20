'use client';

import { useMemo, useState } from 'react';
import type { Persona } from '@/types/persona';
import type { Skill } from '@/types/skill';
import type { MaterialSlot } from '@/types/material';
import MaterialCard from './MaterialCard';
import formulasData from '@/data/fusionFormulas.json';
import {
    buildPersonasByArcana,
    buildPersonasById,
    computeNormalSpread,
    computeTriangleSpread,
} from '@/lib/fusion';
import {
    buildInheritCandidates,
    computeInheritSlotCount,
    getOwnedSkills,
    isPlaceholderSkill,
    skillKey,
    skillLevelTag,
    skillDisplayName,
    type SkillInheritanceThreshold,
} from '@/lib/inherit';

type Props = {
    personas: Persona[];
    skills: Skill[];
};

const EMPTY_SLOT: MaterialSlot = { persona: null, level: null, skills: [] };

const SPREAD_LABELS: Record<string, string> = {
    normal: '노말 스프레드',
    sameArcana: '동일 아르카나 합체',
    triangle: '트라이앵글 스프레드',
    sameArcanaTriangle: '동일 아르카나 트라이앵글',
    special: '특수합체',
};

export default function Calculator({ personas, skills }: Props) {
    // 재료 2개의 상태를 "부모"인 이 컴포넌트가 가지고 있다.
    // MaterialCard 하나하나는 자기 상태를 직접 못 바꾸고, onChange로 "이렇게 바꿔주세요"라고 요청만 함.
    // 이게 재료1/재료2 카드 두 개가 서로의 상태를 침범하지 않으면서도,
    // 부모(Calculator)가 "지금 재료가 둘 다 선택됐는지" 같은 걸 알 수 있게 해주는 구조.
    const [materials, setMaterials] = useState<MaterialSlot[]>([
        EMPTY_SLOT,
        EMPTY_SLOT,
        EMPTY_SLOT,
    ]);

    const [selectedInheritKeys, setSelectedInheritKeys] = useState<string[]>(
        [],
    );

    function updateMaterial(index: number, next: MaterialSlot) {
        setMaterials((prev) => {
            const copy = [...prev]; // 배열을 직접 수정하지 않고 복사본을 만든다 (React 상태는 불변으로 다뤄야 함)
            copy[index] = next;
            return copy;
        });
    }

    const byArcana = useMemo(() => buildPersonasByArcana(personas), [personas]);
    const byId = useMemo(() => buildPersonasById(personas), [personas]);

    const sortedPersonas = useMemo(
        () =>
            [...personas].sort((a, b) =>
                a.name.kr.localeCompare(b.name.kr, 'ko'),
            ),
        [personas],
    );

    const requiredSelected =
        materials[0].persona !== null && materials[1].persona !== null;

    const useTriangle = materials[2].persona !== null;

    const result = !requiredSelected
        ? null
        : useTriangle
          ? computeTriangleSpread(
                byArcana,
                byId,

                {
                    persona: materials[0].persona!,
                    currentLevel: materials[0].level!,
                },
                {
                    persona: materials[1].persona!,
                    currentLevel: materials[1].level!,
                },
                {
                    persona: materials[2].persona!,
                    currentLevel: materials[2].level!,
                },
            )
          : computeNormalSpread(
                byArcana,
                byId,
                materials[0].persona!,
                materials[1].persona!,
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

    const finalSkills: Skill[] = [...baseSkills];
    if (result?.ok === true) {
        const finalKeys = new Set(baseSkills.map(skillKey));
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
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <MaterialCard
                        label="재료 1"
                        slot={materials[0]}
                        personas={sortedPersonas}
                        skills={skills}
                        onChange={(next) => updateMaterial(0, next)}
                    />
                </div>
                <span className="mt-8 text-zinc-300">×</span>
                <div className="flex-1">
                    <MaterialCard
                        label="재료 2"
                        slot={materials[1]}
                        personas={sortedPersonas}
                        skills={skills}
                        onChange={(next) => updateMaterial(1, next)}
                    />
                </div>
                <span className="mt-8 text-zinc-300">×</span>
                <div className="flex-1">
                    <MaterialCard
                        label="재료 3"
                        slot={materials[2]}
                        personas={sortedPersonas}
                        skills={skills}
                        allowNone
                        onChange={(next) => updateMaterial(2, next)}
                    />
                </div>
            </div>

            {/* 아직 실제 합체 계산 로직은 없음 — 다음 단계에서 fusion.js를 옮겨와서 여기 연결할 예정 */}
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
                                (평균보다 높은 페르소나가 없어 최고 레벨로
                                대체됨)
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
                                const checked =
                                    selectedInheritKeys.includes(key);
                                const slotsFull =
                                    !checked &&
                                    selectedInheritKeys.length >=
                                        inheritSlotCount;
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
                                                onChange={() =>
                                                    toggleInherit(key)
                                                }
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
        </div>
    );
}
