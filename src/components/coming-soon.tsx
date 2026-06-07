import { Card } from "./ui/card";

export function ComingSoon({ phase = 2 }: { phase?: 1 | 2 | 3 }) {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold mb-3">
        Phase {phase}
      </div>
      <h2 className="text-xl font-bold">Coming in Phase {phase}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
        Models are already in the Prisma schema. The UI ships with Phase {phase}.
        See README → Roadmap.
      </p>
    </Card>
  );
}
