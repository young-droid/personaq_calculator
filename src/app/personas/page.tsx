import personas from '@/data/personas.json';
import PersonaSearch from '@/components/PersonaSearch';

export default function PersonasPage() {
    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                페르소나 리스트
            </h1>

            <PersonaSearch personas={personas} />
        </main>
    );
}
