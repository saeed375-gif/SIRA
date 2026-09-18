-- Authenticated RLS policies intentionally use these role helpers.
grant execute on function public.has_role(text) to authenticated;
grant execute on function public.has_any_role(text[]) to authenticated;
revoke execute on function public.has_role(text) from anon;
revoke execute on function public.has_any_role(text[]) from anon;
