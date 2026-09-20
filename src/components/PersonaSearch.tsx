"use client";
// 맨 위의 "use client"가 핵심이야.
// 이게 있으면 이 파일은 "클라이언트 컴포넌트"가 돼서 브라우저에서 실행돼.
// useState 같은 훅, onChange 같은 이벤트 핸들러는 클라이언트 컴포넌트에서만 쓸 수 있어.

import { useState } from "react";
import type { Persona } from "@/types/persona";

// props 타입: 이 컴포넌트가 부모(page.tsx)로부터 어떤 데이터를 받는지 명시.
type Props = {
  personas: Persona[];
};

export default function PersonaSearch({ personas }: Props) {
  // useState: "이 값이 바뀌면 화면을 다시 그려줘"라고 React에게 등록하는 것.
  // query 는 현재 값, setQuery 는 그 값을 바꾸는 함수.
  const [query, setQuery] = useState("");

  // 매 렌더링마다 query 기준으로 필터링. (배열이 크지 않으니 useMemo 없이 이렇게 써도 충분)
  const filtered = personas.filter((p) => p.name.kr.includes(query));

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

      <p className="text-xs text-zinc-400">{filtered.length}개 결과</p>

      <ul className="flex flex-col gap-2">
        {/* .map()으로 배열을 리스트 UI로 변환. key는 React가 각 항목을 구분하기 위한 고유값. */}
        {filtered.slice(0, 30).map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">{p.name.kr}</span>
            <span className="text-xs text-zinc-400">
              {p.arcana} · Lv.{p.level}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
