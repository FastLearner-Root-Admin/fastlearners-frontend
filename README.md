# Fast Learners — Frontend (Next.js)

Welcome! This is the Fast Learners frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Documentation

- Project overview and guides live under `docs/`:
  - `docs/README.md` — Start here
  - `docs/CODE_QUALITY_GUIDE.md`
  - `docs/NAVIGATION_IMPLEMENTATION.md`
  - `docs/NIGERIAN_EDUCATION_SYSTEM.md`
  - `docs/README_NIGERIAN_SYSTEM.md`
  - `docs/WARP.md`
  - `docs/api-docs.md`

## Quick start

```powershell
pnpm install
pnpm dev
```

For setup details, environment variables, scripts, and troubleshooting, see `docs/README.md`.

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tooling used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

Use the scripts defined in `package.json` with `pnpm <script>`:

- `pnpm dev` — start Next.js in development mode
- `pnpm build` — build for production
- `pnpm start` — start the production server after build
- `pnpm preview` — build and start (preview)
- `pnpm lint` — run ESLint
- `pnpm lint:fix` — attempt to fix lint issues
- `pnpm format` — format code with Prettier
- `pnpm format:check` — check formatting
- `pnpm email` — run the email dev server (if configured)

## Project layout (high-level)

- `app/` — Next.js app routes and layouts
- `components/` — UI components and shared pieces
- `lib/` — utilities, API clients, and hooks
- `content/` — content used by Contentlayer
- `lesson-csv-files/` — CSV schemas and sample files
- `public/` — static assets
- `styles/` — global styles (Tailwind config)

## Contentlayer

This project uses Contentlayer for content (see `contentlayer.config.ts`). When running the dev server, Contentlayer will generate the necessary content types automatically.

**Windows Compatibility Note:** Contentlayer may show warnings on Windows systems. These warnings are typically harmless and can be ignored. If you encounter build issues on Windows, try:

1. Running the dev server with administrator privileges
2. Ensuring your file paths don't contain special characters
3. Checking that `contentlayer.config.ts` uses forward slashes in path patterns

If you see Contentlayer-related errors, try reinstalling dependencies and restarting the dev server:

```powershell
pnpm install
pnpm dev
```

## Building and running in production

1. Build the app:

```powershell
pnpm build
```

2. Run the production server:

```powershell
pnpm start
```

Or use the `preview` script to build + start in one command:

```powershell
pnpm preview
```

## Environment & secrets

- Store local environment overrides in `.env.local` (gitignored).
- Do not commit production secrets.

## Troubleshooting

- If you run into dependency issues, try removing `node_modules` and reinstalling:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

- If the app fails to build, check that your Node.js version matches project requirements and that environment variables are set.

## Contributing

- Fork the repository, create a branch, and open a pull request with a clear description of your changes.

## Where to find things

- API clients and hooks: `lib/`
- Pages and routes: `app/`
- UI components: `components/`
- Public assets/images: `public/`

## License

This repository does not include a license file. Add one if you plan to publish or share the project publicly.

---

If you'd like, I can also:

- Add a minimal `.env.example` file
- Add a short `CONTRIBUTING.md`
- Add an `engines` entry to `package.json` to recommend a Node version

Tell me which of those you'd like and I will add it next.

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tooling used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

Use the scripts defined in `package.json` with `pnpm <script>`:

- `pnpm dev` — start Next.js in development mode
- `pnpm build` — build for production
- `pnpm start` — start the production server after build
- `pnpm preview` — build and start (preview)
- `pnpm lint` — run ESLint
- `pnpm lint:fix` — attempt to fix lint issues
- `pnpm format` — format code with Prettier
- `pnpm format:check` — check formatting
- `pnpm email` — run the email dev server (if configured)

## Project layout (high-level)

- `app/` — Next.js app routes and layouts
- `components/` — UI components and shared pieces
- `lib/` — utilities, API clients, and hooks
- `content/` — content used by Contentlayer
- `lesson-csv-files/` — CSV schemas and sample files
- `public/` — static assets
- `styles/` — global styles (Tailwind config)

## Contentlayer

This project uses Contentlayer for content (see `contentlayer.config.ts`). When running the dev server, Contentlayer will generate the necessary content types automatically.

**Windows Compatibility Note:** Contentlayer may show warnings on Windows systems. These warnings are typically harmless and can be ignored. If you encounter build issues on Windows, try:

1. Running the dev server with administrator privileges
2. Ensuring your file paths don't contain special characters
3. Checking that `contentlayer.config.ts` uses forward slashes in path patterns

If you see Contentlayer-related errors, try reinstalling dependencies and restarting the dev server:

```powershell
pnpm install
pnpm dev
```

## Building and running in production

1. Build the app:

```powershell
pnpm build
```

2. Run the production server:

```powershell
pnpm start
```

Or use the `preview` script to build + start in one command:

```powershell
pnpm preview
```

## Environment & secrets

- Store local environment overrides in `.env.local` (gitignored).
- Do not commit production secrets.

## Troubleshooting

- If you run into dependency issues, try removing `node_modules` and reinstalling:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

- If the app fails to build, check that your Node.js version matches project requirements and that environment variables are set.

## Contributing

- Fork the repository, create a branch, and open a pull request with a clear description of your changes.

## Where to find things

- API clients and hooks: `lib/`
- Pages and routes: `app/`
- UI components: `components/`
- Public assets/images: `public/`

## License

This repository does not include a license file. Add one if you plan to publish or share the project publicly.

---

If you'd like, I can also:

- Add a minimal `.env.example` file
- Add a short `CONTRIBUTING.md`
- Add an `engines` entry to `package.json` to recommend a Node version

Tell me which of those you'd like and I will add it next.

# Modular File Upload System

This directory contains a modular file upload system for the Fast Learners platform. The system is designed to easily add/remove file upload APIs without breaking existing functionality.

## 🏗️ Architecture

### Configuration-Driven System

---

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tools used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

## Use the scripts defined in `package.json` with `pnpm <script>`:

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tools used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

## Use the scripts defined in `package.json` with `pnpm <script>`:

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tools used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

## Use the scripts defined in `package.json` with `pnpm <script>`:

# Fast Learners — Frontend (Next.js)

This repository contains the frontend for the Fast Learners platform — a modern, modular Next.js application built with TypeScript and Tailwind CSS. It provides the web UI, reusable components, content pages, and developer tools used by the platform.

## Key features

- Built with Next.js 14 and TypeScript
- Tailwind CSS for styling
- Content managed with Contentlayer
- Reusable components and hooks in the `components/` and `lib/` folders
- CSV/lesson utilities and example CSV files under `lesson-csv-files/`

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Contentlayer
- Zustand for local state

## Prerequisites

- Node.js (recommend v18 or newer)
- pnpm (recommended; `pnpm-lock.yaml` is included)

If you don't have `pnpm` installed you can install it globally:

```powershell
npm install -g pnpm
```

## Quick start (local development)

1. Clone the repo:

```powershell
git clone https://github.com/travis-wayne/fastlearners-frontend.git
cd fast-leaner-frontend
```

2. Install dependencies:

```powershell
pnpm install
```

3. Create environment variables

This project uses environment variables (see `env.mjs`). Create a `.env.local` file at the project root and add any required variables. Example variables commonly used in Next.js projects:

```text
# .env.local (example)
NEXT_PUBLIC_API_URL=https://app.fastlearnersapp.com/api/v1
NEXT_PUBLIC_USE_HTTPONLY_AUTH=true
# Note: NEXT_PUBLIC_USE_HTTPONLY_AUTH=true enables HttpOnly cookie-based authentication.
# Client-side cookie readers are disabled and all auth is handled server-side.
# Add other secrets and keys as required by your environment
```

4. Run the development server:

```powershell
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Useful scripts

Use the scripts defined in `package.json` with `pnpm <script>`:

- `pnpm dev` — start Next.js in development mode
- `pnpm build` — build for production
- `pnpm start` — start the production server after build
- `pnpm preview` — build and start (preview)
- `pnpm lint` — run ESLint
- `pnpm lint:fix` — attempt to fix lint issues
- `pnpm format` — format code with Prettier
- `pnpm format:check` — check formatting
- `pnpm email` — run the email dev server (if configured)

## Project layout (high-level)

- `app/` — Next.js app routes and layouts
- `components/` — UI components and shared pieces
- `lib/` — utilities, API clients, and hooks
- `content/` — content used by Contentlayer
- `lesson-csv-files/` — CSV schemas and sample files
- `public/` — static assets
- `styles/` — global styles (Tailwind config)

## Contentlayer

This project uses Contentlayer for content (see `contentlayer.config.ts`). When running the dev server, Contentlayer will generate the necessary content types automatically.

**Windows Compatibility Note:** Contentlayer may show warnings on Windows systems. These warnings are typically harmless and can be ignored. If you encounter build issues on Windows, try:

1. Running the dev server with administrator privileges
2. Ensuring your file paths don't contain special characters
3. Checking that `contentlayer.config.ts` uses forward slashes in path patterns

If you see Contentlayer-related errors, try reinstalling dependencies and restarting the dev server:

```powershell
pnpm install
pnpm dev
```

## Building and running in production

1. Build the app:

```powershell
pnpm build
```

2. Run the production server:

```powershell
pnpm start
```

Or use the `preview` script to build + start in one command:

```powershell
pnpm preview
```

## Environment & secrets

- Store local environment overrides in `.env.local` (gitignored).
- Do not commit production secrets.

## Troubleshooting

- If you run into dependency issues, try removing `node_modules` and reinstalling:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

- If the app fails to build, check that your Node.js version matches project requirements and that environment variables are set.

## Contributing

- Fork the repository, create a branch, and open a pull request with a clear description of your changes.

## Where to find things

- API clients and hooks: `lib/`
- Pages and routes: `app/`
- UI components: `components/`
- Public assets/images: `public/`

## License

This repository does not include a license file. Add one if you plan to publish or share the project publicly.

---

If you'd like, I can also:

- Add a minimal `.env.example` file
- Add a short `CONTRIBUTING.md`
- Add an `engines` entry to `package.json` to recommend a Node version

Tell me which of those you'd like and I will add it next.
