# Deployment Guide - Digital Ocean App Platform

## Prerequisites

1. **GitHub Account**: You'll need a GitHub account
2. **Digital Ocean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
3. **OpenAI API Key**: Get one from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

## Step 1: Push to GitHub

1. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new)
   - Name it `cvrd` (or whatever you prefer)
   - Make it public or private (your choice)
   - Don't initialize with README (we already have one)

2. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cvrd.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Digital Ocean App Platform

1. **Go to Digital Ocean App Platform**:
   - Visit [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
   - Click "Create App"

2. **Connect GitHub Repository**:
   - Select "GitHub" as source
   - Authorize Digital Ocean to access your GitHub
   - Select your `cvrd` repository
   - Choose the `main` branch

3. **Configure the App**:
   - **App Name**: `cvrd` (or your preferred name)
   - **Source Directory**: Leave empty (app is in root)
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: `3000`

4. **Set Environment Variables**:
   - In the "Environment Variables" section
   - Add: `OPENAI_API_KEY` = `your_actual_api_key_here`
   - Make sure to use your real OpenAI API key

5. **Deploy**:
   - Click "Create Resources"
   - Wait for deployment (usually 2-5 minutes)

## Step 3: Access Your App

Once deployed, you'll get a URL like:
- `https://cvrd-xyz123.ondigitalocean.app`

Your app will be live and accessible to anyone!

## Cost Estimation

- **Digital Ocean App Platform**: ~$5-12/month for basic tier
- **OpenAI API**: Pay per use (~$0.01-0.05 per job description analysis)
- **Total**: Very affordable for personal use

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Environment Variables**: Make sure `OPENAI_API_KEY` is set correctly
3. **App Won't Start**: Check the logs in Digital Ocean dashboard

### Useful Commands:

```bash
# Check build locally
npm run build
npm start

# Test environment variables
echo $OPENAI_API_KEY
```

## Next Steps After Deployment

1. **Custom Domain** (optional): Add your own domain in Digital Ocean
2. **Monitoring**: Set up alerts for errors
3. **Scaling**: Upgrade plan if you get more users
4. **Backup**: Regular database backups (when you add one)

## Security Notes

- Never commit `.env.local` to git
- Use environment variables for all secrets
- Consider rate limiting for production use
- Monitor API usage to avoid unexpected costs
