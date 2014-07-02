#!/bin/bash
# 
# @file
# Cherry picks certain files from the demo folder.

mkdir -p "$7/externs/jquery.imgareaselect/css"
mkdir -p "$7/externs/jquery.imgareaselect/scripts"
cp "$7/demo/css/area_mapper.css" "$7/area_mapper.css"
cp "$7/demo/externs/jquery.imgareaselect/scripts/jquery.imgareaselect.pack.js" "$7/externs/jquery.imgareaselect/scripts/"
cp "$7/demo/externs/jquery.imgareaselect/GPL-LICENSE.txt" "$7/externs/jquery.imgareaselect/"
cp "$7/demo/externs/jquery.imgareaselect/MIT-LICENSE.txt" "$7/externs/jquery.imgareaselect/"
rsync -av "$7/demo/externs/jquery.imgareaselect/css/" "$7/externs/jquery.imgareaselect/css/"