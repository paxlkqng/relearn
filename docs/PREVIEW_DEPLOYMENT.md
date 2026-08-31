# Preview Deployment

Relearn uses Vercel Git integration for preview deployments from the active development branch.

Current development branch: `bootstrap/platform-foundation`

Expected flow:
1. Push a reviewable commit to the development branch.
2. Vercel creates a preview deployment for that commit.
3. Validate the web UI before any merge or production deployment.

Production deployment and self-merge remain intentionally disabled during the current development phase.
