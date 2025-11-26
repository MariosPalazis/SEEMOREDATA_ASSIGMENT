# 📘 Metadata Sync Service – NestJS + Snowflake + MongoDB

This project implements a backend service that connects to a Snowflake account, retrieves metadata for all available tables and columns, and synchronizes this metadata into MongoDB.  
The solution ensures:

- **No duplicates across runs**  
- **Accurate detection of schema changes**  
- **Efficient insert/update logic**  
- **Idempotent behavior**  
- **Clear modular architecture**

---
### Core Components

| Component | Description |
|----------|-------------|
| **SnowflakeService** | Connects to Snowflake using the official SDK and retrieves metadata. |
| **MetadataService** | Computes signatures, compares with MongoDB, inserts/updates as needed. |
| **MetadataController** | Exposes `/sync` endpoint. |
| **MongoDB** | Persists metadata documents with versioning via signatures. |

---

# ⚙️ How the System Works

## 1. Trigger `/sync`
Calling:

```
POST /sync
```

starts the metadata synchronization process.

---

## 2. Fetch Metadata from Snowflake

The system queries:

```
SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.TABLES
SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.COLUMNS
```

Returns:

```
database, schemaName, tableName, tableComment,
columns(name, type, nullable, comment, ordinalPosition)
```

---

## 3. Compute SHA-256 Signature

Each table generates a hash based on:

- Table identity  
- Table comment  
- Ordered columns  
- All column attributes  

If anything changes → signature changes.

---

## 4. Compare With MongoDB

Each document uniquely identified by:

```
database + schemaName + name
```

Process:

- No document → **insert**
- Signature changed → **update**
- Signature same → **skip**

---

## 5. Return Summary

Example:
```json
{
  "totalTables": 68,
  "inserted": 1,
  "updated": 0,
  "skipped": 67
}
```

---

# 🗄️ MongoDB Data Model

Stored in:

```
metadata_db.table_metadata
```

Schema:

```ts
{
  database: string,
  schemaName: string,
  name: string,
  comment?: string,
  columns: [
    { name, dataType, isNullable, comment, ordinalPosition }
  ],
  signature: string,
  createdAt: Date,
  updatedAt: Date
}
```

Unique index:

```
signature(database, schemaName, name)
```

---

# 📦 Installation & Setup

## 1. Install dependencies

```
npm install
```

---

## 2. Environment Variables

Create `.env`:

```
MONGODB_URI=
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
SNOWFLAKE_ROLE=
SNOWFLAKE_WAREHOUSE=
```

---

## 3. Start MongoDB

```
I used Atlas but fill free to use any approach you prefer
```

---

## 4. Snowflake Setup Scripts

All SQL commands used to prepare tables and simulate use cases are located in:

👉 **README_snowflake_setup.md**

Includes:

- Menu table creation  
- Example inserts  
- ALTER TABLE  
- CREATE TABLE AS SELECT  

---

## 5. Start App

```
npm run start:dev
```

---

## 6. Run Sync

```
curl -X POST http://localhost:3000/sync
```


---

# 📜 NPM Scripts

```
"build": "nest build",
"format": "prettier --write "src/**/*.ts" "test/**/*.ts"",
"start": "nest start",
"start:dev": "nest start --watch",
"start:debug": "nest start --debug --watch",
"start:prod": "node dist/main"
```

---

# 🔍 Metadata Source Selection

During development, two different Snowflake metadata sources were evaluated and used at different stages.

### 1. `SNOWFLAKE.ACCOUNT_USAGE` views

Initially, the service queried:

- `snowflake.account_usage.tables`
- `snowflake.account_usage.columns`

**Pros:**

- Account-wide view of all databases and schemas.
- Common approach in production environments for centralized metadata catalogs.
- Works well for governance / auditing scenarios.

**Cons (for this assignment/demo):**

- These views are populated asynchronously by Snowflake and can have **up to ~90 minutes latency**.
- Newly created tables or recent schema changes (e.g. the `MENU` table in `SNOWFLAKE_LEARNING_DB`) do not appear immediately.
- This latency makes it hard to reliably test “update” and “insert new table” behavior in a short-lived assignment.

Because of this delay, the initial approach with `ACCOUNT_USAGE` made the local tests look “wrong” (the service appeared not to see new tables, when in fact Snowflake hadn’t exposed them yet in those views).

---

### 2. `INFORMATION_SCHEMA` of the target database

To support **real-time behavior** required by the assignment, the implementation was adapted to query:

- `SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.TABLES`
- `SNOWFLAKE_LEARNING_DB.INFORMATION_SCHEMA.COLUMNS`

**Pros:**

- **Immediate** visibility of new tables and schema changes.
- Perfect for demo environments, development, and automated tests.
- Still provides all necessary metadata (table names, schemas, comments, columns, types, nullability, etc.).
- Matches the scope of this exercise: focus on a specific database (`SNOWFLAKE_LEARNING_DB`).

**Trade-offs:**

- Scope is **database-level**, not account-wide (one `INFORMATION_SCHEMA` per database).
- In a large production environment, you might need to iterate over multiple databases if you want a full catalog.

---

### Conclusion

The current implementation uses `INFORMATION_SCHEMA` for this assignment to guarantee:

- Real-time feedback when changing schemas or creating new tables.
- Reliable and repeatable validation of all use cases (insert / skip / update / new table detection).

However, the architecture (`SnowflakeService → MetadataS

---

# ✅ End of README
