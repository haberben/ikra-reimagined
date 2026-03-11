
-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.suggestions;
CREATE POLICY "Users can view own suggestions" ON public.suggestions
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'moderator'::app_role)
  );
