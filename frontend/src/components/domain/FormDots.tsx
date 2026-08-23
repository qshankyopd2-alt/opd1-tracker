export function FormDots({ form, testId }: { form: ("W" | "L")[]; testId?: string }) {
  if (!form || form.length === 0) return <span className="text-zinc-600 text-xs">—</span>;
  return (
    <span data-testid={testId} className="inline-flex items-center gap-[3px]" title={`Recent form: ${form.join(" ")}`}>
      {form.slice(0, 5).map((r, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-[2px]"
          style={{ backgroundColor: r === "W" ? "#10B981" : "#EF4444", opacity: 1 - i * 0.12 }}
        />
      ))}
    </span>
  );
}
