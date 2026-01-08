#!/bin/bash

# Script to scrape all three CSV sources and harmonize the data

echo "=========================================="
echo "Starting full data scraping pipeline..."
echo "=========================================="
echo ""

# Step 1: Scrape Matt's Pickleball
echo "📊 [1/4] Scraping Matt's Pickleball CSV..."
npm run scrape:mattspickleball:csv
if [ $? -ne 0 ]; then
  echo "❌ Error scraping Matt's Pickleball. Please check if mattspickleball.csv exists in Downloads."
  exit 1
fi
echo "✅ Matt's Pickleball complete"
echo ""

# Step 2: Scrape PickleballEffect
echo "📊 [2/4] Scraping PickleballEffect CSV..."
npm run scrape:pickleballeffect:csv
if [ $? -ne 0 ]; then
  echo "❌ Error scraping PickleballEffect. Please check if Grid view.csv exists in Downloads."
  exit 1
fi
echo "✅ PickleballEffect complete"
echo ""

# Step 3: Scrape Pickleball Studio
echo "📊 [3/4] Scraping Pickleball Studio CSV..."
npm run scrape:pickleballstudio:csv
if [ $? -ne 0 ]; then
  echo "❌ Error scraping Pickleball Studio. Please check if pickleballstudio.csv exists in Downloads."
  exit 1
fi
echo "✅ Pickleball Studio complete"
echo ""

# Step 4: Harmonize all data
echo "🔄 [4/4] Harmonizing all data sources..."
npm run harmonize
if [ $? -ne 0 ]; then
  echo "❌ Error harmonizing data."
  exit 1
fi
echo "✅ Harmonization complete"
echo ""

echo "=========================================="
echo "✨ Pipeline complete!"
echo "=========================================="
echo ""
echo "📁 Output files:"
echo "  Raw data:        output/raw/"
echo "  Harmonized data: output/harmonized/"
echo ""
echo "📊 Summary:"
ls -lh output/raw/*.json
echo ""
ls -lh output/harmonized/*.json
echo ""
