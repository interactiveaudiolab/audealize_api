#!/bin/bash 
cd static/js/effects/
jsdoc -R ../../../jsdoc_README.md audealize.js reverb.js equalizer.js ../descriptor.js ../../../readme.md  -d ../../../docs/ -u ../../../docs/tutorials 
