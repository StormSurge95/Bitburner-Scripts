# Required Scripts
## start.js
This script is literally just the starting point. It creates our array of hackable servers and sorts them based on profit, then creates a `daemon.js` script to do the main job of actually hacking the target server. It takes one optional argument for the index of the sorted array to use when deciding on a target; if omitted, the index defaults to `0`.

## daemon.js
As implied previously, this script does the majority of the calculatory work for hacking the target server.

## hack-scheduler.js / grow-scheduler.js
These scripts do as their names suggest; they simply schedule the running of the target scripts.

## hack-target.js / grow-target.js / weaken-target.js
These scripts, again, do as their names suggest; they simply hack/grow/weaken the provided target.
