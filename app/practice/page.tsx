import { PracticeSession } from "@/app/practice/practice-session";
import { starterProblems } from "@/src/lib/problems";

export default function PracticePage() {
  return (
    <main className="shell">
      <PracticeSession problems={starterProblems} />
    </main>
  );
}
