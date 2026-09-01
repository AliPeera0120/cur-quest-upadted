/* Shared CSV builders, so both backends export byte-identical files. */
const esc = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const table = (rows) => rows.map((r) => r.map(esc).join(',')).join('\n');

export function exportRows(data, catalog, kind = 'skills') {
  if (kind === 'summary') {
    return table([
      ['Student', 'Overall mastery %', 'Growth (pts)', 'Lessons completed', 'Questions answered', 'Accuracy %', 'Skills mastered', 'Minutes', 'Last active'],
      ...data.perStudent.map((p) => [
        p.student.displayName, p.overall ?? '', p.growth ?? '', p.lessonsCompleted,
        p.questionsAnswered, p.accuracy ?? '', p.skillsMastered,
        Math.round(p.seconds / 60), p.lastActiveAt ? new Date(p.lastActiveAt).toLocaleDateString() : 'never',
      ]),
    ]);
  }
  if (kind === 'assignments') {
    const rows = [];
    for (const a of data.assignments) {
      for (const r of a.rows) {
        rows.push([
          a.title || a.lessonTitle, a.lessonTitle,
          a.dueAt ? new Date(a.dueAt).toLocaleDateString() : '',
          a.minMastery, r.student.displayName, r.state,
          r.progress.bestScore ?? '', r.progress.attempts,
        ]);
      }
    }
    return table([['Assignment', 'Lesson', 'Due', 'Min mastery %', 'Student', 'Status', 'Best score %', 'Attempts'], ...rows]);
  }
  const strands = catalog.strands;
  return table([
    ['Student', ...strands.map((s) => `${s.name} %`), ...strands.map((s) => `${s.name} level`)],
    ...data.perStudent.map((p) => [
      p.student.displayName,
      ...strands.map((s) => p.strands[s.id]?.pct ?? ''),
      ...strands.map((s) => p.strands[s.id]?.level ?? 'not_started'),
    ]),
  ]);
}
