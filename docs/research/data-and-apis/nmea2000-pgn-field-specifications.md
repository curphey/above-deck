# NMEA 2000 Navigation PGN Field-Level Specifications

Technical reference for building Go protocol adapters that parse raw CAN bus frames into structured data. All field specifications sourced from the [canboat](https://github.com/canboat/canboat) open-source PGN database (`canboat.json`).

---

## Table of Contents

1. [CAN Frame ID Encoding](#can-frame-id-encoding)
2. [Transport Protocols](#transport-protocols)
3. [ISO 11783 Address Claim (PGN 60928)](#pgn-60928--iso-address-claim)
4. [Data Type Conventions](#data-type-conventions)
5. [PGN Field Tables](#pgn-field-tables)
6. [Lookup Enumerations](#lookup-enumerations)

---

## CAN Frame ID Encoding

NMEA 2000 uses CAN 2.0B extended frames with 29-bit identifiers. The 29-bit CAN ID encodes priority, PGN, source address, and (for PDU1 format) destination address.

### Bit Layout (29-bit Extended CAN ID)

```
Bits [28:26]  Priority (3 bits, 0=highest, 7=lowest)
Bits [25:24]  Reserved + Data Page (R + DP, 2 bits)
Bits [23:16]  PDU Format / PF (8 bits)
Bits [15:8]   PDU Specific / PS (8 bits)
Bits [7:0]    Source Address (8 bits)
```

### PDU1 vs PDU2 Format

The PDU Format (PF) byte determines whether the message is addressed (PDU1) or broadcast (PDU2):

- **PDU1 (PF < 240 / 0xF0):** PS field = destination address. PGN = (RDP << 16) + (PF << 8). These are addressable messages (e.g., ISO Request, Address Claim).
- **PDU2 (PF >= 240 / 0xF0):** PS field is part of the PGN. PGN = (RDP << 16) + (PF << 8) + PS. Destination is implicitly broadcast (0xFF). All navigation PGNs in this document are PDU2.

### Decoding Algorithm (from canboat `common.c`)

```
func DecodeCANID(id uint32) (prio, pgn, src, dst uint32) {
    PF  := uint8(id >> 16)
    PS  := uint8(id >> 8)
    RDP := uint8(id >> 24) & 0x03
    
    src  = id & 0xFF
    prio = (id >> 26) & 0x07
    
    if PF < 240 {
        // PDU1: PS is destination address
        dst = uint32(PS)
        pgn = (uint32(RDP) << 16) + (uint32(PF) << 8)
    } else {
        // PDU2: PS is part of PGN, destination is broadcast
        dst = 0xFF
        pgn = (uint32(RDP) << 16) + (uint32(PF) << 8) + uint32(PS)
    }
    return
}
```

### Encoding Algorithm

```
func EncodeCANID(prio, pgn, src, dst uint32) uint32 {
    canId := (src & 0xFF) | 0x80000000  // bit 31 set = extended frame
    PF := (pgn >> 8) & 0xFF
    
    if PF < 240 {
        canId |= (dst & 0xFF) << 8
        canId |= pgn << 8
    } else {
        canId |= pgn << 8
    }
    canId |= prio << 26
    return canId
}
```

---

## Transport Protocols

### Single Frame

Messages with data length <= 8 bytes. Transmitted as a single CAN frame. The 8-byte CAN data payload maps directly to the PGN field definitions.

Identifiable by: `Type: "Single"` in PGN definitions, or `Length <= 8`.

### Fast Packet

Messages with data length > 8 bytes but typically <= 223 bytes. NMEA 2000-specific protocol (not ISO 11783). Uses multiple CAN frames with a proprietary reassembly scheme.

**Frame structure:**

- **Frame 0 (first frame):** Byte 0 = `(sequence_id << 5) | frame_counter` where `frame_counter = 0`. Byte 1 = total data bytes. Bytes 2-7 = first 6 bytes of payload.
- **Frames 1-N (subsequent frames):** Byte 0 = `(sequence_id << 5) | frame_counter`. Bytes 1-7 = next 7 bytes of payload.

**Key constants:**
```
FASTPACKET_BUCKET_0_SIZE    = 6   // payload bytes in frame 0
FASTPACKET_BUCKET_N_SIZE    = 7   // payload bytes in frames 1+
FASTPACKET_BUCKET_0_OFFSET  = 2   // data starts at byte 2 in frame 0
FASTPACKET_BUCKET_N_OFFSET  = 1   // data starts at byte 1 in frames 1+
FASTPACKET_MAX_INDEX        = 31  // max frame counter (5 bits)
FASTPACKET_MAX_SIZE         = 6 + 7 * 31 = 223 bytes max payload
```

**Sequence ID:** 3-bit counter (bits [7:5] of byte 0) that increments with each new message. Used to distinguish interleaved messages from the same PGN/source.

**Frame counter:** 5-bit counter (bits [4:0] of byte 0), 0 for first frame, incrementing for each subsequent frame.

**Reassembly:**
1. Extract `frame = data[0] & 0x1F`, `seq = data[0] & 0xE0`
2. Match to existing buffer by (PGN, source, sequence)
3. If frame == 0: record total size from `data[1]`, calculate expected frame count = `1 + ceil(totalSize / 7)`
4. Copy payload into reassembly buffer at correct offset
5. Track received frames via bitmask; when all expected frames received, deliver complete message

**PGN range rule:**
- PGNs in range 0x10000-0x1EFFF can use fast packet
- PGNs < 0x10000 or >= 0x1F000 use single frame
- Some PGNs (0x1F000-0x1FFFF) can be either, depending on actual data length

### ISO 11783 Multi-Packet (TP)

For messages > 223 bytes or ISO-standard multi-packet. Uses Transport Protocol (TP) with two management PGNs:

- **PGN 60416 (TP.CM):** Connection Management. Initiates transfer, announces total bytes and packet count.
- **PGN 60160 (TP.DT):** Data Transfer. Carries the actual data packets (7 bytes each, sequence-numbered).

BAM (Broadcast Announce Message) is the broadcast variant. RTS/CTS is the addressed variant with flow control.

Not needed for the navigation PGNs in this document (all fit within fast packet), but relevant for very large proprietary PGNs.

---

## Data Type Conventions

### Field Value Encoding

All multi-byte integer fields are **little-endian** (least significant byte first), matching CAN bus byte ordering.

### Reserved Values (Sentinel Values)

For any field of bit width N:
- **Not available / Unknown:** All bits set to 1 (e.g., 0xFFFF for 16-bit unsigned)
- **Out of range / Error:** All bits set to 1 except LSB (e.g., 0xFFFE for 16-bit unsigned)
- **Reserved:** 0xFFFD for 16-bit unsigned (and similar patterns for other widths)

For unsigned fields of width N:
- Max valid value = `(2^N) - 4` (values above this are sentinel)

For signed fields, the negative sentinel values follow the same pattern using two's complement.

### Common Physical Quantities and Their Encoding

| Quantity | Wire Unit | Resolution | Notes |
|----------|-----------|------------|-------|
| Angle | radians | 0.0001 rad | Convert to degrees: value * 180 / pi |
| Angular Velocity | rad/s | 3.125e-08 rad/s | Very high precision for rate of turn |
| Speed | m/s | 0.01 m/s | Convert to knots: value * 1.94384 |
| Length/Distance | meters | varies | Resolution varies by PGN |
| Temperature | Kelvin | 0.01 K | Convert to Celsius: value - 273.15 |
| Pressure | Pascals | varies | Convert to mbar: value / 100 |
| Latitude | degrees | 1e-07 deg (32-bit) or 1e-16 deg (64-bit) | Signed, negative = South |
| Longitude | degrees | 1e-07 deg (32-bit) or 1e-16 deg (64-bit) | Signed, negative = West |
| Date | days | 1 day | Days since 1970-01-01 (Unix epoch) |
| Time | seconds | 0.0001 s | Seconds since midnight UTC |
| Duration | seconds | varies | Resolution varies by PGN |

### Converting Wire Values to Engineering Units

```
engineering_value = raw_integer_value * resolution + offset
```

Most fields have offset = 0. The `offset` field in the canboat JSON is rare; when present it shifts the zero point.

### STRING_LAU Type

Length-prefixed string: first byte = total length (including the length byte itself), second byte = encoding (0 = ASCII/UTF-8, 1 = Unicode/UTF-16). Remaining bytes = string data.

---

## PGN 60928 -- ISO Address Claim

| Property | Value |
|----------|-------|
| PGN | 60928 (0xEE00) |
| Description | ISO Address Claim |
| Priority | 6 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | Irregular (on request / startup) |

Used for network address arbitration. Each device broadcasts its 64-bit ISO NAME; the device with the numerically lowest NAME wins address conflicts. Industry Group = 4 (Marine) for NMEA 2000 devices. Arbitrary Address Capable = 1 for all N2K devices.

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Unique Number | 0 | 21 | uint | no | 1 | 0-2097148 | - | ISO Identity Number |
| 2 | Manufacturer Code | 21 | 11 | LOOKUP | no | 1 | 0-2044 | - | See MANUFACTURER_CODE enum |
| 3 | Device Instance Lower | 32 | 3 | uint | no | 1 | 0-7 | - | ISO ECU Instance |
| 4 | Device Instance Upper | 35 | 5 | uint | no | 1 | 0-31 | - | ISO Function Instance |
| 5 | Device Function | 40 | 8 | INDIRECT_LOOKUP | no | 1 | 0-252 | - | ISO Function (meaning depends on Device Class) |
| 6 | Spare | 48 | 1 | SPARE | - | - | - | - | - |
| 7 | Device Class | 49 | 7 | LOOKUP | no | 1 | 0-125 | - | See DEVICE_CLASS enum |
| 8 | System Instance | 56 | 4 | uint | no | 1 | 0-13 | - | ISO Device Class Instance |
| 9 | Industry Group | 60 | 3 | LOOKUP | no | 1 | 0-6 | - | 4 = Marine Industry |
| 10 | Arbitrary Address Capable | 63 | 1 | LOOKUP | no | 1 | 0-1 | - | 1 = yes (always 1 for N2K) |

**Address claim procedure:**
1. On power-up, device sends Address Claim with its 64-bit NAME and desired source address
2. If another device has the same address, the one with the numerically lower NAME wins
3. Losing device must either claim a different address or go offline (send Cannot Claim = address 254)
4. Request for Address Claim: PGN 59904 (ISO Request) requesting PGN 60928

---

## PGN 126992 -- System Time

| Property | Value |
|----------|-------|
| PGN | 126992 (0x1F010) |
| Description | System Time |
| Priority | 3 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID, ties related PGNs together |
| 2 | Source | 8 | 4 | LOOKUP | no | 1 | 0-13 | - | See SYSTEM_TIME enum (GPS, GLONASS, etc.) |
| 3 | Reserved | 12 | 4 | RESERVED | - | - | - | - | - |
| 4 | Date | 16 | 16 | DATE | no | 1 | 0-65532 | days | Days since 1970-01-01 |
| 5 | Time | 32 | 32 | TIME | - | 0.0001 | 0-86401 | s | Seconds since midnight UTC |

---

## PGN 127245 -- Rudder

| Property | Value |
|----------|-------|
| PGN | 127245 (0x1F10D) |
| Description | Rudder |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Instance | 0 | 8 | uint | no | 1 | 0-252 | - | Rudder instance (primary key) |
| 2 | Direction Order | 8 | 3 | LOOKUP | no | 1 | 0-6 | - | See DIRECTION_RUDDER enum |
| 3 | Reserved | 11 | 5 | RESERVED | - | - | - | - | - |
| 4 | Angle Order | 16 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Commanded rudder angle |
| 5 | Position | 32 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Actual rudder angle |
| 6 | Reserved | 48 | 16 | RESERVED | - | - | - | - | - |

---

## PGN 127250 -- Vessel Heading

| Property | Value |
|----------|-------|
| PGN | 127250 (0x1F112) |
| Description | Vessel Heading |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Heading | 8 | 16 | uint16 | no | 0.0001 | 0-6.2832 | rad | Vessel heading |
| 3 | Deviation | 24 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Magnetic deviation |
| 4 | Variation | 40 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Magnetic variation |
| 5 | Reference | 56 | 2 | LOOKUP | no | 1 | 0-2 | - | See DIRECTION_REFERENCE enum |
| 6 | Reserved | 58 | 6 | RESERVED | - | - | - | - | - |

**Notes:** True Heading = Magnetic Heading + Variation. Compass Heading + Deviation = Magnetic Heading.

---

## PGN 127251 -- Rate of Turn

| Property | Value |
|----------|-------|
| PGN | 127251 (0x1F113) |
| Description | Rate of Turn |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Rate | 8 | 32 | int32 | yes | 3.125e-08 | +/-67.109 | rad/s | Rate of turn. Positive = turning to starboard |
| 3 | Reserved | 40 | 24 | RESERVED | - | - | - | - | - |

**Notes:** Resolution is extremely fine (3.125e-08 rad/s = ~0.0000018 deg/s). To convert to deg/min: `value_rad_s * 180 / pi * 60`.

---

## PGN 127257 -- Attitude

| Property | Value |
|----------|-------|
| PGN | 127257 (0x1F119) |
| Description | Attitude |
| Priority | 3 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Yaw | 8 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Yaw angle |
| 3 | Pitch | 24 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Pitch angle (positive = bow up) |
| 4 | Roll | 40 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Roll/heel angle (positive = starboard down) |
| 5 | Reserved | 56 | 8 | RESERVED | - | - | - | - | - |

---

## PGN 127258 -- Magnetic Variation

| Property | Value |
|----------|-------|
| PGN | 127258 (0x1F11A) |
| Description | Magnetic Variation |
| Priority | 7 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Source | 8 | 4 | LOOKUP | no | 1 | 0-13 | - | See MAGNETIC_VARIATION enum |
| 3 | Reserved | 12 | 4 | RESERVED | - | - | - | - | - |
| 4 | Age of Service | 16 | 16 | DATE | no | 1 | 0-65532 | days | Date of variation model |
| 5 | Variation | 32 | 16 | int16 | yes | 0.0001 | +/-3.1416 | rad | Magnetic variation (positive = East) |
| 6 | Reserved | 48 | 16 | RESERVED | - | - | - | - | - |

---

## PGN 128259 -- Speed, Water Referenced

| Property | Value |
|----------|-------|
| PGN | 128259 (0x1F503) |
| Description | Speed |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Speed Water Referenced | 8 | 16 | uint16 | no | 0.01 | 0-655.32 | m/s | Speed through water |
| 3 | Speed Ground Referenced | 24 | 16 | uint16 | no | 0.01 | 0-655.32 | m/s | Speed over ground |
| 4 | Speed Water Referenced Type | 40 | 8 | LOOKUP | no | 1 | 0-252 | - | See WATER_REFERENCE enum |
| 5 | Speed Direction | 48 | 4 | uint | no | 1 | 0-13 | - | Speed direction |
| 6 | Reserved | 52 | 12 | RESERVED | - | - | - | - | - |

**Notes:** To convert m/s to knots: `value * 1.94384`.

---

## PGN 128267 -- Water Depth

| Property | Value |
|----------|-------|
| PGN | 128267 (0x1F50B) |
| Description | Water Depth |
| Priority | 3 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Depth | 8 | 32 | uint32 | no | 0.01 | 0-42949672.92 | m | Depth below transducer |
| 3 | Offset | 40 | 16 | int16 | yes | 0.001 | +/-32.767 | m | Transducer offset. Positive = distance to waterline. Negative = distance to keel. |
| 4 | Range | 56 | 8 | uint8 | no | 10 | 0-2520 | m | Max measurement range of sounder |

**Notes:** True depth below waterline = Depth - Offset (when offset is positive/waterline). Depth below keel = Depth + abs(Offset) (when offset is negative/keel).

---

## PGN 128275 -- Distance Log

| Property | Value |
|----------|-------|
| PGN | 128275 (0x1F513) |
| Description | Distance Log |
| Priority | 6 |
| Type | **Fast Packet** |
| Data Length | 14 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Date | 0 | 16 | DATE | no | 1 | 0-65532 | days | Days since 1970-01-01 |
| 2 | Time | 16 | 32 | TIME | - | 0.0001 | 0-86401 | s | Seconds since midnight UTC |
| 3 | Log | 48 | 32 | uint32 | no | 1 | 0-4294967292 | m | Total cumulative distance |
| 4 | Trip Log | 80 | 32 | uint32 | no | 1 | 0-4294967292 | m | Distance since last reset |

**Notes:** This is the simplest fast-packet PGN. 14 bytes requires 3 CAN frames: frame 0 carries 6 bytes of payload, frame 1 carries 7 bytes, frame 2 carries 1 byte.

---

## PGN 129025 -- Position, Rapid Update

| Property | Value |
|----------|-------|
| PGN | 129025 (0x1F801) |
| Description | Position, Rapid Update |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Latitude | 0 | 32 | int32 | yes | 1e-07 | +/-90 | deg | Latitude. Negative = South |
| 2 | Longitude | 32 | 32 | int32 | yes | 1e-07 | +/-180 | deg | Longitude. Negative = West |

**Notes:** This is the most compact position PGN -- no SID, no metadata, just lat/lng. At 10 Hz, this provides the primary position stream for chartplotters. Resolution of 1e-07 degrees = ~0.011 mm at the equator.

---

## PGN 129026 -- COG & SOG, Rapid Update

| Property | Value |
|----------|-------|
| PGN | 129026 (0x1F802) |
| Description | COG & SOG, Rapid Update |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 250 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | COG Reference | 8 | 2 | LOOKUP | no | 1 | 0-2 | - | See DIRECTION_REFERENCE enum |
| 3 | Reserved | 10 | 6 | RESERVED | - | - | - | - | - |
| 4 | COG | 16 | 16 | uint16 | no | 0.0001 | 0-6.2832 | rad | Course Over Ground |
| 5 | SOG | 32 | 16 | uint16 | no | 0.01 | 0-655.32 | m/s | Speed Over Ground |
| 6 | Reserved | 48 | 16 | RESERVED | - | - | - | - | - |

---

## PGN 129029 -- GNSS Position Data

| Property | Value |
|----------|-------|
| PGN | 129029 (0x1F805) |
| Description | GNSS Position Data |
| Priority | 3 |
| Type | **Fast Packet** |
| Data Length | 43 bytes minimum (variable with repeating fields) |
| Update Rate | 1000 ms |
| Repeating Fields | Fields 16-18, count in field 15 |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Date | 8 | 16 | DATE | no | 1 | 0-65532 | days | Days since 1970-01-01 |
| 3 | Time | 24 | 32 | TIME | - | 0.0001 | 0-86401 | s | Seconds since midnight UTC |
| 4 | Latitude | 56 | 64 | int64 | yes | 1e-16 | +/-90 | deg | High-precision latitude |
| 5 | Longitude | 120 | 64 | int64 | yes | 1e-16 | +/-180 | deg | High-precision longitude |
| 6 | Altitude | 184 | 64 | int64 | yes | 1e-06 | large | m | Altitude referenced to WGS-84 |
| 7 | GNSS Type | 248 | 4 | LOOKUP | no | 1 | 0-13 | - | See GNS enum |
| 8 | Method | 252 | 4 | LOOKUP | no | 1 | 0-13 | - | See GNS_METHOD enum |
| 9 | Integrity | 256 | 2 | LOOKUP | no | 1 | 0-3 | - | See GNS_INTEGRITY enum |
| 10 | Reserved | 258 | 6 | RESERVED | - | - | - | - | - |
| 11 | Number of SVs | 264 | 8 | uint | no | 1 | 0-252 | - | Satellites used in solution |
| 12 | HDOP | 272 | 16 | int16 | yes | 0.01 | +/-327.67 | - | Horizontal dilution of precision |
| 13 | PDOP | 288 | 16 | int16 | yes | 0.01 | +/-327.67 | - | Positional dilution of precision |
| 14 | Geoidal Separation | 304 | 32 | int32 | yes | 0.01 | +/-21474836 | m | Difference between WGS-84 ellipsoid and geoid |
| 15 | Reference Stations | 336 | 8 | uint | no | 1 | 0-252 | - | Count of following repeating field sets |
| 16* | Reference Station Type | 344 | 4 | LOOKUP | no | 1 | 0-13 | - | See GNS enum (repeating) |
| 17* | Reference Station ID | 348 | 12 | uint | no | 1 | 0-4092 | - | DGPS station ID (repeating) |
| 18* | Age of DGNSS Corrections | 360 | 16 | uint16 | no | 0.01 | 0-655.32 | s | Age of corrections (repeating) |

*Fields 16-18 repeat `Reference Stations` times.

**Notes:** This is the primary high-accuracy position PGN. The 64-bit lat/lng fields provide sub-nanometer theoretical resolution (1e-16 degrees). At 43+ bytes, requires 7+ CAN frames via fast packet.

---

## PGN 129033 -- Time & Date

| Property | Value |
|----------|-------|
| PGN | 129033 (0x1F809) |
| Description | Time & Date |
| Priority | 3 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Date | 0 | 16 | DATE | no | 1 | 0-65532 | days | Days since 1970-01-01 |
| 2 | Time | 16 | 32 | TIME | - | 0.0001 | 0-86401 | s | Seconds since midnight UTC |
| 3 | Local Offset | 48 | 16 | int16 | yes | 60 | +/-1966020 | s | Offset from UTC in minutes (resolution = 60s). Signed: positive = ahead of UTC |

**Notes:** Unlike PGN 126992, this PGN includes the local timezone offset. The Local Offset resolution of 60 seconds means the raw value is in minutes.

---

## PGN 129283 -- Cross Track Error

| Property | Value |
|----------|-------|
| PGN | 129283 (0x1F903) |
| Description | Cross Track Error |
| Priority | 3 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | XTE Mode | 8 | 4 | LOOKUP | no | 1 | 0-13 | - | See RESIDUAL_MODE enum |
| 3 | Reserved | 12 | 2 | RESERVED | - | - | - | - | - |
| 4 | Navigation Terminated | 14 | 2 | LOOKUP | no | 1 | 0-2 | - | See YES_NO enum |
| 5 | XTE | 16 | 32 | int32 | yes | 0.01 | +/-21474836 | m | Cross track error. Positive = vessel is to starboard of intended track |
| 6 | Reserved | 48 | 16 | RESERVED | - | - | - | - | - |

---

## PGN 129284 -- Navigation Data

| Property | Value |
|----------|-------|
| PGN | 129284 (0x1F904) |
| Description | Navigation Data |
| Priority | 3 |
| Type | **Fast Packet** |
| Data Length | 34 bytes |
| Update Rate | 1000 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Distance to Waypoint | 8 | 32 | uint32 | no | 0.01 | 0-42949672.92 | m | Distance to active waypoint |
| 3 | Course/Bearing Reference | 40 | 2 | LOOKUP | no | 1 | 0-2 | - | See DIRECTION_REFERENCE enum |
| 4 | Perpendicular Crossed | 42 | 2 | LOOKUP | no | 1 | 0-2 | - | See YES_NO enum |
| 5 | Arrival Circle Entered | 44 | 2 | LOOKUP | no | 1 | 0-2 | - | See YES_NO enum |
| 6 | Calculation Type | 46 | 2 | LOOKUP | no | 1 | 0-2 | - | See BEARING_MODE enum |
| 7 | ETA Time | 48 | 32 | TIME | - | 0.0001 | 0-86401 | s | Seconds since midnight for ETA |
| 8 | ETA Date | 80 | 16 | DATE | no | 1 | 0-65532 | days | Days since epoch for ETA |
| 9 | Bearing, Origin to Dest WP | 96 | 16 | uint16 | no | 0.0001 | 0-6.2832 | rad | Bearing from origin to destination |
| 10 | Bearing, Position to Dest WP | 112 | 16 | uint16 | no | 0.0001 | 0-6.2832 | rad | Bearing from current position to destination |
| 11 | Origin Waypoint Number | 128 | 32 | uint32 | no | 1 | 0-4294967292 | - | Origin waypoint ID |
| 12 | Destination Waypoint Number | 160 | 32 | uint32 | no | 1 | 0-4294967292 | - | Destination waypoint ID |
| 13 | Destination Latitude | 192 | 32 | int32 | yes | 1e-07 | +/-90 | deg | Waypoint latitude |
| 14 | Destination Longitude | 224 | 32 | int32 | yes | 1e-07 | +/-180 | deg | Waypoint longitude |
| 15 | Waypoint Closing Velocity | 256 | 16 | int16 | yes | 0.01 | +/-327.67 | m/s | VMG towards waypoint |

---

## PGN 129285 -- Navigation Route/WP Information

| Property | Value |
|----------|-------|
| PGN | 129285 (0x1F905) |
| Description | Navigation - Route/WP Information |
| Priority | 6 |
| Type | **Fast Packet** |
| Data Length | 10 bytes minimum (variable with repeating fields) |
| Update Rate | Irregular (on route change) |
| Repeating Fields | Fields 10-13, count in field 2 |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | Start RPS# | 0 | 16 | uint16 | no | 1 | 0-65532 | - | Starting route/waypoint pair sequence number |
| 2 | nItems | 16 | 16 | uint16 | no | 1 | 0-65532 | - | Number of WP items in this message |
| 3 | Database ID | 32 | 16 | uint16 | no | 1 | 0-65532 | - | Database identifier |
| 4 | Route ID | 48 | 16 | uint16 | no | 1 | 0-65532 | - | Route identifier |
| 5 | Navigation Direction | 64 | 3 | LOOKUP | no | 1 | 0-6 | - | See DIRECTION enum |
| 6 | Supplementary Data Available | 67 | 2 | LOOKUP | no | 1 | 0-2 | - | See OFF_ON enum |
| 7 | Reserved | 69 | 3 | RESERVED | - | - | - | - | - |
| 8 | Route Name | 72 | variable | STRING_LAU | - | - | - | - | Length-prefixed string |
| 9 | Reserved | - | 8 | RESERVED | - | - | - | - | - |
| 10* | WP ID | - | 16 | uint16 | no | 1 | 0-65532 | - | Waypoint identifier (repeating) |
| 11* | WP Name | - | variable | STRING_LAU | - | - | - | - | Waypoint name (repeating) |
| 12* | WP Latitude | - | 32 | int32 | yes | 1e-07 | +/-90 | deg | Waypoint latitude (repeating) |
| 13* | WP Longitude | - | 32 | int32 | yes | 1e-07 | +/-180 | deg | Waypoint longitude (repeating) |

*Fields 10-13 repeat `nItems` times. Bit offsets for repeating fields are dynamic due to variable-length Route Name and WP Name strings.

**Notes:** STRING_LAU format: byte 0 = total length (including length byte + encoding byte), byte 1 = encoding (0=ASCII/UTF-8, 1=UTF-16), bytes 2+ = string data.

---

## PGN 130306 -- Wind Data

| Property | Value |
|----------|-------|
| PGN | 130306 (0x1FD02) |
| Description | Wind Data |
| Priority | 2 |
| Type | Single Frame |
| Data Length | 8 bytes |
| Update Rate | 100 ms |

| # | Field | Bit Offset | Bit Length | Type | Signed | Resolution | Range | Unit | Description |
|---|-------|-----------|-----------|------|--------|------------|-------|------|-------------|
| 1 | SID | 0 | 8 | uint | no | 1 | 0-252 | - | Sequence ID |
| 2 | Wind Speed | 8 | 16 | uint16 | no | 0.01 | 0-655.32 | m/s | Wind speed |
| 3 | Wind Angle | 24 | 16 | uint16 | no | 0.0001 | 0-6.2832 | rad | Wind angle relative to reference |
| 4 | Reference | 40 | 3 | LOOKUP | no | 1 | 0-6 | - | See WIND_REFERENCE enum (primary key) |
| 5 | Reserved | 43 | 21 | RESERVED | - | - | - | - | - |

**Notes:** The Reference field is the primary key -- the same PGN is transmitted separately for apparent wind, true wind (ground ref), true wind (boat ref), etc. Wind Angle for apparent wind: 0 = bow, increasing clockwise. For true wind (ground ref): 0 = North.

---

## Lookup Enumerations

### DIRECTION_REFERENCE
| Value | Name |
|-------|------|
| 0 | True |
| 1 | Magnetic |
| 2 | Error |

### DIRECTION_RUDDER
| Value | Name |
|-------|------|
| 0 | No Order |
| 1 | Move to starboard |
| 2 | Move to port |

### SYSTEM_TIME
| Value | Name |
|-------|------|
| 0 | GPS |
| 1 | GLONASS |
| 2 | Radio Station |
| 3 | Local Cesium clock |
| 4 | Local Rubidium clock |
| 5 | Local Crystal clock |

### MAGNETIC_VARIATION
| Value | Name |
|-------|------|
| 0 | Manual |
| 1 | Automatic Chart |
| 2 | Automatic Table |
| 3 | Automatic Calculation |
| 4 | WMM 2000 |
| 5 | WMM 2005 |
| 6 | WMM 2010 |
| 7 | WMM 2015 |
| 8 | WMM 2020 |
| 9 | WMM 2025 |

### WATER_REFERENCE
| Value | Name |
|-------|------|
| 0 | Paddle wheel |
| 1 | Pitot tube |
| 2 | Doppler |
| 3 | Correlation (ultra sound) |
| 4 | Electro Magnetic |

### WIND_REFERENCE
| Value | Name |
|-------|------|
| 0 | True (ground referenced to North) |
| 1 | Magnetic (ground referenced to Magnetic North) |
| 2 | Apparent |
| 3 | True (boat referenced) |
| 4 | True (water referenced) |

### GNS (GNSS Type)
| Value | Name |
|-------|------|
| 0 | GPS |
| 1 | GLONASS |
| 2 | GPS+GLONASS |
| 3 | GPS+SBAS/WAAS |
| 4 | GPS+SBAS/WAAS+GLONASS |
| 5 | Chayka |
| 6 | integrated |
| 7 | surveyed |
| 8 | Galileo |

### GNS_METHOD
| Value | Name |
|-------|------|
| 0 | no GNSS |
| 1 | GNSS fix |
| 2 | DGNSS fix |
| 3 | Precise GNSS |
| 4 | RTK Fixed Integer |
| 5 | RTK float |
| 6 | Estimated (DR) mode |
| 7 | Manual Input |
| 8 | Simulate mode |

### GNS_INTEGRITY
| Value | Name |
|-------|------|
| 0 | No integrity checking |
| 1 | Safe |
| 2 | Caution |
| 3 | Unsafe |

### RESIDUAL_MODE
| Value | Name |
|-------|------|
| 0 | Autonomous |
| 1 | Differential enhanced |
| 2 | Estimated |
| 3 | Simulator |
| 4 | Manual |

### BEARING_MODE
| Value | Name |
|-------|------|
| 0 | Great Circle |
| 1 | Rhumbline |

### DIRECTION
| Value | Name |
|-------|------|
| 0 | Forward |
| 1 | Reverse |

### YES_NO
| Value | Name |
|-------|------|
| 0 | No |
| 1 | Yes |

### OFF_ON
| Value | Name |
|-------|------|
| 0 | Off |
| 1 | On |

### DEVICE_CLASS
| Value | Name |
|-------|------|
| 0 | Reserved for 2000 Use |
| 10 | System tools |
| 20 | Safety systems |
| 25 | Internetwork device |
| 30 | Electrical Distribution |
| 35 | Electrical Generation |
| 40 | Steering and Control surfaces |
| 50 | Propulsion |
| 60 | Navigation |
| 70 | Communication |
| 75 | Sensor Communication Interface |
| 80 | Instrumentation/general systems |
| 85 | External Environment |
| 90 | Internal Environment |
| 100 | Deck + cargo + fishing equipment systems |
| 110 | Human Interface |
| 120 | Display |
| 125 | Entertainment |

### INDUSTRY_CODE
| Value | Name |
|-------|------|
| 0 | Global |
| 1 | Highway |
| 2 | Agriculture |
| 3 | Construction |
| 4 | Marine Industry |
| 5 | Industrial |

---

## PGN Summary Table

| PGN | Name | Priority | Type | Length | Rate (ms) | Key Fields |
|-----|------|----------|------|--------|-----------|------------|
| 60928 | ISO Address Claim | 6 | Single | 8 | Irregular | 64-bit ISO NAME |
| 126992 | System Time | 3 | Single | 8 | 1000 | Source, Date, Time |
| 127245 | Rudder | 2 | Single | 8 | 100 | Instance, Angle Order, Position |
| 127250 | Vessel Heading | 2 | Single | 8 | 100 | Heading, Deviation, Variation, Reference |
| 127251 | Rate of Turn | 2 | Single | 8 | 100 | Rate (32-bit, ultra-fine resolution) |
| 127257 | Attitude | 3 | Single | 8 | 1000 | Yaw, Pitch, Roll |
| 127258 | Magnetic Variation | 7 | Single | 8 | 1000 | Source, Variation |
| 128259 | Speed | 2 | Single | 8 | 1000 | STW, SOG, Sensor Type |
| 128267 | Water Depth | 3 | Single | 8 | 1000 | Depth, Offset, Range |
| 128275 | Distance Log | 6 | Fast | 14 | 1000 | Log, Trip Log |
| 129025 | Position, Rapid | 2 | Single | 8 | 100 | Latitude, Longitude (32-bit) |
| 129026 | COG & SOG, Rapid | 2 | Single | 8 | 250 | COG, SOG |
| 129029 | GNSS Position | 3 | Fast | 43+ | 1000 | Lat/Lng (64-bit), Alt, GNSS metadata |
| 129033 | Time & Date | 3 | Single | 8 | 1000 | Date, Time, Local Offset |
| 129283 | Cross Track Error | 3 | Single | 8 | 1000 | XTE, Mode, Nav Terminated |
| 129284 | Navigation Data | 3 | Fast | 34 | 1000 | Dist to WP, Bearings, ETA, WP coords |
| 129285 | Route/WP Info | 6 | Fast | 10+ | Irregular | Route Name, WP list with coords |
| 130306 | Wind Data | 2 | Single | 8 | 100 | Speed, Angle, Reference type |

---

## Implementation Notes for Go

### Bit-Level Field Extraction

Fields are not always byte-aligned. The general extraction pattern:

```
// For a field starting at bitOffset with bitLength bits:
byteOffset := bitOffset / 8
bitStart   := bitOffset % 8  // bit position within the starting byte

// Read enough bytes to cover the field
// For fields <= 32 bits, read into uint32; for 64-bit fields, read into uint64
// Apply mask: (1 << bitLength) - 1
// For signed fields, sign-extend from bitLength to native int width
```

### Byte Order

CAN bus data bytes are in transmission order. Multi-byte integer fields within the payload are **little-endian**. This is consistent across all NMEA 2000 PGNs.

### Sentinel Value Detection

Before applying resolution/offset scaling, check for sentinel values:

```
// For unsigned N-bit field:
maxValid := (1 << N) - 4  // or (uint(1)<<N) - 4
// Raw values above maxValid are sentinels:
// allOnes     = not available / unknown
// allOnes - 1 = out of range / error  
// allOnes - 2 = reserved

// For signed N-bit field (two's complement):
// The pattern is similar but in the negative range
```

### SID (Sequence ID) Correlation

Many PGNs include a SID field. When multiple PGNs share the same SID value from the same source address within a close time window, their data was derived from the same measurement epoch. Use this to correlate, e.g., heading + rate of turn, or COG + SOG with position.

### Source

All field specifications in this document are derived from the canboat project's `canboat.json` database (https://github.com/canboat/canboat), which is the most complete open-source reverse-engineering of the NMEA 2000 protocol. The NMEA 2000 standard itself is proprietary and requires a paid license from NMEA, but the wire protocol has been extensively documented through clean-room reverse engineering.
