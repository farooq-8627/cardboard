# WorkflowWizard

A modern web application built with React, TypeScript, and Express.

## Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

## Production Build

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build client
npm run build:client

# Build server
npm run build:server

# Start production server
npm start
```

## Deployment

### GitHub Actions

The project uses GitHub Actions for CI/CD. On every push to the main branch:

1. Dependencies are installed
2. Client and server are built
3. Build artifacts are uploaded

### Render Deployment

The application is configured for deployment on Render:

1. Automatic deployments on push to main branch
2. Node.js environment with custom build and start commands
3. Health checks enabled at `/health` endpoint

## Environment Variables

- `NODE_ENV`: Set to 'production' for production builds
- `PORT`: Server port (defaults to 3000)

## Project Structure

```
.
├── client/           # React client application
├── server/           # Express server
├── shared/           # Shared types and utilities
├── dist/            # Build output
│   ├── client/      # Client build files
│   └── server/      # Server build files
└── public/          # Static assets
```
