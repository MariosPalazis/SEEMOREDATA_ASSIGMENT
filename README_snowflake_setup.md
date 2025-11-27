1. Environment Setup
USE ROLE ACCOUNTADMIN;
USE WAREHOUSE SNOWFLAKE_LEARNING_WH;
USE DATABASE SNOWFLAKE_LEARNING_DB;
USE SCHEMA MARIOS_LOAD_SAMPLE_DATA_FROM_S3;


2. Create / Reset TABLE MENU
CREATE OR REPLACE TABLE MENU
(
    menu_id NUMBER(19,0),
    menu_type_id NUMBER(38,0),
    menu_type VARCHAR,
    truck_brand_name VARCHAR,
    menu_item_id NUMBER(38,0),
    menu_item_name VARCHAR,
    item_category VARCHAR,
    item_subcategory VARCHAR,
    cost_of_goods_usd NUMBER(38,4),
    sale_price_usd NUMBER(38,4),
    menu_item_health_metrics_obj VARIANT
);


3. Insert Sample Data (with VARIANT JSON)
INSERT INTO MENU (...) SELECT ... UNION ALL SELECT ...;


4. Schema Change
ALTER TABLE MENU ADD COLUMN DEMO_CHANGE_COL VARCHAR;

5. Create New Table
CREATE OR REPLACE TABLE MENU_COPY AS SELECT * FROM MENU;

