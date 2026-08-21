import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ScrollToTop from './shell/ScrollToTop.jsx';
import PublicLayout from './shell/PublicLayout.jsx';
import ArenaShell from './shell/ArenaShell.jsx';
import { RequireAuth, RedirectIfSignedIn, RouteSpinner } from '@/platform/auth.jsx';

/* Every page is a lazy chunk. The homepage should not carry the teacher
   dashboard, and a visitor reading about our library events should never
   download the lesson bank. */
const Home        = lazy(() => import('./pages/Home.jsx'));
const ExploreHub  = lazy(() => import('./pages/ExploreHub.jsx'));
const Experiments = lazy(() => import('./pages/Experiments.jsx'));
const Coding      = lazy(() => import('./pages/Coding.jsx'));
const Briefs      = lazy(() => import('./pages/Briefs.jsx'));
const Careers     = lazy(() => import('./pages/Careers.jsx'));
const ArenaAbout  = lazy(() => import('./pages/ArenaAbout.jsx'));
const Programs    = lazy(() => import('./pages/Programs.jsx'));
const Educators   = lazy(() => import('./pages/Educators.jsx'));
const About       = lazy(() => import('./pages/About.jsx'));
const GetInvolved = lazy(() => import('./pages/GetInvolved.jsx'));
const Privacy     = lazy(() => import('./pages/Privacy.jsx'));
const NotFound    = lazy(() => import('./pages/NotFound.jsx'));

const SignIn        = lazy(() => import('./pages/auth/SignIn.jsx'));
const JoinClass     = lazy(() => import('./pages/auth/JoinClass.jsx'));
const TeacherSignUp = lazy(() => import('./pages/auth/TeacherSignUp.jsx'));

const StudentHome    = lazy(() => import('./pages/student/StudentHome.jsx'));
const StudentExplore = lazy(() => import('./pages/student/StudentExplore.jsx'));
const StudentMissions = lazy(() => import('./pages/student/StudentMissions.jsx'));
const StudentProgress = lazy(() => import('./pages/student/StudentProgress.jsx'));
const StudentBadges   = lazy(() => import('./pages/student/StudentBadges.jsx'));
const StudentProfile  = lazy(() => import('./pages/student/StudentProfile.jsx'));
const LessonDetail    = lazy(() => import('./pages/student/LessonDetail.jsx'));
const LessonPlayer    = lazy(() => import('./pages/player/LessonPlayer.jsx'));

const TeacherHome      = lazy(() => import('./pages/teacher/TeacherHome.jsx'));
const TeacherClasses   = lazy(() => import('./pages/teacher/TeacherClasses.jsx'));
const ClassDashboard   = lazy(() => import('./pages/teacher/ClassDashboard.jsx'));
const StudentDetail    = lazy(() => import('./pages/teacher/StudentDetail.jsx'));
const TeacherAssignments = lazy(() => import('./pages/teacher/TeacherAssignments.jsx'));
const TeacherLibrary   = lazy(() => import('./pages/teacher/TeacherLibrary.jsx'));
const QuickPlay        = lazy(() => import('./pages/teacher/QuickPlay.jsx'));
const ClassroomMode    = lazy(() => import('./pages/teacher/ClassroomMode.jsx'));

const AdminHome    = lazy(() => import('./pages/admin/AdminHome.jsx'));
const AdminLessons = lazy(() => import('./pages/admin/AdminLessons.jsx'));
const AdminLessonEdit = lazy(() => import('./pages/admin/AdminLessonEdit.jsx'));
const AdminSkills  = lazy(() => import('./pages/admin/AdminSkills.jsx'));
const AdminContent = lazy(() => import('./pages/admin/AdminContent.jsx'));

/**
 * The old Base44 routes were bare page names like /ScienceArena. Anything
 * already linked, bookmarked or indexed keeps working.
 */
const LEGACY = {
  '/Home': '/',
  '/AboutUs': '/about',
  '/Learn': '/explore',
  '/Activities': '/explore/experiments',
  '/ThisWeekInSTEM': '/explore/briefs',
  '/CareersInSTEM': '/explore/careers',
  '/Events': '/programs',
  '/MakeAnImpact': '/get-involved',
  '/Play': '/arena',
  '/ScienceArena': '/arena',
  '/ScienceLab': '/arena',
  '/QuestPassport': '/arena/progress',
};

function Fallback() { return <RouteSpinner />; }

export default function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* ---------------------------------------------------- public */}
          <Route element={<PublicLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/explore" element={<ExploreHub />} />
            <Route path="/explore/experiments" element={<Experiments />} />
            <Route path="/explore/experiments/:lessonId" element={<Experiments />} />
            <Route path="/explore/coding" element={<Coding />} />
            <Route path="/explore/coding/:lessonId" element={<Coding />} />
            <Route path="/explore/briefs" element={<Briefs />} />
            <Route path="/explore/briefs/:lessonId" element={<Briefs />} />
            <Route path="/explore/careers" element={<Careers />} />
            <Route path="/arena" element={<ArenaAbout />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/educators" element={<Educators />} />
            <Route path="/about" element={<About />} />
            <Route path="/get-involved" element={<GetInvolved />} />
            <Route path="/privacy" element={<Privacy />} />
          </Route>

          {/* ------------------------------------------------------ auth */}
          <Route path="/arena/sign-in" element={<RedirectIfSignedIn><SignIn /></RedirectIfSignedIn>} />
          <Route path="/arena/join" element={<JoinClass />} />
          <Route path="/arena/sign-up" element={<Navigate to="/arena/join" replace />} />
          <Route path="/arena/sign-up/teacher" element={<RedirectIfSignedIn><TeacherSignUp /></RedirectIfSignedIn>} />

          {/* -------------------------------------------------- platform */}
          <Route element={<RequireAuth><ArenaShell /></RequireAuth>}>
            <Route path="/arena/home" element={<StudentHome />} />
            <Route path="/arena/explore" element={<StudentExplore />} />
            <Route path="/arena/assignments" element={<StudentMissions />} />
            <Route path="/arena/progress" element={<StudentProgress />} />
            <Route path="/arena/achievements" element={<StudentBadges />} />
            <Route path="/arena/profile" element={<StudentProfile />} />
            <Route path="/arena/lesson/:lessonId" element={<LessonDetail />} />
            <Route path="/arena/play/:lessonId" element={<LessonPlayer />} />

            <Route path="/arena/teach" element={<RequireAuth roles={['teacher', 'admin']}><TeacherHome /></RequireAuth>} />
            <Route path="/arena/teach/classes" element={<RequireAuth roles={['teacher', 'admin']}><TeacherClasses /></RequireAuth>} />
            <Route path="/arena/teach/classes/:classId" element={<RequireAuth roles={['teacher', 'admin']}><ClassDashboard /></RequireAuth>} />
            <Route path="/arena/teach/classes/:classId/students/:studentId" element={<RequireAuth roles={['teacher', 'admin']}><StudentDetail /></RequireAuth>} />
            <Route path="/arena/teach/assignments" element={<RequireAuth roles={['teacher', 'admin']}><TeacherAssignments /></RequireAuth>} />
            <Route path="/arena/teach/library" element={<RequireAuth roles={['teacher', 'admin']}><TeacherLibrary /></RequireAuth>} />
            <Route path="/arena/teach/quick" element={<RequireAuth roles={['teacher', 'admin']}><QuickPlay /></RequireAuth>} />
            <Route path="/arena/teach/classroom/:classId" element={<RequireAuth roles={['teacher', 'admin']}><ClassroomMode /></RequireAuth>} />

            <Route path="/arena/admin" element={<RequireAuth roles={['admin']}><AdminHome /></RequireAuth>} />
            <Route path="/arena/admin/lessons" element={<RequireAuth roles={['admin']}><AdminLessons /></RequireAuth>} />
            <Route path="/arena/admin/lessons/:lessonId" element={<RequireAuth roles={['admin']}><AdminLessonEdit /></RequireAuth>} />
            <Route path="/arena/admin/skills" element={<RequireAuth roles={['admin']}><AdminSkills /></RequireAuth>} />
            <Route path="/arena/admin/content" element={<RequireAuth roles={['admin']}><AdminContent /></RequireAuth>} />
          </Route>

          {/* ---------------------------------------- legacy Base44 URLs */}
          {Object.entries(LEGACY).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
