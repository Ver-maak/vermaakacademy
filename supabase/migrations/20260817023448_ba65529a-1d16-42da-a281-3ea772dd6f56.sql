REVOKE EXECUTE ON FUNCTION public.admin_set_user_role(TEXT, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_user_role(TEXT, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_staff() FROM anon;