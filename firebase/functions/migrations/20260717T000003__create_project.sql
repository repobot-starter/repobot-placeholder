-- Project domain: projects and project memberships.
-- Matches src/Data/Project/{Project,ProjectMembership}.ts exactly.

CREATE TABLE projects (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL,
    description text,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    -- References users.id by convention only (no cross-domain FK).
    created_by_user_id text NOT NULL,
    archived_at timestamptz
);

CREATE TABLE project_memberships (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    project_id text NOT NULL,
    -- References users.id by convention only (no cross-domain FK).
    user_id text NOT NULL,
    role text NOT NULL CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    CONSTRAINT project_memberships_project_id_user_id_unique UNIQUE (project_id, user_id)
);
