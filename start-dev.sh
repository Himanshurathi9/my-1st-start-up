#!/bin/bash
cd /home/z/my-project
while true; do
  echo "=== Starting dev server ===" >> dev.log
  bun run dev >> dev.log 2>&1
  echo "=== Dev server exited, restarting in 2s ===" >> dev.log
  sleep 2
done
