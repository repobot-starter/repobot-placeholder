-- Standard OAuth providers (GitHub, Facebook, Discord, X, LinkedIn):
-- auth_identities learns one stable subject column per provider, mirroring
-- google_subject / apple_subject. Matches src/Data/Identity/AuthIdentity.ts
-- exactly. An identity may carry any combination of subjects — providers
-- sharing a verified email link to the same identity.

ALTER TABLE auth_identities
    ADD COLUMN github_subject text,
    ADD COLUMN facebook_subject text,
    ADD COLUMN discord_subject text,
    ADD COLUMN x_subject text,
    ADD COLUMN linkedin_subject text,
    ADD CONSTRAINT auth_identities_github_subject_unique UNIQUE (github_subject),
    ADD CONSTRAINT auth_identities_facebook_subject_unique UNIQUE (facebook_subject),
    ADD CONSTRAINT auth_identities_discord_subject_unique UNIQUE (discord_subject),
    ADD CONSTRAINT auth_identities_x_subject_unique UNIQUE (x_subject),
    ADD CONSTRAINT auth_identities_linkedin_subject_unique UNIQUE (linkedin_subject);
