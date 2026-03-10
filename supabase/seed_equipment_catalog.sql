-- =============================================================================
-- Equipment Catalog Seed Data
-- Real marine equipment with researched power consumption specifications.
-- Sources include manufacturer datasheets, retailer specs, and community data.
-- =============================================================================

-- Truncate existing data (idempotent re-seeding)
TRUNCATE TABLE equipment_catalog;

-- =============================================================================
-- DRAINS (power consumers)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Watermakers
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Schenker Zen series (DC, energy recovery system)
(gen_random_uuid(), 'drain', 'watermaker', 'Schenker', 'Zen 30', NULL, true,
 'Schenker Zen 30',
 '{"wattsTypical": 110, "wattsMin": 100, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

(gen_random_uuid(), 'drain', 'watermaker', 'Schenker', 'Zen 50', NULL, true,
 'Schenker Zen 50',
 '{"wattsTypical": 240, "wattsMin": 220, "wattsMax": 260, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

(gen_random_uuid(), 'drain', 'watermaker', 'Schenker', 'Zen 100', NULL, true,
 'Schenker Zen 100',
 '{"wattsTypical": 400, "wattsMin": 380, "wattsMax": 420, "hoursPerDayAnchor": 1.5, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

-- Schenker Smart series
(gen_random_uuid(), 'drain', 'watermaker', 'Schenker', 'Smart 30', NULL, true,
 'Schenker Smart 30',
 '{"wattsTypical": 110, "wattsMin": 100, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/smart/'),

(gen_random_uuid(), 'drain', 'watermaker', 'Schenker', 'Smart 60', NULL, true,
 'Schenker Smart 60',
 '{"wattsTypical": 240, "wattsMin": 220, "wattsMax": 260, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/smart/'),

-- Spectra watermakers
(gen_random_uuid(), 'drain', 'watermaker', 'Spectra', 'Ventura 150T', NULL, true,
 'Spectra Ventura 150T',
 '{"wattsTypical": 108, "wattsMin": 96, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.spectrawatermakers.com/us/us/ventura'),

(gen_random_uuid(), 'drain', 'watermaker', 'Spectra', 'Ventura 200T', NULL, true,
 'Spectra Ventura 200T',
 '{"wattsTypical": 144, "wattsMin": 130, "wattsMax": 160, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://seatechmarineproducts.com/spectra-ventura-200t-tropical-12v-24vdc-8-3gph-marine-watermaker-vt200t.html'),

(gen_random_uuid(), 'drain', 'watermaker', 'Spectra', 'Newport 400', NULL, true,
 'Spectra Newport 400',
 '{"wattsTypical": 256, "wattsMin": 230, "wattsMax": 280, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.spectrawatermakers.com/us/us/11131-newport-400c'),

-- Katadyn PowerSurvivor
(gen_random_uuid(), 'drain', 'watermaker', 'Katadyn', 'PowerSurvivor 40E', NULL, true,
 'Katadyn PowerSurvivor 40E',
 '{"wattsTypical": 48, "wattsMin": 42, "wattsMax": 54, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.katadyngroup.com/us/en/8013438-Katadyn-PowerSurvivor-40E~p6702'),

(gen_random_uuid(), 'drain', 'watermaker', 'Katadyn', 'PowerSurvivor 80E', NULL, true,
 'Katadyn PowerSurvivor 80E',
 '{"wattsTypical": 96, "wattsMin": 84, "wattsMax": 108, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.katadyngroup.com/us/en/Katadyn-PowerSurvivor-80E'),

-- Rainman watermakers
(gen_random_uuid(), 'drain', 'watermaker', 'Rainman', 'Compact (12V DC)', NULL, true,
 'Rainman Compact 12V DC',
 '{"wattsTypical": 410, "wattsMin": 380, "wattsMax": 440, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.rainmandesal.com/dc-electric-watermaker/'),

(gen_random_uuid(), 'drain', 'watermaker', 'Rainman', 'Petrol Portable', NULL, true,
 'Rainman Petrol Portable',
 '{"wattsTypical": 1250, "wattsMin": 1100, "wattsMax": 1400, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://www.rainmandesal.com/ac-electric-watermaker/'),

-- Village Marine
(gen_random_uuid(), 'drain', 'watermaker', 'Village Marine', 'LTM-500', NULL, true,
 'Village Marine LTM-500',
 '{"wattsTypical": 750, "wattsMin": 680, "wattsMax": 820, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://citimarinestore.com/en/village-marine-ltm-series-watermaker/1510-ltm-500-21-gph-500-gpd.html'),

(gen_random_uuid(), 'drain', 'watermaker', 'Village Marine', 'LTM-800', NULL, true,
 'Village Marine LTM-800',
 '{"wattsTypical": 1100, "wattsMin": 1000, "wattsMax": 1200, "hoursPerDayAnchor": 1.5, "hoursPerDayPassage": 1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://citimarinestore.com/en/village-marine-ltm-series-watermaker/1514-ltm-800-220v-90-6050.html'),

-- Generic watermakers
(gen_random_uuid(), 'drain', 'watermaker', NULL, NULL, NULL, true,
 'Generic Watermaker (Small, DC)',
 '{"wattsTypical": 100, "wattsMin": 48, "wattsMax": 150, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'watermaker', NULL, NULL, NULL, true,
 'Generic Watermaker (Large, AC)',
 '{"wattsTypical": 800, "wattsMin": 500, "wattsMax": 1200, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Gensets (generators) - modeled as drains for fuel/maintenance tracking
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'genset', 'Fischer Panda', 'iSeries 5000i', NULL, true,
 'Fischer Panda iSeries 5000i',
 '{"wattsTypical": 150, "wattsMin": 100, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/5000-generator/'),

(gen_random_uuid(), 'drain', 'genset', 'Fischer Panda', 'iSeries 8000i', NULL, true,
 'Fischer Panda iSeries 8000i',
 '{"wattsTypical": 200, "wattsMin": 140, "wattsMax": 260, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/ac-8-mini-generator/'),

(gen_random_uuid(), 'drain', 'genset', 'Fischer Panda', 'iSeries 15000i', NULL, true,
 'Fischer Panda iSeries 15000i',
 '{"wattsTypical": 300, "wattsMin": 200, "wattsMax": 400, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/'),

-- Paguro generators
(gen_random_uuid(), 'drain', 'genset', 'Paguro', '2000 Compact', NULL, true,
 'Paguro 2000 Compact',
 '{"wattsTypical": 80, "wattsMin": 60, "wattsMax": 100, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/307-vte-paguro-marine-generators'),

(gen_random_uuid(), 'drain', 'genset', 'Paguro', '4000', NULL, true,
 'Paguro 4000',
 '{"wattsTypical": 120, "wattsMin": 90, "wattsMax": 150, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.mastry.com/PAGURO-4000'),

(gen_random_uuid(), 'drain', 'genset', 'Paguro', '6000', NULL, true,
 'Paguro 6000',
 '{"wattsTypical": 160, "wattsMin": 120, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.mastry.com/PAGURO-6000'),

(gen_random_uuid(), 'drain', 'genset', 'Paguro', '9000', NULL, true,
 'Paguro 9000',
 '{"wattsTypical": 220, "wattsMin": 170, "wattsMax": 280, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://pdf.nauticexpo.com/pdf/volpi-tecno-energia/paguro-9000-v/22193-95589.html'),

-- WhisperPower Piccolo
(gen_random_uuid(), 'drain', 'genset', 'WhisperPower', 'Piccolo 5', NULL, true,
 'WhisperPower Piccolo 5',
 '{"wattsTypical": 100, "wattsMin": 70, "wattsMax": 140, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.whisperpower.com/diesel-generators/piccolo-generators/piccolo-5'),

(gen_random_uuid(), 'drain', 'genset', 'WhisperPower', 'Piccolo 8', NULL, true,
 'WhisperPower Piccolo 8',
 '{"wattsTypical": 150, "wattsMin": 100, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.whisperpower.com/US/4/2/338/products/generators-ac-variable-speed/piccolo-8-marine.html'),

-- Onan/Cummins QD
(gen_random_uuid(), 'drain', 'genset', 'Onan/Cummins', 'QD 3.5', NULL, true,
 'Onan/Cummins QD 3.5',
 '{"wattsTypical": 80, "wattsMin": 60, "wattsMax": 100, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-qd-45-kw-generator'),

(gen_random_uuid(), 'drain', 'genset', 'Onan/Cummins', 'QD 5.0', NULL, true,
 'Onan/Cummins QD 5.0',
 '{"wattsTypical": 120, "wattsMin": 90, "wattsMax": 160, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-qd-45-kw-generator'),

(gen_random_uuid(), 'drain', 'genset', 'Onan/Cummins', 'QD 7.5', NULL, true,
 'Onan/Cummins QD 7.5',
 '{"wattsTypical": 180, "wattsMin": 140, "wattsMax": 240, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-qd-6758-kw-generator'),

-- Generic genset
(gen_random_uuid(), 'drain', 'genset', NULL, NULL, NULL, true,
 'Generic Marine Genset',
 '{"wattsTypical": 140, "wattsMin": 80, "wattsMax": 300, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Refrigeration
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Isotherm Cruise
(gen_random_uuid(), 'drain', 'refrigeration', 'Isotherm', 'Cruise 65', NULL, true,
 'Isotherm Cruise 65',
 '{"wattsTypical": 35, "wattsMin": 25, "wattsMax": 45, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://www.indelwebastomarine.com/us/service-downloads/faq/'),

(gen_random_uuid(), 'drain', 'refrigeration', 'Isotherm', 'Cruise 130', NULL, true,
 'Isotherm Cruise 130',
 '{"wattsTypical": 45, "wattsMin": 30, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://defender.com/en_us/isotherm-cruise-130-elegance-refrigerator-freezer'),

(gen_random_uuid(), 'drain', 'refrigeration', 'Isotherm', 'Cruise 200', NULL, true,
 'Isotherm Cruise 200',
 '{"wattsTypical": 55, "wattsMin": 40, "wattsMax": 75, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.45, "crewScaling": false, "powerType": "dc"}',
 'https://www.indelwebastomarine.com/'),

-- Vitrifrigo
(gen_random_uuid(), 'drain', 'refrigeration', 'Vitrifrigo', 'DP2600', NULL, true,
 'Vitrifrigo DP2600',
 '{"wattsTypical": 65, "wattsMin": 50, "wattsMax": 80, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/vitrifrigo-marine-refrigerators-freezers/6177-vitrifrigo-dp2600-dp2600ibd4-f-2.html'),

(gen_random_uuid(), 'drain', 'refrigeration', 'Vitrifrigo', 'C115', NULL, true,
 'Vitrifrigo C115',
 '{"wattsTypical": 45, "wattsMin": 35, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://yachtaidmarine.com/shop/marine-refrigerator/c115ibd4-f-1-marine-refrigerator-vitrifrigo-c115i-c115ia-classic/'),

-- Engel
(gen_random_uuid(), 'drain', 'refrigeration', 'Engel', 'MR040F', NULL, true,
 'Engel MR040F',
 '{"wattsTypical": 24, "wattsMin": 6, "wattsMax": 36, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://engelcoolers.com/products/mr40-overland-fridge'),

(gen_random_uuid(), 'drain', 'refrigeration', 'Engel', 'MT45F', NULL, true,
 'Engel MT45F',
 '{"wattsTypical": 30, "wattsMin": 6, "wattsMax": 36, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://engelcoolers.com/products/45-platinum-portable-car-fridge'),

-- Frigoboat
(gen_random_uuid(), 'drain', 'refrigeration', 'Frigoboat', 'Keel Cooler 100L', NULL, true,
 'Frigoboat Keel Cooler 100L',
 '{"wattsTypical": 35, "wattsMin": 25, "wattsMax": 50, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://coastalclimatecontrol.com/component/edocman/2-refrigeration/492-consumption-guide-for-frigoboat-12v-24v-keel-cooled-systems'),

-- Dometic CoolMatic
(gen_random_uuid(), 'drain', 'refrigeration', 'Dometic', 'CoolMatic CRX-50', NULL, true,
 'Dometic CoolMatic CRX-50',
 '{"wattsTypical": 40, "wattsMin": 17, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://www.dometic.com/en/product/dometic-coolmatic-crx-50-9105306567'),

(gen_random_uuid(), 'drain', 'refrigeration', 'Dometic', 'CoolMatic CRX-110', NULL, true,
 'Dometic CoolMatic CRX-110',
 '{"wattsTypical": 55, "wattsMin": 25, "wattsMax": 75, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.manuals.co.uk/dometic/coolmatic-crx-110/specifications'),

-- Generic refrigeration
(gen_random_uuid(), 'drain', 'refrigeration', NULL, NULL, NULL, true,
 'Generic Marine Fridge (12V)',
 '{"wattsTypical": 40, "wattsMin": 20, "wattsMax": 65, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.38, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Autopilots
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Raymarine Evolution
(gen_random_uuid(), 'drain', 'autopilot', 'Raymarine', 'Evolution EV-100', NULL, true,
 'Raymarine Evolution EV-100',
 '{"wattsTypical": 36, "wattsMin": 12, "wattsMax": 84, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/autopilot-packs/ev-100-power-pilot'),

(gen_random_uuid(), 'drain', 'autopilot', 'Raymarine', 'Evolution EV-200', NULL, true,
 'Raymarine Evolution EV-200',
 '{"wattsTypical": 60, "wattsMin": 18, "wattsMax": 180, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/'),

(gen_random_uuid(), 'drain', 'autopilot', 'Raymarine', 'Evolution EV-400', NULL, true,
 'Raymarine Evolution EV-400',
 '{"wattsTypical": 108, "wattsMin": 24, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/'),

-- B&G
(gen_random_uuid(), 'drain', 'autopilot', 'B&G', 'NAC-2', NULL, true,
 'B&G NAC-2',
 '{"wattsTypical": 36, "wattsMin": 12, "wattsMax": 96, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/autopilots/autopilot-computers/nac-2-autopilot-computer/'),

(gen_random_uuid(), 'drain', 'autopilot', 'B&G', 'NAC-3', NULL, true,
 'B&G NAC-3',
 '{"wattsTypical": 96, "wattsMin": 24, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/autopilots/autopilot-computers/nac-3-autopilot-computer/'),

-- Garmin
(gen_random_uuid(), 'drain', 'autopilot', 'Garmin', 'Reactor 40', NULL, true,
 'Garmin Reactor 40',
 '{"wattsTypical": 48, "wattsMin": 12, "wattsMax": 120, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/599938/'),

(gen_random_uuid(), 'drain', 'autopilot', 'Garmin', 'GHP 20', NULL, true,
 'Garmin GHP 20',
 '{"wattsTypical": 30, "wattsMin": 10, "wattsMax": 72, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/599935/'),

-- Simrad (same hardware as B&G)
(gen_random_uuid(), 'drain', 'autopilot', 'Simrad', 'NAC-2', NULL, true,
 'Simrad NAC-2',
 '{"wattsTypical": 36, "wattsMin": 12, "wattsMax": 96, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

(gen_random_uuid(), 'drain', 'autopilot', 'Simrad', 'NAC-3', NULL, true,
 'Simrad NAC-3',
 '{"wattsTypical": 96, "wattsMin": 24, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

-- Generic autopilot
(gen_random_uuid(), 'drain', 'autopilot', NULL, NULL, NULL, true,
 'Generic Tiller Autopilot',
 '{"wattsTypical": 30, "wattsMin": 10, "wattsMax": 84, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 16, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Chartplotters
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Raymarine Axiom2
(gen_random_uuid(), 'drain', 'chartplotter', 'Raymarine', 'Axiom2 7"', NULL, true,
 'Raymarine Axiom2 7"',
 '{"wattsTypical": 9, "wattsMin": 7, "wattsMax": 12, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Raymarine', 'Axiom2 9"', NULL, true,
 'Raymarine Axiom2 9"',
 '{"wattsTypical": 12, "wattsMin": 9, "wattsMax": 16, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Raymarine', 'Axiom2 12"', NULL, true,
 'Raymarine Axiom2 12"',
 '{"wattsTypical": 18, "wattsMin": 14, "wattsMax": 24, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s'),

-- Garmin GPSMAP
(gen_random_uuid(), 'drain', 'chartplotter', 'Garmin', 'GPSMAP 723', NULL, true,
 'Garmin GPSMAP 723',
 '{"wattsTypical": 13, "wattsMin": 10, "wattsMax": 18, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/697252/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Garmin', 'GPSMAP 923', NULL, true,
 'Garmin GPSMAP 923',
 '{"wattsTypical": 17, "wattsMin": 13, "wattsMax": 22, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/697252/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Garmin', 'GPSMAP 1243', NULL, true,
 'Garmin GPSMAP 1243',
 '{"wattsTypical": 24, "wattsMin": 18, "wattsMax": 32, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/697252/'),

-- B&G Vulcan
(gen_random_uuid(), 'drain', 'chartplotter', 'B&G', 'Vulcan 7', NULL, true,
 'B&G Vulcan 7',
 '{"wattsTypical": 10, "wattsMin": 7, "wattsMax": 14, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'B&G', 'Vulcan 9', NULL, true,
 'B&G Vulcan 9',
 '{"wattsTypical": 14, "wattsMin": 10, "wattsMax": 18, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'B&G', 'Vulcan 12', NULL, true,
 'B&G Vulcan 12',
 '{"wattsTypical": 20, "wattsMin": 15, "wattsMax": 26, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/'),

-- Simrad NSX
(gen_random_uuid(), 'drain', 'chartplotter', 'Simrad', 'NSX 7', NULL, true,
 'Simrad NSX 7',
 '{"wattsTypical": 10, "wattsMin": 7, "wattsMax": 14, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Simrad', 'NSX 9', NULL, true,
 'Simrad NSX 9',
 '{"wattsTypical": 14, "wattsMin": 10, "wattsMax": 18, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Simrad', 'NSX 12', NULL, true,
 'Simrad NSX 12',
 '{"wattsTypical": 20, "wattsMin": 15, "wattsMax": 26, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

-- Furuno NavNet
(gen_random_uuid(), 'drain', 'chartplotter', 'Furuno', 'NavNet TZT12F', NULL, true,
 'Furuno NavNet TZT12F',
 '{"wattsTypical": 22, "wattsMin": 16, "wattsMax": 28, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furuno.com/'),

(gen_random_uuid(), 'drain', 'chartplotter', 'Furuno', 'NavNet TZT16F', NULL, true,
 'Furuno NavNet TZT16F',
 '{"wattsTypical": 28, "wattsMin": 20, "wattsMax": 36, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furuno.com/'),

-- Generic chartplotter
(gen_random_uuid(), 'drain', 'chartplotter', NULL, NULL, NULL, true,
 'Generic Chartplotter (7-9")',
 '{"wattsTypical": 12, "wattsMin": 7, "wattsMax": 18, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Radar
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'radar', 'Raymarine', 'Quantum 2 Q24D', NULL, true,
 'Raymarine Quantum 2 Q24D',
 '{"wattsTypical": 20, "wattsMin": 15, "wattsMax": 25, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/'),

(gen_random_uuid(), 'drain', 'radar', 'Garmin', 'GMR Fantom 18x', NULL, true,
 'Garmin GMR Fantom 18x',
 '{"wattsTypical": 28, "wattsMin": 18, "wattsMax": 40, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://panbo.com/enclosed-radars-compared-including-garmin-raymarine-and-simrad/'),

(gen_random_uuid(), 'drain', 'radar', 'Garmin', 'GMR Fantom 24x', NULL, true,
 'Garmin GMR Fantom 24x',
 '{"wattsTypical": 35, "wattsMin": 22, "wattsMax": 50, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://panbo.com/enclosed-radars-compared-including-garmin-raymarine-and-simrad/'),

(gen_random_uuid(), 'drain', 'radar', 'Furuno', 'DRS4DL+', NULL, true,
 'Furuno DRS4DL+',
 '{"wattsTypical": 24, "wattsMin": 16, "wattsMax": 32, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furuno.com/'),

(gen_random_uuid(), 'drain', 'radar', 'Simrad', 'HALO20+', NULL, true,
 'Simrad HALO20+',
 '{"wattsTypical": 25, "wattsMin": 17, "wattsMax": 33, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

(gen_random_uuid(), 'drain', 'radar', 'Simrad', 'HALO24', NULL, true,
 'Simrad HALO24',
 '{"wattsTypical": 30, "wattsMin": 20, "wattsMax": 40, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/'),

-- Generic radar
(gen_random_uuid(), 'drain', 'radar', NULL, NULL, NULL, true,
 'Generic Dome Radar',
 '{"wattsTypical": 25, "wattsMin": 15, "wattsMax": 40, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 14, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Windlasses
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Lewmar
(gen_random_uuid(), 'drain', 'windlass', 'Lewmar', 'V1', NULL, true,
 'Lewmar V1',
 '{"wattsTypical": 500, "wattsMin": 300, "wattsMax": 600, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

(gen_random_uuid(), 'drain', 'windlass', 'Lewmar', 'V2', NULL, true,
 'Lewmar V2',
 '{"wattsTypical": 700, "wattsMin": 500, "wattsMax": 840, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

(gen_random_uuid(), 'drain', 'windlass', 'Lewmar', 'V3', NULL, true,
 'Lewmar V3',
 '{"wattsTypical": 1000, "wattsMin": 700, "wattsMax": 1200, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

(gen_random_uuid(), 'drain', 'windlass', 'Lewmar', 'VX2', NULL, true,
 'Lewmar VX2',
 '{"wattsTypical": 700, "wattsMin": 500, "wattsMax": 1000, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-vx-series-kit'),

-- Quick
(gen_random_uuid(), 'drain', 'windlass', 'Quick', 'Aleph 700', NULL, true,
 'Quick Aleph 700',
 '{"wattsTypical": 700, "wattsMin": 500, "wattsMax": 840, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.quickitaly.com/en/products/windlasses-and-capstans/vertical-windlasses/aleph-al3-al3p/'),

(gen_random_uuid(), 'drain', 'windlass', 'Quick', 'Hector 1000', NULL, true,
 'Quick Hector 1000',
 '{"wattsTypical": 1000, "wattsMin": 700, "wattsMax": 1200, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.svb24.com/en/quick-hector-windlass-with-capstan.html'),

-- Maxwell
(gen_random_uuid(), 'drain', 'windlass', 'Maxwell', 'RC6', NULL, true,
 'Maxwell RC6',
 '{"wattsTypical": 500, "wattsMin": 350, "wattsMax": 600, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/'),

(gen_random_uuid(), 'drain', 'windlass', 'Maxwell', 'RC8', NULL, true,
 'Maxwell RC8',
 '{"wattsTypical": 600, "wattsMin": 400, "wattsMax": 800, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/'),

(gen_random_uuid(), 'drain', 'windlass', 'Maxwell', 'HRC10', NULL, true,
 'Maxwell HRC10',
 '{"wattsTypical": 1000, "wattsMin": 700, "wattsMax": 1200, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/'),

-- Lofrans
(gen_random_uuid(), 'drain', 'windlass', 'Lofrans', 'Tigres', NULL, true,
 'Lofrans Tigres',
 '{"wattsTypical": 1500, "wattsMin": 1100, "wattsMax": 1800, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lofrans.com/product/71-horizontal-windlasses/5017-tigres'),

(gen_random_uuid(), 'drain', 'windlass', 'Lofrans', 'Kobra', NULL, true,
 'Lofrans Kobra',
 '{"wattsTypical": 1000, "wattsMin": 700, "wattsMax": 1200, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lofrans.com/products/windlasses/kobra-horizontal-windlass'),

-- Generic windlass
(gen_random_uuid(), 'drain', 'windlass', NULL, NULL, NULL, true,
 'Generic Windlass (12V)',
 '{"wattsTypical": 700, "wattsMin": 400, "wattsMax": 1200, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.05, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- AIS
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'ais', 'Vesper', 'Cortex M1', NULL, true,
 'Vesper Cortex M1',
 '{"wattsTypical": 6, "wattsMin": 3, "wattsMax": 8, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://panbo.com/testing-vesper-cortex-m1-excellent-ais-monitoring-and-much-more-in-one-box/'),

(gen_random_uuid(), 'drain', 'ais', 'Vesper', 'Cortex H1', NULL, true,
 'Vesper Cortex H1 (w/ M1 Hub)',
 '{"wattsTypical": 7, "wattsMin": 3, "wattsMax": 10, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.landfallnavigation.com/vesper-ais-cortex-v1-transponder.html'),

(gen_random_uuid(), 'drain', 'ais', 'Raymarine', 'AIS700', NULL, true,
 'Raymarine AIS700',
 '{"wattsTypical": 3, "wattsMin": 2, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/ais/ais-receivers-and-transceivers/ais700-class-b-transceiver'),

(gen_random_uuid(), 'drain', 'ais', 'em-trak', 'B360', NULL, true,
 'em-trak B360',
 '{"wattsTypical": 3, "wattsMin": 1.5, "wattsMax": 7, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://em-trak.com/products/'),

(gen_random_uuid(), 'drain', 'ais', 'em-trak', 'B100', NULL, true,
 'em-trak B100',
 '{"wattsTypical": 2, "wattsMin": 1, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://em-trak.com/wp-content/uploads/B100-user-manual-EN.pdf'),

(gen_random_uuid(), 'drain', 'ais', 'Digital Yacht', 'AIT5000', NULL, true,
 'Digital Yacht AIT5000',
 '{"wattsTypical": 3, "wattsMin": 1.5, "wattsMax": 7, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://digitalyacht.co.uk/product/ait5000-ais-transponder-5w/'),

-- Generic AIS
(gen_random_uuid(), 'drain', 'ais', NULL, NULL, NULL, true,
 'Generic AIS Transponder',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 7, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Lighting
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'lighting', 'Hella Marine', 'NaviLED Pro', NULL, true,
 'Hella Marine NaviLED Pro',
 '{"wattsTypical": 2, "wattsMin": 1.5, "wattsMax": 2.5, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.hellamarine.com/shop/navigation-lights/'),

(gen_random_uuid(), 'drain', 'lighting', 'Lopolight', 'Series 301', NULL, true,
 'Lopolight Series 301',
 '{"wattsTypical": 2, "wattsMin": 1.3, "wattsMax": 2.8, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lopolight.com/'),

(gen_random_uuid(), 'drain', 'lighting', 'Aqua Signal', 'Series 34', NULL, true,
 'Aqua Signal Series 34',
 '{"wattsTypical": 1.5, "wattsMin": 1, "wattsMax": 2, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.westmarine.com/aqua-signal-series-34-mast-mount-led-tri-color-anchor-navigation-light-14146880.html'),

-- Generic lighting
(gen_random_uuid(), 'drain', 'lighting', NULL, NULL, NULL, true,
 'Generic LED Cabin Lights (all)',
 '{"wattsTypical": 20, "wattsMin": 10, "wattsMax": 40, "hoursPerDayAnchor": 5, "hoursPerDayPassage": 4, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'lighting', NULL, NULL, NULL, true,
 'Generic LED Navigation Lights (full set)',
 '{"wattsTypical": 6, "wattsMin": 4, "wattsMax": 10, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Water Systems
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'water_system', 'Jabsco', 'Par-Max 3.0', NULL, true,
 'Jabsco Par-Max 3.0',
 '{"wattsTypical": 48, "wattsMin": 36, "wattsMax": 60, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.xylem.com/siteassets/brand/jabsco/resources/manual/user-guide-par-max-3.pdf'),

(gen_random_uuid(), 'drain', 'water_system', 'Jabsco', 'Par-Max 4.0', NULL, true,
 'Jabsco Par-Max 4.0',
 '{"wattsTypical": 60, "wattsMin": 48, "wattsMax": 72, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.xylem.com/siteassets/brand/jabsco/resources/manual/user-guide-par-max-3.pdf'),

(gen_random_uuid(), 'drain', 'water_system', 'Whale', 'Gulper 320', NULL, true,
 'Whale Gulper 320',
 '{"wattsTypical": 36, "wattsMin": 24, "wattsMax": 48, "hoursPerDayAnchor": 0.3, "hoursPerDayPassage": 0.2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'water_system', 'Shurflo', '4048', NULL, true,
 'Shurflo 4048',
 '{"wattsTypical": 60, "wattsMin": 48, "wattsMax": 84, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

-- Generic water systems
(gen_random_uuid(), 'drain', 'water_system', NULL, NULL, NULL, true,
 'Generic Freshwater Pump',
 '{"wattsTypical": 48, "wattsMin": 24, "wattsMax": 72, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'water_system', NULL, NULL, NULL, true,
 'Generic Electric Marine Toilet',
 '{"wattsTypical": 144, "wattsMin": 96, "wattsMax": 240, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Comfort Appliances
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'comfort', NULL, NULL, NULL, true,
 'Generic 12V Fan',
 '{"wattsTypical": 12, "wattsMin": 6, "wattsMax": 24, "hoursPerDayAnchor": 6, "hoursPerDayPassage": 4, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Microwave (AC)',
 '{"wattsTypical": 1000, "wattsMin": 700, "wattsMax": 1200, "hoursPerDayAnchor": 0.15, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": false, "powerType": "ac"}',
 NULL),

(gen_random_uuid(), 'drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Coffee Maker (AC)',
 '{"wattsTypical": 900, "wattsMin": 600, "wattsMax": 1200, "hoursPerDayAnchor": 0.2, "hoursPerDayPassage": 0.15, "dutyCycle": 1.0, "crewScaling": false, "powerType": "ac"}',
 NULL),

(gen_random_uuid(), 'drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Electric Kettle (AC)',
 '{"wattsTypical": 1500, "wattsMin": 1000, "wattsMax": 2000, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": false, "powerType": "ac"}',
 NULL),

(gen_random_uuid(), 'drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Cabin Heater (AC)',
 '{"wattsTypical": 1500, "wattsMin": 750, "wattsMax": 2000, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 4, "dutyCycle": 0.5, "crewScaling": false, "powerType": "ac"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Communication
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'communication', 'Icom', 'IC-M510', NULL, true,
 'Icom IC-M510',
 '{"wattsTypical": 6, "wattsMin": 1, "wattsMax": 60, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 24, "dutyCycle": 0.1, "crewScaling": false, "powerType": "dc"}',
 'https://www.icomamerica.com/lineup/products/IC-M510/'),

(gen_random_uuid(), 'drain', 'communication', 'Icom', 'IC-M605', NULL, true,
 'Icom IC-M605',
 '{"wattsTypical": 7, "wattsMin": 1.5, "wattsMax": 70, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 24, "dutyCycle": 0.1, "crewScaling": false, "powerType": "dc"}',
 'https://www.icomamerica.com/lineup/products/IC-M605/'),

(gen_random_uuid(), 'drain', 'communication', 'Standard Horizon', 'GX6000', NULL, true,
 'Standard Horizon GX6000',
 '{"wattsTypical": 5, "wattsMin": 1, "wattsMax": 55, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 24, "dutyCycle": 0.1, "crewScaling": false, "powerType": "dc"}',
 'https://standardhorizon.com/product-detail.aspx?Model=GX6000'),

(gen_random_uuid(), 'drain', 'communication', 'Starlink', 'Maritime', NULL, true,
 'Starlink Maritime',
 '{"wattsTypical": 75, "wattsMin": 40, "wattsMax": 110, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://starlink.com/specifications'),

(gen_random_uuid(), 'drain', 'communication', 'Iridium', 'GO! exec', NULL, true,
 'Iridium GO! exec',
 '{"wattsTypical": 10, "wattsMin": 5, "wattsMax": 15, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.iridium.com/products/iridium-go-exec/'),

-- Generic communication
(gen_random_uuid(), 'drain', 'communication', NULL, NULL, NULL, true,
 'Generic VHF Radio',
 '{"wattsTypical": 5, "wattsMin": 1, "wattsMax": 55, "hoursPerDayAnchor": 10, "hoursPerDayPassage": 24, "dutyCycle": 0.1, "crewScaling": false, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'communication', NULL, NULL, NULL, true,
 'Generic SSB/HF Radio',
 '{"wattsTypical": 30, "wattsMin": 5, "wattsMax": 150, "hoursPerDayAnchor": 1, "hoursPerDayPassage": 2, "dutyCycle": 0.3, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Sailing & Safety
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'drain', 'sailing_safety', NULL, NULL, NULL, true,
 'Generic Electric Windlass',
 '{"wattsTypical": 700, "wattsMin": 400, "wattsMax": 1500, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.02, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'sailing_safety', NULL, NULL, NULL, true,
 'Generic Bilge Pump (auto)',
 '{"wattsTypical": 36, "wattsMin": 12, "wattsMax": 60, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.5, "dutyCycle": 0.1, "crewScaling": false, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'sailing_safety', NULL, NULL, NULL, true,
 'Generic Wind Instruments',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 5, "hoursPerDayAnchor": 8, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

(gen_random_uuid(), 'drain', 'sailing_safety', NULL, NULL, NULL, true,
 'Generic Bow Thruster',
 '{"wattsTypical": 2400, "wattsMin": 1200, "wattsMax": 3600, "hoursPerDayAnchor": 0.02, "hoursPerDayPassage": 0.01, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);


-- =============================================================================
-- CHARGE SOURCES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Solar Panels
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Victron BlueSolar
(gen_random_uuid(), 'charge', 'solar', 'Victron', 'BlueSolar 175W Mono', NULL, true,
 'Victron BlueSolar 175W Mono',
 '{"sourceType": "solar", "panelWatts": 175, "panelType": "rigid"}',
 'https://www.victronenergy.com/solar-pv-panels/bluesolar-panels'),

(gen_random_uuid(), 'charge', 'solar', 'Victron', 'BlueSolar 305W Mono', NULL, true,
 'Victron BlueSolar 305W Mono',
 '{"sourceType": "solar", "panelWatts": 305, "panelType": "rigid"}',
 'https://www.victronenergy.com/solar-pv-panels/bluesolar-panels'),

-- Renogy
(gen_random_uuid(), 'charge', 'solar', 'Renogy', '100W Mono', NULL, true,
 'Renogy 100W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "rigid"}',
 'https://www.renogy.com/products/renogy-n-type-solar-panel'),

(gen_random_uuid(), 'charge', 'solar', 'Renogy', '200W Mono', NULL, true,
 'Renogy 200W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "rigid"}',
 'https://www.renogy.com/products/renogy-n-type-solar-panel'),

(gen_random_uuid(), 'charge', 'solar', 'Renogy', '320W Mono', NULL, true,
 'Renogy 320W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 320, "panelType": "rigid"}',
 'https://www.renogy.com/320-watt-monocrystalline-solar-panel/'),

-- SunPower flexible
(gen_random_uuid(), 'charge', 'solar', 'SunPower', '170W Flex', NULL, true,
 'SunPower 170W Flexible',
 '{"sourceType": "solar", "panelWatts": 170, "panelType": "flexible"}',
 'https://www.sunpoweredyachts.com/'),

(gen_random_uuid(), 'charge', 'solar', 'SunPower', '110W Flex', NULL, true,
 'SunPower 110W Flexible',
 '{"sourceType": "solar", "panelWatts": 110, "panelType": "flexible"}',
 'https://www.sunpoweredyachts.com/'),

-- Rich Solar
(gen_random_uuid(), 'charge', 'solar', 'Rich Solar', '200W Mono', NULL, true,
 'Rich Solar 200W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "rigid"}',
 NULL),

(gen_random_uuid(), 'charge', 'solar', 'Rich Solar', '400W Mono', NULL, true,
 'Rich Solar 400W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 400, "panelType": "rigid"}',
 NULL),

-- BougeRV
(gen_random_uuid(), 'charge', 'solar', 'BougeRV', '200W Flex', NULL, true,
 'BougeRV 200W Flexible',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "flexible"}',
 NULL),

(gen_random_uuid(), 'charge', 'solar', 'BougeRV', '100W Rigid', NULL, true,
 'BougeRV 100W Rigid',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "rigid"}',
 NULL),

-- Generic solar panels
(gen_random_uuid(), 'charge', 'solar', NULL, NULL, NULL, true,
 'Generic 100W Rigid Solar Panel',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "rigid"}',
 NULL),

(gen_random_uuid(), 'charge', 'solar', NULL, NULL, NULL, true,
 'Generic 200W Rigid Solar Panel',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "rigid"}',
 NULL),

(gen_random_uuid(), 'charge', 'solar', NULL, NULL, NULL, true,
 'Generic 300W Rigid Solar Panel',
 '{"sourceType": "solar", "panelWatts": 300, "panelType": "rigid"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Alternators
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'charge', 'alternator', 'Balmar', 'AT-SF-200-12', NULL, true,
 'Balmar AT-SF-200-12',
 '{"sourceType": "alternator", "alternatorAmps": 200, "motoringHoursPerDay": 2}',
 'https://balmar.net/application/marine/alternators-charging-kits/xt-series/'),

(gen_random_uuid(), 'charge', 'alternator', 'Balmar', 'XT-250-12', NULL, true,
 'Balmar XT-250-12',
 '{"sourceType": "alternator", "alternatorAmps": 250, "motoringHoursPerDay": 2}',
 'https://balmar.net/application/marine/alternators-charging-kits/xt-series/'),

(gen_random_uuid(), 'charge', 'alternator', 'Mastervolt', 'Alpha 12/130', NULL, true,
 'Mastervolt Alpha 12/130',
 '{"sourceType": "alternator", "alternatorAmps": 130, "motoringHoursPerDay": 2}',
 'https://www.mastervolt.com/products/alternators-12v/alpha-12-130-iii/'),

(gen_random_uuid(), 'charge', 'alternator', 'Mastervolt', 'Alpha 24/75', NULL, true,
 'Mastervolt Alpha 24/75',
 '{"sourceType": "alternator", "alternatorAmps": 75, "motoringHoursPerDay": 2}',
 'https://www.mastervolt.com/'),

(gen_random_uuid(), 'charge', 'alternator', 'Electromaax', '80A', NULL, true,
 'Electromaax 80A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 80, "motoringHoursPerDay": 2}',
 NULL),

(gen_random_uuid(), 'charge', 'alternator', 'Electromaax', '120A', NULL, true,
 'Electromaax 120A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 120, "motoringHoursPerDay": 2}',
 NULL),

-- Generic alternators
(gen_random_uuid(), 'charge', 'alternator', NULL, NULL, NULL, true,
 'Generic 50A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 50, "motoringHoursPerDay": 2}',
 NULL),

(gen_random_uuid(), 'charge', 'alternator', NULL, NULL, NULL, true,
 'Generic 80A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 80, "motoringHoursPerDay": 2}',
 NULL),

(gen_random_uuid(), 'charge', 'alternator', NULL, NULL, NULL, true,
 'Generic 120A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 120, "motoringHoursPerDay": 2}',
 NULL);

-- -----------------------------------------------------------------------------
-- Shore Chargers
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

(gen_random_uuid(), 'charge', 'shore_charger', 'Victron', 'Blue Smart IP22 30A', NULL, true,
 'Victron Blue Smart IP22 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://www.victronenergy.com/chargers/blue-smart-ip22-charger'),

(gen_random_uuid(), 'charge', 'shore_charger', 'Victron', 'Centaur 12/50', NULL, true,
 'Victron Centaur 12/50',
 '{"sourceType": "shore", "shoreChargerAmps": 50, "shoreHoursPerDay": 8}',
 'https://www.victronenergy.com/chargers'),

(gen_random_uuid(), 'charge', 'shore_charger', 'Mastervolt', 'ChargeMaster 25A', NULL, true,
 'Mastervolt ChargeMaster 25A',
 '{"sourceType": "shore", "shoreChargerAmps": 25, "shoreHoursPerDay": 8}',
 'https://www.mastervolt.com/products/chargemaster-plus/'),

(gen_random_uuid(), 'charge', 'shore_charger', 'Mastervolt', 'ChargeMaster 50A', NULL, true,
 'Mastervolt ChargeMaster 50A',
 '{"sourceType": "shore", "shoreChargerAmps": 50, "shoreHoursPerDay": 8}',
 'https://www.mastervolt.com/products/chargemaster-plus/'),

(gen_random_uuid(), 'charge', 'shore_charger', 'Sterling', 'Pro Charge Ultra 30A', NULL, true,
 'Sterling Pro Charge Ultra 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://sterling-power.com/products/pro-charge-ultra'),

(gen_random_uuid(), 'charge', 'shore_charger', 'Sterling', 'Pro Charge Ultra 60A', NULL, true,
 'Sterling Pro Charge Ultra 60A',
 '{"sourceType": "shore", "shoreChargerAmps": 60, "shoreHoursPerDay": 8}',
 'https://sterling-power.com/products/pro-charge-ultra'),

(gen_random_uuid(), 'charge', 'shore_charger', 'ProMariner', 'ProNautic P 30A', NULL, true,
 'ProMariner ProNautic P 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://www.fisheriessupply.com/pro-mariner-pronautic-p-series-digital-chargers/63130'),

(gen_random_uuid(), 'charge', 'shore_charger', 'ProMariner', 'ProNautic P 60A', NULL, true,
 'ProMariner ProNautic P 60A',
 '{"sourceType": "shore", "shoreChargerAmps": 60, "shoreHoursPerDay": 8}',
 'https://www.hodgesmarine.com/prm63160-promariner-pronautic-1260p-60-amp-3-bank-battery-c.html'),

-- Generic shore chargers
(gen_random_uuid(), 'charge', 'shore_charger', NULL, NULL, NULL, true,
 'Generic Shore Charger 15A',
 '{"sourceType": "shore", "shoreChargerAmps": 15, "shoreHoursPerDay": 8}',
 NULL),

(gen_random_uuid(), 'charge', 'shore_charger', NULL, NULL, NULL, true,
 'Generic Shore Charger 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 NULL);


-- =============================================================================
-- STORAGE (batteries)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LiFePO4 Batteries
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Victron Smart LiFePO4
(gen_random_uuid(), 'store', 'lifepo4', 'Victron', 'Smart LiFePO4 100Ah', NULL, true,
 'Victron Smart LiFePO4 12.8V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

(gen_random_uuid(), 'store', 'lifepo4', 'Victron', 'Smart LiFePO4 200Ah', NULL, true,
 'Victron Smart LiFePO4 12.8V 200Ah',
 '{"chemistry": "lifepo4", "capacityAh": 200}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

(gen_random_uuid(), 'store', 'lifepo4', 'Victron', 'Smart LiFePO4 330Ah', NULL, true,
 'Victron Smart LiFePO4 12.8V 330Ah',
 '{"chemistry": "lifepo4", "capacityAh": 330}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

-- Battle Born
(gen_random_uuid(), 'store', 'lifepo4', 'Battle Born', 'BB10012 100Ah', NULL, true,
 'Battle Born BB10012 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://battlebornbatteries.com/wp-content/uploads/2022/11/BB10012-Standard-Datasheet_V1-12.26.2024-compressed.pdf'),

(gen_random_uuid(), 'store', 'lifepo4', 'Battle Born', 'BB27012 270Ah', NULL, true,
 'Battle Born BB27012 12V 270Ah',
 '{"chemistry": "lifepo4", "capacityAh": 270}',
 'https://battlebornbatteries.com/'),

-- RELiON
(gen_random_uuid(), 'store', 'lifepo4', 'RELiON', 'RB100 100Ah', NULL, true,
 'RELiON RB100 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.relionbattery.com/products/lithium/rb100'),

(gen_random_uuid(), 'store', 'lifepo4', 'RELiON', 'RB300 300Ah', NULL, true,
 'RELiON RB300 12V 300Ah',
 '{"chemistry": "lifepo4", "capacityAh": 300}',
 'https://www.amazon.com/RELiON-RB300-Lithium-LiFePO4-12-8V-Terminal/dp/B0BMV15Q93'),

-- Lithionics
(gen_random_uuid(), 'store', 'lifepo4', 'Lithionics', '12V 320Ah', NULL, true,
 'Lithionics 12V 320Ah',
 '{"chemistry": "lifepo4", "capacityAh": 320}',
 'https://lithionics.com/product/lithionics-12v-320ah-lithium-ion-battery/'),

-- SOK
(gen_random_uuid(), 'store', 'lifepo4', 'SOK', '100Ah 12V', NULL, true,
 'SOK 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://us.sokbattery.com/'),

(gen_random_uuid(), 'store', 'lifepo4', 'SOK', '206Ah 12V', NULL, true,
 'SOK 12V 206Ah',
 '{"chemistry": "lifepo4", "capacityAh": 206}',
 'https://us.sokbattery.com/product-page/sok-12v-206ah-lifepo4-battery-bluetooth-built-in-heater'),

-- Epoch
(gen_random_uuid(), 'store', 'lifepo4', 'Epoch', '12V 100Ah', NULL, true,
 'Epoch 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.epochbatteries.com/'),

(gen_random_uuid(), 'store', 'lifepo4', 'Epoch', '12V 300Ah', NULL, true,
 'Epoch 12V 300Ah',
 '{"chemistry": "lifepo4", "capacityAh": 300}',
 'https://www.epochbatteries.com/products/12v-300ah-heated-bluetooth-lifepo4-battery-epoch-essentials'),

-- Generic LiFePO4
(gen_random_uuid(), 'store', 'lifepo4', NULL, NULL, NULL, true,
 'Generic LiFePO4 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 NULL),

(gen_random_uuid(), 'store', 'lifepo4', NULL, NULL, NULL, true,
 'Generic LiFePO4 12V 200Ah',
 '{"chemistry": "lifepo4", "capacityAh": 200}',
 NULL);

-- -----------------------------------------------------------------------------
-- AGM Batteries
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (id, type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Lifeline
(gen_random_uuid(), 'store', 'agm', 'Lifeline', 'GPL-27T 100Ah', NULL, true,
 'Lifeline GPL-27T 12V 100Ah',
 '{"chemistry": "agm", "capacityAh": 100}',
 'https://lifelinebatteries.com/'),

(gen_random_uuid(), 'store', 'agm', 'Lifeline', 'GPL-4DL 210Ah', NULL, true,
 'Lifeline GPL-4DL 12V 210Ah',
 '{"chemistry": "agm", "capacityAh": 210}',
 'https://batteryguys.com/products/lifeline-gpl-4dl'),

(gen_random_uuid(), 'store', 'agm', 'Lifeline', 'GPL-8DL 255Ah', NULL, true,
 'Lifeline GPL-8DL 12V 255Ah',
 '{"chemistry": "agm", "capacityAh": 255}',
 'https://lifelinebatteries.com/products/marine-batteries/gpl-8dl/'),

-- Rolls/Surrette (6V batteries, listed by single-battery Ah at 6V; users pair in series)
(gen_random_uuid(), 'store', 'agm', 'Rolls/Surrette', 'S-460 230Ah', NULL, true,
 'Rolls/Surrette S-460 6V 230Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 230}',
 'https://www.solaris-shop.com/surrette-rolls-s-460agm-6vdc-415ah-agm-battery/'),

(gen_random_uuid(), 'store', 'agm', 'Rolls/Surrette', 'S-530 264Ah', NULL, true,
 'Rolls/Surrette S-530 6V 264Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 264}',
 NULL),

-- Trojan
(gen_random_uuid(), 'store', 'agm', 'Trojan', 'T-105 225Ah', NULL, true,
 'Trojan T-105 6V 225Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 225}',
 'https://batteryguys.com/products/trojan-t-105'),

(gen_random_uuid(), 'store', 'agm', 'Trojan', '8D-AGM 230Ah', NULL, true,
 'Trojan 8D-AGM 12V 230Ah',
 '{"chemistry": "agm", "capacityAh": 230}',
 'https://a1solarstore.com/trojan-8d-agm-dual-terminal-230ah-12v-dual-purpose-agm-battery-for-marine-rv-and-industrial.html'),

-- Firefly
(gen_random_uuid(), 'store', 'agm', 'Firefly', 'Group 31 116Ah', NULL, true,
 'Firefly Oasis Group 31 12V 116Ah',
 '{"chemistry": "agm", "capacityAh": 116}',
 'https://www.emarineinc.com/Firefly-Oasis-12V-Group-31-Battery'),

-- Generic AGM
(gen_random_uuid(), 'store', 'agm', NULL, NULL, NULL, true,
 'Generic AGM 12V 100Ah',
 '{"chemistry": "agm", "capacityAh": 100}',
 NULL),

(gen_random_uuid(), 'store', 'agm', NULL, NULL, NULL, true,
 'Generic AGM 12V 200Ah',
 '{"chemistry": "agm", "capacityAh": 200}',
 NULL);


-- =============================================================================
-- Summary: ~155 products total
-- Drains:   ~105 items (watermakers, gensets, refrigeration, autopilots,
--           chartplotters, radar, windlasses, AIS, lighting, water systems,
--           comfort, communication, sailing/safety)
-- Charge:   ~25 items (solar, alternators, shore chargers)
-- Store:    ~25 items (LiFePO4, AGM)
-- =============================================================================
