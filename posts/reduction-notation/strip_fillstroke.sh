#!/bin/bash

# File to convert
FILE=diagram_notext.svg
# FILE=diagram.svg

# Strip the fill and stroke styles from the SVG so it can be embedded and
# styled by the page itself
sed -E "s/(fill|stroke):[^;]*;//g" "$FILE" \
  | tail -n +4 \
  > diagram_nofillstroke.svg
