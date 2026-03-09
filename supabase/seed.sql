-- Seed data for local development
-- This file runs on first database startup

-- Power consumers: Navigation
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Chartplotter (7")', 'navigation', 'IconDeviceDesktop', 20, 15, 25, 2, 16, 1.0, 'scheduled', false, 1),
('Chartplotter (9-12")', 'navigation', 'IconDeviceDesktop', 32, 25, 40, 2, 16, 1.0, 'scheduled', false, 2),
('Autopilot (tiller)', 'navigation', 'IconCompass', 17, 10, 24, 0, 20, 1.0, 'scheduled', false, 3),
('Autopilot (wheel)', 'navigation', 'IconCompass', 42, 24, 60, 0, 20, 1.0, 'scheduled', false, 4),
('Radar', 'navigation', 'IconRadar', 32, 20, 45, 0, 8, 1.0, 'intermittent', false, 5),
('AIS transponder', 'navigation', 'IconBroadcast', 3.5, 2, 5, 24, 24, 1.0, 'always-on', false, 6),
('Instruments (depth/speed/wind)', 'navigation', 'IconGauge', 3.5, 2, 5, 0, 16, 1.0, 'scheduled', false, 7),
('GPS (standalone)', 'navigation', 'IconMapPin', 2, 1, 3, 0, 24, 1.0, 'always-on', false, 8);

-- Power consumers: Communication
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('VHF radio (receive)', 'communication', 'IconAntenna', 4.5, 3, 6, 8, 16, 1.0, 'scheduled', false, 1),
('SSB/HF radio (receive)', 'communication', 'IconAntenna', 30, 24, 36, 1, 2, 1.0, 'scheduled', false, 2),
('Starlink', 'communication', 'IconSatellite', 75, 50, 100, 12, 8, 1.0, 'scheduled', false, 3),
('Satellite phone', 'communication', 'IconPhone', 10, 5, 15, 0.25, 0.5, 1.0, 'intermittent', false, 4),
('WiFi booster', 'communication', 'IconWifi', 8.5, 5, 12, 8, 2, 1.0, 'scheduled', false, 5);

-- Power consumers: Refrigeration
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Small fridge (top-loading)', 'refrigeration', 'IconFridge', 37, 30, 45, 24, 24, 0.4, 'always-on', false, 1),
('Large fridge (front-opening)', 'refrigeration', 'IconFridge', 65, 50, 80, 24, 24, 0.5, 'always-on', false, 2),
('Freezer (dedicated)', 'refrigeration', 'IconSnowflake', 55, 40, 70, 24, 24, 0.4, 'always-on', false, 3),
('Fridge/freezer combo (efficient)', 'refrigeration', 'IconFridge', 45, 35, 55, 24, 24, 0.35, 'always-on', false, 4);

-- Power consumers: Lighting
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('LED cabin lights (all)', 'lighting', 'IconBulb', 12, 6, 18, 6, 4, 1.0, 'scheduled', false, 1),
('LED anchor light', 'lighting', 'IconLamp', 2.5, 2, 3, 11, 0, 1.0, 'always-on', false, 2),
('LED navigation lights (tricolor)', 'lighting', 'IconLamp', 10, 6, 15, 0, 11, 1.0, 'always-on', false, 3),
('Cockpit/deck light', 'lighting', 'IconLamp', 6, 3, 10, 2, 1, 1.0, 'intermittent', false, 4),
('Reading light', 'lighting', 'IconLamp', 2, 1, 3, 3, 2, 1.0, 'intermittent', false, 5);

-- Power consumers: Water Systems
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Freshwater pump', 'water-systems', 'IconDroplet', 48, 36, 60, 0.5, 0.25, 1.0, 'intermittent', true, 1),
('Watermaker (small, 12V)', 'water-systems', 'IconDroplet', 120, 60, 180, 3, 2, 1.0, 'scheduled', false, 2),
('Watermaker (large)', 'water-systems', 'IconDroplet', 270, 180, 360, 3, 2, 1.0, 'scheduled', false, 3),
('Bilge pump (auto)', 'water-systems', 'IconDroplet', 42, 24, 60, 0.1, 0.1, 1.0, 'intermittent', false, 4),
('Electric toilet', 'water-systems', 'IconDroplet', 22, 15, 30, 0.15, 0.1, 1.0, 'intermittent', true, 5);

-- Power consumers: Comfort / Galley
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Cabin fan (12V)', 'comfort-galley', 'IconWind', 12, 6, 18, 12, 8, 1.0, 'scheduled', false, 1),
('Microwave (via inverter)', 'comfort-galley', 'IconMicrowave', 1000, 800, 1200, 0.15, 0.1, 1.0, 'intermittent', true, 2),
('Coffee maker (via inverter)', 'comfort-galley', 'IconCoffee', 800, 600, 1000, 0.15, 0.15, 1.0, 'intermittent', false, 3),
('Electric kettle (via inverter)', 'comfort-galley', 'IconCoffee', 1250, 1000, 1500, 0.1, 0.1, 1.0, 'intermittent', false, 4),
('Stereo/music system', 'comfort-galley', 'IconMusic', 30, 12, 48, 4, 2, 1.0, 'intermittent', false, 5),
('TV/display (small, 12V)', 'comfort-galley', 'IconDeviceTv', 35, 20, 50, 2, 0, 1.0, 'intermittent', false, 6),
('Washer/dryer (via inverter)', 'comfort-galley', 'IconWashMachine', 1000, 500, 1500, 0.5, 0, 0.6, 'intermittent', true, 7);

-- Power consumers: Charging
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Laptop charging', 'charging', 'IconDeviceLaptop', 55, 45, 65, 3, 2, 1.0, 'scheduled', true, 1),
('Phone/tablet charging (x2)', 'charging', 'IconDeviceMobile', 15, 10, 20, 4, 3, 1.0, 'scheduled', true, 2),
('Camera/drone charging', 'charging', 'IconCamera', 22, 15, 30, 1, 0.5, 1.0, 'intermittent', false, 3),
('Inverter standby draw', 'charging', 'IconPlug', 20, 10, 30, 24, 24, 1.0, 'always-on', false, 4);

-- Power consumers: Sailing / Safety
INSERT INTO power_consumers (name, category, icon, watts_typical, watts_min, watts_max, hours_per_day_anchor, hours_per_day_passage, duty_cycle, usage_type, crew_scaling, sort_order) VALUES
('Electric windlass', 'sailing-safety', 'IconAnchor', 1000, 600, 1500, 0.05, 0, 1.0, 'intermittent', false, 1),
('Bow thruster', 'sailing-safety', 'IconArrowsLeftRight', 2000, 1200, 3000, 0.02, 0, 1.0, 'intermittent', false, 2),
('Smoke/CO detector', 'sailing-safety', 'IconAlarm', 0.75, 0.5, 1, 24, 24, 1.0, 'always-on', false, 3);

-- Product specs: MPPT Controllers
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('mppt-controller', 'Victron', 'SmartSolar MPPT 75/15', '{"max_pv_voltage": 75, "max_charge_current": 15, "max_pv_power_12v": 200, "max_pv_power_24v": 400, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-75-10-75-15-100-15-100-20', '{12,24}', 100, 140),
('mppt-controller', 'Victron', 'SmartSolar MPPT 100/30', '{"max_pv_voltage": 100, "max_charge_current": 30, "max_pv_power_12v": 440, "max_pv_power_24v": 880, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-100-30', '{12,24}', 170, 220),
('mppt-controller', 'Victron', 'SmartSolar MPPT 100/50', '{"max_pv_voltage": 100, "max_charge_current": 50, "max_pv_power_12v": 700, "max_pv_power_24v": 1400, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-100-30-100-50', '{12,24}', 250, 320),
('mppt-controller', 'Victron', 'SmartSolar MPPT 150/35', '{"max_pv_voltage": 150, "max_charge_current": 35, "max_pv_power_12v": 500, "max_pv_power_24v": 1000, "bluetooth": true, "ve_direct": true}', 'https://www.victronenergy.com/solar-charge-controllers/smartsolar-150-35', '{12,24,48}', 220, 280),
('mppt-controller', 'Renogy', 'Rover 20A MPPT', '{"max_pv_voltage": 100, "max_charge_current": 20, "max_pv_power_12v": 260, "max_pv_power_24v": 520, "bluetooth": false}', 'https://www.renogy.com/rover-20-amp-mppt-solar-charge-controller/', '{12,24}', 80, 110),
('mppt-controller', 'Renogy', 'Rover 40A MPPT', '{"max_pv_voltage": 100, "max_charge_current": 40, "max_pv_power_12v": 520, "max_pv_power_24v": 1040, "bluetooth": false}', 'https://www.renogy.com/rover-40-amp-mppt-solar-charge-controller/', '{12,24}', 130, 170);

-- Product specs: Batteries (LiFePO4)
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('battery-lifepo4', 'Battle Born', 'BB10012 100Ah', '{"capacity_ah": 100, "voltage": 12.8, "energy_wh": 1280, "max_continuous_discharge_a": 100, "cycles_80dod": 3000, "bms": "built-in", "weight_kg": 13}', 'https://battlebornbatteries.com/product/12v-100ah-lifepo4-deep-cycle-battery/', '{12}', 13, 800, 950),
('battery-lifepo4', 'Victron', 'Smart LiFePO4 12.8V/200Ah', '{"capacity_ah": 200, "voltage": 12.8, "energy_wh": 2560, "max_continuous_discharge_a": 200, "cycles_80dod": 2500, "bms": "built-in", "bluetooth": true, "weight_kg": 28}', 'https://www.victronenergy.com/batteries/lithium-battery-12-8v-smart', '{12}', 28, 1800, 2200),
('battery-lifepo4', 'Renogy', '12V 100Ah Smart LiFePO4', '{"capacity_ah": 100, "voltage": 12.8, "energy_wh": 1280, "max_continuous_discharge_a": 100, "cycles_80dod": 4000, "bms": "built-in", "bluetooth": true, "weight_kg": 11.8}', 'https://www.renogy.com/12v-100ah-smart-lithium-iron-phosphate-battery/', '{12}', 11.8, 500, 650);

-- Product specs: Batteries (AGM)
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('battery-agm', 'Victron', 'AGM Deep Cycle 12V/220Ah', '{"capacity_ah": 220, "voltage": 12, "energy_wh": 2640, "cycles_50dod": 500, "weight_kg": 65}', 'https://www.victronenergy.com/batteries/agm-deep-cycle', '{12}', 65, 400, 500),
('battery-agm', 'Lifeline', 'GPL-4CT 6V/220Ah', '{"capacity_ah": 220, "voltage": 6, "energy_wh": 1320, "cycles_50dod": 750, "weight_kg": 30, "note": "Use two in series for 12V"}', 'https://www.lifelinebatteries.com/marine-batteries/', '{6}', 30, 350, 450);

-- Product specs: Inverter/Chargers
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, weight_kg, price_range_low, price_range_high) VALUES
('inverter-charger', 'Victron', 'MultiPlus 12/500/20', '{"continuous_watts": 500, "peak_watts": 1000, "charge_current_a": 20, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{12}', 10, 500, 650),
('inverter-charger', 'Victron', 'MultiPlus 12/2000/80', '{"continuous_watts": 2000, "peak_watts": 4000, "charge_current_a": 80, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{12}', 19, 1100, 1400),
('inverter-charger', 'Victron', 'MultiPlus 24/3000/70', '{"continuous_watts": 3000, "peak_watts": 6000, "charge_current_a": 70, "ac_output": "230V", "transfer_switch": true}', 'https://www.victronenergy.com/inverters-chargers/multiplus', '{24}', 28, 1600, 2000);

-- Product specs: Battery Monitors
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('battery-monitor', 'Victron', 'SmartShunt 500A', '{"max_current_a": 500, "bluetooth": true, "ve_direct": true, "midpoint_monitoring": false}', 'https://www.victronenergy.com/battery-monitors/smart-battery-shunt', '{12,24,48}', 90, 130),
('battery-monitor', 'Victron', 'BMV-712 Smart', '{"max_current_a": 500, "bluetooth": true, "ve_direct": true, "midpoint_monitoring": true, "display": true}', 'https://www.victronenergy.com/battery-monitors/bmv-712-smart', '{12,24,48}', 150, 200);

-- Product specs: Alternator Regulators
INSERT INTO product_specs (component_type, make, model, specs, source_url, compatible_voltages, price_range_low, price_range_high) VALUES
('alternator-regulator', 'Wakespeed', 'WS500', '{"max_field_current_a": 25, "bluetooth": true, "can_bus": true, "lifepo4_compatible": true, "programmable": true}', 'https://wakespeed.com/ws500/', '{12,24,48}', 450, 550),
('alternator-regulator', 'Balmar', 'MC-614', '{"max_field_current_a": 12, "lifepo4_compatible": true, "multi_stage": true}', 'https://www.balmar.net/mc-614/', '{12}', 250, 350);

-- Boat model templates
INSERT INTO boat_model_templates (make, model, year_range, boat_type, length_ft, default_crew, factory_solar_watts, factory_battery_ah, factory_battery_chemistry, system_voltage, engine_make, engine_model, engine_alternator_amps) VALUES
('Lagoon', '40', '2019-2024', 'catamaran', 40, 3, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Lagoon', '42', '2019-2024', 'catamaran', 42, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Lagoon', '43', '2020-2024', 'catamaran', 43, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Lagoon', '46', '2019-2024', 'catamaran', 46, 4, 0, 400, 'agm', 12, 'Yanmar', '4JH57', 80),
('Lagoon', '50', '2018-2024', 'catamaran', 50, 4, 200, 400, 'agm', 12, 'Yanmar', '4JH80', 120),
('Beneteau', 'Oceanis 40.1', '2019-2024', 'monohull', 40, 2, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Beneteau', 'Oceanis 46.1', '2019-2024', 'monohull', 46, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Jeanneau', 'Sun Odyssey 440', '2019-2024', 'monohull', 44, 2, 0, 200, 'agm', 12, 'Yanmar', '4JH45', 80),
('Jeanneau', 'Sun Odyssey 490', '2019-2024', 'monohull', 49, 3, 0, 200, 'agm', 12, 'Yanmar', '4JH57', 80),
('Fountaine Pajot', 'Elba 45', '2020-2024', 'catamaran', 45, 3, 0, 300, 'agm', 12, 'Yanmar', '4JH45', 80),
('Fountaine Pajot', 'Isla 40', '2019-2024', 'catamaran', 40, 3, 0, 200, 'agm', 12, 'Yanmar', '3YM30', 80),
('Bavaria', 'C42', '2020-2024', 'monohull', 42, 2, 0, 200, 'agm', 12, 'Volvo Penta', 'D2-40', 80);

-- Default appliance IDs for monohull templates (13 standard appliances)
UPDATE boat_model_templates SET default_appliance_ids = ARRAY(
  SELECT id FROM power_consumers WHERE name IN (
    'Chartplotter (7")', 'VHF radio (receive)', 'AIS transponder',
    'Autopilot (wheel)', 'LED navigation lights (tricolor)', 'LED cabin lights (all)',
    'Cockpit/deck light', 'LED anchor light', 'Instruments (depth/speed/wind)',
    'Small fridge (top-loading)', 'Bilge pump (auto)',
    'Phone/tablet charging (x2)', 'Cabin fan (12V)'
  )
) WHERE boat_type = 'monohull';

-- Default appliance IDs for catamaran templates (16 appliances including radar, freezer, windlass)
UPDATE boat_model_templates SET default_appliance_ids = ARRAY(
  SELECT id FROM power_consumers WHERE name IN (
    'Chartplotter (9-12")', 'VHF radio (receive)', 'AIS transponder',
    'Autopilot (wheel)', 'LED navigation lights (tricolor)', 'LED cabin lights (all)',
    'Cockpit/deck light', 'LED anchor light', 'Instruments (depth/speed/wind)',
    'Small fridge (top-loading)', 'Freezer (dedicated)', 'Bilge pump (auto)',
    'Phone/tablet charging (x2)', 'Cabin fan (12V)',
    'Radar', 'Electric windlass'
  )
) WHERE boat_type = 'catamaran';
