# VetRelief audit and implementation checklist

## Current architecture

- Frontend: React 19, Vite, React Router, JavaScript/JSX.
- Backend: Express 5 in `server/server.js`.
- Persistence: MongoDB/Mongoose with user, job, application, saved-job, notification, alert, conversation, interview, review, verification, mentorship, career-goal, learning-resource, saved-resource, and interview-practice models.
- Deployment references: the main page had a hardcoded Vercel API URL; the profile page had a localhost URL. The frontend now accepts `VITE_API_URL` for both.
- The Express backend exports its app from `server/server.js`; a Vercel backend project should use `server/` as its root so Vercel can detect that entrypoint. Live deployment has not been verified. A Node API integration test runs from the server package and root test command.

## Feature checklist

| # | Feature | Status |
|---|---|---|
| 1 | AI-based job matching | In Progress |
| 2 | Personalized recommendations | Tested |
| 3 | Advanced job search and filters | Tested |
| 4 | Saved jobs and bookmarks | Tested |
| 5 | Job alerts and notifications | Tested |
| 6 | Application tracking | Tested |
| 7 | Salary and benefits transparency | Tested |
| 8 | Employer and clinic profiles | Tested |
| 9 | Clinic reviews and ratings | Tested |
| 10 | Candidate-employer messaging | Tested |
| 11 | Interview scheduling | Tested |
| 12 | Professional veterinary profiles | Tested |
| 13 | Verified candidate and employer profiles | Tested |
| 14 | Veterinary internship marketplace | Tested |
| 15 | Externship marketplace | Tested |
| 16 | Veterinary mentorship matching | Tested |
| 17 | Student career dashboard | Tested |
| 18 | Locum and relief job listings | Tested |
| 19 | Map-based job search | In Progress |
| 20 | AI resume builder | In Progress |
| 21 | AI interview preparation | In Progress |
| 22 | Career path planner | Tested |
| 23 | Veterinary learning and resources hub | Tested |
| 24 | Employer recruitment dashboard | Tested |
| 25 | Mobile-first and PWA experience | Implemented |

`In Progress` indicates a related implementation exists but the full feature requirements are not complete. `Implemented` indicates the feature work is present but still needs the evidence required for `Tested`. `Tested` means automated checks passed; MongoDB persistence and browser flows still need verification against the configured database and deployment. `Deployed` is used only after a live deployment is verified.

## Phase 0 results

- Preserved the existing API and UI structure while requiring authentication for application submission and application listing.
- Application queries now scope candidate access to the signed-in candidate and employer access to applications associated with that employer. New application records store candidate and job references and the owning employer email. Existing records without ownership metadata remain visible to their candidate by email, but are not exposed to employers.
- Application status updates now require an authenticated clinic owner and match the application's employer email.
- Signup accepts candidate, student, and clinic-owner roles; no client-provided admin role is accepted.
- Production now requires `AUTH_TOKEN_SECRET`, `MONGO_URI`, and `FRONTEND_ORIGINS`. MongoDB connection failure no longer starts a production server with ephemeral in-memory records.
- Frontend API URL is configurable through `VITE_API_URL`; application requests include the bearer token and selected job ID.
- Mongoose adds optional indexed `candidateId`, `jobId`, and `employerEmail` fields to applications. Existing records are not deleted or rewritten.

## Phase 1 results

- Candidate profile GET/PUT endpoints now load and save validated candidate details, credentials-confirmed edits, professional summary, specializations, skills, certifications, experience, employment history, preferences, availability, and resume/avatar data.
- Clinic owners can edit business details, clinic description, specialties, facilities, team information, and logo. A public clinic directory shows business contact details and current job summaries.
- Clinic owners can create, edit, and delete only their own jobs. Job submissions are restricted to clinic-owner accounts.
- Application listing is scoped to the signed-in candidate or the owning clinic. Employers can update statuses with actor/timestamp history and retrieve application resumes through an ownership-checked endpoint. Candidates see their own application status and history.
- Job search now supports backend keyword, location, specialization, employment type, experience, work mode, salary range, posted-within, sort, and pagination filters.
- Saved jobs are persisted through a unique candidate/job relation, with save/remove controls and a saved-jobs section. Deleted jobs remain identifiable as unavailable when MongoDB population returns no job.
- Jobs support structured salary bounds, currency, pay frequency, benefits, accommodation, and relocation assistance while preserving the existing free-form pay field for older records.
- API integration tests cover role checks, ownership, profile editing, clinic listing, search, saved jobs, application tracking, status history, and resume access.

## Phase 2 results

- Candidates can create and remove job alerts with keyword, location, specialty, and employment type filters. New matching jobs generate private in-app notifications. Application status changes also notify candidates.
- In-app notifications are scoped to their recipient and can be marked read. Messaging threads are tied to an application, restricted to its candidate and clinic owner, and notify the other participant on each message.
- Clinic owners can invite an applicant to a future interview, change its time or cancel it. Candidates can confirm or decline; both parties receive notifications for invitations, changes, cancellations, and responses.
- Candidates can review a clinic after an application reaches Selected or Rejected. Clinic directory entries show published average ratings. Users can report a review; administrators can inspect reported reviews and hide or republish them.
- Candidates and clinic owners can submit a PDF or image as a private verification request. The submitting user can see request status and retrieve their own document. Administrators can review/download documents, approve or reject requests, and approval marks the user verified. Clinic directory profiles display verified status.
- Added MongoDB models for job alerts, notifications, conversations, interviews, clinic reviews, and verification requests. The API uses the same role and ownership checks in MongoDB and the development in-memory fallback.
- React dashboard now exposes alerts, notifications, messages, interview responses and changes, post-application clinic reviews, document submission, and administrator review controls.

## Phase 3 results

- Job listings now distinguish standard jobs, internships, externships, locum assignments, and relief roles. Employers can add opportunity-specific duration, eligibility, responsibilities, stipend, deadlines, mentorship, learning objectives, application instructions, assignment dates, and shift details.
- Backend search filters by opportunity category and verified clinic status. Existing job records without the new category continue to behave as standard jobs.
- Veterinary students can register with a student account and see a career dashboard with internship, externship, and entry-level listings, saved opportunities, application counts, profile completion, and the mentorship directory.
- Veterinary professionals can opt into a mentor listing with topics, availability, and communication methods. Candidates and students can request mentorship around an offered topic; only the invited mentor can accept or reject. The directory does not expose email or phone details.
- Employers can attach latitude and longitude to an opportunity. Candidates can switch between the list and an OpenStreetMap embed centered on a selected listing; listings without coordinates remain available in the list. Geocoding, distance search, and multi-job markers are not implemented.
- Added mentorship request persistence and indexes; extended job and user models with opportunity and mentor fields. Existing records remain readable through defaults and serializer fallbacks.
- React screens now include opportunity category filters and publishing fields, student career dashboard, mentor opt-in, mentor directory, request actions, and map links.

### Phase 3 API paths

- Existing `GET /api/jobs` accepts `opportunityType` and `verifiedOnly` filters; existing clinic-owner job create/edit endpoints persist category-specific fields.
- `GET /api/mentors`, `PUT /api/mentors/me`, `GET/POST /api/mentorship-requests`, and `PATCH /api/mentorship-requests/:id`.

### Manual Phase 3 check

1. Create an employer listing for each opportunity category, including dates, eligibility, stipend, and shift data where appropriate; verify public search filters and application submission.
2. Sign up as Veterinary Student and inspect internship, externship, entry-level, saved opportunity, application, and profile completion sections.
3. Sign in as a veterinarian or vet tech, publish a mentor profile, and verify students can filter mentors by topic and send a request. Confirm only that mentor can accept or reject it.
4. Add coordinates to a job and open its map link. Confirm listings without coordinates remain searchable and visible.
5. Test new data against MongoDB, including migration behavior for old jobs without `opportunityType`; the current automated suite exercises the in-memory fallback.

## Phase 4 results

- Candidate recommendations use a deterministic profile-match fallback that scores only provided data: specializations, skills, preferred locations, experience, salary overlap, saved-job tags, preferred employment types, and overlap between candidate qualifications and job requirements. Results include transparent reasons and exclude jobs already applied to. Optional AI matching is documented under Phase 5.
- Candidates can edit a private structured resume with education, experience, skills, certifications, and three layouts. The preview opens a print-ready document that can be saved as PDF in the browser; no generated qualifications are added.
- Interview preparation offers role-aware fallback questions and focus prompts for supported specialties. Candidates save answers and self-ratings. The prompts are labeled as practice only, not AI-generated answers or clinical guidance.
- Candidates can create career goals with target dates and milestone progress, and update/delete only their own goals.
- Added a searchable learning resource hub with candidate bookmarks and Admin-only publishing, hiding, editing, and deletion. Resources are externally linked, so publishing requires reviewed content and an administrator account.
- Added `CareerGoal`, `LearningResource`, `SavedResource`, and `InterviewPractice` models and the structured private resume section on `User`.
- React now provides recommendation cards, structured resume editing/print export, interview practice and saved progress, career goal tracking, and resource browsing/bookmarks/admin publishing controls.

### Phase 4 API paths

- `GET /api/job-matches` and `GET /api/recommendations`.
- `GET/PUT /api/resume-builder`.
- `GET /api/interview-prep/questions`, `GET/PUT /api/interview-prep/progress`.
- `GET/POST /api/career-goals`, `PATCH/DELETE /api/career-goals/:id`.
- `GET /api/learning-resources`, `GET /api/saved-resources`, `POST/DELETE /api/saved-resources/:resourceId`; Admin-only `GET /api/admin/learning-resources`, `POST /api/learning-resources`, and `PATCH/DELETE /api/learning-resources/:id`.

### Manual Phase 4 check

1. Complete candidate specializations, skills, location, experience, salary preferences, and save a job; inspect match reasons and confirm already-applied jobs are excluded.
2. Edit resume sections, save, preview, and use Print / Save as PDF. Verify only candidate-provided details appear.
3. Open interview practice as a veterinarian, vet tech, and student; change specialization, answer prompts, rate yourself, and save progress.
4. Create a career goal with milestones, update completion, then confirm another account cannot view or change it.
5. As Admin, publish a reviewed external learning link. Browse, search, bookmark it as a candidate, then hide or remove it and verify the saved listing behavior.
6. Repeat against test MongoDB. Automated tests currently use the in-memory fallback; AI provider-backed behavior is not configured or claimed.

### Phase 2 API paths

- `GET/POST/DELETE /api/job-alerts`, `GET /api/notifications`, and `PATCH /api/notifications/:id/read`.
- `GET/POST /api/conversations` and `POST /api/conversations/:id/messages`.
- `GET /api/interviews`, `POST /api/applications/:id/interviews`, and `PATCH /api/interviews/:id` or `/api/interviews/:id/response`.
- `GET /api/clinics/:clinicId/reviews`, `POST /api/applications/:id/reviews`, `POST /api/reviews/:id/report`, and admin-only `GET /api/moderation/reviews` plus `PATCH /api/reviews/:id/moderate`.
- `POST/GET /api/verification-requests`, `GET /api/verification-requests/:id/document`, and admin-only `PATCH /api/verification-requests/:id/review`.

### Manual Phase 2 check

1. Sign in as a candidate, save an alert, then publish a matching job as a clinic owner; confirm a notification arrives and can be marked read.
2. Start a conversation from an application as each participant and verify another account cannot read or send to that thread.
3. Invite a candidate to an interview, reschedule or cancel it, then confirm or decline as the candidate. Check both accounts receive the related notifications.
4. Move an application to Selected or Rejected, submit a clinic review, and verify the clinic rating. Report the review and use a provisioned Admin account to hide or republish it.
5. Submit a verification file as a candidate and clinic owner. Confirm each can see only their own status/document, then review it as Admin and confirm approval adds the verified badge.
6. Repeat against test MongoDB to verify indexes, persistence, and private document access; the current automated suite uses the in-memory development fallback.

### Phase 1 database and API changes

- Models extended: `User` (candidate profile and clinic profile fields), `Job` (structured salary, work mode, and experience fields plus indexes), `Application` (status history and ownership), and new `SavedJob` (unique candidate/job pair).
- Added/extended endpoints: `GET/PUT /api/profile`, `GET /api/clinics`, `GET /api/employer/jobs`, filtered/paginated `GET /api/jobs`, `POST/PUT/DELETE /api/jobs`, `GET/POST/DELETE /api/saved-jobs`, authenticated `GET /api/applications`, `PATCH /api/applications/:id/status`, `GET /api/applications/:id/resume`, and authenticated `POST /api/apply`.
- Existing MongoDB records remain valid; missing optional fields use defaults. No collection drops or production migrations were run.

### Manual Phase 1 check

1. Create a Clinic Owner account, complete business details in Profile, and publish a job with salary, work mode, experience, and benefits.
2. Edit and delete that job from the owner dashboard; confirm another owner receives a not-found response for the same job ID.
3. Create a candidate account, edit the professional profile, search by location/salary/work mode, save a job, and remove it from Saved Jobs.
4. Apply with a PDF. Confirm the candidate tracker shows the application and status history, and the owning clinic can update status and download the resume.
5. Confirm a different candidate cannot retrieve that resume and a different clinic cannot view or update that application.
6. Configure a test MongoDB and repeat these steps to validate Mongoose persistence and indexes; the automated test currently covers the in-memory development fallback only.

### Checks

- Frontend production build: passed.
- Backend `node --check` for server and models: passed.
- `git diff --check`: passed (Git reports expected LF-to-CRLF conversion warnings on Windows).
- `npm test`: passed (1 API integration test; it exercised the in-memory development fallback because no test MongoDB was configured).
- Backend `node --check` and frontend production build: passed after Phase 3 changes.
- Backend `node --check`, API integration tests, and frontend production build: passed after Phase 4 changes.
- Phase 4 integration coverage checks explainable recommendations and applied-job exclusion, private resume-builder saving, role/specialty-specific question fallbacks and practice progress, career goal ownership/milestones, and admin-only resource publishing.
- API integration coverage includes alert creation and matching notification, participant-scoped conversations, interview scheduling/rescheduling/confirmation, eligible reviews and reports, and private verification document access. It also checks that non-admin users cannot use moderation or verification review controls.
- Phase 3 API integration coverage includes internship/externship/locum/relief publication and filtering, coordinates, student signup, topic-filtered mentor discovery, and mentor-only mentorship request responses.
- MongoDB-backed persistence and browser automation: not verified in this environment.
- Deployment: not verified. No deployment configuration or live deployment was changed.

### Configuration

- Backend: `MONGO_URI`, `AUTH_TOKEN_SECRET`, `FRONTEND_ORIGINS`, `PORT`, and `TRUST_PROXY` (set according to the hosting proxy topology; defaults to one trusted proxy). Configure `CRON_SECRET` for Vercel scheduled alert digests. Configure `RESEND_API_KEY` and `RESET_EMAIL_FROM` for password-reset mail and alert digest emails. Optional AI: `OPENAI_API_KEY` and `OPENAI_MODEL`.
- Admin provisioning: run `npm run create-admin` from `server/` after setting `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` (minimum 12 characters); do not keep the bootstrap password in deployment configuration afterward.
- Frontend: `VITE_API_URL` (leave blank for local Vite proxy; set to the deployed API origin for separate Vercel projects).
- Example files are `server/.env.example` and `client/.env.example`; replace example values locally and configure production values in the backend/frontend deployment projects.

## Phase 5 results

- Employer recruitment dashboard now filters the employer's already ownership-scoped applicant list by candidate name, role, listing, location, profile summary, specialties, skills, certifications, and application status. It shows the filtered result count and applications received in the last seven days; status updates, resumes, messages, and interviews remain tied to the existing authorized endpoints.
- Added a keyboard skip link, explicit navigation label, accessible labels for auth fields and candidate filters, visible focus styling, reduced-motion support (already present), and narrow-screen layouts for candidate filters and applicant rows. These are code-level improvements; screen-reader and device-browser review remains outstanding.
- Added installable PWA metadata, a scalable app icon, and a service worker that caches only the app shell and same-origin hashed static assets. Requests under `/api/`, non-GET requests, and cross-origin requests are never intercepted or cached. Offline support is for the application shell only; authenticated features require the network.
- Added response security headers, disabled the Express signature header, bounded JSON request bodies, and limited login/signup to 10 attempts per IP and route per 15-minute window. Rate-limit state is per Node process/function instance; a shared gateway or distributed store is still needed for consistent multi-instance enforcement.
- Added safe JSON responses for malformed and oversized bodies, CORS rejection, unmatched routes, and unhandled errors. Server errors are logged without returning internal details to clients.
- The backend now exports its Express app without opening a socket when imported and reconnects to MongoDB on demand in production. Vercel's Express support recognizes `server.js` at the configured project root; use `server/` as the backend project root. Live deployment remains unverified.
- Advanced job search now includes specialization, salary currency, and relevance sorting. Candidate profiles include preferred employment types; deterministic matches explain preference and requirements overlap.
- Clinic listings can load and hide public reviews, and users can report a review. Verification requests display review status, timestamp, reviewer, and rejection note; rejected requests can be resubmitted. Rejection requires a reviewer note.
- Job search offers an OpenStreetMap embed/list toggle centered on one selected listing with coordinates. Listings without coordinates remain in the list; geocoding, distance search, and multi-job map markers are not available.
- Added optional, backend-only OpenAI Responses API support for job matches, resume suggestions, and interview-answer feedback. It requires explicit per-request consent, sends minimized candidate/job text without contact details, excludes already-applied jobs, constrains matching output to supplied jobs, and retains non-AI fallbacks. `OPENAI_API_KEY` remains unconfigured here, so provider calls are not verified. Requests set `store: false`; standard API abuse-monitoring retention still applies.
- No schema or collection changes were required for Phase 5.

## Completion pass

- Job alerts now support salary bounds, currency, instant/daily/weekly frequency, duplicate prevention, pausing, and resuming. Matching jobs produce in-app notices; daily digests are sent through configured Resend email and a secret-protected Vercel cron endpoint. Email delivery and the scheduled Vercel invocation require deployment credentials and have not been run here.
- Conversation threads support unread counts, read receipts, paginated message history, and a bounded embedded-message history. Participants alone can load or mark a thread read.
- Interview invitations include an IANA time zone and prevent overlapping scheduled appointments for the candidate or clinic during creation and rescheduling.
- Password recovery now issues a random one-time token, stores only its hash, expires it after 15 minutes, and sends it through Resend when configured. Responses do not reveal whether an account exists. Successful password reset revokes existing sessions.
- Account deletion requires the current password, blocks Admin self-deletion, and removes the account's related personal records and owned jobs. The in-memory fallback is covered as well.
- Admin has user search, overview counts, account enable/disable, job hide/publish moderation, review moderation, verification review, and learning-resource editing. Admin creation is only available through the guarded `npm run create-admin` script with explicit environment variables; public signup cannot create an Admin.
- Resume profiles now include editable qualifications and a print-to-PDF flow. AI resume suggestions remain editable drafts.
- Removed hardcoded demo job records from client and server fallbacks. Empty search results now render a real empty state and counts come from current records.
- Added PWA install prompting and a development API proxy. API URLs are configurable and production CORS now requires an explicit allowed-origin list.
- Expanded API tests cover the above workflows in the in-memory environment, including alert digests, read state, time conflicts, Admin moderation, reset/session revocation, and account deletion.

### Phase 5 checks

- `npm.cmd test`: passed (2 tests: recruitment/career API integration and recommendation service matching). The API test includes ownership workflows, search, review reporting, verification privacy, AI consent/configuration gates, security headers, malformed JSON, throttling, Admin workflows, reset/session revocation, account deletion, alerts, conversations, and interviews. It used the in-memory fallback because no test MongoDB was configured.
- `npm.cmd run build`: passed (Vite production build; 25 modules transformed; latest build output was 25 modules).
- `node --check server/server.js`, `node --check client/public/sw.js`: passed.
- `git diff --check`: passed with expected LF-to-CRLF warnings on Windows.
- MongoDB-backed tests, browser/device accessibility checks, offline installation checks, AI provider calls, and a live serverless deployment were not available here.

### Phase 5 manual and deployment checks

1. As an employer with applications, search by candidate name, role, specialty, skill, and job title; combine with each application status and confirm only your own applicants appear.
2. Use keyboard-only navigation and a screen reader at mobile and desktop widths. Verify skip navigation, form names, focus visibility, and responsive application actions.
3. Serve the production client over HTTPS, install the PWA, then go offline. Confirm the static shell opens and candidate/employer data is unavailable offline. Inspect Cache Storage and verify no `/api/` response is stored.
4. Deploy the backend Vercel project with its root directory set to `server/`; set `MONGO_URI`, `AUTH_TOKEN_SECRET`, `FRONTEND_ORIGINS`, `TRUST_PROXY`, `CRON_SECRET`, `RESEND_API_KEY`, and `RESET_EMAIL_FROM` appropriately. Set the frontend's `VITE_API_URL` to that deployment and verify health, auth, profiles, search, applications, and private resume access against test MongoDB before production. Vercel cron schedule configuration is in `server/vercel.json`.
5. Run `npm run create-admin` from `server/` with `MONGO_URI`, `ADMIN_EMAIL`, `ADMIN_NAME`, and a 12-character-or-longer `ADMIN_PASSWORD`; verify Admin pages and moderation using that provisioned account.
6. Request a password recovery and job-alert digest using a configured Resend test sender; confirm email delivery, expiry, generic responses, and the scheduled cron invocation.

## Remaining audit findings

- Existing application records have no job or employer relationship. They remain candidate-readable, but employer management applies only to new records with stored ownership metadata.
- Experience-level, work-mode, opportunity-category, specialization, salary currency, and verified-employer filters are available. Map discovery shows one selected coordinate at a time; it does not geocode or search by distance.
- Candidate visibility currently controls whether extended profile details accompany an application to that employer; application contact details remain shared as part of applying. There is not yet a public candidate directory. Employer filtering only searches candidates who applied to that employer's own listings.
- Resume uploads and verification documents are still stored as base64 in MongoDB; private object storage, retention/deletion policy, reviewer audit history, and verification expiry/revocation are future work.
- An administrator account must be provisioned with the guarded `npm run create-admin` script; public signup does not permit admin creation. Admin workflows are covered by a test-only fixture in the API integration suite.
- Job alerts send in-app notices immediately and support scheduled email digests. Production email delivery and cron execution still require configured Resend/Vercel credentials. Push delivery is not implemented.
- Interview scheduling stores timestamps and optional meeting details. Calendar-provider integration, email invitations, and recurring availability are not implemented.
- The in-process login/signup limiter is not shared across Vercel instances. Configure a distributed rate-limit store or edge gateway before relying on it for high-volume production abuse protection.
- Deployment, configured-MongoDB persistence, mobile browser behavior, assistive-technology behavior, scheduled email delivery, and OpenAI provider calls are not verified. No production settings or deployment were changed. Completion of those checks requires access to test MongoDB, mail and hosting credentials, and an OpenAI API key if AI is to be enabled. The existing client still has some feature requirements that remain partial: AI matching/resume/interview feedback depend on provider configuration, and map discovery has no geocoding, distance search, or multi-job markers.

## Remaining Tasks - Execution Checklist

Use this list to finish implementation and then verify the system in a staging environment. Keep each box unchecked until its acceptance criteria pass. Do not put secrets in this file or commit local `.env` files.

### A. Implement the remaining feature gaps

- [ ] **Complete map discovery.** Add a map/list experience with multiple job markers, visible job summaries, map bounds/location filtering, and selection-to-job-detail navigation. Keep list search usable when map tiles/provider are unavailable. Use a provider with an approved usage policy; keep restricted browser keys in frontend configuration and server-only keys on the backend. **Done when:** several coordinate-bearing jobs appear together, filters update both map and list, selecting a marker opens its job, and missing coordinates/provider failure leaves the list usable.
- [ ] **Handle legacy application ownership.** Add a dry-run migration/report for old application records missing `jobId`, `candidateId`, or employer ownership. Backfill only when a unique, reliable existing relation proves the match; report ambiguous/unmatched rows for manual review and never infer ownership from name alone. **Done when:** the dry-run report is reviewed, safe rows migrate in staging, and rerunning the migration is idempotent.
- [ ] **Decide and implement protected document storage before scale-up.** Move resume and verification base64 payloads from MongoDB to private object storage, retaining authenticated download routes and file validation. Add a retention/deletion policy and reviewer audit history. **Done when:** unauthorized users cannot retrieve objects, deletion removes related objects, and existing files are migrated and verified. This is a production-hardening item; current storage remains private within MongoDB.

### B. Run local checks

- [ ] From the repository root, run `npm.cmd test` and `npm.cmd run build`; record the current results and fix regressions.
- [ ] From `server/`, run `node --check server.js`, `node --check scripts/create-admin.js`, `node --check test/api.test.js`, and `git diff --check`.
- [ ] Start the API and Vite client locally using the existing `dev` scripts and confirm the Vite `/api` proxy reaches the backend. Check signup/login, logout, empty job results, and API error/loading states.

### C. Verify against staging services

- [ ] **MongoDB staging:** configure a disposable test database; run the API integration suite against MongoDB as well as the in-memory fallback. Verify indexes, persistence after restart, model defaults for older records, account deletion cleanup, file access control, and ownership checks. Do not use production data for this check.
- [ ] **AI provider:** configure `OPENAI_API_KEY` and `OPENAI_MODEL` only in the backend staging environment. Exercise job matching, resume suggestions, and interview feedback with explicit consent; verify minimized inputs, editable output, no invented qualifications, fallback behavior on timeout/error, and no exposed key in built frontend assets or logs.
- [ ] **Admin workflows:** provision a staging Admin with `npm run create-admin` from `server/`, using temporary environment variables. Verify user disable/enable, job moderation, review moderation, verification approval/rejection, and resource editing. Remove bootstrap credentials from the environment after account creation.
- [ ] **Email and scheduled alerts:** configure a verified Resend sender with `RESEND_API_KEY` and `RESET_EMAIL_FROM`, plus a random `CRON_SECRET`. Verify reset email delivery, generic responses for unknown emails, expiry and one-time use; verify Instant alerts notify immediately and Daily/Weekly alerts send only through the digest. Trigger the cron endpoint with its bearer secret and confirm missing/wrong secrets are rejected.
- [ ] **PWA/browser/accessibility:** serve the production build over HTTPS in current desktop and mobile browsers. Test installation prompt, app-shell offline behavior, responsive layouts, keyboard navigation, focus visibility, screen-reader labels, and reduced-motion behavior. Confirm Cache Storage never contains API responses or private user data.
- [ ] **Feature acceptance pass:** walk through the 25 feature rows above with candidate, student, clinic-owner, and Admin staging accounts. Include unauthorized cross-account access attempts, salary/location/opportunity filters, application lifecycle, saved jobs, alerts, messaging/read state, interview conflicts/time zones, reviews, verification, mentorship, resume/PDF export, career goals/resources, and employer recruitment tools. Attach results or bugs to this plan before changing statuses to `Tested`.

### D. Stage deployment and release

- [ ] Configure separate staging frontend and backend projects. Set the backend project root to `server/`; configure `MONGO_URI`, `AUTH_TOKEN_SECRET`, `FRONTEND_ORIGINS`, `TRUST_PROXY`, `CRON_SECRET`, mail settings, and optional AI settings in the backend project. Set `VITE_API_URL` in the frontend project to the staging API origin.
- [ ] Confirm `server/vercel.json` schedules the digest endpoint as expected, and confirm the deployed cron receives the configured bearer secret. Check logs for successful and failed invocations.
- [ ] Run staging smoke checks for health, CORS, authentication, profiles, job search, job posting, applications, private resume retrieval, messaging, admin endpoints, email reset, digest delivery, and account deletion.
- [ ] Review staging logs, dependency audit output, and privacy behavior; fix release-blocking findings. Confirm no secrets or personal records appear in client bundles, public API responses, or service-worker caches.
- [ ] Deploy production only after staging acceptance and an approved release window. Configure production values in hosting dashboards, verify the live health check and core candidate/employer journeys, and record deployment URL/date and rollback procedure here. No production deployment has been performed by this plan update.

### E. Optional follow-up work (not required to close the 25-feature checklist)

- [ ] Add a distributed rate-limit store or edge gateway so login/signup throttling is shared across serverless instances.
- [ ] Add calendar-provider integration, email interview invitations, and recurring availability if those workflows are needed.
- [ ] Add push notifications if required; current alerts support in-app notices and configured email digests.
- [ ] Revisit public candidate discovery only if product policy changes; current employer candidate search remains limited to applicants for that employer's jobs.
