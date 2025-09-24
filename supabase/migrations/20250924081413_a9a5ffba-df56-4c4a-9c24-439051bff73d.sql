-- Mettre à jour le rôle de l'utilisateur ralalanael@gmail.com pour qu'il devienne admin
UPDATE user_roles 
SET role = 'admin'::app_role
WHERE user_id = 'a528b58c-1567-49eb-9e77-182f4b9abec4';