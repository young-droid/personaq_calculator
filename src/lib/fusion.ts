import { FusionResult } from '@/types/fusionResult';
import { Persona } from '@/types/persona';
import normalTableData from '@/data/normalFusionTable.json';
import arcanasData from '@/data/arcanas.json';
import triangleTableData from '@/data/triangleFusionTable.json';
import specialFusionsData from '@/data/specialFusions.json';

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

const normalTable = normalTableData.table as Record<
    string,
    Record<string, string | null>
>;

type SpecialFusionRecipe = {
    result: { name: string; arcana: string; level: number };
    materials: string[];
    spreadType: 'normal' | 'triangle';
};
const specialFusions = specialFusionsData as SpecialFusionRecipe[];

function parseAlternatives(materialStr: string): string[] {
    return materialStr.split('또는').map((s) => s.trim());
}

function matchesRecipe(
    materialIds: string[],
    recipeMaterials: string[],
): boolean {
    if (materialIds.length !== recipeMaterials.length) return false;
    const slots = recipeMaterials.map(parseAlternatives);
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
            const resultPersona = byId.get(recipe.result.name) ?? null;
            return { recipe, resultPersona };
        }
    }
    return null;
}

function checkZeusExclusivity(materialPersonas: Persona[]): string | null {
    const ids = materialPersonas.map((p) => p.id);
    if (ids.includes('제우스') && ids.includes('중장 제우스')) {
        return '제우스와 중장 제우스는 같은 합체에 재료로 함께 쓸 수 없습니다.';
    }
    return null;
}
export function computeNormalSpread(
    byArcana: Map<string, Persona[]>,
    byId: Map<string, Persona>,
    matA: Persona,
    matB: Persona,
): FusionResult {
    const zeusErr = checkZeusExclusivity([matA, matB]);
    if (zeusErr) return { ok: false, reason: zeusErr };

    const special = findSpecialFusionMatch(byId, [matA, matB]);
    if (special) {
        if (!special.resultPersona) {
            return {
                ok: false,
                reason: `특수합체 결과 페르소나(${special.recipe.result.name})를 데이터에서 찾을 수 없습니다.`,
            };
        }
        return {
            ok: true,
            spreadType: 'special',
            resultPersona: special.resultPersona,
            resultArcana: special.recipe.result.arcana,
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
                reason: '이 아르카나에서 레벨이 가장 낮은 두 페르소나로는 동일 아르카나 합체를 할 수 없습니다.',
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
            reason: '이 두 아르카나 조합은 노말 스프레드로 합체할 수 없습니다.',
        };
    }

    const { persona: resultPersona, capped } = findFirstAbove(
        byArcana,
        resultArcana,
        Math.floor(baseAvg) + 1, // 기존 "baseAvg" 대신, 수학적으로 동일한 "floor(평균)+1"
        excludeIds,
    );
    if (!resultPersona) {
        return {
            ok: false,
            reason: `결과 아르카나(${resultArcana})에 합체 가능한 페르소나가 없습니다.`,
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

const arcanaIndexByKr = new Map(arcanasData.map((a) => [a.name.kr, a.id]));

const triangleTable = triangleTableData.table as Record<
    string,
    Record<string, string | null>
>;

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
            const curNum = arcanaIndexByKr.get(cur.persona.arcana) ?? 999;
            const bestNum = arcanaIndexByKr.get(best.persona.arcana) ?? 999;
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

    const zeusErr = checkZeusExclusivity(materialPersonas);
    if (zeusErr) return { ok: false, reason: zeusErr };

    const special = findSpecialFusionMatch(byId, materialPersonas);
    if (special) {
        if (!special.resultPersona) {
            return {
                ok: false,
                reason: `특수합체 결과 페르소나(${special.recipe.result.name})를 데이터에서 찾을 수 없습니다.`,
            };
        }
        return {
            ok: true,
            spreadType: 'special',
            resultPersona: special.resultPersona,
            resultArcana: special.recipe.result.arcana,
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
                reason: '이 아르카나에서 레벨이 가장 높은 세 페르소나로는 동일 아르카나 합체를 할 수 없습니다.',
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
            reason: '1단계(재료1×재료2) 조합이 노말 스프레드 표에 없어서 트라이앵글 스프레드를 계산할 수 없습니다.',
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
            reason: '2단계(중간 아르카나×재료3) 조합이 트라이앵글 스프레드 표에 없습니다.',
        };
    }

    const { persona: resultPersona, capped } = findFirstAbove(
        byArcana,
        resultArcana,
        Math.floor(baseAvg) + 5, // 인게임 검증 사례 3건으로 확정 (+1, +3 모두 불일치)
        excludeIds,
    );
    if (!resultPersona) {
        return {
            ok: false,
            reason: `결과 아르카나(${resultArcana})에 합체 가능한 페르소나가 없습니다.`,
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
