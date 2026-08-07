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

## Instagram feed planner

The private planner is available at `/plan` and uses the same email OTP session as `/admin`.
It stores planned images and captions in MongoDB, stores uploads in Vercel Blob, and reads Marla's
published feed from the Instagram API.

Add these values to `.env.local` to connect the published feed:

```bash
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
INSTAGRAM_USERNAME=marlizzlle
INSTAGRAM_API_VERSION=v25.0
# Optional. Use https://graph.facebook.com for a Facebook Login token.
INSTAGRAM_GRAPH_BASE_URL=https://graph.instagram.com
```

The token needs access to Marla's professional Instagram account and the
`instagram_business_basic` permission. The access token is only used by the server-side route and
is never sent to the browser.
