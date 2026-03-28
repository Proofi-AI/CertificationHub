This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database setup

This project uses two completely separate Supabase projects:
- **Development**: used locally, pointed to by `.env.local`
- **Production**: used on Vercel, pointed to by Vercel environment variables

They share the same schema but have completely separate data that never mixes.

### How to set up locally

1. Create a Supabase project at supabase.com (this is your dev project)
2. Copy `.env.example` to `.env.local`
3. Fill in all values using your dev Supabase project credentials
4. For DATABASE_URL use port 6543 (connection pooler)
5. For DIRECT_URL use port 5432 (direct connection)
6. Both URLs are found at: Supabase dashboard > Settings > Database
7. Run `npx prisma migrate dev` to apply the schema to your dev database
8. Run `npm run dev` to start the app

### How to set up production

1. Create a second Supabase project at supabase.com (this is your prod project)
2. In Vercel dashboard > Settings > Environment Variables, add all variables from `.env.example` using your PRODUCTION Supabase project credentials
3. Set NEXT_PUBLIC_APP_URL to your Vercel deployment URL
4. Trigger a manual redeploy in Vercel — this will automatically run `prisma migrate deploy` and create all tables in your production database

### How schema changes work

Never manually run migrations against the production database. The correct workflow is:

1. Edit `prisma/schema.prisma` locally
2. Run `npx prisma migrate dev --name describe_your_change`
3. A new migration file is created in `prisma/migrations/`
4. Commit and push to GitHub
5. Vercel builds automatically and runs `prisma migrate deploy`
6. Production schema updates, production data is untouched

### Two database URLs explained

| Variable | Port | Used for |
|---|---|---|
| DATABASE_URL | 6543 | Runtime queries via connection pooler |
| DIRECT_URL | 5432 | Prisma migrations only, bypasses pooler |

Supabase's connection pooler does not support the commands Prisma uses for migrations. DIRECT_URL bypasses it for migration commands only. Both are required.
