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
