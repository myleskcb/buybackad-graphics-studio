#!/bin/sh
# docs/iphonesla-library.zip: the iPhones LA side of the library API (rule 111)
# in one file, for the owner to hand over. Run after any change to the folder;
# scripts/library_handoff_check.mjs fails while the zip and the folder differ.
set -e
cd "$(dirname "$0")/../docs"
rm -f iphonesla-library.zip
find iphonesla-library -name __pycache__ -prune -exec rm -rf {} +
zip -q -X -r iphonesla-library.zip iphonesla-library -x '*/.*'
unzip -l iphonesla-library.zip
