# Deployment Setup

## GitHub Actions for Vercel Deployment

This project includes automated deployment workflows for the frontend using GitHub Actions and Vercel.

### Required Secrets

You need to add the following secrets to your GitHub repository:

1. **VERCEL_TOKEN**: Your Vercel personal access token
   - Go to [Vercel Dashboard](https://vercel.com/account/tokens)
   - Create a new token
   - Add it as a repository secret

2. **ORG_ID**: Your Vercel organization ID
   - Run `vercel link` in your frontend directory
   - Check `.vercel/project.json` for the `orgId`

3. **PROJECT_ID**: Your Vercel project ID
   - Run `vercel link` in your frontend directory
   - Check `.vercel/project.json` for the `projectId`

### Setting up Vercel Project

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   cd frontend
   vercel link
   ```

3. Get your project details:
   ```bash
   cat .vercel/project.json
   ```

### Workflows

- **deploy-frontend.yml**: Deploys to production on pushes to main/master branch
- **preview-frontend.yml**: Creates preview deployments for pull requests

### Adding Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each of the required secrets listed above

### Environment Variables

If your frontend needs environment variables, add them to your Vercel project:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add your variables for Production, Preview, and Development environments

### Manual Deployment

You can also deploy manually using:

```bash
cd frontend
vercel --prod
```
