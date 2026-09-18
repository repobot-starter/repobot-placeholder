-- Apple Sign-In: auth_identities learns the Apple OpenID subject, mirroring
-- google_subject. Matches src/Data/Identity/AuthIdentity.ts exactly. An
-- identity may carry both subjects (the same person signing in with Google
-- and Apple links by verified email, like the existing Google flow).

ALTER TABLE auth_identities
    ADD COLUMN apple_subject text,
    ADD CONSTRAINT auth_identities_apple_subject_unique UNIQUE (apple_subject);
