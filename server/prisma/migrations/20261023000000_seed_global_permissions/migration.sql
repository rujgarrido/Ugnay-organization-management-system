-- Seed global permission codes (idempotent: ON CONFLICT DO NOTHING)
-- These codes are system-defined and shared across all organizations.
-- They are inserted once; existing rows are left untouched.

INSERT INTO "Permission" ("id", "code", "description")
VALUES
  -- President position
  (gen_random_uuid(), 'CREATE_ORGANIZATION', 'Create new organizations'),
  (gen_random_uuid(), 'MANAGE_MEMBERS', 'Manage organization members'),
  (gen_random_uuid(), 'MANAGE_POSITIONS', 'Manage positions and roles'),
  (gen_random_uuid(), 'MANAGE_COMMITTEES', 'Manage committees'),
  (gen_random_uuid(), 'CREATE_PROJECT', 'Create new projects'),
  (gen_random_uuid(), 'UPDATE_PROJECT', 'Update project details'),
  (gen_random_uuid(), 'ARCHIVE_PROJECT', 'Archive projects'),
  (gen_random_uuid(), 'CREATE_TASK', 'Create new tasks'),
  (gen_random_uuid(), 'UPDATE_TASK', 'Update task details'),
  (gen_random_uuid(), 'ASSIGN_TASK', 'Assign tasks to members'),
  (gen_random_uuid(), 'CREATE_PROPOSAL', 'Create event proposals'),
  (gen_random_uuid(), 'UPDATE_PROPOSAL', 'Update proposal details'),
  (gen_random_uuid(), 'SUBMIT_PROPOSAL', 'Submit proposals for approval'),
  (gen_random_uuid(), 'VIEW_ACTIVITY', 'View organization activity log')
ON CONFLICT ("code") DO NOTHING;
