-- Default trips based on regional country groupings
-- These represent common travel destinations organized by region

-- Africa Region Trip
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אפריקה - טיול יבשת', 'טיול מקיף ביבשת אפריקה הכולל את היעדים הפופולריים ביותר', 'africa', 
'["EG", "MA", "TZ", "UG", "TN", "ZA", "ZM", "MG", "NG", "KE", "MU"]'::json);

-- Americas Region Trip
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אמריקה הלטינית - טיול יבשת', 'חוויית טיול מקיפה באמריקה הלטינית והקאריביים', 'americas', 
'["AR", "BR", "CL", "CO", "CR", "EC", "SV", "PE", "UY", "GF", "MX"]'::json);

-- Asia-Pacific Region Trip  
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אסיה-פסיפיק - טיול יבשת', 'טיול מרתק באסיה ואוקיאניה עם היעדים הפופולריים', 'asia-pacific', 
'["AU", "HK", "ID", "KR", "MO", "MY", "PK", "SG", "LK", "TW", "TH", "UZ", "VN"]'::json);

-- Balkans Region Trip
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('הבלקן - טיול אזורי', 'סיור מקיף באזור הבלקן ודרום מזרח אירופה', 'balkans', 
'["AL", "BA", "BG", "GR", "HR", "MK", "ME", "RO", "RS", "SI"]'::json);

-- Europe Plus Region Trip
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אירופה מורחבת - טיול יבשת', 'טיול מקיף באירופה כולל מדינות נוספות ובריטניה', 'europe-plus', 
'["AT", "DK", "IE", "IT", "SE", "FR", "BG", "CY", "EE", "FI", "GR", "HU", "LV", "LT", "NL", "NO", "PL", "RO", "SK", "SI", "ES", "GB", "TR", "DE", "MT", "CH", "BE", "HR", "CZ", "LI", "LU", "PT", "IS", "IC", "VA", "CYP"]'::json);

-- Popular single country trips
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('ארצות הברית - טיול מקיף', 'טיול בארצות הברית עם כיסוי ארצי מלא', 'north-america', 
'["US"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('יפן - חוויית הדלת המזרח', 'טיול מקיף ביפן עם כיסוי מלא של האי', 'asia', 
'["JP"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('איטליה - טיול אמנות ותרבות', 'טיול מקיף באיטליה מהאלפים ועד סיציליה', 'europe', 
'["IT"]'::json);

-- Multi-region trips
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('אירו-אסיה אקספרס', 'מסע מהיר מאירופה לאסיה דרך תורכיה', 'multi-region', 
'["DE", "AT", "IT", "TR", "JP", "KR", "TH"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('טיול אגן הים התיכון', 'סיור במדינות אגן הים התיכון', 'mediterranean', 
'["ES", "FR", "IT", "GR", "TR", "EG", "MA", "TN"]'::json);

-- Popular backpacking routes
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('דרום מזרח אסיה - בקפקינג', 'המסלול הקלאסי של בקפקרים בדרום מזרח אסיה', 'southeast-asia', 
'["TH", "VN", "MY", "SG", "ID", "PH"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('מזרח אירופה - טיול תרבותי', 'גילוי מזרח אירופה ותרבותה העשירה', 'eastern-europe', 
'["PL", "CZ", "SK", "HU", "RO", "BG"]'::json);

-- Business traveler routes
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('מרכזי עסקים גלובליים', 'מסע עסקי במרכזים הפיננסיים המובילים בעולם', 'business-hubs', 
'["US", "GB", "DE", "JP", "SG", "HK", "CH"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('שווקים מתפתחים - עסקים', 'סיור עסקי בשווקים המתפתחים הפרספקטיביים', 'emerging-markets', 
'["BR", "IN", "ZA", "MX", "TH", "VN", "PL"]'::json);

-- Nature and adventure trips
INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('ספארי ואתגרים באפריקה', 'חוויית ספארי ופעילויות אתגר באפריקה', 'africa-adventure', 
'["KE", "TZ", "ZA", "ZM", "UG"]'::json);

INSERT INTO trips (name, description, region_id, country_ids) VALUES 
('הרפתקאות בפטגוניה', 'חוויות טבע קיצוניות בפטגוניה', 'patagonia', 
'["AR", "CL"]'::json); 