#!/usr/bin/env node
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Register happy-dom globally
GlobalRegistrator.register();

// Now import and run tests
import('./src/hooks/use-esim-detection.test.ts');