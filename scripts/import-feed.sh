#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# PreisAlarm — Chunked Feed Import Script
# Imports the full Adtraction XXL Parfum feed in batches of 200
# ═══════════════════════════════════════════════════════════════

API_URL="https://www.preisalarm.ch/api/feeds/import"
CRON_SECRET="${CRON_SECRET:-your-cron-secret-here}"
BATCH_SIZE=200
SKIP=0
TOTAL=0
IMPORTED_TOTAL=0
BATCH_NUM=0

echo "╔═══════════════════════════════════════════════╗"
echo "║  PreisAlarm — Feed Import (Chunked)           ║"
echo "║  Batch Size: $BATCH_SIZE                            ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

while true; do
  BATCH_NUM=$((BATCH_NUM + 1))
  echo "━━━ Batch $BATCH_NUM | skip=$SKIP, limit=$BATCH_SIZE ━━━"

  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"skip\": $SKIP, \"limit\": $BATCH_SIZE}")

  # Check for curl errors
  if [ $? -ne 0 ]; then
    echo "  ❌ curl failed — retrying in 10s..."
    sleep 10
    continue
  fi

  # Parse response
  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  TOTAL_IN_FEED=$(echo "$RESPONSE" | grep -o '"totalInFeed":[0-9]*' | head -1 | cut -d: -f2)
  PROCESSED=$(echo "$RESPONSE" | grep -o '"processed":[0-9]*' | head -1 | cut -d: -f2)
  IMPORTED=$(echo "$RESPONSE" | grep -o '"imported":[0-9]*' | head -1 | cut -d: -f2)
  ERRORS=$(echo "$RESPONSE" | grep -o '"errors":[0-9]*' | head -1 | cut -d: -f2)
  NEXT_SKIP=$(echo "$RESPONSE" | grep -o '"nextSkip":[0-9]*' | head -1 | cut -d: -f2)
  DURATION=$(echo "$RESPONSE" | grep -o '"durationMs":[0-9]*' | head -1 | cut -d: -f2)

  # Check for API errors
  if [ "$STATUS" != "ok" ]; then
    ERROR_MSG=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  ❌ API Error: $ERROR_MSG"
    echo "  Full response: $RESPONSE"
    echo "  Retrying in 10s..."
    sleep 10
    continue
  fi

  IMPORTED_TOTAL=$((IMPORTED_TOTAL + IMPORTED))

  if [ -z "$TOTAL_IN_FEED" ]; then TOTAL_IN_FEED=0; fi
  if [ -z "$PROCESSED" ]; then PROCESSED=0; fi
  if [ -z "$IMPORTED" ]; then IMPORTED=0; fi
  if [ -z "$ERRORS" ]; then ERRORS=0; fi
  if [ -z "$DURATION" ]; then DURATION=0; fi

  TOTAL=$TOTAL_IN_FEED

  echo "  ✅ imported=$IMPORTED, errors=$ERRORS, duration=${DURATION}ms"
  echo "  📊 Progress: $NEXT_SKIP / $TOTAL (total imported: $IMPORTED_TOTAL)"

  # Check if we're done
  if [ "$PROCESSED" -eq 0 ] || [ "$NEXT_SKIP" -ge "$TOTAL" ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════╗"
    echo "║  ✅ IMPORT COMPLETE                           ║"
    echo "║  Total products: $TOTAL"
    echo "║  Total imported: $IMPORTED_TOTAL"
    echo "║  Batches: $BATCH_NUM"
    echo "╚═══════════════════════════════════════════════╝"
    break
  fi

  SKIP=$NEXT_SKIP

  echo "  ⏳ Waiting 5s before next batch..."
  sleep 5
done
