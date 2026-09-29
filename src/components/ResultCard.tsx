import { personaName, arcanaName, fusionReason, fusionSpreadName, fusionResultText, DEFAULT_LANG, type Lang } from '@/lib/i18n';
import { useMemo, useState } from 'react';
import type { Skill } from '@/types/skill';
import type { MaterialSlot } from '@/types/material';
import type { FusionResult } from '@/types/fusionResult';
import {
    buildInheritCandidates,
    computeInheritSlotCount,
    getPersonaSkills,
    getInitialSkills,
    skillDisplayName,
    skillKey,
    skillLevelTag,
} from '@/lib/inherit';
import fusionSettings from '@/data/fusionSettings.json';

type Props = {
    result: FusionResult | null;
    requiredSelected: boolean;
    materials: MaterialSlot[];
    lang?: Lang;
};

export default function ResultCard({
    result,
    requiredSelected,
    materials,
    lang = DEFAULT_LANG,
}: Props) {
    const [selectedInheritKeys, setSelectedInheritKeys] = useState<string[]>(
        [],
    );
    const totalSkillCount = materials.reduce(
        (sum, m) => sum + m.skills.length,
        0,
    );

    const inheritSlotCount = computeInheritSlotCount(
        fusionSettings.inheritanceThresholds,
        totalSkillCount,
    );

    const inheritCandidates = useMemo(
        () =>
            result?.ok === true
                ? buildInheritCandidates(materials, result.resultPersona)
                : [],
        [result, materials],
    );

    const baseSkills =
        result?.ok === true
            ? getPersonaSkills(result.resultPersona)
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

    const [prevInheritCandidates, setPrevInheritCandidates] =
        useState(inheritCandidates);
    if (inheritCandidates !== prevInheritCandidates) {
        setPrevInheritCandidates(inheritCandidates);
        const validKeys = new Set(
            inheritCandidates.map((c) => skillKey(c.skill)),
        );
        setSelectedInheritKeys((prev) =>
            prev.filter((key) => validKeys.has(key)),
        );
    }

    return (
        <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm  dark:border-zinc-700">
            {!requiredSelected && (
                <span className="text-zinc-400">
                    {fusionResultText('selectMaterials', lang)}
                </span>
            )}
            {result?.ok === true && (
                <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col justify-between gap-1.5">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                    {personaName(result.resultPersona.id, lang)}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {fusionSpreadName(result.spreadType, lang)}
                                </span>
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-zinc-400">
                                {arcanaName(result.resultArcana, lang)} · Lv.
                                {result.resultPersona.level}
                            </div>{' '}
                            <div className="flex flex-col  text-zinc-400 dark:text-zinc-400">
                                {result.resultPersona.hpBonus != null &&
                                    `HP+${result.resultPersona.hpBonus}`}
                                {result.resultPersona.spBonus != null &&
                                    ` · SP+${result.resultPersona.spBonus}`}
                            </div>
                            {result.capped && (
                                <div className="text-xs text-zinc-400">
                                    {fusionResultText('capped', lang)}
                                </div>
                            )}
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                            <div className="text-xs font-semibold text-zinc-500">
                                {fusionResultText('baseSkills', lang, { count: baseSkills.length })}
                            </div>
                            <ul className="grid grid-cols-1 gap-1">
                                {baseSkills.map((s) => {
                                    const isSkillCard =
                                        s.id ===
                                        result.resultPersona.skillCard;
                                    return (
                                        <li
                                            key={skillKey(s)}
                                            className={
                                                isSkillCard
                                                    ? 'flex flex-row justify-between rounded-md border border-b-blue-400 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200'
                                                    : 'flex flex-row justify-between rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                            }
                                        >
                                            {skillDisplayName(s, lang)}
                                            <span
                                                className={
                                                    isSkillCard
                                                        ? 'text-blue-500'
                                                        : 'text-zinc-400'
                                                }
                                            >
                                                {skillLevelTag(s, lang)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex flex-col gap-1">
                            <div className="text-xs font-semibold text-zinc-500">
                                {fusionResultText('inheritSkills', lang, { selected: selectedInheritKeys.length, total: inheritSlotCount })}
                            </div>
                            <ul className="grid grid-cols-2 gap-1">
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
                                                className={`grid grid-cols-2 cursor-pointer items-center rounded-md border px-2.5 py-1 text-xs transition-colors ${
                                                    disabled
                                                        ? 'cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600'
                                                        : checked
                                                          ? ' border-b-blue-400 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-800 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-200'
                                                          : ' border-zinc-300 text-zinc-700 hover:border-blue-400 dark:border-zinc-600 dark:text-zinc-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    disabled={disabled}
                                                    onChange={() =>
                                                        toggleInherit(key)
                                                    }
                                                    className="sr-only"
                                                />
                                                <span
                                                    className={
                                                        !c.eligible
                                                            ? 'line-through '
                                                            : ''
                                                    }
                                                >
                                                    {skillDisplayName(c.skill, lang)}
                                                </span>
                                                {!c.eligible && (
                                                    <span className="justify-self-end text-[10px]">
                                                        {fusionResultText('notInheritable', lang)}
                                                    </span>
                                                )}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                        <div className="mt-2 flex flex-col gap-1 border-t pt-2 border-zinc-100 dark:border-zinc-800">
                            <div className="text-xs font-semibold text-zinc-500">
                                {fusionResultText('finalSkills', lang, { count: finalSkills.length })}
                            </div>
                            <ul className="grid grid-cols-2 gap-1">
                                {finalSkills.map((s) => (
                                    <li
                                        key={skillKey(s)}
                                        className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
                                    >
                                        {skillDisplayName(s, lang)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {result?.ok === false && (
                <span className="text-red-500">{fusionReason(result.reason, lang)}</span>
            )}
        </div>
    );
}
