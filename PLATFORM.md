# Platform API

Every screen talks to `api` from `@/platform/api.js` and nothing else. Errors
are `PlatformError` with a stable `.code` and a human `.message` — show
`err.message` directly, it is written for the end user.

```js
import { api, PlatformError } from '@/platform/api.js';
import { useAuth } from '@/platform/auth.jsx';
```

`useAuth()` → `{ user, ready, isStudent, isTeacher, isAdmin, isLocal, backend,
signIn, signUpStudent, signUpTeacher, signOut, updateProfile, deleteAccount,
refresh }`.
`user` = `{ id, role, username, displayName, avatarKey, title, gradeBand,
schoolName, xpTotal, settings }`.

## Auth
- `api.signUpTeacher({ email, password, displayName, schoolName })` → `{ profile, recoveryPhrase }` (phrase shown once)
- `api.signUpStudent({ username, password, displayName, joinCode?, avatarKey?, gradeBand? })` → `{ profile, joinedClass }`
- `api.signIn({ identifier, password })`, `api.signOut()`, `api.currentUser()`
- `api.changePassword({ currentPassword, newPassword })`
- `api.resetWithRecovery({ email, phrase, newPassword })`
- `api.resetStudentPassword({ classId, studentId, newPassword })` (teacher, own class only)
- `api.updateProfile(patch)`, `api.deleteOwnAccount()`

## Classes
- `api.createClass({ name, gradeBand, subject })`
- `api.listMyClasses({ includeArchived })` — role aware
- `api.updateClass(id, patch)`, `api.archiveClass(id, archived)`
- `api.regenerateJoinCode(id)` → `{ joinCode }`
- `api.lookupClassByCode(code)` → `{ classId, className, teacherName }` — throws
  `invalid_code | unknown_code | archived_code | inactive_code | expired_code`
- `api.joinClass(code)` → `{ …, alreadyMember }`, `api.leaveClass(classId)`
- `api.removeStudent(classId, studentId)`, `api.listRoster(classId)`

## Catalog
- `api.getCatalog()` → indexed catalog: `{ lessons, skills, strands,
  achievements, lesson(id), skill(id), strand(id), skillsByStrand,
  lessonsBySkill, haystack }`
- `api.listLessons(filters)` → `{ rows, total }`. Filters: `q, strands[],
  formats[], difficulties[], grades[], durations[], skills[], tags[],
  masteryOf, masteryStates[], sort, limit, offset`
- `api.getFacets(filters)` → `{ all, filtered }` counts for filter chips
- `api.getLessonForPlay(id)` → `{ lesson, activities }` **answers stripped**
- `api.getLessonForReview(id)` → same with answers (teacher/admin only)
- Admin: `createLesson`, `saveLesson`, `setLessonStatus`, `duplicateLesson`,
  `saveActivities`, `saveQuestion`, `exportOverrides`, `importOverrides`,
  `clearOverrides`
- Also from `@/content/index.js`: `CONTENT_SUMMARY` (bundled, tiny — counts,
  strands, featured lessons, sample questions), `FORMATS`, `DIFFICULTY`,
  `DURATION_BUCKETS`, `searchLessons`, `facetCounts`

## Play
- `api.startAttempt({ lessonId, assignmentId?, restart? })` → attempt (resumes an open one, `resumed: true`)
- `api.submitResponse({ attemptId, questionId, response, msElapsed })` → `{ isCorrect, explanation, answer, skillId }`
- `api.saveCheckpoint({ attemptId, state, secondsSpent })` — call after every answer
- `api.completeAttempt({ attemptId, score, maxScore, secondsSpent, state })` →
  `{ scorePct, progress, previousBest, isPersonalBest, isFirstCompletion,
     awards[], xpEarned, xpTotal, rank, nextRank, masteryChanges[], achievements[] }`
- `api.abandonAttempt(attemptId)`

## Student analytics
- `api.getStudentOverview(studentId?)` → `{ profile, rank, nextRank,
  continueCard, assignments[], recent[], recommendations[], progress, mastery,
  strands, achievements[], classes[], activity[], totals }`
- `api.getSkillDetail(studentId?)` → per-strand `{ strand, rollup, skills[] }`
- `api.getTimeline(studentId?, limit)`

## Teacher analytics
- `api.getTeacherOverview()` → `{ profile, classes[], activity[], recentEvents[] }`
- `api.getClassOverview(classId)` → `{ class, roster[], perStudent[],
  skillMatrix, strandMatrix, classStrands[], assignments[], insights[],
  weakSkills[], goals[], activity[], totals }`
- `api.getStudentDetail(classId, studentId)` → `{ student, overall, growth,
  strands, mastery, progress, review[], strengths[], timeline[], activity[],
  totals, assignments[] }`
- `api.createAssignment({ classId, lessonId, dueAt, minMastery, required, note })`
- `api.listAssignments(classId)`, `api.getAssignment(id)`,
  `api.updateAssignment(id, patch)`, `api.archiveAssignment(id)`
- `api.createClassGoal({ classId, title, metric, target, endsAt })`, `api.deleteClassGoal(id)`
- `api.exportClassCsv(classId, 'skills'|'summary'|'assignments')` → CSV string

## Mastery model — `@/platform/mastery.js`
`MASTERY_RULES`, `computeMastery`, `computeLessonProgress`, `rollUp`,
`levelForPct`, `XP`, `xpForCompletion`, `RANKS`, `rankForXp`, `nextRank`.
Levels: `not_started | beginning | developing | proficient | mastered`.

## Demo data — `@/platform/seed.js`
`seedDemo()` builds Mrs. Smith, 5th Grade Science (14 students incl. one who
never played), STEM Club (6), an archived class, assignments in mixed states,
class goals, and mid-lesson attempts so "Continue playing" has something real.
`credentials()` returns the sign-in details. `isSeeded()` checks.
