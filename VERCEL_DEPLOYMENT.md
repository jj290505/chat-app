# Vercel Deployment Guide

This Next.js chat application is ready for deployment on Vercel. Follow these steps:

## Prerequisites
- Vercel account (https://vercel.com)
- Vercel CLI installed: `npm install -g vercel`

## Environment Variables
Create a `.env.production` file with your production environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

## Deployment Steps

### Option 1: Using Vercel CLI (Recommended for first deployment)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy the project:**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project: Select "No"
   - Project name: Enter your project name
   - Framework: Next.js (auto-detected)
   - Root directory: ./
   - Build command: npm run build
   - Output directory: .next

3. **Set environment variables in Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all required environment variables

4. **Redeploy with environment variables:**
   ```bash
   vercel --prod
   ```

### Option 2: Using GitHub (Recommended for continuous deployment)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/import
   - Select GitHub and authorize
   - Choose your repository
   - Configure project settings
   - Add environment variables in Vercel dashboard
   - Click Deploy

3. **Future deployments:**
   - Every push to `main` branch will trigger automatic deployment

## Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| GROQ_API_KEY | Groq AI API key | Yes |
| NEXT_PUBLIC_GEMINI_API_KEY | Google Gemini API key | No |
| OPENROUTER_API_KEY | OpenRouter API key | No |

## Post-Deployment

1. **Update Supabase URL allowlist:**
   - Add your Vercel deployment URL to Supabase CORS settings
   - Format: `https://your-project.vercel.app`

2. **Test the application:**
   - Visit your deployment URL
   - Test authentication
   - Test real-time features

3. **Monitor performance:**
   - Check Vercel Analytics
   - Monitor database connections
   - Check API usage

## Troubleshooting

### Build fails with TypeScript errors
- Ensure all environment variables are set
- Check that all imports are correct
- Run `npm run build` locally first

### Real-time features not working
- Verify Supabase URL in environment variables
- Check database tables exist
- Verify Supabase row-level security policies

### Images not loading
- Ensure image domains are configured in `next.config.ts`
- Check that image URLs are correct

## Useful Commands

```bash
# Preview deployment
vercel --prod

# Check deployment status
vercel status

# View logs
vercel logs

# Rollback to previous deployment
vercel rollback
```

## Support

For issues, check:
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
