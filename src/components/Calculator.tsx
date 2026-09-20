'use client';

import { useMemo, useState } from 'react';
import type { Persona } from '@/types/persona';
import type { Skill } from '@/types/skill';
import type { MaterialSlot } from '@/types/material';
import MaterialCard from './MaterialCard';
import {
    buildPersonasByArcana,
    buildPersonasById,
    computeNormalSpread,
    computeTriangleSpread,
} from '@/lib/fusion';
import ResultCard from './ResultCard';

type Props = {
    personas: Persona[];
    skills: Skill[];
};

const EMPTY_SLOT: MaterialSlot = { persona: null, level: null, skills: [] };

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
            <div>
                <ResultCard
                    result={result}
                    requiredSelected={requiredSelected}
                    materials={materials}
                />
            </div>
        </div>
    );
}
