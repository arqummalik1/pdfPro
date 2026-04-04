# PDFPro - Supabase Setup Guide
### Version 1.0 | April 2026

---

## 📋 Overview

This guide explains how to set up **Supabase** for PDFPro - handling user authentication, database for usage analytics, and file storage.

---

## 🎯 What Supabase Handles in PDFPro

| Feature | Purpose |
|---------|---------|
| **Authentication** | User sign-up/login (Google OAuth) |
| **Database** | Processing logs, user history, analytics |
| **Storage** | Saved files, user data |

---

## 🚀 Step 1: Create Supabase Project

1. Go to: https://supabase.com
2. Create new project: `pdfpro`
3. Set region: Asia (Mumbai) - ap-south-1
4. Wait for setup (~2 minutes)

---

## 🔑 Step 2: Get API Credentials

Go to: **Settings → API**

Copy these values:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon key**: `eyJ...` (public key)
- **service_role key**: `eyJ...` (secret - keep safe!)

---

## 🗄️ Step 3: Database Schema

Run this in **SQL Editor**:

```sql
-- Users Profile Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Processing Logs Table
CREATE TABLE IF NOT EXISTS public.processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  tool_used TEXT NOT NULL,
  input_files INTEGER DEFAULT 0,
  input_size BIGINT DEFAULT 0,
  output_size BIGINT DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processing_logs_user_id ON public.processing_logs(user_id);
CREATE INDEX idx_processing_logs_created_at ON public.processing_logs(created_at);

ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert processing logs" ON public.processing_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own logs" ON public.processing_logs FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Trigger: Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🔒 Step 4: Configure Auth (Optional)

Go to: **Authentication → Providers**

Enable Google OAuth if needed.

---

## 🔧 Step 5: Environment Variables

Add to your backend `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

---

## 💰 Cost (Free Tier)

| Resource | Limit |
|----------|-------|
| Database | 500MB |
| Auth | 50K/month |
| Storage | 1GB |

**Total: FREE** ✅

---

## ✅ Checklist

- [ ] Created Supabase project
- [ ] Copied Project URL
- [ ] Copied anon key
- [ ] Copied service key (secret!)
- [ ] Ran SQL schema
- [ ] Added to backend .env