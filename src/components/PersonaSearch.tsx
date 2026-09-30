'use client';
// 맨 위의 "use client"가 핵심이야.
// 이게 있으면 이 파일은 "클라이언트 컴포넌트"가 돼서 브라우저에서 실행돼.
// useState 같은 훅, onChange 같은 이벤트 핸들러는 클라이언트 컴포넌트에서만 쓸 수 있어.

import { personaName, uiText } from '@/lib/i18n';
import { useState } from 'react';
import type { Persona } from '@/types/persona';
import PersonaInfoCard from './PersonaInfoCard';
import arcanas from '@/data/arcanas.json';

// props 타입: 이 컴포넌트가 부모(page.tsx)로부터 어떤 데이터를 받는지 명시.
type Props = {
    personas: Persona[];
};

type SortKey = 'name' | 'arcana' | 'level' | 'hpBonus' | 'spBonus';
type SortDirection = 'asc' | 'desc';

const SORT_OPTIONS: SortKey[] = [
    'name',
    'arcana',
    'level',
    'hpBonus',
    'spBonus',
];

const arcanaOrder = new Map(
    arcanas.map((arcana) => [arcana.id, arcana.number]),
);

export default function PersonaSearch({ personas }: Props) {
    // useState: "이 값이 바뀌면 화면을 다시 그려줘"라고 React에게 등록하는 것.
    // query 는 현재 값, setQuery 는 그 값을 바꾸는 함수.
    const [query, setQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    function handleSortClick(key: SortKey) {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    }

    // 매 렌더링마다 query 기준으로 필터링. (배열이 크지 않으니 useMemo 없이 이렇게 써도 충분)
    const filtered = personas.filter((p) => personaName(p.id).includes(query));

    const sorted = [...filtered].sort((a, b) => {
        if (sortKey === null) return 0;

        const direction = sortDirection === 'asc' ? 1 : -1;

        const nameDifference = personaName(a.id).localeCompare(
            personaName(b.id),
            'ko',
        );

        const tieBreaker = nameDifference || a.id.localeCompare(b.id);

        if (sortKey === 'name') {
            return direction * tieBreaker;
        }

        if (sortKey === 'arcana') {
            const aOrder = arcanaOrder.get(a.arcana);
            const bOrder = arcanaOrder.get(b.arcana);

            // 번호가 없는 아르카나는 마지막에 표시합니다.
            if (aOrder === undefined && bOrder === undefined) {
                return tieBreaker;
            }
            if (aOrder === undefined) return 1;
            if (bOrder === undefined) return -1;

            return (
                direction * (aOrder - bOrder) || a.level - b.level || tieBreaker
            );
        }

        // 여기서 sortKey는 level, hpBonus, spBonus 중 하나입니다.
        const aValue = a[sortKey];
        const bValue = b[sortKey];

        // null을 0으로 취급하지 않고, 항상 마지막에 표시합니다.
        if (aValue === null && bValue === null) return tieBreaker;
        if (aValue === null) return 1;
        if (bValue === null) return -1;

        return direction * (aValue - bValue) || tieBreaker;
    });

    return (
        <div className="flex flex-col gap-3">
            <input
                type="search"
                value={query}
                // onChange: 사용자가 입력할 때마다 실행됨. e.target.value = 입력창에 적힌 현재 텍스트.
                onChange={(e) => setQuery(e.target.value)}
                placeholder="페르소나 이름 검색 (예: 카구야)"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
            <div
                role="group"
                aria-label="페르소나 정렬"
                className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
            >
                <span className="px-2 text-sm text-zinc-500">정렬</span>

                {SORT_OPTIONS.map((key) => {
                    const isActive = sortKey === key;
                    const buttonLabel = uiText(`sort.${key}`);

                    return (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={isActive}
                            aria-label={
                                isActive
                                    ? `${buttonLabel}, ${uiText(`sort.${sortDirection}`)}`
                                    : buttonLabel
                            }
                            onClick={() => handleSortClick(key)}
                            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                            }`}
                        >
                            {buttonLabel}
                            {isActive && (
                                <span aria-hidden="true">
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <p className="text-xs text-zinc-400">{filtered.length}개 결과</p>

            {/* <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"> */}
            <ul className="flex w-full max-w-3xl flex-col self-center gap-2">
                {sorted.map((p) => (
                    <li key={p.id}>
                        <PersonaInfoCard persona={p} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
