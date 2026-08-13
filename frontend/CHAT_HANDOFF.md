# Nobles Project Chat Handoff

This file summarizes the important context from the Codex chat so another chat can quickly understand the project state.

## Project
- React frontend project: `C:\Users\seang\OneDrive\Desktop\OOP3assignments\NoblesProject\frontend`
- Modeling agency site for The Nobles Management.
- User is preparing for an Individual Technical Defense and wants beginner-friendly explanations.

## Commands
- Start frontend: `npm start`
- Start local API: `npm run api`
- Build check: `npm run build`

## Backend/API State
- Backend file: `server/membershipApi.js`
- It handles membership checks/creation, admin check, and loading contact/get scouted submissions.
- Article/model backend routes were attempted but reversed by request.
- There are currently no active backend endpoints for saving admin articles/models.
- Edit articles/models are still mainly frontend/localStorage based.

## Stripe State
- `src/pages/ClubNoblesPage.jsx` was intentionally restored to the old Stripe checkout code shape.
- The real Stripe secret key was replaced with: `sk_test_REPLACE_WITH_BACKEND_SECRET_KEY`
- This may recreate the frontend error: `Module not found: Can't resolve 'stripe'`
- Proper fix later: move Stripe checkout session creation to the backend.

## Admin Work
- Admin emails include `televisionneverenough@gmail.com`, `test@nobles.com`, and `noblesadmintest@gmail.com`.
- Admin dashboard has Articles, Models, Submissions, and Get Scouted tabs.
- Model/article admin cards can be edited, removed, reordered by drag/drop, and shown/hidden.
- Models have category tabs: International, Local, Junior.

## Model Editing
Files:
- `src/pages/AdminModelEditPage.jsx`
- `src/pages/AdminModelImagesPage.jsx`
- `src/pages/AdminModelPreviewPage.jsx`
- `src/services/adminModelDraftStore.js`
- `src/services/modelsService.js`

Features:
- Separate edit model page.
- First/middle/last name fields.
- Image upload and main image selection.
- Extra images page with drag/drop ordering.
- Main image cannot be moved and does not appear in photography section.
- View image button opens larger view.
- Preview page button exists.
- Runway Add Show was fixed to save objects like Charlotte: `{ name, season }`.

## Article Editing
Files:
- `src/pages/AdminArticleEditPage.jsx`
- `src/pages/ArticlesPage.jsx`
- `src/pages/Article.jsx`
- `src/components/ArticleCard.jsx`
- `src/services/articlesService.js`

Features:
- Club Nobles Articles page exists.
- Article cards use admin card styling.
- Article edit page exists.
- Cover image is on the left side.
- Articles can be edited and shown/hidden.

## Club Nobles / Membership
Files:
- `src/pages/ClubNoblesPage.jsx`
- `src/pages/ClubNoblesCheckoutPage.jsx`
- `src/services/membershipService.js`
- `server/membershipApi.js`

Behavior:
- If logged in user has membership, Club Nobles page shows the Articles page.
- If no membership, normal membership sales page shows.
- Membership data is saved locally in `server/data/memberships.json`.

## Contact Page Work
- 70 character limit for name/email/subject.
- 1000 character limit for message.
- Name cannot contain numbers.
- Success/failure message after submit.
- Google reCAPTCHA was requested/added.
- Language filter was added and expanded with bypass variants.

## Cleanup
- Removed some unused admin code.
- Cleaned formatting/trailing blank lines in touched files.
- Moved Club Nobles auth listener into `useEffect`.
- Build passed after cleanup before Stripe code was intentionally restored.

## Risk Areas
- Stripe code may break the frontend build until fixed properly.
- Article/model backend persistence is not currently connected.
- Admin article/model edits likely still rely on localStorage.
- There are many working tree changes, including possibly `../rmw_chatbot_service`; do not revert unrelated files unless asked.

## User Preferences
- Keep explanations direct and beginner-friendly.
- User often wants implementation, not just a plan.
- For test prep, ask questions in order:
  1. My contribution
  2. My code
  3. Technology choice
  4. System understanding
  5. Problems solved
- For code practice, ask them to find/explain components or lines from Contact, Club Nobles, Articles, Admin, and Get Scouted.

## Good Defense Answers
React:
React was used because the site has repeated UI like cards, forms, model profiles, and article previews. Components make code reusable and organized. State helps update the UI when users search, log in, select plans, or edit admin content.

API:
The frontend handles the UI and sends requests. The backend checks/saves data like membership/admin status. GET loads or checks data. POST/PUT creates or updates data. Membership checks should be backend-based so users cannot fake it easily.

Challenges:
Merge conflicts, understanding backend/API work under time pressure, and moving from local frontend-only data toward backend-style persistence.

Business value:
- Scalable architecture: easier to grow because frontend, backend, and data are separated.
- Innovative AI integration: chatbot improves support and helps users find information faster.
- Improved exposure: model/article pages make talent easier to discover.
- Improved efficiency: admin tools reduce manual code edits for content updates.
