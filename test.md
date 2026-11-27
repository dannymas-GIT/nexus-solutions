# Nexus Solutions - QA Test Suite

Automated browser tests for Nexus Business Builder. Required per developer contract.
Pipeline runs these tests on push; failures block staging and production.

## Variables

- `${BASE_URL}` - App base URL (set by pipeline per environment)
- `${TEST_EMAIL}`, `${TEST_PASSWORD}` - Test credentials (if configured)

## Smoke Tests (Required)

These run on every pipeline. Keep fast (< 30 seconds total).

### Test: Homepage Load
**URL:** ${BASE_URL}
**Steps:**
1. Wait for page load
**Expected:**
- Page loads within 3 seconds
- See "Nexus" or "Business" or "Welcome"

### Test: Root Responds
**URL:** ${BASE_URL}/
**Steps:**
1. Wait 2
**Expected:**
- Page loads within 5 seconds

## Feature Tests

Add tests for new features here.

### Test: Idea Studio Page Loads
**URL:** ${BASE_URL}/idea-studio
**Steps:**
1. Wait for page load
**Expected:**
- Page loads within 5 seconds
- See "Idea Studio"
- See "Submit Brief"
- See "nexus-solutions"
