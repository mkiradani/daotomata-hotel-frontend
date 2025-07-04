# Daotomata Hotel Frontend

Frontend application for the Daotomata Hotel project, built with Astro and React.

## 🏨 About

This is the frontend application for the Daotomata Hotel management system. It provides a modern, responsive interface for hotel booking, room management, and customer interactions.

### Key Features

- Multi-tenant hotel management
- Real-time booking system
- Room and facility management
- Activity booking
- Responsive design
- Integration with booking engines (Cloudbeds)
- Admin dashboard

## 🚀 Project Structure

```text
/
├── public/              # Static assets
├── src/
│   ├── components/      # React/Astro components
│   ├── layouts/         # Page layouts
│   ├── lib/            # Utilities and services
│   │   ├── booking-engines/  # Booking system integrations
│   │   └── directus.js      # CMS and data integration
│   ├── pages/          # File-based routing
│   │   ├── [hotel]/    # Dynamic hotel routes
│   │   ├── admin/      # Admin dashboard
│   │   └── api/        # API endpoints
│   └── styles/         # Global styles
├── Dockerfile          # Container configuration
└── package.json
```

## 🔧 Technology Stack

- **Framework**: Astro with Qwik islands
- **CMS & Data**: Directus
- **Booking Engine**: Cloudbeds integration
- **Styling**: Tailwind CSS + DaisyUI
- **Quality**: Husky hooks (pre-commit build, pre-push comprehensive checks)
- **Deployment**: Docker

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## ⚙️ Configuration

1. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables:
   - `DIRECTUS_URL`: Your Directus CMS URL
   - `DIRECTUS_ADMIN_TOKEN`: Your Directus admin access token
   - `CLOUDBEDS_API_KEY`: Your Cloudbeds API key

## 🔒 Code Quality & Git Hooks

This project uses Husky to enforce code quality through Git hooks:

### Pre-commit Hook
- **Trigger**: Before every commit
- **Action**: Runs `pnpm build` to ensure code compiles
- **Purpose**: Prevents committing broken code

### Pre-push Hook
- **Trigger**: Before every push to remote
- **Actions**:
  1. Build verification (`pnpm build`)
  2. Type checking (`tsc --noEmit`)
  3. Linting (`pnpm lint`)
- **Purpose**: Comprehensive quality check before sharing code

### Bypassing Hooks (Emergency Only)
```bash
# Skip pre-commit (not recommended)
git commit --no-verify -m "emergency fix"

# Skip pre-push (not recommended)
git push --no-verify
```

**Note**: Hooks are automatically installed when running `pnpm install` via the `prepare` script.

## 🚀 Deployment

### Docker

```bash
# Build the image
docker build -t daotomata-hotel-frontend .

# Run the container
docker run -p 4321:4321 daotomata-hotel-frontend
```

### Production Build

```bash
pnpm build
pnpm preview
```

## 🏗️ Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:4321](http://localhost:4321) in your browser

## 📝 License

This project is part of the Daotomata Hotel management system.
