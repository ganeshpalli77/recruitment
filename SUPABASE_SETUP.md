# Supabase Setup Instructions

## 1. Configure Environment Variables

Update your `.env.local` file with your Supabase project credentials:

```bash
# Get these values from your Supabase project dashboard
# Go to: https://supabase.com/dashboard → Your Project → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. Supabase Project Setup

### Option A: Use Existing "recruitment" Project
If you already have a "recruitment" project in Supabase:
1. Go to your Supabase dashboard
2. Select the "recruitment" project
3. Copy the Project URL and anon key from Settings → API
4. Update your `.env.local` file

### Option B: Create New Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it "recruitment-dashboard"
4. Copy the credentials to `.env.local`

## 3. Authentication Settings

In your Supabase dashboard:

1. Go to **Authentication → Settings**
2. Set **Site URL** to: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`

## 4. Database Schema (Optional)

The authentication system uses Supabase's built-in auth tables. For the recruitment features, you might want to add:

```sql
-- Create candidates table
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  position TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  ai_score INTEGER,
  skills_match TEXT,
  experience_years INTEGER,
  education TEXT,
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view all candidates" ON candidates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for inserting candidates
CREATE POLICY "Users can insert candidates" ON candidates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 5. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. You should be redirected to the login page
4. Try creating a new account and logging in

## 6. Troubleshooting

- **"Invalid project reference"**: Double-check your `NEXT_PUBLIC_SUPABASE_URL`
- **"Invalid API key"**: Verify your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Redirect issues**: Ensure your redirect URLs are properly configured in Supabase

## Features Implemented

✅ **Email/Password Authentication**
✅ **Login & Signup Pages** with beautiful shadcn/ui components
✅ **Protected Routes** with middleware
✅ **User Session Management**
✅ **Logout Functionality**
✅ **Form Validation** with Zod and React Hook Form
✅ **Error Handling** and user feedback
✅ **Responsive Design** with Tailwind CSS

Your recruitment dashboard is now ready with full authentication! 🎉
