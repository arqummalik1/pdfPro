-- SQL Script: Create users table with name and email columns
-- Created for: mydearPDF user management
-- Run this in your PostgreSQL database (e.g., Supabase SQL Editor)

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Add a comment to the table for documentation
COMMENT ON TABLE public.users IS 'User information table for mydearPDF - stores name and email';
COMMENT ON COLUMN public.users.name IS 'Full name of the user';
COMMENT ON COLUMN public.users.email IS 'Email address of the user (must be unique)';

-- Optional: Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Optional: Create trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verification query - uncomment to test after creation
-- SELECT * FROM public.users LIMIT 5;
