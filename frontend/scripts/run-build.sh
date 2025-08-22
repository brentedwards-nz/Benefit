#!/bin/bash

# Source the nvm script to make nvm available
[ -s "$HOME/.nvm/nvm.sh" ] && \. "$HOME/.nvm/nvm.sh"

# Now run your build command
nvm use 20.9.0
npm run build