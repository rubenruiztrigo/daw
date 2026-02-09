-- Create a dedicated table for user badges
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure a user doesn't get the same badge twice
    UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read badges (public profile info)
CREATE POLICY "Everyone can view user badges" ON public.user_badges
    FOR SELECT USING (true);

-- Allow users to manage their own badges if needed (though usually given by system/admin)
-- For now, let's allow authenticated users to view
-- And maybe a system role to insert. If users can "claim" badges later, we'd add policies here.

-- INDEX for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
