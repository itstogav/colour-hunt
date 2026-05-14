# Colour Hunt

A colour-hunting photo game. Pick a colour, photograph nine matching things before the timer runs out.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### One-time setup

1. **Create a GitHub repo**
   - Go to [github.com/new](https://github.com/new) and create a new public or private repo called `colour-hunt`
   - Don't add a README, .gitignore, or license — this project already has them

2. **Push this project to GitHub**

   Open a terminal in this folder and run:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/colour-hunt.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` with your GitHub username.

3. **Connect to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Sign in with your GitHub account if needed
   - Click "Import" next to your `colour-hunt` repo
   - Vercel will auto-detect Next.js — just click "Deploy"
   - First deploy takes about a minute

4. **Add your custom domain**
   - In your Vercel project, go to Settings → Domains
   - Add your domain (e.g. `colourhunt.app`)
   - Follow Vercel's DNS instructions for your registrar

### Future updates

Any time you change the code:

```bash
git add .
git commit -m "Describe your change"
git push
```

Vercel will automatically rebuild and redeploy.

## File structure

```
colour-hunt/
├── app/
│   ├── layout.js          # Root layout + metadata
│   └── page.js            # Entry page
├── components/
│   └── ColourHunt.jsx     # The whole app
├── package.json
├── next.config.js
└── jsconfig.json
```

All the actual app logic lives in `components/ColourHunt.jsx`.
