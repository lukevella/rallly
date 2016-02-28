#!/bin/bash
npm install
bower install --allow-root
if [ ! -f config/main.js ]; then
    cp config/main.sample.js config/main.js
fi
