#!/usr/bin/env bash
#
# One-time wiring for the CI kernel bake (.github/workflows/ci.yml, bake
# job): lets this repo's GitHub Actions publish kernel snapshots to the dev
# posture's snapshot bucket via Workload Identity Federation — no stored
# keys, scoped to exactly this repository.
#
# Creates (all idempotent):
#   - a WIF pool ("github-actions") + GitHub OIDC provider in the dev
#     project, restricted to this repository
#   - a kernel-ci-publisher service account with objectAdmin on the dev
#     kernel snapshot bucket and on the customer postures' web-bundle build
#     caches (the ci.yml web-bundles job publishes pre-built template
#     bundles there)
#   - the GitHub repo variables the workflows read
#
# Usage:
#   bash scripts/setup-kernel-ci-publisher.sh [dev-project-id]
#
# Requires: gcloud (authenticated with project IAM admin), gh (repo admin).

set -euo pipefail

PROJECT_ID="${1:-repobot-dev-271523}"
REPO="${REPOBOT_BASE_GITHUB_REPO:-repobot-starter/repobot-tmp-base}"
POOL_ID="github-actions"
PROVIDER_ID="repobot-base"
SA_NAME="kernel-ci-publisher"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
BUCKET="gs://${PROJECT_ID}-kernel-snapshots"

PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" --format='value(projectNumber)')"

echo "==> WIF pool ${POOL_ID} in ${PROJECT_ID}..."
if ! gcloud iam workload-identity-pools describe "${POOL_ID}" \
    --project="${PROJECT_ID}" --location=global >/dev/null 2>&1; then
    gcloud iam workload-identity-pools create "${POOL_ID}" \
        --project="${PROJECT_ID}" --location=global \
        --display-name="GitHub Actions"
fi

echo "==> OIDC provider ${PROVIDER_ID} (restricted to ${REPO})..."
if ! gcloud iam workload-identity-pools providers describe "${PROVIDER_ID}" \
    --project="${PROJECT_ID}" --location=global \
    --workload-identity-pool="${POOL_ID}" >/dev/null 2>&1; then
    gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_ID}" \
        --project="${PROJECT_ID}" --location=global \
        --workload-identity-pool="${POOL_ID}" \
        --display-name="repobot-base CI" \
        --issuer-uri="https://token.actions.githubusercontent.com" \
        --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
        --attribute-condition="assertion.repository == '${REPO}'"
fi

echo "==> Service account ${SA_EMAIL}..."
if ! gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" >/dev/null 2>&1; then
    gcloud iam service-accounts create "${SA_NAME}" \
        --project="${PROJECT_ID}" \
        --display-name="Kernel snapshot CI publisher (repobot-base GitHub Actions)"
fi

echo "==> Allowing ${REPO} workflows to impersonate the publisher..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
    --project="${PROJECT_ID}" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/attribute.repository/${REPO}" \
    >/dev/null

echo "==> Granting objectAdmin on ${BUCKET}..."
gcloud storage buckets add-iam-policy-binding "${BUCKET}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.objectAdmin" >/dev/null

# Pre-built web bundles (ci.yml web-bundles job) publish into the CUSTOMER
# postures' deployer build caches — the same buckets run-deploy.sh restores
# from (setup-customer-serving.sh creates them, 30-day TTL). Override the
# list to change postures; empty disables the wiring (and the CI job skips
# on the unset variable).
WEB_BUNDLE_CACHE_BUCKETS="${REPOBOT_WEB_BUNDLE_CACHE_BUCKETS:-gs://repobot-customers-dev-build-cache gs://repobot-customers-prod-build-cache}"

for CACHE_BUCKET in ${WEB_BUNDLE_CACHE_BUCKETS}; do
    echo "==> Granting objectAdmin on ${CACHE_BUCKET} (pre-built web bundles)..."
    if gcloud storage buckets describe "${CACHE_BUCKET}" >/dev/null 2>&1; then
        gcloud storage buckets add-iam-policy-binding "${CACHE_BUCKET}" \
            --member="serviceAccount:${SA_EMAIL}" \
            --role="roles/storage.objectAdmin" >/dev/null
    else
        echo "    ${CACHE_BUCKET} does not exist yet (setup-customer-serving.sh creates it); re-run this script after it does." >&2
    fi
done

PROVIDER_RESOURCE="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_ID}/providers/${PROVIDER_ID}"

echo "==> Setting GitHub repo variables on ${REPO}..."
gh variable set GCP_WORKLOAD_IDENTITY_PROVIDER --repo "${REPO}" --body "${PROVIDER_RESOURCE}"
gh variable set GCP_KERNEL_PUBLISHER_SERVICE_ACCOUNT --repo "${REPO}" --body "${SA_EMAIL}"
gh variable set KERNEL_SNAPSHOT_STORE_DEV --repo "${REPO}" --body "${BUCKET}"
gh variable set WEB_BUNDLE_CACHE_STORES --repo "${REPO}" --body "${WEB_BUNDLE_CACHE_BUCKETS}"

echo
echo "Done. The next push to main bakes and publishes to ${BUCKET}."
echo "  provider: ${PROVIDER_RESOURCE}"
echo "  service account: ${SA_EMAIL}"
echo "  web-bundle stores: ${WEB_BUNDLE_CACHE_BUCKETS}"
