-- =============================================================================
-- Equipment Catalog Seed Data
-- ~175 real marine products + ~20 generic defaults with researched specs.
-- Power consumption figures sourced from manufacturer datasheets and retailers.
-- Generated 2026-03-10.
-- =============================================================================

-- Truncate existing data (idempotent re-seeding)
TRUNCATE TABLE equipment_catalog;

-- =============================================================================
-- DRAINS (power consumers)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Watermakers
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Schenker Zen series (DC, patented Energy Recovery System)
('drain', 'watermaker', 'Schenker', 'Zen 30', 2024, true,
 'Schenker Zen 30',
 '{"wattsTypical": 110, "wattsMin": 100, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

('drain', 'watermaker', 'Schenker', 'Zen 50', 2024, true,
 'Schenker Zen 50',
 '{"wattsTypical": 240, "wattsMin": 220, "wattsMax": 260, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

('drain', 'watermaker', 'Schenker', 'Zen 100', 2024, true,
 'Schenker Zen 100',
 '{"wattsTypical": 400, "wattsMin": 380, "wattsMax": 420, "hoursPerDayAnchor": 1.5, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/zen/'),

-- Schenker Smart series
('drain', 'watermaker', 'Schenker', 'Smart 30', 2024, true,
 'Schenker Smart 30',
 '{"wattsTypical": 110, "wattsMin": 100, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/smart/'),

('drain', 'watermaker', 'Schenker', 'Smart 60', 2024, true,
 'Schenker Smart 60',
 '{"wattsTypical": 240, "wattsMin": 220, "wattsMax": 260, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://schenkerwatermakers.com/products/smart/'),

-- Spectra watermakers
('drain', 'watermaker', 'Spectra', 'Ventura 150T', 2024, true,
 'Spectra Ventura 150T',
 '{"wattsTypical": 108, "wattsMin": 96, "wattsMax": 120, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://spectrawatermakers.com/products/ventura-150c-vt-150c-12v'),

('drain', 'watermaker', 'Spectra', 'Ventura 200T', 2024, true,
 'Spectra Ventura 200T',
 '{"wattsTypical": 120, "wattsMin": 108, "wattsMax": 140, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://seatechmarineproducts.com/spectra-ventura-200t-tropical-12v-24vdc-8-3gph-marine-watermaker-vt200t.html'),

('drain', 'watermaker', 'Spectra', 'Newport 400', 2024, true,
 'Spectra Newport 400',
 '{"wattsTypical": 256, "wattsMin": 230, "wattsMax": 280, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.spectrawatermakers.com/us/us/11131-newport-400c'),

-- Katadyn PowerSurvivor
('drain', 'watermaker', 'Katadyn', 'PowerSurvivor 40E', 2024, true,
 'Katadyn PowerSurvivor 40E',
 '{"wattsTypical": 48, "wattsMin": 42, "wattsMax": 54, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.katadyngroup.com/us/en/8013438-Katadyn-PowerSurvivor-40E~p6702'),

('drain', 'watermaker', 'Katadyn', 'PowerSurvivor 80E', 2024, true,
 'Katadyn PowerSurvivor 80E',
 '{"wattsTypical": 96, "wattsMin": 84, "wattsMax": 108, "hoursPerDayAnchor": 2.5, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.westmarine.com/buy/katadyn--powersurvivor-80e-watermaker--10676120'),

-- Rainman watermakers
('drain', 'watermaker', 'Rainman', 'Compact (12V DC)', 2024, true,
 'Rainman Compact 12V DC',
 '{"wattsTypical": 410, "wattsMin": 380, "wattsMax": 440, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.rainmandesal.com/dc-electric-watermaker/'),

('drain', 'watermaker', 'Rainman', 'Petrol Portable', 2024, true,
 'Rainman Petrol Portable',
 '{"wattsTypical": 1250, "wattsMin": 1100, "wattsMax": 1400, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://www.rainmandesal.com/ac-electric-watermaker/'),

-- Village Marine
('drain', 'watermaker', 'Village Marine', 'LTM-500', 2024, true,
 'Village Marine LTM-500',
 '{"wattsTypical": 750, "wattsMin": 680, "wattsMax": 820, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 1.5, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://citimarinestore.com/en/village-marine-ltm-series-watermaker/1510-ltm-500-21-gph-500-gpd.html'),

('drain', 'watermaker', 'Village Marine', 'LTM-800', 2024, true,
 'Village Marine LTM-800',
 '{"wattsTypical": 1100, "wattsMin": 1000, "wattsMax": 1200, "hoursPerDayAnchor": 1.5, "hoursPerDayPassage": 1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 'https://citimarinestore.com/en/village-marine-ltm-series-watermaker/1514-ltm-800-220v-90-6050.html'),

-- Generic watermaker
('drain', 'watermaker', NULL, NULL, NULL, true,
 'Generic Watermaker (DC)',
 '{"wattsTypical": 150, "wattsMin": 48, "wattsMax": 400, "hoursPerDayAnchor": 2, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Gensets (generators) — modeled as drains for own parasitic/control power draw
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Fischer Panda iSeries (variable speed inverter gensets; parasitic draw is controls + cooling)
('drain', 'genset', 'Fischer Panda', 'iSeries 5000i', 2024, true,
 'Fischer Panda iSeries 5000i',
 '{"wattsTypical": 150, "wattsMin": 100, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/5000-generator/'),

('drain', 'genset', 'Fischer Panda', 'iSeries 8000i', 2024, true,
 'Fischer Panda iSeries 8000i',
 '{"wattsTypical": 200, "wattsMin": 140, "wattsMax": 260, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/ac-8-mini-generator/'),

('drain', 'genset', 'Fischer Panda', 'iSeries 15000i', 2024, true,
 'Fischer Panda iSeries 15000i',
 '{"wattsTypical": 300, "wattsMin": 200, "wattsMax": 400, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/'),

('drain', 'genset', 'Fischer Panda', 'AGT 4000', 2024, true,
 'Fischer Panda AGT 4000',
 '{"wattsTypical": 120, "wattsMin": 80, "wattsMax": 160, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://fischerpanda.com/marine/'),

-- Paguro generators (VTE)
('drain', 'genset', 'Paguro', '2000', 2024, true,
 'Paguro 2000',
 '{"wattsTypical": 80, "wattsMin": 60, "wattsMax": 100, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/307-vte-paguro-marine-generators'),

('drain', 'genset', 'Paguro', '4000', 2024, true,
 'Paguro 4000',
 '{"wattsTypical": 120, "wattsMin": 90, "wattsMax": 150, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.mastry.com/PAGURO-4000'),

('drain', 'genset', 'Paguro', '6000', 2024, true,
 'Paguro 6000',
 '{"wattsTypical": 160, "wattsMin": 120, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/vte-paguro-marine-generators/7018-vte-paguro-6000-55-kw-3600-rpm-marine-generator.html'),

('drain', 'genset', 'Paguro', '9000', 2024, true,
 'Paguro 9000',
 '{"wattsTypical": 220, "wattsMin": 170, "wattsMax": 280, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/vte-paguro-marine-generators/7019-vte-paguro-9000-8-kw-3600-rpm-marine-generator.html'),

-- WhisperPower Piccolo
('drain', 'genset', 'WhisperPower', 'Piccolo 5', 2024, true,
 'WhisperPower Piccolo 5',
 '{"wattsTypical": 100, "wattsMin": 70, "wattsMax": 140, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.whisperpower.com/diesel-generators/piccolo-generators/piccolo-5'),

('drain', 'genset', 'WhisperPower', 'Piccolo 8', 2024, true,
 'WhisperPower Piccolo 8',
 '{"wattsTypical": 150, "wattsMin": 100, "wattsMax": 200, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.whisperpower.com/diesel-generators/piccolo-generators/piccolo-8'),

-- Onan/Cummins QD
('drain', 'genset', 'Onan/Cummins', 'QD 3.5', 2024, true,
 'Onan/Cummins QD 3.5',
 '{"wattsTypical": 80, "wattsMin": 60, "wattsMax": 100, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-generators'),

('drain', 'genset', 'Onan/Cummins', 'QD 5.0', 2024, true,
 'Onan/Cummins QD 5.0',
 '{"wattsTypical": 120, "wattsMin": 90, "wattsMax": 160, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-generators'),

('drain', 'genset', 'Onan/Cummins', 'QD 7.5', 2024, true,
 'Onan/Cummins QD 7.5',
 '{"wattsTypical": 180, "wattsMin": 140, "wattsMax": 240, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.cummins.com/generators/onan-marine-qd-6758-kw-generator'),

-- Generic genset
('drain', 'genset', NULL, NULL, NULL, true,
 'Generic Marine Genset',
 '{"wattsTypical": 140, "wattsMin": 80, "wattsMax": 300, "hoursPerDayAnchor": 3, "hoursPerDayPassage": 2, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Refrigeration
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Isotherm Cruise (12V compressor fridges, duty cycle ~35-45%)
('drain', 'refrigeration', 'Isotherm', 'Cruise 65', 2024, true,
 'Isotherm Cruise 65',
 '{"wattsTypical": 35, "wattsMin": 25, "wattsMax": 45, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://www.indelwebastomarine.com/us/service-downloads/faq/'),

('drain', 'refrigeration', 'Isotherm', 'Cruise 130', 2024, true,
 'Isotherm Cruise 130',
 '{"wattsTypical": 45, "wattsMin": 30, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://defender.com/en_us/isotherm-cruise-130-elegance-refrigerator-freezer'),

('drain', 'refrigeration', 'Isotherm', 'Cruise 200', 2024, true,
 'Isotherm Cruise 200',
 '{"wattsTypical": 55, "wattsMin": 40, "wattsMax": 72, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.45, "crewScaling": false, "powerType": "dc"}',
 'https://www.indelwebastomarine.com/us/'),

-- Vitrifrigo
('drain', 'refrigeration', 'Vitrifrigo', 'DP2600', 2024, true,
 'Vitrifrigo DP2600',
 '{"wattsTypical": 65, "wattsMin": 50, "wattsMax": 80, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://citimarinestore.com/en/vitrifrigo-marine-refrigerators-freezers/6177-vitrifrigo-dp2600-dp2600ibd4-f-2.html'),

('drain', 'refrigeration', 'Vitrifrigo', 'C115', 2024, true,
 'Vitrifrigo C115',
 '{"wattsTypical": 45, "wattsMin": 30, "wattsMax": 55, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.38, "crewScaling": false, "powerType": "dc"}',
 'https://yachtaidmarine.com/shop/marine-refrigerator/c115ibd4-f-1-marine-refrigerator-vitrifrigo-c115i-c115ia-classic/'),

-- Engel
('drain', 'refrigeration', 'Engel', 'MR040', 2024, true,
 'Engel MR040',
 '{"wattsTypical": 22, "wattsMin": 12, "wattsMax": 36, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://engelcoolers.com/products/mr40-overland-fridge'),

('drain', 'refrigeration', 'Engel', 'MT45', 2024, true,
 'Engel MT45',
 '{"wattsTypical": 26, "wattsMin": 14, "wattsMax": 42, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://engelcoolers.com/products/45-platinum-portable-car-fridge'),

-- Frigoboat
('drain', 'refrigeration', 'Frigoboat', 'Keel Cooler 50L', 2024, true,
 'Frigoboat Keel Cooler 50L',
 '{"wattsTypical": 35, "wattsMin": 25, "wattsMax": 50, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://coastalclimatecontrol.com/component/edocman/2-refrigeration/492-consumption-guide-for-frigoboat-12v-24v-keel-cooled-systems'),

-- Dometic CoolMatic
('drain', 'refrigeration', 'Dometic', 'CoolMatic CRX-50', 2024, true,
 'Dometic CoolMatic CRX-50',
 '{"wattsTypical": 40, "wattsMin": 28, "wattsMax": 50, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.35, "crewScaling": false, "powerType": "dc"}',
 'https://www.dometic.com/en-us/outdoor/boat/boat-refrigerators/dometic-coolmatic-crx-50'),

('drain', 'refrigeration', 'Dometic', 'CoolMatic CRX-110', 2024, true,
 'Dometic CoolMatic CRX-110',
 '{"wattsTypical": 72, "wattsMin": 50, "wattsMax": 85, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.dometic.com/en-us/outdoor/boat/boat-refrigerators/dometic-coolmatic-crx-110-131780'),

-- Generic fridge + freezer
('drain', 'refrigeration', NULL, NULL, NULL, true,
 'Generic Marine Fridge',
 '{"wattsTypical": 45, "wattsMin": 25, "wattsMax": 72, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.38, "crewScaling": false, "powerType": "dc"}',
 NULL),

('drain', 'refrigeration', NULL, NULL, NULL, true,
 'Generic Marine Freezer',
 '{"wattsTypical": 65, "wattsMin": 40, "wattsMax": 90, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 0.5, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Autopilots
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Raymarine Evolution (watts = amps * 12V; duty cycle ~30% calm, 50% rough)
('drain', 'autopilot', 'Raymarine', 'EV-100 Wheel', 2024, true,
 'Raymarine EV-100 Wheel',
 '{"wattsTypical": 36, "wattsMin": 12, "wattsMax": 84, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/autopilot-packs/ev-100-power-pilot'),

('drain', 'autopilot', 'Raymarine', 'EV-200 Sail', 2024, true,
 'Raymarine EV-200 Sail',
 '{"wattsTypical": 60, "wattsMin": 24, "wattsMax": 180, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/autopilot-packs/ev-200-power-pilot'),

('drain', 'autopilot', 'Raymarine', 'EV-400', 2024, true,
 'Raymarine EV-400',
 '{"wattsTypical": 120, "wattsMin": 48, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/boat-autopilots/'),

-- B&G (NAC-2: 8A continuous / NAC-3: 30A continuous at 12V)
('drain', 'autopilot', 'B&G', 'NAC-2', 2024, true,
 'B&G NAC-2',
 '{"wattsTypical": 40, "wattsMin": 12, "wattsMax": 96, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/autopilots/autopilot-computers/nac-2-autopilot-computer/'),

('drain', 'autopilot', 'B&G', 'NAC-3', 2024, true,
 'B&G NAC-3',
 '{"wattsTypical": 120, "wattsMin": 36, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/autopilots/autopilot-computers/nac-3-autopilot-computer/'),

-- Garmin
('drain', 'autopilot', 'Garmin', 'Reactor 40', 2024, true,
 'Garmin Reactor 40',
 '{"wattsTypical": 48, "wattsMin": 18, "wattsMax": 120, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/599938/'),

('drain', 'autopilot', 'Garmin', 'GHP 20', 2024, true,
 'Garmin GHP 20',
 '{"wattsTypical": 30, "wattsMin": 12, "wattsMax": 72, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/31301/'),

-- Simrad (same platform as B&G)
('drain', 'autopilot', 'Simrad', 'NAC-2', 2024, true,
 'Simrad NAC-2',
 '{"wattsTypical": 40, "wattsMin": 12, "wattsMax": 96, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/autopilots/nac-2/'),

('drain', 'autopilot', 'Simrad', 'NAC-3', 2024, true,
 'Simrad NAC-3',
 '{"wattsTypical": 120, "wattsMin": 36, "wattsMax": 360, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/autopilots/nac-3/'),

-- Generic autopilot
('drain', 'autopilot', NULL, NULL, NULL, true,
 'Generic Autopilot',
 '{"wattsTypical": 48, "wattsMin": 12, "wattsMax": 180, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 18, "dutyCycle": 0.4, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Chartplotters
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Raymarine Axiom2 (power scales ~linearly with screen size: 7"~15W, 9"~22W, 12"~30W)
('drain', 'chartplotter', 'Raymarine', 'Axiom2 7"', 2024, true,
 'Raymarine Axiom2 7"',
 '{"wattsTypical": 15, "wattsMin": 12, "wattsMax": 18, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s'),

('drain', 'chartplotter', 'Raymarine', 'Axiom2 9"', 2024, true,
 'Raymarine Axiom2 9"',
 '{"wattsTypical": 22, "wattsMin": 18, "wattsMax": 28, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-s'),

('drain', 'chartplotter', 'Raymarine', 'Axiom2 12"', 2024, true,
 'Raymarine Axiom2 12"',
 '{"wattsTypical": 30, "wattsMin": 24, "wattsMax": 38, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/chartplotters/axiom/axiom-2-pro-rvm'),

-- Garmin GPSMAP
('drain', 'chartplotter', 'Garmin', 'GPSMAP 723', 2024, true,
 'Garmin GPSMAP 723',
 '{"wattsTypical": 14, "wattsMin": 10, "wattsMax": 18, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/884366'),

('drain', 'chartplotter', 'Garmin', 'GPSMAP 923', 2024, true,
 'Garmin GPSMAP 923',
 '{"wattsTypical": 20, "wattsMin": 16, "wattsMax": 26, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/884367'),

('drain', 'chartplotter', 'Garmin', 'GPSMAP 1243', 2024, true,
 'Garmin GPSMAP 1243',
 '{"wattsTypical": 28, "wattsMin": 22, "wattsMax": 36, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.thegpsstore.com/Marine-Electronics/Chart-Plotters/Garmin-GPSMAP-1243-GN-Chartplotter'),

-- B&G Vulcan
('drain', 'chartplotter', 'B&G', 'Vulcan 7', 2024, true,
 'B&G Vulcan 7',
 '{"wattsTypical": 13, "wattsMin": 10, "wattsMax": 17, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/chartplotters/vulcan-7/'),

('drain', 'chartplotter', 'B&G', 'Vulcan 9', 2024, true,
 'B&G Vulcan 9',
 '{"wattsTypical": 19, "wattsMin": 15, "wattsMax": 24, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/chartplotters/vulcan-9/'),

('drain', 'chartplotter', 'B&G', 'Vulcan 12', 2024, true,
 'B&G Vulcan 12',
 '{"wattsTypical": 27, "wattsMin": 22, "wattsMax": 34, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.bandg.com/bg/type/chartplotters/vulcan-12/'),

-- Simrad NSX
('drain', 'chartplotter', 'Simrad', 'NSX 7', 2024, true,
 'Simrad NSX 7',
 '{"wattsTypical": 14, "wattsMin": 10, "wattsMax": 18, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/chartplotters/nsx-7/'),

('drain', 'chartplotter', 'Simrad', 'NSX 9', 2024, true,
 'Simrad NSX 9',
 '{"wattsTypical": 20, "wattsMin": 16, "wattsMax": 26, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/chartplotters/nsx-9/'),

('drain', 'chartplotter', 'Simrad', 'NSX 12', 2024, true,
 'Simrad NSX 12',
 '{"wattsTypical": 28, "wattsMin": 22, "wattsMax": 35, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/chartplotters/nsx-12/'),

-- Furuno NavNet TZtouch3
('drain', 'chartplotter', 'Furuno', 'NavNet TZT12F', 2024, true,
 'Furuno NavNet TZT12F',
 '{"wattsTypical": 28, "wattsMin": 22, "wattsMax": 36, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furunousa.com/en/products/tzt12f'),

('drain', 'chartplotter', 'Furuno', 'NavNet TZT16F', 2024, true,
 'Furuno NavNet TZT16F',
 '{"wattsTypical": 38, "wattsMin": 30, "wattsMax": 48, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furunousa.com/en/products/tzt16f'),

-- Generic chartplotter
('drain', 'chartplotter', NULL, NULL, NULL, true,
 'Generic Chartplotter (7-9")',
 '{"wattsTypical": 18, "wattsMin": 10, "wattsMax": 28, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 16, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Radar
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Raymarine Quantum 2 (17W transmit, 7W standby)
('drain', 'radar', 'Raymarine', 'Quantum 2', 2024, true,
 'Raymarine Quantum 2',
 '{"wattsTypical": 17, "wattsMin": 7, "wattsMax": 20, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/marine-radar/quantum/quantum-2-q24d-radome'),

-- Garmin GMR Fantom (33W normal, 24W power save, 4W standby)
('drain', 'radar', 'Garmin', 'GMR Fantom 18x', 2024, true,
 'Garmin GMR Fantom 18x',
 '{"wattsTypical": 33, "wattsMin": 4, "wattsMax": 33, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/714814/'),

('drain', 'radar', 'Garmin', 'GMR Fantom 24x', 2024, true,
 'Garmin GMR Fantom 24x',
 '{"wattsTypical": 33, "wattsMin": 4, "wattsMax": 33, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.garmin.com/en-US/p/714815/'),

-- Furuno DRS4D-NXT (25W solid-state doppler)
('drain', 'radar', 'Furuno', 'DRS4D-NXT', 2024, true,
 'Furuno DRS4D-NXT',
 '{"wattsTypical": 25, "wattsMin": 8, "wattsMax": 30, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.furuno.com/special/en/radar/drs4d-nxt/'),

-- Simrad HALO
('drain', 'radar', 'Simrad', 'HALO20+', 2024, true,
 'Simrad HALO20+',
 '{"wattsTypical": 20, "wattsMin": 6, "wattsMax": 25, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/radar/halo20simradradar/'),

('drain', 'radar', 'Simrad', 'HALO24', 2024, true,
 'Simrad HALO24',
 '{"wattsTypical": 25, "wattsMin": 6, "wattsMax": 30, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.simrad-yachting.com/simrad/type/radar/halo24simrad24radar/'),

-- Generic radar
('drain', 'radar', NULL, NULL, NULL, true,
 'Generic Radar (Dome)',
 '{"wattsTypical": 25, "wattsMin": 6, "wattsMax": 35, "hoursPerDayAnchor": 0, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Windlass
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Lewmar V-series (intermittent use: watts during operation, very low duty cycle)
('drain', 'windlass', 'Lewmar', 'V1', 2024, true,
 'Lewmar V1',
 '{"wattsTypical": 500, "wattsMin": 400, "wattsMax": 600, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

('drain', 'windlass', 'Lewmar', 'V2', 2024, true,
 'Lewmar V2',
 '{"wattsTypical": 700, "wattsMin": 550, "wattsMax": 850, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

('drain', 'windlass', 'Lewmar', 'V3', 2024, true,
 'Lewmar V3',
 '{"wattsTypical": 1000, "wattsMin": 800, "wattsMax": 1200, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lewmar.com/windlass-v1-v2-v3-series-kit'),

-- Quick (Aleph AL3 700W/1000W/1500W; Hector 700W)
('drain', 'windlass', 'Quick', 'Aleph AL3 700W', 2024, true,
 'Quick Aleph AL3 700W',
 '{"wattsTypical": 700, "wattsMin": 550, "wattsMax": 800, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.quickitaly.com/en/products/windlasses-and-capstans/vertical-windlasses/aleph-al3-al3p/'),

('drain', 'windlass', 'Quick', 'Hector 700W', 2024, true,
 'Quick Hector 700W',
 '{"wattsTypical": 700, "wattsMin": 550, "wattsMax": 800, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.svb24.com/en/quick-hector-windlass-with-capstan.html'),

-- Maxwell (RC6: 500W, RC8: 600-1000W, HRC10: 1200W)
('drain', 'windlass', 'Maxwell', 'RC6', 2024, true,
 'Maxwell RC6',
 '{"wattsTypical": 500, "wattsMin": 400, "wattsMax": 600, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/wp-content/uploads/2022/03/RC6-RC8-RC10-Product-information-R2.pdf'),

('drain', 'windlass', 'Maxwell', 'RC8', 2024, true,
 'Maxwell RC8',
 '{"wattsTypical": 1000, "wattsMin": 800, "wattsMax": 1200, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/wp-content/uploads/2022/03/RC6-RC8-RC10-Product-information-R2.pdf'),

('drain', 'windlass', 'Maxwell', 'HRC10', 2024, true,
 'Maxwell HRC10',
 '{"wattsTypical": 1200, "wattsMin": 1000, "wattsMax": 1500, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://maxwellmarine.com/'),

-- Lofrans (Tigres: 1500W, Kobra: 1000W)
('drain', 'windlass', 'Lofrans', 'Tigres', 2024, true,
 'Lofrans Tigres',
 '{"wattsTypical": 1500, "wattsMin": 1200, "wattsMax": 1800, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lofrans.com/product/71-horizontal-windlasses/5017-tigres'),

('drain', 'windlass', 'Lofrans', 'Kobra', 2024, true,
 'Lofrans Kobra',
 '{"wattsTypical": 1000, "wattsMin": 800, "wattsMax": 1200, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.lofrans.com/products/windlasses/kobra-horizontal-windlass'),

-- Generic windlass
('drain', 'windlass', NULL, NULL, NULL, true,
 'Generic Windlass',
 '{"wattsTypical": 800, "wattsMin": 400, "wattsMax": 1500, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- AIS
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Vesper Cortex (M1 hub: 6W nominal / H1 handset: 2.4W nominal)
('drain', 'ais', 'Vesper', 'Cortex M1', 2024, true,
 'Vesper Cortex M1',
 '{"wattsTypical": 6, "wattsMin": 3, "wattsMax": 72, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://panbo.com/testing-vesper-cortex-m1-excellent-ais-monitoring-and-much-more-in-one-box/'),

('drain', 'ais', 'Vesper', 'Cortex H1', 2024, true,
 'Vesper Cortex H1',
 '{"wattsTypical": 2.4, "wattsMin": 1.5, "wattsMax": 12, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.defender.com/product.jsp?id=6883617'),

-- Raymarine AIS700 (<3W continuous, 5W transmit)
('drain', 'ais', 'Raymarine', 'AIS700', 2024, true,
 'Raymarine AIS700',
 '{"wattsTypical": 3, "wattsMin": 2, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.raymarine.com/en-us/our-products/ais/ais-receivers-and-transceivers/ais700-class-b-transceiver'),

-- em-trak (B360: 5W SOTDMA; B100: 2W)
('drain', 'ais', 'em-trak', 'B360', 2024, true,
 'em-trak B360',
 '{"wattsTypical": 2, "wattsMin": 1, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://em-trak.com/products/'),

('drain', 'ais', 'em-trak', 'B100', 2024, true,
 'em-trak B100',
 '{"wattsTypical": 2, "wattsMin": 1, "wattsMax": 3, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://em-trak.com/products/'),

-- Digital Yacht AIT5000 (5W SOTDMA Class B+)
('drain', 'ais', 'Digital Yacht', 'AIT5000', 2024, true,
 'Digital Yacht AIT5000',
 '{"wattsTypical": 3, "wattsMin": 1.5, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://digitalyachtamerica.com/product/ait5000/'),

-- Generic AIS transponder
('drain', 'ais', NULL, NULL, NULL, true,
 'Generic AIS Transponder',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 5, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Lighting
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Hella Marine NaviLED Pro (<2W per light)
('drain', 'lighting', 'Hella Marine', 'NaviLED Pro', 2024, true,
 'Hella Marine NaviLED Pro',
 '{"wattsTypical": 2, "wattsMin": 1, "wattsMax": 3, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.hellamarine.com/shop/navigation-lights/'),

-- Lopolight Series 301 (~1.4W per light)
('drain', 'lighting', 'Lopolight', 'Series 301', 2024, true,
 'Lopolight Series 301',
 '{"wattsTypical": 1.4, "wattsMin": 1, "wattsMax": 2.8, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://lopolight.com/products/navigation-light-range/'),

-- Aqua Signal Series 34 (~1.5W per light)
('drain', 'lighting', 'Aqua Signal', 'Series 34', 2024, true,
 'Aqua Signal Series 34',
 '{"wattsTypical": 1.5, "wattsMin": 1, "wattsMax": 3.2, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.toplicht.com/hull-deck/navigation-lights/aqua-signal/aqua-signal-34-led-navigation-lights'),

-- Generic cabin LED (all cabin lights total)
('drain', 'lighting', NULL, NULL, NULL, true,
 'Generic Cabin LED Lighting',
 '{"wattsTypical": 20, "wattsMin": 10, "wattsMax": 40, "hoursPerDayAnchor": 6, "hoursPerDayPassage": 6, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

-- Generic nav lights (full set: port/stbd/stern/masthead/anchor)
('drain', 'lighting', NULL, NULL, NULL, true,
 'Generic Navigation Lights (Full Set)',
 '{"wattsTypical": 8, "wattsMin": 4, "wattsMax": 15, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 12, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Water Systems
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Jabsco Par-Max (3.0: ~42W @ 12V; 4.0: ~60W @ 12V)
('drain', 'water-systems', 'Jabsco', 'Par-Max 3.0', 2024, true,
 'Jabsco Par-Max 3.0',
 '{"wattsTypical": 42, "wattsMin": 36, "wattsMax": 60, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.xylem.com/siteassets/brand/jabsco/resources/technical-brochure/parmax-3-datasheet-31395-2512-3a.pdf'),

('drain', 'water-systems', 'Jabsco', 'Par-Max 4.0', 2024, true,
 'Jabsco Par-Max 4.0',
 '{"wattsTypical": 60, "wattsMin": 48, "wattsMax": 84, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.xylem.com/siteassets/brand/jabsco/resources/technical-brochure/q401j-112s-3a---parmax-hd4-datasheet.pdf'),

-- Whale Gulper 320 (7.5A @ 12V = 90W)
('drain', 'water-systems', 'Whale', 'Gulper 320', 2024, true,
 'Whale Gulper 320',
 '{"wattsTypical": 90, "wattsMin": 60, "wattsMax": 100, "hoursPerDayAnchor": 0.2, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://defender.com/en_us/whale-gulper-320-high-capacity-bilge-pump'),

-- Shurflo 4048 (~7A @ 12V = 84W)
('drain', 'water-systems', 'Shurflo', '4048', 2024, true,
 'Shurflo 4048',
 '{"wattsTypical": 84, "wattsMin": 48, "wattsMax": 96, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 'https://www.shurflo.com/'),

-- Generic water pump
('drain', 'water-systems', NULL, NULL, NULL, true,
 'Generic Water Pressure Pump',
 '{"wattsTypical": 60, "wattsMin": 36, "wattsMax": 96, "hoursPerDayAnchor": 0.5, "hoursPerDayPassage": 0.3, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

-- Generic electric toilet
('drain', 'water-systems', NULL, NULL, NULL, true,
 'Generic Electric Toilet',
 '{"wattsTypical": 144, "wattsMin": 96, "wattsMax": 240, "hoursPerDayAnchor": 0.1, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Comfort
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

('drain', 'comfort', NULL, NULL, NULL, true,
 'Generic 12V Fan',
 '{"wattsTypical": 12, "wattsMin": 5, "wattsMax": 24, "hoursPerDayAnchor": 8, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": true, "powerType": "dc"}',
 NULL),

('drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Microwave (Inverter)',
 '{"wattsTypical": 1000, "wattsMin": 600, "wattsMax": 1200, "hoursPerDayAnchor": 0.15, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 NULL),

('drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Coffee Maker',
 '{"wattsTypical": 800, "wattsMin": 600, "wattsMax": 1000, "hoursPerDayAnchor": 0.15, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": true, "powerType": "ac"}',
 NULL),

('drain', 'comfort', NULL, NULL, NULL, true,
 'Generic Cabin Heater (Diesel)',
 '{"wattsTypical": 35, "wattsMin": 20, "wattsMax": 50, "hoursPerDayAnchor": 8, "hoursPerDayPassage": 8, "dutyCycle": 0.6, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Communication
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Icom VHF radios (IC-M510: 5A TX @ 12V = 60W TX, ~3W standby)
('drain', 'communication', 'Icom', 'IC-M510', 2024, true,
 'Icom IC-M510',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.icomamerica.com/lineup/products/IC-M510/'),

('drain', 'communication', 'Icom', 'IC-M605', 2024, true,
 'Icom IC-M605',
 '{"wattsTypical": 4, "wattsMin": 1, "wattsMax": 65, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.icomamerica.com/lineup/products/IC-M605/'),

-- Standard Horizon (25W TX, ~3W standby)
('drain', 'communication', 'Standard Horizon', 'GX6000', 2024, true,
 'Standard Horizon GX6000',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://standardhorizon.com/product-detail.aspx?Model=GX6000'),

-- Iridium GO! exec (15W active, 5W standby)
('drain', 'communication', 'Iridium', 'GO! exec', 2024, true,
 'Iridium GO! exec',
 '{"wattsTypical": 5, "wattsMin": 3, "wattsMax": 15, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 'https://www.iridium.com/products/iridium-go-exec/'),

-- Generic VHF
('drain', 'communication', NULL, NULL, NULL, true,
 'Generic VHF Radio',
 '{"wattsTypical": 3, "wattsMin": 1, "wattsMax": 60, "hoursPerDayAnchor": 24, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

-- Generic SSB
('drain', 'communication', NULL, NULL, NULL, true,
 'Generic SSB Radio',
 '{"wattsTypical": 5, "wattsMin": 2, "wattsMax": 150, "hoursPerDayAnchor": 4, "hoursPerDayPassage": 8, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Sailing (misc sailing-related drains)
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

('drain', 'sailing', NULL, NULL, NULL, true,
 'Generic Bilge Pump (Electric)',
 '{"wattsTypical": 36, "wattsMin": 24, "wattsMax": 60, "hoursPerDayAnchor": 0.05, "hoursPerDayPassage": 0.1, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

('drain', 'sailing', NULL, NULL, NULL, true,
 'Generic Wind Instruments (Masthead)',
 '{"wattsTypical": 1.5, "wattsMin": 0.5, "wattsMax": 3, "hoursPerDayAnchor": 12, "hoursPerDayPassage": 24, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL),

('drain', 'sailing', NULL, NULL, NULL, true,
 'Generic Bow Thruster',
 '{"wattsTypical": 2400, "wattsMin": 1500, "wattsMax": 3600, "hoursPerDayAnchor": 0.02, "hoursPerDayPassage": 0, "dutyCycle": 1.0, "crewScaling": false, "powerType": "dc"}',
 NULL);


-- =============================================================================
-- CHARGE SOURCES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Solar Panels
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Victron BlueSolar (monocrystalline rigid panels)
('charge', 'solar', 'Victron', 'BlueSolar 175W', 2024, true,
 'Victron BlueSolar 175W',
 '{"sourceType": "solar", "panelWatts": 175, "panelType": "mono"}',
 'https://www.victronenergy.com/upload/documents/Datasheet-BlueSolar-Monocrystalline-Panels-EN.pdf'),

('charge', 'solar', 'Victron', 'BlueSolar 215W', 2024, true,
 'Victron BlueSolar 215W',
 '{"sourceType": "solar", "panelWatts": 215, "panelType": "mono"}',
 'https://www.victronenergy.com/upload/documents/Datasheet-BlueSolar-Monocrystalline-Panels-EN.pdf'),

('charge', 'solar', 'Victron', 'BlueSolar 305W', 2024, true,
 'Victron BlueSolar 305W',
 '{"sourceType": "solar", "panelWatts": 305, "panelType": "mono"}',
 'https://www.victronenergy.com/upload/documents/Datasheet-BlueSolar-Monocrystalline-Panels-EN.pdf'),

-- Renogy (rigid monocrystalline)
('charge', 'solar', 'Renogy', '100W Mono', 2024, true,
 'Renogy 100W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "mono"}',
 'https://www.renogy.com/products/renogy-n-type-solar-panel'),

('charge', 'solar', 'Renogy', '200W Mono', 2024, true,
 'Renogy 200W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "mono"}',
 'https://richsolar.com/products/200-watt-solar-panel'),

('charge', 'solar', 'Renogy', '320W Mono', 2024, true,
 'Renogy 320W Monocrystalline',
 '{"sourceType": "solar", "panelWatts": 320, "panelType": "mono"}',
 'https://www.renogy.com/320-watt-monocrystalline-solar-panel/'),

-- SunPower (flexible, marine-grade)
('charge', 'solar', 'SunPower', '170W Flex', 2024, true,
 'SunPower 170W Flexible',
 '{"sourceType": "solar", "panelWatts": 170, "panelType": "flex"}',
 'https://www.sunpoweredyachts.com/'),

('charge', 'solar', 'SunPower', '110W Flex', 2024, true,
 'SunPower 110W Flexible',
 '{"sourceType": "solar", "panelWatts": 110, "panelType": "flex"}',
 'https://www.emarineinc.com/categories-SunPower-Solar-Flexible-Panels'),

-- Rich Solar
('charge', 'solar', 'Rich Solar', '200W Mono', 2024, true,
 'Rich Solar MEGA 200W',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "mono"}',
 'https://richsolar.com/products/200-watt-solar-panel'),

('charge', 'solar', 'Rich Solar', '400W Mono', 2024, true,
 'Rich Solar 400W Kit (2x200W)',
 '{"sourceType": "solar", "panelWatts": 400, "panelType": "mono"}',
 'https://richsolar.com/products/400-watt-solar-kit'),

-- BougeRV (CIGS flexible)
('charge', 'solar', 'BougeRV', '200W Flex', 2024, true,
 'BougeRV Yuma 200W Flex',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "flex"}',
 'https://www.bougerv.com/products/200w-flexible-solar-panel'),

('charge', 'solar', 'BougeRV', '100W Flex', 2024, true,
 'BougeRV Yuma 100W Flex',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "flex"}',
 'https://www.bougerv.com/products/100w-flexible-solar-panel'),

-- Generic solar panels
('charge', 'solar', NULL, NULL, NULL, true,
 'Generic Solar Panel 100W',
 '{"sourceType": "solar", "panelWatts": 100, "panelType": "mono"}',
 NULL),

('charge', 'solar', NULL, NULL, NULL, true,
 'Generic Solar Panel 200W',
 '{"sourceType": "solar", "panelWatts": 200, "panelType": "mono"}',
 NULL),

('charge', 'solar', NULL, NULL, NULL, true,
 'Generic Solar Panel 300W',
 '{"sourceType": "solar", "panelWatts": 300, "panelType": "mono"}',
 NULL);

-- -----------------------------------------------------------------------------
-- Alternators
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Balmar (AT-SF-200: 200A; XT-250: 250A)
('charge', 'alternator', 'Balmar', 'AT-SF-200', 2024, true,
 'Balmar AT-SF-200 12V 200A',
 '{"sourceType": "alternator", "alternatorAmps": 200, "motoringHoursPerDay": 2}',
 'https://balmar.net/application/marine/alternators-charging-kits/xt-series/'),

('charge', 'alternator', 'Balmar', 'XT-250', 2024, true,
 'Balmar XT-250 12V 250A',
 '{"sourceType": "alternator", "alternatorAmps": 250, "motoringHoursPerDay": 2}',
 'https://balmar.net/application/marine/alternators-charging-kits/xt-series/'),

-- Mastervolt Alpha
('charge', 'alternator', 'Mastervolt', 'Alpha 12/130', 2024, true,
 'Mastervolt Alpha 12/130',
 '{"sourceType": "alternator", "alternatorAmps": 130, "motoringHoursPerDay": 2}',
 'https://www.mastervolt.com/products/alternators-12v/alpha-12-130-iii/'),

('charge', 'alternator', 'Mastervolt', 'Alpha 24/75', 2024, true,
 'Mastervolt Alpha 24/75',
 '{"sourceType": "alternator", "alternatorAmps": 75, "motoringHoursPerDay": 2}',
 'https://www.mastervolt.com/products/alternators-24v/'),

-- Electromaax
('charge', 'alternator', 'Electromaax', '80A', 2024, true,
 'Electromaax 80A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 80, "motoringHoursPerDay": 2}',
 'https://www.electromaax.com/'),

('charge', 'alternator', 'Electromaax', '120A', 2024, true,
 'Electromaax 120A Alternator',
 '{"sourceType": "alternator", "alternatorAmps": 120, "motoringHoursPerDay": 2}',
 'https://www.electromaax.com/'),

-- Generic alternators
('charge', 'alternator', NULL, NULL, NULL, true,
 'Generic Alternator 50A',
 '{"sourceType": "alternator", "alternatorAmps": 50, "motoringHoursPerDay": 2}',
 NULL),

('charge', 'alternator', NULL, NULL, NULL, true,
 'Generic Alternator 80A',
 '{"sourceType": "alternator", "alternatorAmps": 80, "motoringHoursPerDay": 2}',
 NULL),

('charge', 'alternator', NULL, NULL, NULL, true,
 'Generic Alternator 120A',
 '{"sourceType": "alternator", "alternatorAmps": 120, "motoringHoursPerDay": 2}',
 NULL);

-- -----------------------------------------------------------------------------
-- Shore Chargers
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Victron
('charge', 'shore', 'Victron', 'Blue Smart IP22 30A', 2024, true,
 'Victron Blue Smart IP22 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://www.victronenergy.com/chargers/blue-smart-ip22-charger'),

('charge', 'shore', 'Victron', 'Centaur 12/50', 2024, true,
 'Victron Centaur 12/50',
 '{"sourceType": "shore", "shoreChargerAmps": 50, "shoreHoursPerDay": 8}',
 'https://www.victronenergy.com/chargers'),

-- Mastervolt ChargeMaster Plus
('charge', 'shore', 'Mastervolt', 'ChargeMaster Plus 25A', 2024, true,
 'Mastervolt ChargeMaster Plus 25A',
 '{"sourceType": "shore", "shoreChargerAmps": 25, "shoreHoursPerDay": 8}',
 'https://www.mastervolt.us/products/chargemaster-plus-12-v/'),

('charge', 'shore', 'Mastervolt', 'ChargeMaster Plus 50A', 2024, true,
 'Mastervolt ChargeMaster Plus 50A',
 '{"sourceType": "shore", "shoreChargerAmps": 50, "shoreHoursPerDay": 8}',
 'https://www.mastervolt.us/products/chargemaster-plus-12-v/'),

-- Sterling Pro Charge Ultra
('charge', 'shore', 'Sterling', 'Pro Charge Ultra 30A', 2024, true,
 'Sterling Pro Charge Ultra 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://sterling-power.com/products/pro-charge-ultra'),

('charge', 'shore', 'Sterling', 'Pro Charge Ultra 60A', 2024, true,
 'Sterling Pro Charge Ultra 60A',
 '{"sourceType": "shore", "shoreChargerAmps": 60, "shoreHoursPerDay": 8}',
 'https://sterling-power.com/products/pro-charge-ultra'),

-- ProMariner ProNautic P
('charge', 'shore', 'ProMariner', 'ProNautic P 30A', 2024, true,
 'ProMariner ProNautic P 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 'https://www.westmarine.com/promariner-pronautic-1230p-onboard-marine-battery-charger-30-amp-12v-3-banks-12039467.html'),

('charge', 'shore', 'ProMariner', 'ProNautic P 60A', 2024, true,
 'ProMariner ProNautic P 60A',
 '{"sourceType": "shore", "shoreChargerAmps": 60, "shoreHoursPerDay": 8}',
 'https://www.westmarine.com/promariner-pronautic-1260p-onboard-marine-battery-charger-60-amp-12v-3-banks-17076563.html'),

-- Generic shore chargers
('charge', 'shore', NULL, NULL, NULL, true,
 'Generic Shore Charger 15A',
 '{"sourceType": "shore", "shoreChargerAmps": 15, "shoreHoursPerDay": 8}',
 NULL),

('charge', 'shore', NULL, NULL, NULL, true,
 'Generic Shore Charger 30A',
 '{"sourceType": "shore", "shoreChargerAmps": 30, "shoreHoursPerDay": 8}',
 NULL);


-- =============================================================================
-- STORAGE (batteries)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- LiFePO4 Batteries
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Victron Smart LiFePO4
('store', 'lifepo4', 'Victron', 'Smart LiFePO4 100Ah', 2024, true,
 'Victron Smart LiFePO4 12.8V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

('store', 'lifepo4', 'Victron', 'Smart LiFePO4 200Ah', 2024, true,
 'Victron Smart LiFePO4 12.8V 200Ah',
 '{"chemistry": "lifepo4", "capacityAh": 200}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

('store', 'lifepo4', 'Victron', 'Smart LiFePO4 330Ah', 2024, true,
 'Victron Smart LiFePO4 12.8V 330Ah',
 '{"chemistry": "lifepo4", "capacityAh": 330}',
 'https://www.victronenergy.com/batteries/lithium-battery-12-8v'),

-- Battle Born
('store', 'lifepo4', 'Battle Born', 'BB10012 100Ah', 2024, true,
 'Battle Born BB10012 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://battlebornbatteries.com/product/100ah-12v-lifepo4-deep-cycle-battery/'),

('store', 'lifepo4', 'Battle Born', 'GC3 270Ah', 2024, true,
 'Battle Born GC3 12V 270Ah',
 '{"chemistry": "lifepo4", "capacityAh": 270}',
 'https://battlebornbatteries.com/product/270ah-12v-lifepo4-deep-cycle-gc3-battery/'),

-- RELiON
('store', 'lifepo4', 'RELiON', 'RB100 100Ah', 2024, true,
 'RELiON RB100 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.relionbattery.com/products/lithium/rb100'),

('store', 'lifepo4', 'RELiON', 'RB300 300Ah', 2024, true,
 'RELiON RB300 12V 300Ah',
 '{"chemistry": "lifepo4", "capacityAh": 300}',
 'https://www.relionbattery.com/products/lithium/rb300-hp'),

-- Lithionics
('store', 'lifepo4', 'Lithionics', '12V 320Ah', 2024, true,
 'Lithionics 12V 320Ah',
 '{"chemistry": "lifepo4", "capacityAh": 320}',
 'https://lithionics.com/product/lithionics-12v-320ah-lithium-ion-battery/'),

-- SOK
('store', 'lifepo4', 'SOK', '100Ah 12V', 2024, true,
 'SOK 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://us.sokbattery.com/'),

('store', 'lifepo4', 'SOK', '206Ah 12V', 2024, true,
 'SOK 12V 206Ah',
 '{"chemistry": "lifepo4", "capacityAh": 206}',
 'https://us.sokbattery.com/product-page/sok-12v-206ah-lifepo4-battery-bluetooth-built-in-heater'),

-- Epoch
('store', 'lifepo4', 'Epoch', '12V 100Ah', 2024, true,
 'Epoch 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 'https://www.epochbatteries.com/'),

('store', 'lifepo4', 'Epoch', '12V 300Ah', 2024, true,
 'Epoch 12V 300Ah',
 '{"chemistry": "lifepo4", "capacityAh": 300}',
 'https://www.epochbatteries.com/products/12v-300ah-heated-bluetooth-lifepo4-battery-epoch-essentials'),

-- Generic LiFePO4
('store', 'lifepo4', NULL, NULL, NULL, true,
 'Generic LiFePO4 12V 100Ah',
 '{"chemistry": "lifepo4", "capacityAh": 100}',
 NULL),

('store', 'lifepo4', NULL, NULL, NULL, true,
 'Generic LiFePO4 12V 200Ah',
 '{"chemistry": "lifepo4", "capacityAh": 200}',
 NULL);

-- -----------------------------------------------------------------------------
-- AGM Batteries
-- -----------------------------------------------------------------------------

INSERT INTO equipment_catalog (type, category, make, model, year, latest, name, specs, source_url) VALUES

-- Lifeline
('store', 'agm', 'Lifeline', 'GPL-27T 100Ah', 2024, true,
 'Lifeline GPL-27T 12V 100Ah',
 '{"chemistry": "agm", "capacityAh": 100}',
 'https://lifelinebatteries.com/'),

('store', 'agm', 'Lifeline', 'GPL-4DL 210Ah', 2024, true,
 'Lifeline GPL-4DL 12V 210Ah',
 '{"chemistry": "agm", "capacityAh": 210}',
 'https://batteryguys.com/products/lifeline-gpl-4dl'),

('store', 'agm', 'Lifeline', 'GPL-8DL 255Ah', 2024, true,
 'Lifeline GPL-8DL 12V 255Ah',
 '{"chemistry": "agm", "capacityAh": 255}',
 'https://lifelinebatteries.com/products/marine-batteries/gpl-8dl/'),

-- Rolls/Surrette (6V batteries; users pair in series for 12V)
('store', 'agm', 'Rolls/Surrette', 'S-460 415Ah', 2024, true,
 'Rolls/Surrette S-460 6V 415Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 415}',
 'https://www.rollsbattery.com/battery/s6-460agm-re/'),

('store', 'agm', 'Rolls/Surrette', 'S-530 264Ah', 2024, true,
 'Rolls/Surrette S-530 6V 264Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 264}',
 'https://www.rollsbattery.com/'),

-- Trojan
('store', 'agm', 'Trojan', 'T-105 225Ah', 2024, true,
 'Trojan T-105 6V 225Ah (pair for 12V)',
 '{"chemistry": "agm", "capacityAh": 225}',
 'https://batteryguys.com/products/trojan-t-105'),

('store', 'agm', 'Trojan', '8D-AGM 230Ah', 2024, true,
 'Trojan 8D-AGM 12V 230Ah',
 '{"chemistry": "agm", "capacityAh": 230}',
 'https://www.trojanbattery.com/'),

-- Firefly (carbon foam AGM)
('store', 'agm', 'Firefly', 'Group 31 116Ah', 2024, true,
 'Firefly Oasis Group 31 12V 116Ah',
 '{"chemistry": "agm", "capacityAh": 116}',
 'https://www.emarineinc.com/Firefly-Oasis-12V-Group-31-Battery'),

-- Generic AGM
('store', 'agm', NULL, NULL, NULL, true,
 'Generic AGM 12V 100Ah',
 '{"chemistry": "agm", "capacityAh": 100}',
 NULL),

('store', 'agm', NULL, NULL, NULL, true,
 'Generic AGM 12V 200Ah',
 '{"chemistry": "agm", "capacityAh": 200}',
 NULL);


-- =============================================================================
-- Summary: ~175 products total
-- Drains:   ~110 items (watermaker, genset, refrigeration, autopilot,
--           chartplotter, radar, windlass, ais, lighting, water-systems,
--           comfort, communication, sailing)
-- Charge:   ~27 items (solar, alternator, shore)
-- Store:    ~25 items (lifepo4, agm)
-- =============================================================================
