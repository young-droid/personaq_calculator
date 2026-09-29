import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import personas from '../src/data/personas.json';
import arcanas from '../src/data/arcanas.json';
import recipes from '../src/data/specialFusions.json';
import normalTable from '../src/data/normalFusionTable.json';
import triangleTable from '../src/data/triangleFusionTable.json';
import settings from '../src/data/fusionSettings.json';
import ko from '../src/locales/ko.json';
import ja from '../src/locales/ja.json';
import en from '../src/locales/en.json';
import ResultCard from '../src/components/ResultCard';
import { buildPersonasByArcana, buildPersonasById, computeNormalSpread, computeTriangleSpread } from '../src/lib/fusion';
import { computeInheritSlotCount } from '../src/lib/inherit';
import { arcanaName, fusionReason, personaName, type Lang } from '../src/lib/i18n';
import type { Persona } from '../src/types/persona';
import type { FusionFailureReason, FusionResult } from '../src/types/fusionResult';

const byId = buildPersonasById(personas);
const byArcana = buildPersonasByArcana(personas);
const material = (persona: Persona) => ({ persona, currentLevel: persona.level });

function fuse(mats: Persona[], resultsById = byId): FusionResult {
    return mats.length === 2
        ? computeNormalSpread(byArcana, resultsById, mats[0], mats[1])
        : computeTriangleSpread(byArcana, resultsById, material(mats[0]), material(mats[1]), material(mats[2]));
}

test('tables and recipes contain valid IDs; every alternative and material order resolves', () => {
    const arcanaIds = new Set(arcanas.map((a) => a.id));
    for (const table of [normalTable, triangleTable]) {
        assert.equal(Object.keys(table).length, 21);
        for (const [first, row] of Object.entries(table)) {
            assert(arcanaIds.has(first));
            assert.equal(Object.keys(row).length, 20);
            for (const [second, result] of Object.entries(row)) {
                assert(arcanaIds.has(second));
                assert(result === null || arcanaIds.has(result));
            }
        }
    }
    function permutations(ids: string[]): string[][] {
        return ids.length === 0 ? [[]] : ids.flatMap((id, i) =>
            permutations(ids.filter((_, j) => i !== j)).map((rest) => [id, ...rest]),
        );
    }
    for (const recipe of recipes) {
        assert(byId.has(recipe.result));
        const choices = recipe.materials.reduce<string[][]>(
            (sets, slot) => sets.flatMap((set) => slot.map((id) => [...set, id])), [[]],
        );
        for (const ids of choices) {
            for (const ordered of permutations(ids)) {
                const mats = ordered.map((id) => { const p = byId.get(id); assert(p); return p; });
                const result = fuse(mats);
                assert(result.ok);
                assert.equal(result.spreadType, 'special');
                assert.equal(result.resultPersona.id, recipe.result);
                assert.equal(result.resultArcana, byId.get(recipe.result)!.arcana);
            }
        }
    }
});

test('missing special result and forbidden materials return codes and IDs', () => {
    const recipe = recipes[0];
    const missingResult = new Map(byId);
    missingResult.delete(recipe.result);
    const result = fuse(recipe.materials.map((slot) => byId.get(slot[0])!), missingResult);
    assert.deepEqual(result, { ok: false, reason: { code: 'missingSpecialResult', personaId: recipe.result } });
    const forbidden = settings.forbiddenMaterialGroups[0];
    for (const ids of [forbidden, [...forbidden, 'ps_001']]) {
        assert.deepEqual(fuse(ids.map((id) => byId.get(id)!)), {
            ok: false, reason: { code: 'forbiddenMaterials', personaIds: forbidden },
        });
    }
});

test('inheritance thresholds preserve boundary behavior', () => {
    for (const [total, slots] of [[0, 1], [5, 1], [6, 2], [8, 2], [9, 3], [12, 3], [13, 4], [18, 4]]) {
        assert.equal(computeInheritSlotCount(settings.inheritanceThresholds, total), slots);
    }
});

const fixture = (id: string, arcana: string, level: number): Persona => ({
    id, arcana, level, hpBonus: null, spBonus: null, skillCard: null, skills: [], nonInheritable: null,
});

test('normal uses +1 and triangle uses configurable +5, distinguishing it from +3', () => {
    assert.equal(settings.levelOffsets.triangle, 5);
    const a = fixture('a', 'fool', 1), b = fixture('b', 'magician', 2), c = fixture('c', 'priestess', 3);
    const normalArcana = normalTable.fool.magician;
    const table: Record<string, Record<string, string | null>> = triangleTable;
    const finalArcana = table[normalArcana].priestess;
    assert(finalArcana);
    const pool = [a, b, c, fixture('normal-below', normalArcana, 1), fixture('normal-result', normalArcana, 2),
        fixture('triangle-plus3', finalArcana, 5), fixture('triangle-plus5', finalArcana, 7)];
    const arcanaMap = buildPersonasByArcana(pool), idMap = buildPersonasById(pool);
    const normal = computeNormalSpread(arcanaMap, idMap, a, b);
    const triangle = computeTriangleSpread(arcanaMap, idMap, material(a), material(b), material(c));
    assert(normal.ok); assert(triangle.ok);
    assert.equal(normal.resultPersona.id, 'normal-result');
    assert.equal(triangle.resultPersona.id, 'triangle-plus5');
});

test('all failure branches return the expected translation keys', () => {
    const a = fixture('a', 'fool', 1), b = fixture('b', 'magician', 2), c = fixture('c', 'priestess', 3);
    const empty = new Map<string, Persona[]>();
    const unknown = fixture('unknown', 'unknown', 1);
    const same = fixture('same', 'fool', 2), sameThird = fixture('same-third', 'fool', 3);
    const cases: [FusionResult, FusionFailureReason['code']][] = [
        [computeNormalSpread(empty, byId, a, same), 'sameArcanaNoResult'],
        [computeNormalSpread(empty, byId, a, unknown), 'normalUnavailable'],
        [computeNormalSpread(empty, byId, a, b), 'noResultInArcana'],
        [computeTriangleSpread(empty, byId, material(a), material(same), material(sameThird)), 'sameArcanaTriangleNoResult'],
        [computeTriangleSpread(empty, byId, material(a), material(unknown), material(c)), 'triangleStep1Unavailable'],
        [computeTriangleSpread(empty, byId, material(a), material(b), material({ ...unknown, level: 99 })), 'triangleStep2Unavailable'],
        [computeTriangleSpread(empty, byId, material(a), material(b), material(c)), 'noResultInArcana'],
    ];
    for (const [result, code] of cases) { assert(!result.ok); assert.equal(result.reason.code, code); }
});

test('all locales cover the same messages and placeholders', () => {
    for (const section of ['errors', 'spread', 'result'] as const) {
        for (const locale of [ja, en]) {
            assert.deepEqual(Object.keys(locale.fusion[section]).sort(), Object.keys(ko.fusion[section]).sort());
            for (const [key, template] of Object.entries(ko.fusion[section])) {
                const translated = (locale.fusion[section] as Record<string, string>)[key];
                assert(translated.length > 0);
                assert.deepEqual(translated.match(/\{\w+\}/g)?.sort(), template.match(/\{\w+\}/g)?.sort());
            }
        }
    }
});

test('one stored result renders in each language without recalculating', () => {
    const result: FusionResult = { ok: false, reason: { code: 'noResultInArcana', arcanaId: 'fool' } };
    const success = fuse(recipes[0].materials.map((slot) => byId.get(slot[0])!));
    assert(success.ok);
    for (const lang of ['ko', 'ja', 'en'] as Lang[]) {
        const locale = { ko, ja, en }[lang];
        const errorText = fusionReason(result.reason, lang);
        assert(errorText.includes(arcanaName('fool', lang)));
        assert(!errorText.includes('{arcana}'));
        const errorHtml = renderToStaticMarkup(createElement(ResultCard, { result, requiredSelected: true, materials: [], lang }));
        assert(errorHtml.includes(errorText));
        const successHtml = renderToStaticMarkup(createElement(ResultCard, { result: success, requiredSelected: true, materials: [], lang }));
        assert(successHtml.includes(personaName(success.resultPersona.id, lang)));
        assert(successHtml.includes(locale.fusion.spread.special));
        assert(successHtml.includes(locale.fusion.result.initialSkill));
        assert(!successHtml.includes('{count}'));
    }
});
