# NestJS + Snowflake + MongoDB Metadata Sync

## Overview

This service connects to a Snowflake account, retrieves metadata about all tables (grouped by database and schema) and stores it in MongoDB. It is designed to avoid unnecessary Snowflake queries and to avoid duplicates in MongoDB.

## Tech stack

- NestJS
- Snowflake SDK (`snowflake-sdk`)
- MongoDB with Mongoose
- `@nestjs/config` for environment variables

## Setup

1. Install dependencies:

```bash
npm install



During the development of this assignment, two different sources for retrieving Snowflake metadata were evaluated:

1. SNOWFLAKE.ACCOUNT_USAGE views

Initially, the service queried:

snowflake.account_usage.tables

snowflake.account_usage.columns

This approach provides full account-wide visibility and is typically preferred in production environments.
However, these views have a built-in latency (up to 90 minutes) before reflecting new tables or schema changes.
As a result, newly created tables (such as the MENU table used during testing) did not appear immediately.

2. INFORMATION_SCHEMA of the target database

To enable real-time testing for this assignment, the implementation was adapted to use:

SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.TABLES

SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.COLUMNS

This provides instant visibility of metadata changes in the specific database used for the demo (SNOWFLAKE_LEARNING_DB), allowing all use cases (insert, skip, update, new table detection) to be validated without delay.

Conclusion

The service architecture (SnowflakeService → MetadataService) remains fully modular.
Switching between ACCOUNT_USAGE (enterprise-level, account-wide) and INFORMATION_SCHEMA (database-level, real-time) requires only a small change in the query layer.
This flexibility makes the solution suitable both for demo purposes and production-grade metadata harvesting.