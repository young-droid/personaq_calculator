import type { FusionResult, FusionFailureReason } from '@/types/fusionResult';
import type { Persona } from '@/types/persona';
import normalTableData from '@/data/normalFusionTable.json';
import arcanasData from '@/data/arcanas.json';
import triangleTableData from '@/data/triangleFusionTable.json';
import specialFusionsData from '@/data/specialFusions.json';
import fusionSettings from '@/data/fusionSettings.json';

export function buildPersonasByArcana(
    personas: Persona[],
): Map<string, Persona[]> {
    const map = new Map<string, Persona[]>();
    for (const p of personas) {
        const list = map.get(p.arcana) ?? [];
        list.push(p);
        map.set(p.arcana, list);
    }
    for (const list of map.values()) {
        list.sort((a, b) => a.level - b.level);
    }
    return map;
}

export function buildPersonasById(personas: Persona[]): Map<string, Persona> {
    const map = new Map<string, Persona>();
    for (const p of personas) {
        map.set(p.id, p);
    }
    return map;
}

function avg(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** threshold보다 레벨이 "높은" 페르소나 중 가장 낮은 것. 없으면 최고 레벨로 캡. */
function findFirstAbove(
    byArcana: Map<string, Persona[]>,
    arcana: string,
    minLevel: number,
    excludeIds: string[],
): { persona: Persona | null; capped: boolean } {
    const list = (byArcana.get(arcana) ?? []).filter(
        (p) => !excludeIds.includes(p.id),
    );
    if (list.length === 0) return { persona: null, capped: false };
    const above = list.filter((p) => p.level >= minLevel); // > baseAvg  →  >= minLevel
    if (above.length > 0) return { persona: above[0], capped: false };
    return { persona: list[list.length - 1], capped: true };
}

/** threshold와 같거나 "낮은" 페르소나 중 가장 레벨이 높은 것 (동일 아르카나 합체용). */
function findLastAtOrBelow(
    byArcana: Map<string, Persona[]>,
    arcana: string,
    threshold: number,
    excludeIds: string[],
): Persona | null {
    const list = (byArcana.get(arcana) ?? []).filter(
        (p) => !excludeIds.includes(p.id),
    );
    const below = list.filter((p) => p.level <= threshold);
    if (below.length === 0) return null;
    return below[below.length - 1];
}

type FusionTable = Record<string, Record<string, string | null>>;
const normalTable: FusionTable = normalTableData;

type SpecialFusionRecipe = {
    result: string;
    materials: string[][];
};
const specialFusions = specialFusionsData satisfies SpecialFusionRecipe[];

function matchesRecipe(
    materialIds: string[],
    recipeMaterials: string[][],
): boolean {
    if (materialIds.length !== recipeMaterials.length) return false;
    const slots = recipeMaterials;
    const remaining = [...materialIds];

    for (const slot of slots) {
        const idx = remaining.findIndex((id) => slot.includes(id));
        if (idx === -1) return false;
        remaining.splice(idx, 1);
    }
    return true;
}

function findSpecialFusionMatch(
    byId: Map<string, Persona>,
    materialPersonas: Persona[],
): { recipe: SpecialFusionRecipe; resultPersona: Persona | null } | null {
    const ids = materialPersonas.map((p) => p.id);
    for (const recipe of specialFusions) {
        if (matchesRecipe(ids, recipe.materials)) {
            const resultPersona = byId.get(recipe.result) ?? null;
            return { recipe, resultPersona };
        }
    }
    return null;
}

function checkMaterialRestrictions(materialPersonas: Persona[]): FusionFailureReason | null {
    const ids = materialPersonas.map((p) => p.id);
    const group = fusionSettings.forbiddenMaterialGroups.find(
        (group) => group.every((id) => ids.includes(id)),
    );
    return group ? { code: 'forbiddenMaterials', personaIds: group } : null;
}
export function computeNormalSpread(
    byArcana: Map<string, Persona[]>,
    byId: Map<string, Persona>,
    matA: Persona,
    matB: Persona,
): FusionResult {
    const materialError = checkMaterialRestrictions([matA, matB]);
    if (materialError) return { ok: false, reason: materialError };

    const special = findSpecialFusionMatch(byId, [matA, matB]);
    if (special) {
        if (!special.resultPersona) {
            return {
                ok: false,
                reason: { code: 'missingSpecialResult', personaId: special.recipe.result },
            };
        }
        return {
            ok: true,
            spreadType: 'special',
            resultPersona: special.resultPersona,
            resultArcana: special.resultPersona.arcana,
        };
    }
    const excludeIds = [matA.id, matB.id];
    const baseAvg = avg([matA.level, matB.level]);

    // 같은 아르카나끼리는 "동일 아르카나 합체" 규칙 (표를 안 보고 평균 이하 중 최고를 찾음)
    if (matA.arcana === matB.arcana) {
        const result = findLastAtOrBelow(
            byArcana,
            matA.arcana,
            baseAvg,
            excludeIds,
        );
        if (!result) {
            return {
                ok: false,
                reason: { code: 'sameArcanaNoResult' },
            };
        }
        return {
            ok: true,
            spreadType: 'sameArcana',
            resultPersona: result,
            resultArcana: matA.arcana,
            baseAvg,
        };
    }

    const resultArcana = normalTable[matA.arcana]?.[matB.arcana];
    if (!resultArcana) {
        return {
            ok: false,
            reason: { code: 'normalUnavailable' },
        };
    }

    const { persona: resultPersona, capped } = findFirstAbove(
        byArcana,
        resultArcana,
        Math.floor(baseAvg) + fusionSettings.levelOffsets.normal,
        excludeIds,
    );
    if (!resultPersona) {
        return {
            ok: false,
            reason: { code: 'noResultInArcana', arcanaId: resultArcana },
        };
    }
    return {
        ok: true,
        spreadType: 'normal',
        resultPersona,
        resultArcana,
        baseAvg,
        capped,
    };
}

const arcanaIndexById = new Map(arcanasData.map((a) => [a.id, a.number]));

const triangleTable: FusionTable = triangleTableData;

export type FusionMaterial = { persona: Persona; currentLevel: number };

function pickThirdMaterial(materials: FusionMaterial[]): {
    third: FusionMaterial;
    others: FusionMaterial[];
} {
    let thirdIdx = 0;
    for (let i = 1; i < materials.length; i++) {
        const cur = materials[i];
        const best = materials[thirdIdx];
        if (cur.currentLevel > best.currentLevel) {
            thirdIdx = i;
        } else if (cur.currentLevel === best.currentLevel) {
            const curNum = arcanaIndexById.get(cur.persona.arcana) ?? 999;
            const bestNum = arcanaIndexById.get(best.persona.arcana) ?? 999;
            if (curNum < bestNum) thirdIdx = i;
        }
    }

    const third = materials[thirdIdx];
    const others = materials.filter((_, i) => i !== thirdIdx);
    return { third, others };
}

/** threshold보다 "높은" 페르소나 중 가장 낮은 것 (동률 없음, 트라이앵글 동일 아르카나 전용) */
function findFirstAboveStrict(
    byArcana: Map<string, Persona[]>,
    arcana: string,
    threshold: number,
    excludeIds: string[],
): Persona | null {
    const list = (byArcana.get(arcana) ?? []).filter(
        (p) => !excludeIds.includes(p.id),
    );
    const above = list.filter((p) => p.level > threshold);
    return above.length > 0 ? above[0] : null;
}

export function computeTriangleSpread(
    byArcana: Map<string, Persona[]>,
    byId: Map<string, Persona>,
    matA: FusionMaterial,
    matB: FusionMaterial,
    matC: FusionMaterial,
): FusionResult {
    const materials = [matA, matB, matC];
    const materialPersonas = materials.map((m) => m.persona);

    const materialError = checkMaterialRestrictions(materialPersonas);
    if (materialError) return { ok: false, reason: materialError };

    const special = findSpecialFusionMatch(byId, materialPersonas);
    if (special) {
        if (!special.resultPersona) {
            return {
                ok: false,
                reason: { code: 'missingSpecialResult', personaId: special.recipe.result },
            };
        }
        return {
            ok: true,
            spreadType: 'special',
            resultPersona: special.resultPersona,
            resultArcana: special.resultPersona.arcana,
        };
    }
    const excludeIds = materials.map((m) => m.persona.id);
    const baseAvg = avg(materials.map((m) => m.persona.level)); // 평균은 항상 "기본 레벨" 기준

    const { third, others } = pickThirdMaterial(materials);
    const [one, two] = others;

    const allSameArcana =
        one.persona.arcana === two.persona.arcana &&
        two.persona.arcana === third.persona.arcana;

    if (allSameArcana) {
        const result = findFirstAboveStrict(
            byArcana,
            one.persona.arcana,
            baseAvg,
            excludeIds,
        );
        if (!result) {
            return {
                ok: false,
                reason: { code: 'sameArcanaTriangleNoResult' },
            };
        }
        return {
            ok: true,
            spreadType: 'sameArcanaTriangle',
            resultPersona: result,
            resultArcana: one.persona.arcana,
            baseAvg,
        };
    }

    // 1단계: 재료3이 아닌 나머지 둘을 노말 표에 대입 → 중간 아르카나
    let intermediateArcana: string | null | undefined;
    if (one.persona.arcana === two.persona.arcana) {
        intermediateArcana = one.persona.arcana;
    } else {
        intermediateArcana =
            normalTable[one.persona.arcana]?.[two.persona.arcana];
    }
    if (!intermediateArcana) {
        return {
            ok: false,
            reason: { code: 'triangleStep1Unavailable' },
        };
    }

    // 2단계: 중간 아르카나 × 재료3을 트라이앵글 표에 대입 → 최종 아르카나
    let resultArcana: string | null | undefined;
    if (intermediateArcana === third.persona.arcana) {
        resultArcana = intermediateArcana; // 우연히 같은 아르카나가 된 엣지 케이스
    } else {
        resultArcana =
            triangleTable[intermediateArcana]?.[third.persona.arcana];
    }
    if (!resultArcana) {
        return {
            ok: false,
            reason: { code: 'triangleStep2Unavailable' },
        };
    }

    const { persona: resultPersona, capped } = findFirstAbove(
        byArcana,
        resultArcana,
        Math.floor(baseAvg) + fusionSettings.levelOffsets.triangle,
        excludeIds,
    );
    if (!resultPersona) {
        return {
            ok: false,
            reason: { code: 'noResultInArcana', arcanaId: resultArcana },
        };
    }
    return {
        ok: true,
        spreadType: 'triangle',
        resultPersona,
        resultArcana,
        baseAvg,
        capped,
    };
}
