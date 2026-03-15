
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.suggestions;

CREATE POLICY "Users can view own suggestions" ON public.suggestions
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins can update suggestions" ON public.suggestions;

CREATE POLICY "Admins can update suggestions" ON public.suggestions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins can delete suggestions" ON public.suggestions;

CREATE POLICY "Admins can delete suggestions" ON public.suggestions
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );
