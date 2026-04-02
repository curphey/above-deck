# NMEA 2000 PGN Field-Level Specifications

Technical reference for building Go protocol adapters that parse raw CAN bus frames into structured data. All field definitions sourced from the [canboat project](https://github.com/canboat/canboat) (v6.1.6, Apache 2.0 license).

**Date:** 2026-03-31

---

## Table of Contents

1. [Protocol Fundamentals](#protocol-fundamentals)
2. [Electrical/Power PGNs](#electricalpower-pgns)
3. [Propulsion/Engine PGNs](#propulsionengine-pgns)
4. [Tank PGNs](#tank-pgns)
5. [Environment PGNs](#environment-pgns)
6. [Digital Switching PGNs](#digital-switching-pgns)
7. [Device Identification PGNs](#device-identification-pgns)
8. [AIS PGNs](#ais-pgns)
9. [Lookup Tables](#lookup-tables)

---

## Protocol Fundamentals

### CAN Frame Structure

NMEA 2000 runs on CAN 2.0B (29-bit extended identifier). The 29-bit CAN ID encodes:

```
Bits 28-26: Priority (0-7, lower = higher priority)
Bits 25-16: PGN (Parameter Group Number)
Bits  7-0:  Source Address (0-253)
```

For PDU1 format (destination-specific PGNs, PGN < 0xF000):
```
Bits 25-16: PGN upper byte + destination address in lower byte
```

For PDU2 format (broadcast PGNs, PGN >= 0xF000):
```
Bits 25-8:  Full PGN (18 bits)
```

### Transport Types

| Type | Max Data | CAN Frames | Description |
|------|----------|------------|-------------|
| **Single** | 8 bytes | 1 | Fits in one CAN frame. Data bytes 0-7 map directly. |
| **Fast-Packet** | 223 bytes | Up to 32 | First frame: byte 0 = sequence counter (bits 7-5) + frame counter 0 (bits 4-0), byte 1 = total byte count, bytes 2-7 = first 6 data bytes. Subsequent frames: byte 0 = sequence counter + frame counter (1-31), bytes 1-7 = next 7 data bytes. |

### Data Encoding Conventions

- **Byte order:** Little-endian (LSB first) for all multi-byte integers
- **Unavailable/unknown:** All bits set to 1 (e.g., 0xFF for uint8, 0xFFFF for uint16, 0x7FFF for int16)
- **Out of range:** All bits set to 1 except LSB (e.g., 0xFE for uint8, 0xFFFE for uint16, 0x7FFE for int16)
- **Temperature:** Stored in Kelvin. Convert to Celsius: `C = K - 273.15`
- **Pressure:** Stored in Pascals. Convert to hPa/mbar: `hPa = Pa / 100`
- **Angles:** Stored in radians. Convert to degrees: `deg = rad * (180 / pi)`
- **Speed:** Stored in m/s. Convert to knots: `kn = m/s * 1.94384`
- **SID (Sequence ID):** Links correlated readings from the same measurement cycle

### Physical Value Calculation

```
physical_value = (raw_value * resolution) + offset
```

Most fields have offset = 0. The Peukert Exponent in PGN 127513 has offset = 1.

---

## Electrical/Power PGNs

### PGN 127506 -- DC Detailed Status

| Property | Value |
|----------|-------|
| PGN | 127506 (0x1F212) |
| Description | DC Detailed Status |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 11 bytes (88 bits) |
| Update Rate | 1500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Instance | 8 | 8 | uint8 | 1 | 0 | - | 0-252 | DC source instance (primary key) |
| 3 | DC Type | 16 | 8 | lookup | 1 | 0 | - | 0-252 | DC_SOURCE enum (primary key) |
| 4 | State of Charge | 24 | 8 | uint8 | 1 | 0 | % | 0-252 | Battery SOC percentage |
| 5 | State of Health | 32 | 8 | uint8 | 1 | 0 | % | 0-252 | Battery SOH percentage |
| 6 | Time Remaining | 40 | 16 | uint16 | 60 | 0 | s | 0-3931920 | Time remaining at current discharge rate (resolution = 60s = 1 minute) |
| 7 | Ripple Voltage | 56 | 16 | uint16 | 0.001 | 0 | V | 0-65.532 | AC ripple on DC bus |
| 8 | Remaining Capacity | 72 | 16 | uint16 | 1 | 0 | Ah | 0-65532 | Remaining amp-hours |

**Go parsing notes:**
- Time Remaining: raw value is in minutes, multiply by 60 for seconds
- Ripple Voltage resolution is 1 mV

---

### PGN 127508 -- Battery Status

| Property | Value |
|----------|-------|
| PGN | 127508 (0x1F214) |
| Description | Battery Status |
| Priority | 6 |
| Type | Single (8 bytes, 1 CAN frame) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 1500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Battery instance (primary key) |
| 2 | Voltage | 8 | 16 | int16 | 0.01 | 0 | V | -327.67 to 327.64 | Battery terminal voltage (10 mV resolution) |
| 3 | Current | 24 | 16 | int16 | 0.1 | 0 | A | -3276.7 to 3276.4 | Battery current, positive = charging (100 mA resolution) |
| 4 | Temperature | 40 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Battery temperature in Kelvin. Subtract 273.15 for Celsius. |
| 5 | SID | 56 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |

**Go parsing notes:**
- Most commonly transmitted electrical PGN. Victron, Mastervolt, and most battery monitors send this.
- Voltage is signed to handle reverse polarity detection.
- Current sign convention: positive = charging (into battery), negative = discharging.

---

### PGN 127513 -- Battery Configuration Status

| Property | Value |
|----------|-------|
| PGN | 127513 (0x1F219) |
| Description | Battery Configuration Status |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 8 bytes (64 bits) |
| Update Rate | Irregular (on request / configuration change) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Battery instance (primary key) |
| 2 | Battery Type | 8 | 4 | lookup | 1 | 0 | - | 0-13 | BATTERY_TYPE enum |
| 3 | Supports Equalization | 12 | 2 | lookup | 1 | 0 | - | 0-2 | YES_NO enum |
| 4 | Reserved | 14 | 2 | reserved | - | - | - | - | - |
| 5 | Nominal Voltage | 16 | 4 | lookup | 1 | 0 | - | 0-13 | BATTERY_VOLTAGE enum |
| 6 | Chemistry | 20 | 4 | lookup | 1 | 0 | - | 0-13 | BATTERY_CHEMISTRY enum |
| 7 | Capacity | 24 | 16 | uint16 | 1 | 0 | Ah | 0-65532 | Rated capacity in amp-hours |
| 8 | Temperature Coefficient | 40 | 8 | int8 | 1 | 0 | % | -127 to 124 | Temperature compensation coefficient |
| 9 | Peukert Exponent | 48 | 8 | uint8 | 0.002 | 1 | - | 1.0-1.5 | Peukert exponent. **Note offset=1:** `value = (raw * 0.002) + 1.0` |
| 10 | Charge Efficiency Factor | 56 | 8 | int8 | 1 | 0 | % | -127 to 124 | Charge efficiency percentage |

**Go parsing notes:**
- This is a configuration/static PGN, transmitted infrequently.
- Peukert Exponent is the only field with a non-zero offset. Typical lead-acid = 1.25, LiFePO4 ~ 1.05.
- Battery Type and Chemistry are separate concepts: Type = construction (Flooded/Gel/AGM), Chemistry = electrochemistry (Pb/Li/NiCd/etc).

---

## Propulsion/Engine PGNs

### PGN 127488 -- Engine Parameters, Rapid Update

| Property | Value |
|----------|-------|
| PGN | 127488 (0x1F200) |
| Description | Engine Parameters, Rapid Update |
| Priority | 2 |
| Type | Single (8 bytes, 1 CAN frame) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | lookup | 1 | 0 | - | 0-252 | ENGINE_INSTANCE enum (primary key) |
| 2 | Speed | 8 | 16 | uint16 | 0.25 | 0 | rpm | 0-16383 | Engine RPM (0.25 rpm resolution) |
| 3 | Boost Pressure | 24 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Turbo/supercharger boost pressure |
| 4 | Tilt/Trim | 40 | 8 | int8 | 1 | 0 | % | -127 to 124 | Engine tilt/trim percentage |
| 5 | Reserved | 48 | 16 | reserved | - | - | - | - | - |

**Go parsing notes:**
- Highest-frequency engine PGN (10 Hz). Parse this for real-time tachometer display.
- RPM = raw_uint16 * 0.25. So raw value 4000 = 1000 RPM.
- Instance 0 = port engine (or single engine), Instance 1 = starboard engine.

---

### PGN 127489 -- Engine Parameters, Dynamic

| Property | Value |
|----------|-------|
| PGN | 127489 (0x1F201) |
| Description | Engine Parameters, Dynamic |
| Priority | 2 |
| Type | Fast-Packet |
| Data Length | 26 bytes (208 bits) |
| Update Rate | 500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | lookup | 1 | 0 | - | 0-252 | ENGINE_INSTANCE enum (primary key) |
| 2 | Oil Pressure | 8 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Engine oil pressure (hPa = raw) |
| 3 | Oil Temperature | 24 | 16 | uint16 | 0.1 | 0 | K | 0-6553.2 | Oil temperature in Kelvin |
| 4 | Temperature | 40 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Coolant temperature in Kelvin |
| 5 | Alternator Potential | 56 | 16 | int16 | 0.01 | 0 | V | -327.67 to 327.64 | Alternator output voltage |
| 6 | Fuel Rate | 72 | 16 | int16 | 0.1 | 0 | L/h | -3276.7 to 3276.4 | Fuel consumption rate |
| 7 | Total Engine Hours | 88 | 32 | uint32 | 1 | 0 | s | 0-4294967292 | Cumulative engine hours in seconds |
| 8 | Coolant Pressure | 120 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Cooling system pressure |
| 9 | Fuel Pressure | 136 | 16 | uint16 | 1000 | 0 | Pa | 0-65532000 | Fuel rail/line pressure |
| 10 | Reserved | 152 | 8 | reserved | - | - | - | - | - |
| 11 | Discrete Status 1 | 160 | 16 | bitfield | 1 | 0 | - | 0-65535 | ENGINE_STATUS_1 bit lookup |
| 12 | Discrete Status 2 | 176 | 16 | bitfield | 1 | 0 | - | 0-65535 | ENGINE_STATUS_2 bit lookup |
| 13 | Engine Load | 192 | 8 | int8 | 1 | 0 | % | -127 to 124 | Percent engine load |
| 14 | Engine Torque | 200 | 8 | int8 | 1 | 0 | % | -127 to 124 | Percent engine torque |

**Go parsing notes:**
- Total Engine Hours is in seconds. Divide by 3600 for hours.
- Oil Temperature resolution (0.1 K) is coarser than coolant temperature (0.01 K).
- Fuel Rate is signed: positive = consumption, negative = return flow.
- Status bitfields: test each bit independently. Multiple alarms can be active simultaneously.

---

### PGN 127493 -- Transmission Parameters, Dynamic

| Property | Value |
|----------|-------|
| PGN | 127493 (0x1F205) |
| Description | Transmission Parameters, Dynamic |
| Priority | 2 |
| Type | Single (8 bytes, 1 CAN frame) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | lookup | 1 | 0 | - | 0-252 | ENGINE_INSTANCE enum (primary key) |
| 2 | Transmission Gear | 8 | 2 | lookup | 1 | 0 | - | 0-2 | GEAR_STATUS enum |
| 3 | Reserved | 10 | 6 | reserved | - | - | - | - | - |
| 4 | Oil Pressure | 16 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Transmission oil pressure |
| 5 | Oil Temperature | 32 | 16 | uint16 | 0.1 | 0 | K | 0-6553.2 | Transmission oil temperature |
| 6 | Discrete Status 1 | 48 | 8 | uint8 | 1 | 0 | - | 0-252 | Transmission status flags |
| 7 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

**Go parsing notes:**
- Gear field is only 2 bits, packed into the low bits of byte 1.
- Transmission Gear: extract bits 0-1 of byte 1 with `data[1] & 0x03`.

---

## Tank PGNs

### PGN 127505 -- Fluid Level

| Property | Value |
|----------|-------|
| PGN | 127505 (0x1F211) |
| Description | Fluid Level |
| Priority | 6 |
| Type | Single (8 bytes, 1 CAN frame) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 2500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 4 | uint4 | 1 | 0 | - | 0-13 | Tank instance (primary key). Supports up to 14 tanks. |
| 2 | Type | 4 | 4 | lookup | 1 | 0 | - | 0-13 | TANK_TYPE enum |
| 3 | Level | 8 | 16 | int16 | 0.004 | 0 | % | -131.068 to 131.056 | Fill level percentage. 0.004% resolution (=0.4% per 100 raw counts). |
| 4 | Capacity | 24 | 32 | uint32 | 0.1 | 0 | L | 0-429496729.2 | Tank capacity in litres (100 mL resolution) |
| 5 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

**Go parsing notes:**
- Instance and Type share byte 0: Instance = bits 0-3 (`data[0] & 0x0F`), Type = bits 4-7 (`(data[0] >> 4) & 0x0F`).
- Level is signed to allow over-range indication.
- Typical use: calculate current volume as `(level / 100.0) * capacity`.

---

## Environment PGNs

### PGN 130310 -- Environmental Parameters (Obsolete)

| Property | Value |
|----------|-------|
| PGN | 130310 (0x1FD06) |
| Description | Environmental Parameters (obsolete -- use 130312-130316 instead) |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Water Temperature | 8 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Sea water temperature |
| 3 | Outside Ambient Air Temperature | 24 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Outside air temperature |
| 4 | Atmospheric Pressure | 40 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Barometric pressure |
| 5 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

**Note:** Deprecated. Still widely transmitted by older equipment. Parse for backward compatibility but prefer 130312-130316.

---

### PGN 130311 -- Environmental Parameters

| Property | Value |
|----------|-------|
| PGN | 130311 (0x1FD07) |
| Description | Environmental Parameters |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 500 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Temperature Source | 8 | 6 | lookup | 1 | 0 | - | 0-61 | TEMPERATURE_SOURCE enum (primary key) |
| 3 | Humidity Source | 14 | 2 | lookup | 1 | 0 | - | 0-2 | HUMIDITY_SOURCE enum |
| 4 | Temperature | 16 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Temperature reading |
| 5 | Humidity | 32 | 16 | int16 | 0.004 | 0 | % | -131.068 to 131.056 | Relative humidity |
| 6 | Atmospheric Pressure | 48 | 16 | uint16 | 100 | 0 | Pa | 0-6553200 | Barometric pressure |

**Note:** Also deprecated in favour of separate PGNs 130312-130316. Still widely transmitted.

**Go parsing notes:**
- Temperature Source and Humidity Source share bytes 1-2 with non-aligned nibble boundaries.
- Temperature Source = bits 0-5 of byte 1 (`data[1] & 0x3F`), Humidity Source = bits 6-7 of byte 1 (`(data[1] >> 6) & 0x03`).

---

### PGN 130312 -- Temperature

| Property | Value |
|----------|-------|
| PGN | 130312 (0x1FD08) |
| Description | Temperature |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 2000 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Instance | 8 | 8 | uint8 | 1 | 0 | - | 0-252 | Sensor instance (primary key) |
| 3 | Source | 16 | 8 | lookup | 1 | 0 | - | 0-252 | TEMPERATURE_SOURCE enum (primary key) |
| 4 | Actual Temperature | 24 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Current temperature reading |
| 5 | Set Temperature | 40 | 16 | uint16 | 0.01 | 0 | K | 0-655.32 | Desired/setpoint temperature (for HVAC) |
| 6 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

---

### PGN 130313 -- Humidity

| Property | Value |
|----------|-------|
| PGN | 130313 (0x1FD09) |
| Description | Humidity |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 2000 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Instance | 8 | 8 | uint8 | 1 | 0 | - | 0-252 | Sensor instance (primary key) |
| 3 | Source | 16 | 8 | lookup | 1 | 0 | - | 0-252 | HUMIDITY_SOURCE enum (primary key) |
| 4 | Actual Humidity | 24 | 16 | int16 | 0.004 | 0 | % | -131.068 to 131.056 | Current relative humidity |
| 5 | Set Humidity | 40 | 16 | int16 | 0.004 | 0 | % | -131.068 to 131.056 | Desired/setpoint humidity |
| 6 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

---

### PGN 130314 -- Actual Pressure

| Property | Value |
|----------|-------|
| PGN | 130314 (0x1FD0A) |
| Description | Actual Pressure |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 2000 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Instance | 8 | 8 | uint8 | 1 | 0 | - | 0-252 | Sensor instance (primary key) |
| 3 | Source | 16 | 8 | lookup | 1 | 0 | - | 0-252 | PRESSURE_SOURCE enum (primary key) |
| 4 | Pressure | 24 | 32 | int32 | 0.1 | 0 | Pa | -214748364.7 to 214748364.4 | Pressure value (0.1 Pa resolution) |
| 5 | Reserved | 56 | 8 | reserved | - | - | - | - | - |

**Go parsing notes:**
- Unlike the older PGN 130310/130311 which uses uint16 with 100 Pa resolution, this PGN uses a 32-bit signed integer with 0.1 Pa resolution -- significantly higher precision.
- For atmospheric pressure: standard atmosphere = 101325 Pa = raw value 1013250.

---

### PGN 130316 -- Temperature, Extended Range

| Property | Value |
|----------|-------|
| PGN | 130316 (0x1FD0C) |
| Description | Temperature, Extended Range |
| Priority | 5 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | 2000 ms |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | SID | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |
| 2 | Instance | 8 | 8 | uint8 | 1 | 0 | - | 0-252 | Sensor instance (primary key) |
| 3 | Source | 16 | 8 | lookup | 1 | 0 | - | 0-252 | TEMPERATURE_SOURCE enum (primary key) |
| 4 | Temperature | 24 | 24 | uint24 | 0.001 | 0 | K | 0-16777.212 | Extended range temperature (0.001 K = 1 mK resolution) |
| 5 | Set Temperature | 48 | 16 | uint16 | 0.1 | 0 | K | 0-6553.2 | Desired/setpoint temperature |

**Go parsing notes:**
- 24-bit field: read 3 bytes little-endian (`uint32(data[3]) | uint32(data[4])<<8 | uint32(data[5])<<16`).
- Higher resolution (1 mK) and wider range than PGN 130312 (10 mK, max 655 K). Use this for exhaust gas temperature monitoring (EGT can exceed 655 K).

---

## Digital Switching PGNs

### PGN 127501 -- Binary Switch Bank Status

| Property | Value |
|----------|-------|
| PGN | 127501 (0x1F20D) |
| Description | Binary Switch Bank Status |
| Priority | 3 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | Not specified |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Switch bank instance (primary key) |
| 2-29 | Indicator1-28 | 8-62 | 2 each | lookup | 1 | 0 | - | 0-2 | OFF_ON enum. 28 indicators, 2 bits each. |

**Layout:** After the 8-bit instance field, there are 28 two-bit indicator fields packed sequentially:
- Indicator 1: bits 8-9 (byte 1, bits 0-1)
- Indicator 2: bits 10-11 (byte 1, bits 2-3)
- Indicator 3: bits 12-13 (byte 1, bits 4-5)
- Indicator 4: bits 14-15 (byte 1, bits 6-7)
- ...pattern continues through byte 7

**Go parsing:**
```
// Extract indicator N (1-28) from data bytes:
func getIndicator(data []byte, n int) uint8 {
    bitOffset := 8 + (n-1)*2
    byteIdx := bitOffset / 8
    bitIdx := uint(bitOffset % 8)
    return (data[byteIdx] >> bitIdx) & 0x03
}
// 0=Off, 1=On, 2=Error, 3=Unavailable
```

---

### PGN 127502 -- Switch Bank Control

| Property | Value |
|----------|-------|
| PGN | 127502 (0x1F20E) |
| Description | Switch Bank Control |
| Priority | 3 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | Not specified |

Identical layout to PGN 127501 except:
- Field names are "Switch1" through "Switch28" instead of "Indicator1" through "Indicator28"
- Uses OFF_ON_CONTROL enum (includes "Take no action" value = 3)

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Instance | 0 | 8 | uint8 | 1 | 0 | - | 0-252 | Switch bank instance (primary key) |
| 2-29 | Switch1-28 | 8-62 | 2 each | lookup | 1 | 0 | - | 0-3 | OFF_ON_CONTROL enum |

**Go parsing notes:**
- This is a command PGN (sent to control switches), whereas 127501 is a status PGN (reports current state).
- Value 3 ("Take no action") allows controlling individual switches without affecting others in the bank.

---

## Device Identification PGNs

### PGN 60928 -- ISO Address Claim

| Property | Value |
|----------|-------|
| PGN | 60928 (0xEE00) |
| Description | ISO Address Claim |
| Priority | 6 |
| Type | Single (8 bytes) |
| Data Length | 8 bytes (64 bits) |
| Update Rate | Irregular (on network join, address conflict) |

The 64-bit NAME field is packed as follows:

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Unique Number | 0 | 21 | uint21 | 1 | 0 | - | 0-2097148 | ISO Identity Number (serial number) |
| 2 | Manufacturer Code | 21 | 11 | lookup | 1 | 0 | - | 0-2044 | MANUFACTURER_CODE enum |
| 3 | Device Instance Lower | 32 | 3 | uint3 | 1 | 0 | - | 0-7 | ISO ECU Instance |
| 4 | Device Instance Upper | 35 | 5 | uint5 | 1 | 0 | - | 0-31 | ISO Function Instance |
| 5 | Device Function | 40 | 8 | indirect lookup | 1 | 0 | - | 0-252 | DEVICE_FUNCTION (meaning depends on Device Class) |
| 6 | Spare | 48 | 1 | spare | - | - | - | - | - |
| 7 | Device Class | 49 | 7 | lookup | 1 | 0 | - | 0-125 | DEVICE_CLASS enum |
| 8 | System Instance | 56 | 4 | uint4 | 1 | 0 | - | 0-13 | ISO Device Class Instance |
| 9 | Industry Group | 60 | 3 | lookup | 1 | 0 | - | 0-6 | INDUSTRY_CODE enum (4 = Marine) |
| 10 | Arbitrary Address Capable | 63 | 1 | lookup | 1 | 0 | - | 0-1 | YES_NO. Always 1 for NMEA 2000. |

**Go parsing notes:**
- The entire 8-byte payload is a single 64-bit NAME field. Parse as little-endian uint64, then extract bit fields:
```
name := binary.LittleEndian.Uint64(data[0:8])
uniqueNumber    := name & 0x1FFFFF           // bits 0-20
manufacturerCode := (name >> 21) & 0x7FF     // bits 21-31
deviceInstLower := (name >> 32) & 0x07       // bits 32-34
deviceInstUpper := (name >> 35) & 0x1F       // bits 35-39
deviceFunction  := (name >> 40) & 0xFF       // bits 40-47
// bit 48 spare
deviceClass     := (name >> 49) & 0x7F       // bits 49-55
systemInstance  := (name >> 56) & 0x0F       // bits 56-59
industryGroup   := (name >> 60) & 0x07       // bits 60-62
arbAddrCapable  := (name >> 63) & 0x01       // bit 63
```
- Combined Device Instance = `(deviceInstUpper << 3) | deviceInstLower` (0-255).

---

### PGN 126996 -- Product Information

| Property | Value |
|----------|-------|
| PGN | 126996 (0x1F014) |
| Description | Product Information |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 134 bytes (1072 bits) |
| Update Rate | Irregular (on request) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | NMEA 2000 Version | 0 | 16 | uint16 | 0.001 | 0 | - | 0-65.532 | Protocol version (e.g., 2.100) |
| 2 | Product Code | 16 | 16 | uint16 | 1 | 0 | - | 0-65532 | Manufacturer product code |
| 3 | Model ID | 32 | 256 | string_fix | - | - | - | 32 chars | Model identifier (fixed 32-byte ASCII, null-padded) |
| 4 | Software Version Code | 288 | 256 | string_fix | - | - | - | 32 chars | Software version string |
| 5 | Model Version | 544 | 256 | string_fix | - | - | - | 32 chars | Hardware model version |
| 6 | Model Serial Code | 800 | 256 | string_fix | - | - | - | 32 chars | Serial number string |
| 7 | Certification Level | 1056 | 8 | uint8 | 1 | 0 | - | 0-252 | NMEA certification level |
| 8 | Load Equivalency | 1064 | 8 | uint8 | 1 | 0 | - | 0-252 | Max power consumption in LEN units (1 LEN = 50 mA) |

**Go parsing notes:**
- Large fast-packet message requiring reassembly from multiple CAN frames.
- Fixed-length strings are 32 bytes, null-padded. Trim trailing nulls and spaces.
- Load Equivalency: actual current draw in mA = value * 50.

---

### PGN 126998 -- Configuration Information

| Property | Value |
|----------|-------|
| PGN | 126998 (0x1F016) |
| Description | Configuration Information |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | Variable |
| Update Rate | Irregular (on request) |

| # | Field | Bit Offset | Bit Length | Type | Description |
|---|-------|-----------|-----------|------|-------------|
| 1 | Installation Description #1 | 0 | variable | STRING_LAU | Free-form installation description (length-prefixed) |
| 2 | Installation Description #2 | variable | variable | STRING_LAU | Second installation description (length-prefixed) |
| 3 | Manufacturer Information | variable | variable | STRING_LAU | Manufacturer-specific information (length-prefixed) |

**Go parsing notes:**
- STRING_LAU = Length And Unicode format: first 2 bytes = total byte count (including length bytes), second byte = encoding (0x01 = Unicode/UTF-16, 0x00 = ASCII), followed by string data.
- Variable-length message; parse sequentially, advancing offset by each string's declared length.

---

## AIS PGNs

### PGN 129038 -- AIS Class A Position Report

| Property | Value |
|----------|-------|
| PGN | 129038 (0x1F80E) |
| Description | AIS Class A Position Report |
| Priority | 4 |
| Type | Fast-Packet |
| Data Length | 28 bytes (224 bits) |
| Update Rate | Irregular (depends on vessel speed: 2s at >23kn, 10s at anchor) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Message ID | 0 | 6 | lookup | 1 | 0 | - | 0-61 | AIS message type (1, 2, or 3) |
| 2 | Repeat Indicator | 6 | 2 | lookup | 1 | 0 | - | 0-3 | 0=default, 3=do not repeat |
| 3 | User ID (MMSI) | 8 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | Maritime Mobile Service Identity (primary key) |
| 4 | Longitude | 40 | 32 | int32 | 1e-7 | 0 | deg | -180 to 180 | 1/10,000,000 degree resolution |
| 5 | Latitude | 72 | 32 | int32 | 1e-7 | 0 | deg | -90 to 90 | 1/10,000,000 degree resolution |
| 6 | Position Accuracy | 104 | 1 | lookup | 1 | 0 | - | 0-1 | 0=low (>10m), 1=high (<10m) |
| 7 | RAIM | 105 | 1 | lookup | 1 | 0 | - | 0-1 | Receiver Autonomous Integrity Monitoring |
| 8 | Time Stamp | 106 | 6 | uint6 | 1 | 0 | - | 0-63 | UTC second (60=not available, 61=manual, 62=dead reckoning, 63=inoperative) |
| 9 | COG | 112 | 16 | uint16 | 0.0001 | 0 | rad | 0-6.2832 | Course Over Ground in radians |
| 10 | SOG | 128 | 16 | uint16 | 0.01 | 0 | m/s | 0-655.32 | Speed Over Ground |
| 11 | Communication State | 144 | 19 | binary | - | - | - | - | TDMA slot allocation data |
| 12 | AIS Transceiver Info | 163 | 5 | lookup | 1 | 0 | - | 0-29 | AIS_TRANSCEIVER enum |
| 13 | Heading | 168 | 16 | uint16 | 0.0001 | 0 | rad | 0-6.2832 | True heading |
| 14 | Rate of Turn | 184 | 16 | int16 | 3.125e-5 | 0 | rad/s | -1.024 to 1.024 | Rate of turn (positive = starboard) |
| 15 | Nav Status | 200 | 4 | lookup | 1 | 0 | - | 0-14 | NAV_STATUS enum |
| 16 | Special Maneuver Indicator | 204 | 2 | lookup | 1 | 0 | - | 0-3 | AIS_SPECIAL_MANEUVER enum |
| 17 | Reserved | 206 | 2 | reserved | - | - | - | - | - |
| 18 | Spare | 208 | 3 | spare | - | - | - | - | - |
| 19 | Reserved | 211 | 5 | reserved | - | - | - | - | - |
| 20 | Sequence ID | 216 | 8 | uint8 | 1 | 0 | - | 0-252 | Sequence ID |

**Go parsing notes:**
- Convert COG/Heading from radians to degrees: `deg = rad * 180.0 / math.Pi`
- Convert SOG to knots: `kn = ms * 1.94384`
- Longitude/Latitude: `degrees = raw_int32 * 1e-7`
- Rate of Turn to deg/min: `degPerMin = radPerSec * 60 * 180 / math.Pi`

---

### PGN 129039 -- AIS Class B Position Report

| Property | Value |
|----------|-------|
| PGN | 129039 (0x1F80F) |
| Description | AIS Class B Position Report |
| Priority | 4 |
| Type | Fast-Packet |
| Data Length | 27 bytes (216 bits) |
| Update Rate | Irregular (typically 30s for CS, 5s for SO) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Message ID | 0 | 6 | lookup | 1 | 0 | - | 0-61 | AIS message type (18 or 19) |
| 2 | Repeat Indicator | 6 | 2 | lookup | 1 | 0 | - | 0-3 | Repeat count |
| 3 | User ID (MMSI) | 8 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | MMSI (primary key) |
| 4 | Longitude | 40 | 32 | int32 | 1e-7 | 0 | deg | -180 to 180 | Position |
| 5 | Latitude | 72 | 32 | int32 | 1e-7 | 0 | deg | -90 to 90 | Position |
| 6 | Position Accuracy | 104 | 1 | lookup | 1 | 0 | - | 0-1 | Accuracy flag |
| 7 | RAIM | 105 | 1 | lookup | 1 | 0 | - | 0-1 | RAIM flag |
| 8 | Time Stamp | 106 | 6 | uint6 | 1 | 0 | - | 0-63 | UTC second |
| 9 | COG | 112 | 16 | uint16 | 0.0001 | 0 | rad | 0-6.2832 | Course Over Ground |
| 10 | SOG | 128 | 16 | uint16 | 0.01 | 0 | m/s | 0-655.32 | Speed Over Ground |
| 11 | Communication State | 144 | 19 | binary | - | - | - | - | TDMA slot data |
| 12 | AIS Transceiver Info | 163 | 5 | lookup | 1 | 0 | - | 0-29 | AIS_TRANSCEIVER enum |
| 13 | Heading | 168 | 16 | uint16 | 0.0001 | 0 | rad | 0-6.2832 | True heading |
| 14 | Regional Application | 184 | 8 | spare | - | - | - | - | Regional use |
| 15 | Regional Application B | 192 | 2 | spare | - | - | - | - | Regional use |
| 16 | Unit Type | 194 | 1 | lookup | 1 | 0 | - | 0-1 | 0=SOTDMA (Class B SO), 1=CS (Class B CS) |
| 17 | Integrated Display | 195 | 1 | lookup | 1 | 0 | - | 0-1 | Can show messages 12 and 14 |
| 18 | DSC | 196 | 1 | lookup | 1 | 0 | - | 0-1 | Has DSC capability |
| 19 | Band | 197 | 1 | lookup | 1 | 0 | - | 0-1 | 0=top 525 kHz, 1=entire marine band |
| 20 | Can Handle Msg 22 | 198 | 1 | lookup | 1 | 0 | - | 0-1 | Channel management support |
| 21 | AIS Mode | 199 | 1 | lookup | 1 | 0 | - | 0-1 | 0=Autonomous, 1=Assigned |
| 22 | AIS Communication State | 200 | 1 | lookup | 1 | 0 | - | 0-1 | 0=SOTDMA, 1=ITDMA |
| 23 | Reserved | 201 | 15 | reserved | - | - | - | - | - |

**Go parsing notes:**
- Class B has no Rate of Turn or Nav Status (unlike Class A).
- Fields 16-22 are Class B capability flags -- 1-bit fields packed into bytes 24-25.

---

### PGN 129794 -- AIS Class A Static and Voyage Related Data

| Property | Value |
|----------|-------|
| PGN | 129794 (0x1FB02) |
| Description | AIS Class A Static and Voyage Related Data |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 75 bytes (600 bits) |
| Update Rate | Irregular (every 6 minutes, or on change) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Message ID | 0 | 6 | lookup | 1 | 0 | - | 0-61 | AIS message type (5) |
| 2 | Repeat Indicator | 6 | 2 | lookup | 1 | 0 | - | 0-3 | Repeat count |
| 3 | User ID (MMSI) | 8 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | MMSI (primary key) |
| 4 | IMO Number | 40 | 32 | uint32 | 1 | 0 | - | 0-4294967292 | IMO ship identification number |
| 5 | Callsign | 72 | 56 | string_fix | - | - | - | 7 chars | Radio callsign (7 bytes ASCII) |
| 6 | Name | 128 | 160 | string_fix | - | - | - | 20 chars | Vessel name (20 bytes ASCII) |
| 7 | Type of Ship | 288 | 8 | lookup | 1 | 0 | - | 0-252 | SHIP_TYPE enum |
| 8 | Length | 296 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | Overall length |
| 9 | Beam | 312 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | Overall beam/width |
| 10 | Position Ref from Starboard | 328 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | GPS antenna offset from starboard |
| 11 | Position Ref from Bow | 344 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | GPS antenna offset from bow |
| 12 | ETA Date | 360 | 16 | uint16 | 1 | 0 | d | 0-65532 | Days since 1970-01-01 |
| 13 | ETA Time | 376 | 32 | uint32 | 0.0001 | 0 | s | 0-86401 | Seconds since midnight (0.1 ms resolution) |
| 14 | Draft | 408 | 16 | uint16 | 0.01 | 0 | m | 0-655.32 | Maximum static draft |
| 15 | Destination | 424 | 160 | string_fix | - | - | - | 20 chars | Destination port (20 bytes ASCII) |
| 16 | AIS Version Indicator | 584 | 2 | lookup | 1 | 0 | - | 0-3 | AIS_VERSION enum |
| 17 | GNSS Type | 586 | 4 | lookup | 1 | 0 | - | 0-13 | Position fix device type |
| 18 | DTE | 590 | 1 | lookup | 1 | 0 | - | 0-1 | Data Terminal Equipment available |
| 19 | Reserved | 591 | 1 | reserved | - | - | - | - | - |
| 20 | AIS Transceiver Info | 592 | 5 | lookup | 1 | 0 | - | 0-29 | AIS_TRANSCEIVER enum |
| 21 | Reserved | 597 | 3 | reserved | - | - | - | - | - |

---

### PGN 129809 -- AIS Class B CS Static Data Report, Part A

| Property | Value |
|----------|-------|
| PGN | 129809 (0x1FB11) |
| Description | AIS Class B static data (msg 24 Part A) |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 27 bytes (216 bits) |
| Update Rate | Irregular (every 6 minutes) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Message ID | 0 | 6 | lookup | 1 | 0 | - | 0-61 | AIS message type (24) |
| 2 | Repeat Indicator | 6 | 2 | lookup | 1 | 0 | - | 0-3 | Repeat count |
| 3 | User ID (MMSI) | 8 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | MMSI (primary key) |
| 4 | Name | 40 | 160 | string_fix | - | - | - | 20 chars | Vessel name (20 bytes ASCII) |
| 5 | AIS Transceiver Info | 200 | 5 | lookup | 1 | 0 | - | 0-29 | AIS_TRANSCEIVER enum |
| 6 | Reserved | 205 | 3 | reserved | - | - | - | - | - |
| 7 | Sequence ID | 208 | 8 | uint8 | 1 | 0 | - | 0-252 | Links Part A and Part B |

---

### PGN 129810 -- AIS Class B CS Static Data Report, Part B

| Property | Value |
|----------|-------|
| PGN | 129810 (0x1FB12) |
| Description | AIS Class B static data (msg 24 Part B) |
| Priority | 6 |
| Type | Fast-Packet |
| Data Length | 35 bytes (280 bits) |
| Update Rate | Irregular (every 6 minutes) |

| # | Field | Bit Offset | Bit Length | Type | Resolution | Offset | Unit | Range | Description |
|---|-------|-----------|-----------|------|------------|--------|------|-------|-------------|
| 1 | Message ID | 0 | 6 | lookup | 1 | 0 | - | 0-61 | AIS message type (24) |
| 2 | Repeat Indicator | 6 | 2 | lookup | 1 | 0 | - | 0-3 | Repeat count |
| 3 | User ID (MMSI) | 8 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | MMSI (primary key) |
| 4 | Type of Ship | 40 | 8 | lookup | 1 | 0 | - | 0-252 | SHIP_TYPE enum |
| 5 | Vendor ID | 48 | 56 | string_fix | - | - | - | 7 chars | Vendor/manufacturer string |
| 6 | Callsign | 104 | 56 | string_fix | - | - | - | 7 chars | Radio callsign |
| 7 | Length | 160 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | Overall length |
| 8 | Beam | 176 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | Overall beam |
| 9 | Position Ref from Starboard | 192 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | GPS offset from starboard |
| 10 | Position Ref from Bow | 208 | 16 | uint16 | 0.1 | 0 | m | 0-6553.2 | GPS offset from bow |
| 11 | Mothership User ID | 224 | 32 | uint32 | 1 | 0 | - | 2000000-999999999 | Mothership MMSI (for auxiliary craft) |
| 12 | Reserved | 256 | 2 | reserved | - | - | - | - | - |
| 13 | Spare | 258 | 2 | spare | - | - | - | - | - |
| 14 | GNSS Type | 260 | 4 | lookup | 1 | 0 | - | 0-13 | Position fix device |
| 15 | AIS Transceiver Info | 264 | 5 | lookup | 1 | 0 | - | 0-29 | AIS_TRANSCEIVER enum |
| 16 | Reserved | 269 | 3 | reserved | - | - | - | - | - |
| 17 | Sequence ID | 272 | 8 | uint8 | 1 | 0 | - | 0-252 | Links to Part A |

**Go parsing notes:**
- Part A and Part B are correlated by MMSI + Sequence ID.
- Mothership MMSI = 0 for independent vessels; set for tenders/auxiliary craft.

---

## Lookup Tables

### MANUFACTURER_CODE (Major Marine Brands)

| Code | Manufacturer |
|------|-------------|
| 69 | ARKS Enterprises |
| 78 | FW Murphy/Enovation Controls |
| 80 | Twin Disc |
| 85 | Kohler Power Systems |
| 116 | BEP Marine |
| 135 | Airmar |
| 137 | Maretron |
| 140 | Lowrance |
| 144 | Mercury Marine |
| 172 | Yanmar Marine |
| 174 | Volvo Penta |
| 175 | Honda Marine |
| 229 | Garmin |
| 273 | Actisense |
| 275 | Navico |
| 295 | BEP Marine |
| 304 | Empir Bus |
| 311 | Fischer Panda |
| 315 | ICOM |
| 351 | Thrane and Thrane |
| 355 | Mastervolt |
| 358 | Victron Energy |
| 370 | Rolls Royce Marine |
| 374 | Northern Lights |
| 378 | Glendinning |
| 381 | B & G |
| 419 | Fusion Electronics |
| 421 | Standard Horizon |
| 422 | True Heading AB |
| 427 | em-trak Marine Electronics |
| 437 | Digital Yacht |
| 467 | Humminbird Marine Electronics |
| 504 | Vesper Marine Ltd |
| 586 | Suzuki Motor Corporation |
| 645 | Garmin (secondary) |
| 969 | Blue Seas |
| 1851 | Raymarine |
| 1855 | Furuno |
| 1857 | Simrad |
| 1862 | Yamaha Marine |

Full table contains 290 entries. See [canboat source](https://github.com/canboat/canboat/blob/master/docs/canboat.json) for complete list.

---

### DEVICE_CLASS

| Code | Class |
|------|-------|
| 0 | Reserved for 2000 Use |
| 10 | System Tools |
| 20 | Safety Systems |
| 25 | Internetwork Device |
| 30 | Electrical Distribution |
| 35 | Electrical Generation |
| 40 | Steering and Control Surfaces |
| 50 | Propulsion |
| 60 | Navigation |
| 70 | Communication |
| 75 | Sensor Communication Interface |
| 80 | Instrumentation/General Systems |
| 85 | External Environment |
| 90 | Internal Environment |
| 100 | Deck + Cargo + Fishing Equipment |
| 110 | Human Interface |
| 120 | Display |
| 125 | Entertainment |

---

### DEVICE_FUNCTION (by Class, key entries)

Device Function is an indirect lookup -- its meaning depends on the Device Class.

**Class 35 (Electrical Generation):**
| Code | Function |
|------|----------|
| 140 | Engine |
| 141 | DC Generator/Alternator |
| 142 | Solar Panel (Solar Array) |
| 143 | Wind Generator (DC) |
| 144 | Fuel Cell |
| 145 | Network Power Supply |
| 151 | AC Generator |
| 152 | AC Bus |
| 153 | AC Mains (Utility/Shore) |
| 154 | AC Output |
| 160 | Power Converter - Battery Charger |
| 161 | Power Converter - Battery Charger+Inverter |
| 162 | Power Converter - Inverter |
| 163 | Power Converter - DC |
| 170 | Battery |
| 180 | Engine Gateway |

**Class 50 (Propulsion):**
| Code | Function |
|------|----------|
| 130 | Engineroom Monitoring |
| 140 | Engine |
| 141 | DC Generator/Alternator |
| 150 | Engine Controller |
| 151 | AC Generator |
| 155 | Motor |
| 160 | Engine Gateway |
| 165 | Transmission |
| 170 | Throttle/Shift Control |
| 180 | Actuator |
| 190 | Gauge Interface |

**Class 60 (Navigation):**
| Code | Function |
|------|----------|
| 130 | Bottom Depth |
| 135 | Bottom Depth/Speed |
| 136 | Bottom Depth/Speed/Temperature |
| 140 | Ownship Attitude |
| 145 | Ownship Position (GNSS) |
| 150 | Ownship Position (Loran C) |
| 155 | Speed |
| 160 | Turn Rate Indicator |
| 170 | Integrated Navigation |
| 195 | Automatic Identification System (AIS) |
| 200 | Radar |
| 205 | ECDIS |
| 210 | ECS |

**Class 75 (Sensor Communication Interface):**
| Code | Function |
|------|----------|
| 130 | Temperature |
| 140 | Pressure |
| 150 | Fluid Level |
| 160 | Flow |
| 170 | Humidity |

**Class 25 (Internetwork Device):**
| Code | Function |
|------|----------|
| 130 | PC Gateway |
| 135 | NMEA 0183 Gateway |
| 136 | NMEA Network Gateway |
| 137 | NMEA 2000 Wireless Gateway |
| 140 | Router |
| 150 | Bridge |
| 160 | Repeater |

---

### INDUSTRY_CODE

| Code | Industry |
|------|----------|
| 0 | Global |
| 1 | Highway |
| 2 | Agriculture |
| 3 | Construction |
| 4 | Marine Industry |
| 5 | Industrial |

All NMEA 2000 devices use Industry Group = 4 (Marine).

---

### TANK_TYPE (PGN 127505)

| Code | Type |
|------|------|
| 0 | Fuel |
| 1 | Water |
| 2 | Gray Water |
| 3 | Live Well |
| 4 | Oil |
| 5 | Black Water |

---

### DC_SOURCE (PGN 127506)

| Code | Type |
|------|------|
| 0 | Battery |
| 1 | Alternator |
| 2 | Convertor |
| 3 | Solar Cell |
| 4 | Wind Generator |

---

### BATTERY_TYPE (PGN 127513)

| Code | Type |
|------|------|
| 0 | Flooded |
| 1 | Gel |
| 2 | AGM |

---

### BATTERY_VOLTAGE (PGN 127513)

| Code | Voltage |
|------|---------|
| 0 | 6V |
| 1 | 12V |
| 2 | 24V |
| 3 | 32V |
| 4 | 36V |
| 5 | 42V |
| 6 | 48V |

---

### BATTERY_CHEMISTRY (PGN 127513)

| Code | Chemistry |
|------|-----------|
| 0 | Pb (Lead) |
| 1 | Li (Lithium) |
| 2 | NiCd |
| 3 | ZnO |
| 4 | NiMH |

---

### ENGINE_INSTANCE (PGN 127488/127489/127493)

| Code | Instance |
|------|----------|
| 0 | Single Engine or Dual Engine Port |
| 1 | Dual Engine Starboard |

---

### GEAR_STATUS (PGN 127493)

| Code | Status |
|------|--------|
| 0 | Forward |
| 1 | Neutral |
| 2 | Reverse |

---

### ENGINE_STATUS_1 Bit Field (PGN 127489, field 11)

16-bit field, each bit is an independent alarm:

| Bit | Alarm |
|-----|-------|
| 0 | Check Engine |
| 1 | Over Temperature |
| 2 | Low Oil Pressure |
| 3 | Low Oil Level |
| 4 | Low Fuel Pressure |
| 5 | Low System Voltage |
| 6 | Low Coolant Level |
| 7 | Water Flow |
| 8 | Water In Fuel |
| 9 | Charge Indicator |
| 10 | Preheat Indicator |
| 11 | High Boost Pressure |
| 12 | Rev Limit Exceeded |
| 13 | EGR System |
| 14 | Throttle Position Sensor |
| 15 | Emergency Stop |

---

### ENGINE_STATUS_2 Bit Field (PGN 127489, field 12)

16-bit field (only lower 8 bits defined):

| Bit | Alarm |
|-----|-------|
| 0 | Warning Level 1 |
| 1 | Warning Level 2 |
| 2 | Power Reduction |
| 3 | Maintenance Needed |
| 4 | Engine Comm Error |
| 5 | Sub or Secondary Throttle |
| 6 | Neutral Start Protect |
| 7 | Engine Shutting Down |

---

### TEMPERATURE_SOURCE (PGN 130311/130312/130316)

| Code | Source |
|------|--------|
| 0 | Sea Temperature |
| 1 | Outside Temperature |
| 2 | Inside Temperature |
| 3 | Engine Room Temperature |
| 4 | Main Cabin Temperature |
| 5 | Live Well Temperature |
| 6 | Bait Well Temperature |
| 7 | Refrigeration Temperature |
| 8 | Heating System Temperature |
| 9 | Dew Point Temperature |
| 10 | Apparent Wind Chill Temperature |
| 11 | Theoretical Wind Chill Temperature |
| 12 | Heat Index Temperature |
| 13 | Freezer Temperature |
| 14 | Exhaust Gas Temperature |
| 15 | Shaft Seal Temperature |

---

### HUMIDITY_SOURCE (PGN 130311/130313)

| Code | Source |
|------|--------|
| 0 | Inside |
| 1 | Outside |

---

### PRESSURE_SOURCE (PGN 130314)

| Code | Source |
|------|--------|
| 0 | Atmospheric |
| 1 | Water |
| 2 | Steam |
| 3 | Compressed Air |
| 4 | Hydraulic |
| 5 | Filter |
| 6 | Altimeter Setting |
| 7 | Oil |
| 8 | Fuel |

---

### NAV_STATUS (AIS PGNs)

| Code | Status |
|------|--------|
| 0 | Under way using engine |
| 1 | At anchor |
| 2 | Not under command |
| 3 | Restricted maneuverability |
| 4 | Constrained by her draught |
| 5 | Moored |
| 6 | Aground |
| 7 | Engaged in Fishing |
| 8 | Under way sailing |
| 9 | Hazardous material - High Speed |
| 10 | Hazardous material - Wing in Ground |
| 11 | Power-driven vessel towing astern |
| 12 | Power-driven vessel pushing ahead or towing alongside |
| 14 | AIS-SART |

---

### SHIP_TYPE (AIS PGNs)

| Code Range | Type |
|------------|------|
| 0 | Unavailable |
| 20-29 | Wing In Ground |
| 30 | Fishing |
| 31 | Towing |
| 32 | Towing exceeds 200m or wider than 25m |
| 33 | Dredging or underwater operations |
| 34 | Diving operations |
| 35 | Military operations |
| 36 | Sailing |
| 37 | Pleasure |
| 40-49 | High Speed Craft |
| 50 | Pilot vessel |
| 51 | SAR |
| 52 | Tug |
| 53 | Port tender |
| 54 | Anti-pollution |
| 55 | Law enforcement |
| 58 | Medical |
| 60-69 | Passenger ship |
| 70-79 | Cargo ship |
| 80-89 | Tanker |
| 90-99 | Other |

Second digit within each range indicates hazard category: 1=X, 2=Y, 3=Z, 4=OS, 9=no additional info.

---

### OFF_ON (PGN 127501)

| Code | Status |
|------|--------|
| 0 | Off |
| 1 | On |

Values 2-3 indicate Error/Unavailable.

---

### OFF_ON_CONTROL (PGN 127502)

| Code | Status |
|------|--------|
| 0 | Off |
| 1 | On |
| 2 | Reserved |
| 3 | Take no action (no change) |

---

## Implementation Notes for Go

### Fast-Packet Reassembly

```
// Fast-packet frame structure:
// Frame 0: [seq_counter:3 | frame_counter:5=0] [total_bytes] [data x 6]
// Frame N: [seq_counter:3 | frame_counter:5=N] [data x 7]
//
// seq_counter increments per new message (wraps at 7)
// frame_counter starts at 0, increments per frame
// Reassemble by concatenating data portions in frame_counter order
```

### Unavailable/Error Detection

Before converting any field, check for the "unavailable" sentinel:

```
// For unsigned fields: all bits = 1
// For signed fields: most negative value (all bits = 1 in two's complement)
// For lookup fields: max value for the bit width

func isUnavailableU16(v uint16) bool { return v == 0xFFFF }
func isUnavailableI16(v int16) bool  { return v == -32768 } // 0x8000
func isUnavailableU8(v uint8) bool   { return v == 0xFF }

// "Out of range" sentinel is max-1:
func isErrorU16(v uint16) bool { return v == 0xFFFE }
```

### CAN ID Encoding

```
// For broadcast PGNs (PDU2, PGN >= 0xF000):
canID := (uint32(priority) << 26) | (uint32(pgn) << 8) | uint32(sourceAddr)

// For addressed PGNs (PDU1, PGN < 0xF000):
canID := (uint32(priority) << 26) | (uint32(pgnUpper) << 16) | (uint32(destAddr) << 8) | uint32(sourceAddr)
```

### Source Data

All specifications in this document are derived from:
- **canboat v6.1.6** -- https://github.com/canboat/canboat (Apache 2.0)
- **canboat.json** -- The machine-readable PGN database at `docs/canboat.json`
- **NMEA 2000 standard** -- proprietary, but canboat provides open-source reverse-engineered definitions
- **ITU-R M.1371-5** -- AIS technical characteristics (referenced by AIS PGNs)
