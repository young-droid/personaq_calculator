import type { Persona } from '@/types/persona';
import {
    personaName,
    arcanaName,
    skillName,
    label,
    fusionResultText,
    DEFAULT_LANG,
    type Lang,
} from '@/lib/i18n';

type Props = {
    persona: Persona;
    lang?: Lang;
};

export default function PersonaInfoCard({
    persona,
    lang = DEFAULT_LANG,
}: Props) {
    const blockedTypes = persona.nonInheritable;

    return (
        <article className="grid h-full w-full grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex min-w-0 flex-col justify-between gap-1">
                <header>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                        {personaName(persona.id, lang)}
                    </h2>

                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {arcanaName(persona.arcana, lang)} · Lv.{persona.level}
                    </p>
                </header>

                <dl className="flex flex-row gap-3 text-sm">
                    <div>
                        <dt className="text-zinc-500">HP 보너스</dt>
                        <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {persona.hpBonus ?? '—'}
                        </dd>
                    </div>

                    <div>
                        <dt className="text-zinc-500">SP 보너스</dt>
                        <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {persona.spBonus ?? '—'}
                        </dd>
                    </div>
                </dl>

                <section>
                    <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        계승 불가 스킬 타입
                    </h3>

                    {blockedTypes === null ? (
                        <p className="text-sm text-zinc-500">정보 없음</p>
                    ) : blockedTypes.length === 0 ? (
                        <p className="text-sm text-zinc-500">없음</p>
                    ) : (
                        <ul className="flex flex-wrap gap-2">
                            {blockedTypes.map((type) => (
                                <li
                                    key={type}
                                    className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                >
                                    {label('inheritType', type, lang)}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
            <section>
                <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    자력으로 배우는 스킬
                </h3>

                <ul className="grid grid-cols-2 gap-1">
                    {persona.skills.map(({ skill, learnLevel }) => {
                        const isSkillCard = skill === persona.skillCard;

                        return (
                            <li
                                key={skill}
                                // className="flex items-center justify-between border rounded-sm border-zinc-500 p-1 text-sm"
                                className={`flex min-w-0 items-center justify-between gap-3 p-1 border rounded-sm text-sm ${
                                    isSkillCard
                                        ? 'border-blue-400 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-100'
                                        : 'border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:text-zinc-50'
                                }`}
                            >
                                <span className="text-zinc-900 dark:text-zinc-50">
                                    {skillName(skill, lang)}
                                </span>

                                <span
                                    className={`shrink-0 text-xs ${
                                        isSkillCard
                                            ? 'text-blue-700 dark:text-blue-300'
                                            : 'text-zinc-500 dark:text-zinc-400'
                                    }`}
                                >
                                    {learnLevel === null
                                        ? fusionResultText('initialSkill', lang)
                                        : `Lv.${learnLevel}`}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </article>
    );
}
