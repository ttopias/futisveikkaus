#!/bin/bash

SQL_DIR="./sql"

psql -U postgres -d postgres -f "$SQL_DIR/init.sql"
echo "Database $DB_NAME created successfully"
psql -U postgres -d postgres -f "$SQL_DIR/tables.sql"
echo "Tables created successfully"
psql -U postgres -d postgres -f "$SQL_DIR/dummy.sql"
echo "Dummy data inserted successfully"
psql -U postgres -d postgres -f "$SQL_DIR/functions.sql"
echo "Functions created successfully"
psql -U postgres -d postgres -f "$SQL_DIR/triggers.sql"
echo "Triggers created successfully"
