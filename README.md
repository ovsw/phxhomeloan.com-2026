# phxhomeloan.com-2026

A pnpm monorepo for the PHX Home Loan site. It includes a Next.js frontend,
a Sanity Studio, shared workspace packages, and Turborepo task orchestration.

## Features

### Monorepo Structure

- Apps: web (Next.js frontend) and studio (Sanity Studio)
- Shared packages: UI components, TypeScript config, environment utilities, logger
- Turborepo for build orchestration and caching

### Frontend (Web)

- Next.js App Router with TypeScript
- Shadcn UI components with Tailwind CSS
- Server Components and Server Actions
- SEO optimization with metadata
- Blog system with rich text editor
- Table of contents generation
- Responsive layouts

### Content Management (Studio)

- Sanity Studio v5
- Custom document types (Blog, FAQ, Pages)
- Visual editing integration
- Structured content with schemas
- Live preview capabilities
- Asset management

## Getting Started

### Run locally

Install dependencies and start the development servers:

```shell
pnpm install
pnpm run dev
```

Open the Next.js app in your browser at [http://localhost:3000](http://localhost:3000).

Open the Studio in your browser at [http://localhost:3333](http://localhost:3333), then sign in with your Sanity account.

### Adding content with Sanity

#### 1. Publish your first document

This project includes a schema with `Author`, `Blog`, `BlogIndex`, `FAQ`, `Footer`, `HomePage`, `Navbar`, `Page`, and `Settings` document types.

From the Studio, click "+ Create" and select the `Blog` document type. Go ahead and create and publish the document.

Your content should now appear in your Next.js app ([http://localhost:3000](http://localhost:3000)) as well as in the Studio on the "Presentation" Tab

#### 2. Sample Content

Sample content is not automatically imported into your project. You can import it after setup to add example blog posts, authors, and other initial content.

#### 3. Seed data using script

To add sample data programmatically, run the following command:

```shell
cd apps/studio
npx sanity dataset import ./seed-data.tar.gz production-v2 --replace
```

This command imports seed content into the PHX `production-v2` Sanity dataset.

#### 4. Extending the Sanity schema

The schemas for all document types are defined in the `studio/schemaTypes/documents` directory. You can [add more document types](https://www.sanity.io/docs/schema-types) to the schema to suit your needs.

### Deploying your application and inviting editors

#### 1. Deploy Sanity Studio

Your Next.js frontend (`/web`) and Sanity Studio (`/studio`) are still only running on your local computer. It's time to deploy and get it into the hands of other content editors.

The repository includes a GitHub Actions workflow for deploying the Sanity Studio. Make sure it lives at `.github/workflows/deploy-sanity.yml` in GitHub so Actions can run it.

> **Note**: To use the GitHub Actions workflow, configure the following GitHub Actions secret:
>
> - `SANITY_DEPLOY_TOKEN`
>
> Configure these non-sensitive GitHub Actions variables:
>
> - `SANITY_STUDIO_PROJECT_ID`
> - `SANITY_STUDIO_DATASET`
> - `SANITY_STUDIO_TITLE`
> - `SANITY_STUDIO_PRESENTATION_URL`
> - `SANITY_STUDIO_APP_ID`

`SANITY_STUDIO_APP_ID` identifies your deployed Studio application. Run `npx sanity deploy` from `apps/studio` **locally** the first time — Sanity creates the application and gives you its app ID — then set `SANITY_STUDIO_APP_ID` to that value, both locally and in your GitHub repository variables, so every later deploy targets the same Studio. The GitHub Actions workflow runs non-interactively (`CI: true`) and can't create the app for you, so that first deploy has to happen locally; until the variable is set, the CI deploy will fail. This replaces the deprecated `studioHost` / `*.sanity.studio` hostname setup ([details](https://www.sanity.io/docs/help/studio-host-user-applications)).

Set `SANITY_STUDIO_PRESENTATION_URL` to your web app front-end URL (from the Vercel deployment). This URL is required for production deployments and should be:

- Set in your GitHub repository variables for CI/CD deployments
- Set in your local environment if deploying manually with `npx sanity deploy`
- Not needed for local development, where preview will automatically use `http://localhost:3000`

You can then manually deploy from your Studio directory (`/studio`) using:

```shell
npx sanity deploy
```

**Note**: To use the live preview feature, your browser needs to enable third party cookies.

#### 2. Deploy Next.js app to Vercel

You have the freedom to deploy your Next.js app to your hosting provider of choice. With Vercel and GitHub being a popular choice, we'll cover the basics of that approach.

1. Create a GitHub repository from this project. [Learn more](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
2. Create a new Vercel project and connect it to your Github repository.
3. Set the `Root Directory` to your Next.js app (`/apps/web`).
4. Configure your Environment Variables.

The web app's environment variables are configured in the Vercel project. GitHub repository secrets are only needed for these values if a GitHub Actions workflow starts building or deploying the web app directly.

#### 3. Configure CORS Origins

Your production URLs must be added to your Sanity project's CORS origins, otherwise the frontend will be blocked from fetching content.

1. Go to [Sanity Manage](https://www.sanity.io/manage), select your project, and navigate to **API** > **CORS origins**.
2. Add the following origins:
   - Your production URL (e.g. `https://your-app.vercel.app`)
   - Your custom domain if applicable (e.g. `https://yourdomain.com`)
   - `http://localhost:3000` (for local development — added by default)
3. Enable **Allow credentials** for each origin that needs authenticated requests (e.g. live preview, visual editing).

> **Note**: Vercel preview deployments use unique URLs per commit. If you need CORS access on preview deployments, add a wildcard origin like `https://*-your-project.vercel.app` or add specific preview URLs as needed.

#### 4. Invite a collaborator

Now that you've deployed your Next.js application and Sanity Studio, you can optionally invite a collaborator to your Studio. Open up [Manage](https://www.sanity.io/manage), select your project and click "Invite project members"

They will be able to access the deployed Studio, where you can collaborate together on creating content.
