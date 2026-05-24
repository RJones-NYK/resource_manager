-- Extensions and permissions for dev/prod databases
-- Note: init scripts only run on first container start (empty data dir)

\c resource_manager_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c resource_manager_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
