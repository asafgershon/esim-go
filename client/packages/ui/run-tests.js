#!/usr/bin/env node

// Setup global DOM environment
const { GlobalRegistrator } = require('@happy-dom/global-registrator');
GlobalRegistrator.register();

// Run the test
require('vitest/cli').main(['run']);