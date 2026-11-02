# Real or AI

A daily eye test. Five pairs a day: one real photo, one AI twin made from a written description of it. Find the fake.

## Run it

```bash
npm install
npm run dev
```

## How puzzles are made

- `data/source.json` holds each round's real photo (Wikimedia Commons file, author, license) and the description used to make its AI twin.
- The pipeline routes under `app/api/admin/` only run on preview deployments with `ADMIN_PIPELINE=1`. They download the real photo, generate the twin through Vercel AI Gateway, put both through the same crop and compression, and store them in Vercel Blob under opaque names.
- `data/puzzles.json` is what the game plays: seven days of five rounds, each with the tell and where it sits in the AI image.

No real people's faces, ever.
