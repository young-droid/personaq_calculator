import personas from '@/data/personas.json';
import skills from '@/data/skills.json';
import Calculator from '@/components/Calculator';

// 이 파일(page.tsx)은 기본적으로 "서버 컴포넌트"야.
// 서버에서 미리 JSON 데이터를 읽어서, 그 결과를 클라이언트 컴포넌트(Calculator)에
// props로 넘겨주는 역할만 해. 이 파일 안에는 useState 같은 훅을 못 써 (서버에서 실행되니까).
export default function Home() {
    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-black">
            <main className="mx-auto flex max-w-5xl min-w-4xl flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                        페르소나Q 합체 계산기
                    </h1>
                </div>

                {/* personas/skills는 서버에서 읽은 데이터. 여기서 클라이언트 컴포넌트로 "전달"만 한다. */}
                <Calculator personas={personas} skills={skills} />
            </main>
        </div>
    );
}
