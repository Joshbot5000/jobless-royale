#!/usr/bin/env bash
# Balance loop: build -> duel every pairing in every arena -> nudge stats -> repeat.
#   tools/balance.sh [rounds]     (default 6). Ends with a report in dist/duel_report.txt
set -e
cd "$(dirname "$0")/.."
ROUNDS=${1:-6}
for i in $(seq 1 "$ROUNDS"); do
  python3 build.py >/dev/null
  node tools/duel.js "" dist/duels.json | tail -1
  node tools/tune.js dist/duels.json
done
python3 build.py >/dev/null
node tools/duel.js "" dist/duels.json | tail -1
node tools/duelreport.js dist/duels.json > dist/duel_report.txt
echo "no answer: $(grep -c 'NO ANSWER' dist/duel_report.txt)  beats all: $(grep -c 'BEATS ALL' dist/duel_report.txt)  weak: $(grep -c 'WEAK' dist/duel_report.txt)"
