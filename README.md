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


# ✅ End of README
