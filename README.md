# FitTrack Pro — React

A React + Vite conversion of the supplied FitTrack Pro HTML prototype.

## Run locally

1. Install Node.js (LTS) from https://nodejs.org/
2. Extract this ZIP and open the `fittrack-react` folder in VS Code.
3. Open the VS Code terminal and run:

```bash
npm install
npm run dev
```

4. Open the local URL printed by Vite (usually http://localhost:5173).

## Admin demo

- Email: `admin@fittrack.com`
- Password: `admin123`

## Features

- Login and signup (local browser prototype)
- Dashboard metrics and progress
- Workout timer, pause/resume, estimated calories and distance
- Bluetooth LE heart-rate connection using Web Bluetooth
- Workout history and daily goals
- Admin account/workout overview
- Responsive layout

## Important

This is a frontend prototype. Authentication and data use `localStorage`; passwords are not securely stored. Do not use real passwords or deploy this as a production authentication system. Web Bluetooth requires a supported browser (usually Chrome/Edge) and localhost or HTTPS. The browser API exposes heart-rate data only for compatible devices; step/calorie sync varies by manufacturer.


# FitTrack assets

This folder contains lightweight SVG branding assets for the FitTrack React project.

- `logo.svg`: horizontal FitTrack logo
- `favicon.svg`: browser tab icon
- `images/`: place project images here
- `icons/`: place custom SVG icons here

Copy `public/assets` into the `public` folder of your FitTrack React project.
Use `/assets/logo.svg` in React, for example:

```jsx
<img src="/assets/logo.svg" alt="FitTrack" />
```
"# Project-review-2" 
