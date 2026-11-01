#!/usr/bin/env bash
# Runs the migration, seed and smoke scenario against a local Postgres (needs psql on PATH and a
# superuser connection, e.g. `sudo -u postgres ./run.sh` or PGHOST/PGUSER set). Creates and drops
# a scratch database called sync_test.
set -euo pipefail
cd "$(dirname "$0")/.."
DB=${SYNC_TEST_DB:-sync_test}
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/auth_shim.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f migrations/0001_init.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f seed.sql
psql -v ON_ERROR_STOP=1 -d "$DB" -f tests/smoke.sql
psql -q -c "drop database $DB"
