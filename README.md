# ExamMeta

ExamMeta is an existing student resource site built with React and Firebase. It includes VTU study materials and subject data, model papers, academic tools, student support, and placement resources.

## Existing features

- Branch, semester, subject, module, and study resource navigation
- Question papers and model papers
- Login-free access to academic resources and device-local hackathon listings
- Gemini study assistant grounded in selected study resources
- FAQs, search, SGPA/CGPA calculators, and career resources
- Live Brabble.ai hackathon listings with India and Karnataka filters and organizer registration links
- Admin dashboard at `/admin` to review, approve, reject, reopen, and delete hackathon submissions (active admin role required)

## Run locally

```sh
npm install
npm start
```

Community hackathons added through the Finder are stored in the browser's local storage. They persist after refreshes on the same device and are automatically removed when their registration date has passed in the Asia/Kolkata timezone.

API keys stay server-side. For local development, add `GEMINI_API_KEY=...` and `BRABBLE_API_KEY=...` to the ignored root `.env` file, then restart `npm start`; it launches the React development server with same-origin `/api/gemini` and `/api/hackathons` handlers. Brabble's key is used only by the hackathon listings handler, which fetches the latest 100 listings and caches them for an hour. For Netlify, set both keys in the site's environment variables; the existing functions are routed to `/api/gemini` and `/api/hackathons`. The Finder links registration directly to each event organizer and displays Brabble's attribution.

Apply Supabase migrations with `supabase db push` to enable the latest hackathon admin permissions.

The previous contribution payment destination has been removed. Configure a new payment integration only after setting up a verified server-side payment flow.

## Build

```sh
npm run build
```

VTU is referenced to describe the existing academic materials and is not an endorsement or affiliation claim.
