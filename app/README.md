# Cover Letter Generator

An AI-powered web application that helps you write better cover letters by analyzing job descriptions and providing feedback on how well your cover letter addresses key requirements.

## Features

- **Job Description Analysis**: Paste a job description and get structured bullet points for responsibilities, company culture, and technical skills
- **Cover Letter Editor**: Write your cover letter in a clean, distraction-free interface
- **AI-Powered Feedback**: Get scores and feedback on how well your cover letter addresses each key point from the job description
- **Real-time Scoring**: See scores (0-100) and feedback for each requirement as you write

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.local` to `.env.local`
   - Get your OpenAI API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Replace `your_openai_api_key_here` with your actual API key

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Paste Job Description**: Copy and paste the job description into the left pane
2. **Parse**: Click "Parse Job Description" to extract key points
3. **Write Cover Letter**: Write your cover letter in the right pane
4. **Check Coverage**: Click "Have I covered it?" to get AI feedback on each key point
5. **Improve**: Use the scores and feedback to improve your cover letter

## Deployment

This app is designed to be deployed on Digital Ocean App Platform:

1. Push your code to a GitHub repository
2. Connect the repository to Digital Ocean App Platform
3. Set the `OPENAI_API_KEY` environment variable in the App Platform dashboard
4. Deploy!

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-3.5-turbo
- **Deployment**: Digital Ocean App Platform

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── parse-job-description/    # API to parse job descriptions
│   │   └── check-coverage/           # API to check cover letter coverage
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Main page with two-pane layout
└── components/
    ├── JobDescriptionPane.tsx        # Left pane for job description
    └── CoverLetterPane.tsx           # Right pane for cover letter
```