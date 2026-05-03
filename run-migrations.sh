#!/bin/bash
# Run InsForge migrations

echo "🚀 Running WIT-ERP Database Migrations..."
echo ""

INSFORGE_URL="https://27qy8cr6.ap-southeast.insforge.app"
INSFORGE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODE3Mjl9.07dajYiFh2DdncF8qKmWLiIk_waKxPvetyFMJgVRKrY"

MIGRATIONS_DIR="./migrations"

echo "📁 Migrations found:"
ls -1 "$MIGRATIONS_DIR"/*.sql | sort

echo ""
echo "📋 Copy and paste SQL ke InsForge console:"
echo "   URL: $INSFORGE_URL"
echo ""
echo "⚠️  Pastikan run dalam urutan versi migration yang valid:"
echo "   <timestamp>_<name>.sql"
echo ""

# Display first migration file if exists
FIRST_FILE=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort | head -1)
if [ -n "$FIRST_FILE" ]; then
  cat "$FIRST_FILE"
fi
