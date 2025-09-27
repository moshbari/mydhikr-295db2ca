-- Ensure default user role is assigned to all existing profiles
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'user'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin roles to specific emails
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email IN ('engr.mbari@gmail.com', 'engrmoshbari@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;