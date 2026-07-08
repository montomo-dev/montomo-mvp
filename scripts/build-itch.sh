#!/bin/sh
set -e
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist/build
cp -R index.html css js assets dist/build/

cd dist/build
zip -r -X ../montomo-itch.zip index.html css js assets -x "*.DS_Store"
cd ..
rm -rf build

echo "dist/montomo-itch.zip を作成しました"
