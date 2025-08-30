-- Simple migration to uppercase provider names
UPDATE catalog_bundles 
SET provider = 'MAYA' 
WHERE LOWER(provider) = 'MAYA';

UPDATE catalog_bundles 
SET provider = 'ESIM_GO' 
WHERE LOWER(provider) = 'esimgo';