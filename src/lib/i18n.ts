// 언어 파일(src/locales/*.json)에서 ID에 맞는 글자를 찾아주는 "번역 창구".
// 화면에서는 이름을 직접 꺼내지 말고, 항상 여기 있는 함수를 거쳐서 가져온다.
// 그래야 나중에 번역 버튼을 붙일 때 lang 값만 바꾸면 화면 전체가 바뀐다.

import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import en from '@/locales/en.json';
import type { FusionFailureReason, FusionResult } from '@/types/fusionResult';

export type Lang = 'ja' | 'ko' | 'en';

export const DEFAULT_LANG: Lang = 'ko';

type Locale = {
    ui: Record<string, string>;
    fusion: {
        errors: Record<FusionFailureReason['code'], string>;
        spread: Record<Extract<FusionResult, { ok: true }>['spreadType'], string>;
        result: Record<keyof typeof ko.fusion.result, string>;
    };
    arcana: Record<string, string>;
    owner: Record<string, string>;
    kind: Record<string, string>;
    range: Record<string, string>;
    inheritType: Record<string, string>;
    costType: Record<string, string>;
    category: Record<string, string>;
    subCategory: Record<string, string>;
    persona: Record<
        string,
        { name: string | null; obtainMethod: string | null }
    >;
    skill: Record<
        string,
        { name: string | null; effect: string | null; note?: string }
    >;
};

const LOCALES: Record<Lang, Locale> = { ja, ko, en };

// 현재 언어에 글자가 없을 때 대신 찾아볼 순서
const FALLBACK_ORDER: Lang[] = ['ja', 'en', 'ko'];

/** 현재 언어 → 일본어 → 영어 → 한국어 순으로 찾아서, 처음 나온 글자를 돌려준다. 아무 데도 없으면 null */
function lookup(
    lang: Lang,
    get: (locale: Locale) => string | null | undefined,
): string | null {
    for (const l of [lang, ...FALLBACK_ORDER]) {
        const value = get(LOCALES[l]);
        if (value) return value;
    }
    return null;
}

// ---- 이름 ----
export function personaName(id: string, lang: Lang = DEFAULT_LANG): string {
    return lookup(lang, (l) => l.persona[id]?.name) ?? id;
}

export function skillName(id: string, lang: Lang = DEFAULT_LANG): string {
    return lookup(lang, (l) => l.skill[id]?.name) ?? id;
}

export function arcanaName(code: string, lang: Lang = DEFAULT_LANG): string {
    return lookup(lang, (l) => l.arcana[code]) ?? code;
}

export function ownerName(id: string, lang: Lang = DEFAULT_LANG): string {
    return lookup(lang, (l) => l.owner[id]) ?? id;
}

// ---- 설명 (없을 수 있음) ----
export function skillEffect(
    id: string,
    lang: Lang = DEFAULT_LANG,
): string | null {
    return lookup(lang, (l) => l.skill[id]?.effect);
}

export function personaObtainMethod(
    id: string,
    lang: Lang = DEFAULT_LANG,
): string | null {
    return lookup(lang, (l) => l.persona[id]?.obtainMethod);
}

// ---- 분류 라벨 ("fire" → "화염" 같은 짧은 이름) ----
type LabelSection =
    | 'kind'
    | 'range'
    | 'inheritType'
    | 'costType'
    | 'category'
    | 'subCategory';

export function label(
    section: LabelSection,
    code: string,
    lang: Lang = DEFAULT_LANG,
): string {
    return lookup(lang, (l) => l[section][code]) ?? code;
}

// 문장 안의 {count}, {persona} 같은 자리에 표시할 값을 넣는다.
function interpolate(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
        values[key] === undefined ? placeholder : String(values[key]),
    );
}

export function fusionReason(reason: FusionFailureReason, lang: Lang = DEFAULT_LANG): string {
    const values: Record<string, string> = {};
    switch (reason.code) {
        case 'forbiddenMaterials':
            values.names = new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' })
                .format(reason.personaIds.map((id) => personaName(id, lang)));
            break;
        case 'missingSpecialResult':
            values.persona = personaName(reason.personaId, lang);
            break;
        case 'noResultInArcana':
            values.arcana = arcanaName(reason.arcanaId, lang);
            break;
    }
    return interpolate(lookup(lang, (l) => l.fusion.errors[reason.code]) ?? reason.code, values);
}

export function fusionSpreadName(
    spread: Extract<FusionResult, { ok: true }>['spreadType'],
    lang: Lang = DEFAULT_LANG,
): string {
    return lookup(lang, (l) => l.fusion.spread[spread]) ?? spread;
}

export function fusionResultText(
    key: keyof typeof ko.fusion.result,
    lang: Lang = DEFAULT_LANG,
    values: Record<string, string | number> = {},
): string {
    return interpolate(lookup(lang, (l) => l.fusion.result[key]) ?? key, values);
}
