#!/bin/bash

NUM_BOOKS=32

curl "https://gutenberg.org/browse/scores/top" \
  | grep -o 'href="/ebooks/[0-9][0-9]*"' \
  | sort \
  | uniq \
  | sed 's/href="\/ebooks\/\([0-9][0-9]*\)"/https:\/\/gutenberg.org\/ebooks\/\1.txt.utf-8/' \
  | shuf \
  | head -n "${NUM_BOOKS}" \
  | xargs -L 1 -P 4 curl -L --compressed \
  | tee text.txt \
  | iconv -c -t ascii \
  | tr -c -d '[:print:]\n' \
  | tr '\n' ' ' \
  | sed 's/[[:space:]][[:space:]]*/ /g' \
  | sed 's/\(.\)/\1\n/g' \
  | sort \
  | uniq -c \
  | sort -n \
  | tee frequency.txt \
  | python3 -c 'import sys, json; 
lines = sys.stdin.readlines(); 
data = {l.strip(): int(n.strip()) for n, l in map(lambda x: x.split(), lines[:-1])}; 
data[" "] = int(lines[-1].strip()); 
total = sum(data.values()); 
data = {k: v / total for k, v in data.items()};  
print(json.dumps(data, indent=2))' \
  | tee frequency.json
