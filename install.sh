#!/bin/bash
npm install
bower install
if [ ! -f config/main.js ]; then
    cp config/main.sample.js config/main.js
fi
