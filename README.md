# ExamMeta

ExamMeta is an existing student resource site built with React and Firebase. It includes VTU study materials and subject data, model papers, academic tools, student support, and placement resources.

## Existing features

- Branch, semester, subject, module, and study resource navigation
- Question papers and model papers
- Firebase sign-in, student profiles, uploads, comments, and support requests
- Gemini study assistant grounded in selected study resources
- FAQs, search, SGPA/CGPA calculators, study planner, and career resources
- Live Google-grounded hackathon search with official event-page citations and future-date filtering
- Admin dashboard for existing submissions and community content

## Run locally

```sh
npm install
npm start
```

The Firebase project configuration is currently set in `src/firebase.js`. Set `REACT_APP_ADMIN_EMAIL` in a local `.env` file to the email of the Firebase Authentication account assigned as admin; the Admin Panel is linked in the footer. This is only a client-side gate. Firebase database permissions must be configured in the Firebase console; this repository does not include or deploy rules that enforce administrator permissions.

Gemini requests stay server-side. For local development, add a newly rotated key to the ignored root `.env` file as `GEMINI_API_KEY=...`; `npm start` launches the React development server with same-origin `/api/gemini` and `/api/hackathons` handlers in that server process. There is no separate API process or port 5051. The key is never included in the browser bundle. For Netlify, set `GEMINI_API_KEY` in the site's environment variables; the existing functions are routed to `/api/gemini` and `/api/hackathons`. Hackathon search uses Gemini Google Search grounding and consumes the Google project's search quota.

The admin dashboard still relies on Firebase authentication and database permissions. Assign admins through Firebase Authentication and enforce access in Firebase database rules or trusted server code; client-side credentials are not a secure admin system.

The previous contribution payment destination has been removed. Configure a new payment integration only after setting up a verified server-side payment flow.

## Build

```sh
npm run build
```

VTU is referenced to describe the existing academic materials and is not an endorsement or affiliation claim.
