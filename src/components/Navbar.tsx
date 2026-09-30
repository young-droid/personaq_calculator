import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
                <Link
                    href="/"
                    className="font-bold text-zinc-900 dark:text-zinc-50"
                >
                    페르소나Q 합체 계산기
                </Link>

                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                    <Link href="/">합체 계산기</Link>
                    <Link href="/personas">페르소나 리스트</Link>
                    <Link href="/skills">스킬 리스트</Link>
                    <Link href="/saved">저장한 페르소나</Link>
                    <Link href="/settings">설정</Link>
                </div>
            </div>
        </nav>
    );
}
