-- Regional trips based on the exact Excel data structure
-- These match the 5 main regions: Africa, Americas, Asia, Balkans, EU+

-- Africa - exact countries from spreadsheet
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אפריקה', 'כיסוי מלא של יבשת אפריקה כולל מצרים, מרוקו, דרום אפריקה ועוד', 'africa', 
'["EG", "MA", "TZ", "UG", "TN", "ZA", "ZM", "MG", "NG", "KE", "MU"]'::json);

-- Americas - exact countries from spreadsheet
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אמריקה', 'כיסוי יבשת אמריקה כולל ארגנטינה, ברזיל, מקסיקו ועוד', 'americas', 
'["AR", "BR", "CL", "CO", "CR", "EC", "SV", "PE", "UY", "GF", "MX"]'::json);

-- Asia - exact countries from spreadsheet  
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אסיה', 'כיסוי יבשת אסיה כולל אוסטרליה, הונג קונג, יפן, תאילנד ועוד', 'asia', 
'["AU", "HK", "ID", "KR", "MO", "MY", "PK", "SG", "LK", "TW", "TH", "UZ", "VN"]'::json);

-- Balkans - exact countries from spreadsheet
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('הבלקן', 'כיסוי אזור הבלקן כולל יוון, קרואטיה, בולגריה ועוד', 'balkans', 
'["AL", "BA", "BG", "GR", "HR", "MK", "ME", "RO", "RS", "SI"]'::json);

-- EU+ - exact countries from spreadsheet (this is the largest group)
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אירופה מורחבת', 'כיסוי מקיף של אירופה כולל בריטניה, גרמניה, צרפת ועוד 30 מדינות', 'europe-plus', 
'["AT", "DK", "IE", "IT", "SE", "FR", "BG", "CY", "EE", "FI", "GR", "HU", "LV", "LT", "NL", "NO", "PL", "RO", "SK", "SI", "ES", "GB", "TR", "DE", "MT", "CH", "BE", "HR", "CZ", "LI", "LU", "PT", "IS", "IC", "VA", "CYP"]'::json); 