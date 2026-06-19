# Card Capture

Mobile-first web app for exhibition lead collection. Take a photo of a visiting card, extract details via OCR + AI, and save directly to Google Sheets.

## Flow

Open app → take photo → OCR reads card → AI structures data → review/edit → save to Google Sheet → next card.

## Setup

### 1. Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API** and **Cloud Vision API**
4. Create a **Service Account** under IAM & Admin → Service Accounts
5. Create a JSON key for the service account — copy the `client_email` and `private_key`

### 2. Google Sheet

1. Create a new Google Sheet
2. Add headers in Row 1: `Timestamp | Name | Phone | Email | Company | Designation | Website | Address | Notes | Source | Image URL`
3. Share the sheet with your service account email (Editor access)
4. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

### 3. OpenAI API

1. Get an API key from [platform.openai.com](https://platform.openai.com)

### 4. Environment Variables

Copy `.env.local` and fill in:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_VISION_API_KEY` | Google Cloud Vision API key |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email |
| `GOOGLE_PRIVATE_KEY` | Service account private key (with `\n` for newlines) |
| `GOOGLE_SHEET_ID` | Google Sheet ID |
| `APP_PASSWORD` | Password to access the app |
| `EXHIBITION_NAME` | Auto-filled source/exhibition name |

### 5. Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000` on your phone (same network).

## Deploy to Vercel

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add all env vars in Vercel project settings
4. Deploy

## PWA

After deploying, open the URL on your phone and "Add to Home Screen" for a native app experience.

## Google Sheet Columns

| Timestamp | Name | Phone | Email | Company | Designation | Website | Address | Notes | Source | Image URL |
|-----------|------|-------|-------|---------|-------------|---------|---------|-------|--------|-----------|

## Tech Stack

- Next.js 16 + TypeScript + Tailwind CSS
- Google Cloud Vision API (OCR)
- OpenAI GPT-4o-mini (text structuring)
- Google Sheets API (data storage)
- PWA-ready (manifest + standalone mode)
