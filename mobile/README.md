# Punchin (mobile)

Employee attendance app for Android and iOS, built with Expo, TypeScript and
Expo Router.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Copy the env template and point it at the backend API

   ```bash
   cp .env.example .env
   ```

   Set `EXPO_PUBLIC_API_URL` to the base URL of the backend, for example
   `http://192.168.1.19:3000/api` (the phone must be able to reach it).

3. Start the app (do not commit `.env`)

   ```bash
   npx expo start
   ```

## Useful commands

- `npx tsc --noEmit` - typecheck
- `npx expo lint` - lint
- `npx expo-doctor` - diagnose dependency/config issues
