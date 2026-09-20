'use client';

import { ChangeEvent, useState } from 'react';
import type { Persona } from '@/types/persona';
import type { Skill } from '@/types/skill';
import type { MaterialSlot } from '@/types/material';
import {
    getOwnedSkills,
    skillKey,
    skillLevelTag,
    skillDisplayName,
    MAX_MATERIAL_SKILLS,
} from '@/lib/inherit';

type Props = {
    label: string; // "재료 1" 같은 표시용 이름
    slot: MaterialSlot; // 이 카드의 현재 상태 — 부모(page.tsx)가 갖고 있는 값을 그대로 받음
    personas: Persona[]; // 페르소나 검색 대상 전체 목록
    skills: Skill[]; // 스킬 검색 대상 전체 목록 (skills.json)
    allowNone?: boolean;
    onChange: (next: MaterialSlot) => void; // 이 카드에서 뭔가 바뀌면 부모에게 알리는 콜백
};

export default function MaterialCard({
    label,
    slot,
    personas,
    skills,
    allowNone,
    onChange,
}: Props) {
    // isAddingSkill/skillQuery: "보유 스킬" 칸에서 스킬 검색창을 열어놨는지. 역시 로컬 상태.
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [skillQuery, setSkillQuery] = useState('');

    const existingKeys = new Set(slot.skills.map(skillKey));
    const filteredSkills = skillQuery
        ? skills
              .filter(
                  (s) =>
                      skillDisplayName(s).includes(skillQuery) &&
                      !existingKeys.has(skillKey(s)),
              )
              .slice(0, 20)
        : [];

    function handlePersonaChange(e: ChangeEvent<HTMLSelectElement>) {
        const id = e.target.value;
        if (id === '') {
            // NONE 선택 또는 placeholder
            onChange({ persona: null, level: null, skills: [] });
            return;
        }

        const persona = personas.find((p) => p.id === id);
        if (!persona) return;

        onChange({
            persona,
            level: persona.level,
            skills: getOwnedSkills(persona, persona.level).slice(
                0,
                MAX_MATERIAL_SKILLS,
            ),
        });
    }

    function handleLevelChange(e: ChangeEvent<HTMLSelectElement>) {
        onChange({ ...slot, level: Number(e.target.value) });
    }

    function handleRemoveSkill(index: number) {
        const nextSkills = slot.skills.filter((_, i) => i !== index);
        onChange({ ...slot, skills: nextSkills });
    }

    function handleAddSkill(skill: Skill) {
        if (slot.skills.length >= MAX_MATERIAL_SKILLS) return; // 6개 꽉 찼으면 무시
        onChange({ ...slot, skills: [...slot.skills, skill] });
        setIsAddingSkill(false);
        setSkillQuery('');
    }

    // --- 페르소나가 선택된 이후: 정보 + 보유 스킬 그리드 ---
    const emptySlotCount = Math.max(
        0,
        MAX_MATERIAL_SKILLS - slot.skills.length,
    );

    // 페르소나의 기본 레벨부터 99까지 오름차순 목록
    const basePersona = slot.persona;
    const levelOptions = basePersona
        ? Array.from(
              { length: 99 - basePersona.level + 1 },
              (_, i) => basePersona.level + i,
          )
        : [];

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-semibold text-zinc-500">{label}</span>

            <select
                value={slot.persona?.id ?? ''}
                onChange={handlePersonaChange}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
                {allowNone && <option value="">NONE (사용 안 함)</option>}
                {!allowNone && !slot.persona && (
                    <option value="" disabled>
                        페르소나 선택
                    </option>
                )}
                {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name.kr}
                    </option>
                ))}
            </select>

            {slot.persona && (
                <>
                    <div className="text-xs text-zinc-400">
                        <span>{slot.persona.arcana} · Lv.</span>
                        <select
                            value={slot.level ?? slot.persona.level}
                            onChange={handleLevelChange}
                            className="rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                        >
                            {levelOptions.map((lv) => (
                                <option key={lv} value={lv}>
                                    {lv}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-semibold text-zinc-500">
                                보유 스킬
                            </span>
                            <span className="text-[10px] text-zinc-400">
                                (자동 추천됨 — 직접 추가/삭제 가능)
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                            {slot.skills.map((skill, i) => (
                                <div
                                    key={skillKey(skill)}
                                    className="flex items-center justify-between gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                                >
                                    <span className="truncate text-zinc-800 dark:text-zinc-100">
                                        {skillDisplayName(skill)}
                                    </span>
                                    <span className="shrink-0 text-zinc-400">
                                        {skillLevelTag(skill)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSkill(i)}
                                        className="shrink-0 text-zinc-400 hover:text-red-500"
                                        title="제거"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {Array.from({ length: emptySlotCount }).map(
                                (_, i) => (
                                    <button
                                        key={`empty-${i}`}
                                        type="button"
                                        onClick={() => setIsAddingSkill(true)}
                                        className="rounded-md border border-dashed border-zinc-300 px-2 py-1.5 text-xs text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700"
                                    >
                                        🔍 스킬 검색
                                    </button>
                                ),
                            )}
                        </div>

                        {isAddingSkill && (
                            <div className="mt-1 flex flex-col gap-1.5">
                                <input
                                    autoFocus
                                    type="search"
                                    value={skillQuery}
                                    onChange={(e) =>
                                        setSkillQuery(e.target.value)
                                    }
                                    placeholder="스킬 이름 검색"
                                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                                />
                                {filteredSkills.length > 0 && (
                                    <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
                                        {filteredSkills.map((s) => (
                                            <li key={skillKey(s)}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleAddSkill(s)
                                                    }
                                                    className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                >
                                                    <span>
                                                        {skillDisplayName(s)}
                                                    </span>
                                                    <span className="text-xs text-zinc-400">
                                                        {s.category || ''}
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingSkill(false);
                                        setSkillQuery('');
                                    }}
                                    className="self-start text-xs text-zinc-400 hover:text-zinc-600"
                                >
                                    닫기
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
