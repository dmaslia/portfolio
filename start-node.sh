#!/bin/bash

# Ensure Node modules are installed
export PATH="/home/daniel/.nvm/versions/node/v22.15.0/bin:$PATH"
/home/daniel/.nvm/versions/node/v22.15.0/bin/npm --prefix /home/daniel/portfolio/backend install

# Start Node.js server
cd /home/daniel/portfolio/backend
exec node /home/daniel/portfolio/backend/server.js

