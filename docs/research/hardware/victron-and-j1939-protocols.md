# Victron Energy & SAE J1939 Protocol Specifications

Technical reference for building Go protocol adapters. Covers Victron VE.Direct (serial),
VE.Can (CAN bus), Victron MQTT (via Cerbo GX), and SAE J1939 engine data as used in
marine diesel applications.

---

## 1. Victron VE.Direct Protocol

### 1.1 Physical Layer

| Parameter       | Value                                |
|-----------------|--------------------------------------|
| Interface       | TTL UART (serial)                    |
| Baud rate       | 19200 bps                            |
| Data bits       | 8                                    |
| Parity          | None                                 |
| Stop bits       | 1                                    |
| Flow control    | None                                 |
| Connector       | 4-pin JST-PH                         |

**Pinout (VE.Direct connector):**

| Pin | Function | Notes                              |
|-----|----------|------------------------------------|
| 1   | GND      | Ground                             |
| 2   | RX       | Data input to Victron device       |
| 3   | TX       | Data output from Victron device    |
| 4   | Power    | 5V (MPPT) or 3.3V (BMV, inverters)|

**Voltage levels by product:**
- MPPT solar chargers: 5V TTL
- BMV-700 series: 3.3V TTL
- MPPT RS, Multi RS, Phoenix Inverters (250-1200VA), Smart Inverters: 3.3V TTL

**Power pin:** Max 10mA average, with max 20mA/5ms bursts.

### 1.2 Text Protocol Format

The device transmits data blocks at 1-second intervals. Each block contains multiple fields,
terminated by a checksum field.

**Frame structure:**

```
<Newline><Field-Label><TAB><Field-Value><Newline>
<Field-Label><TAB><Field-Value><Newline>
...
Checksum<TAB><Checksum-Byte>
```

- Fields are `\r\n` delimited (CR+LF)
- Label and value separated by horizontal tab (`\t`, 0x09)
- Maximum 22 fields per block
- Values are ASCII-encoded decimal or hex

**Checksum calculation (TEXT mode):**
The modulo-256 sum of all bytes in the entire block (including the checksum byte itself)
must equal zero. To verify: iterate through every byte in the block, sum them, and check
`sum % 256 == 0`.

### 1.3 Complete Field Registry

#### 1.3.1 MPPT Solar Charge Controllers

| Label | Unit     | Scale | Description                           |
|-------|----------|-------|---------------------------------------|
| PID   | hex      | —     | Product ID (e.g., 0xA04A)             |
| FW    | —        | —     | Firmware version (e.g., 159 = v1.59)  |
| SER#  | —        | —     | Serial number                         |
| V     | mV       | 1     | Battery voltage                       |
| I     | mA       | 1     | Battery current (>0 charging)         |
| VPV   | mV       | 1     | Panel voltage                         |
| PPV   | W        | 1     | Panel power                           |
| CS    | enum     | —     | Charge state (see enum table)         |
| MPPT  | enum     | —     | Tracker operating mode (see enum)     |
| ERR   | enum     | —     | Error code (see enum table)           |
| OR    | bitmask  | —     | Off reason (see bitmask table)        |
| LOAD  | ON/OFF   | —     | Load output state                     |
| IL    | mA       | 1     | Load current                          |
| H19   | 0.01 kWh | 1     | Yield total (lifetime)                |
| H20   | 0.01 kWh | 1     | Yield today                           |
| H21   | W        | 1     | Maximum power today                   |
| H22   | 0.01 kWh | 1     | Yield yesterday                       |
| H23   | W        | 1     | Maximum power yesterday               |
| HSDS  | —        | 1     | Day sequence number (0-364)           |
| Checksum | —     | —     | Frame checksum byte                   |

**Notes:**
- `I` on MPPT 75/15 and 100/15 reports battery current since firmware v1.15. Earlier firmware reported converter output current.
- `IL` only available on models with a load output.

#### 1.3.2 BMV Battery Monitors / SmartShunt

| Label | Unit   | Scale | Description                            |
|-------|--------|-------|----------------------------------------|
| PID   | hex    | —     | Product ID                             |
| FW    | —      | —     | Firmware version                       |
| V     | mV     | 1     | Main battery voltage                   |
| VS    | mV     | 1     | Auxiliary (starter) battery voltage    |
| VM    | mV     | 1     | Mid-point voltage of battery bank      |
| DM    | ‰      | 1     | Mid-point deviation (0.1%)             |
| I     | mA     | 1     | Battery current (>0 charging, <0 discharging) |
| P     | W      | 1     | Instantaneous power                    |
| CE    | mAh    | 1     | Consumed amp-hours                     |
| SOC   | ‰      | 1     | State of charge (0.1%, so 1000 = 100%) |
| TTG   | min    | 1     | Time to go (minutes, 65535 = infinite) |
| T     | °C     | 1     | Battery temperature                    |
| Alarm | ON/OFF | —     | Alarm condition active                 |
| Relay | ON/OFF | —     | Relay state                            |
| AR    | bitmask| —     | Alarm reason (see bitmask table)       |
| BMV   | —      | —     | Model description (e.g., "702")        |
| H1    | mAh    | 1     | Deepest discharge                      |
| H2    | mAh    | 1     | Last discharge                         |
| H3    | mAh    | 1     | Average discharge                      |
| H4    | —      | 1     | Number of charge cycles                |
| H5    | —      | 1     | Number of full discharges              |
| H6    | mAh    | 1     | Cumulative amp-hours drawn             |
| H7    | mV     | 1     | Minimum main voltage                   |
| H8    | mV     | 1     | Maximum main voltage                   |
| H9    | sec    | 1     | Seconds since last full charge         |
| H10   | —      | 1     | Number of automatic synchronisations   |
| H11   | —      | 1     | Number of low main voltage alarms      |
| H12   | —      | 1     | Number of high main voltage alarms     |
| H13   | —      | 1     | Number of low auxiliary voltage alarms  |
| H14   | —      | 1     | Number of high auxiliary voltage alarms |
| H15   | mV     | 1     | Minimum auxiliary voltage              |
| H16   | mV     | 1     | Maximum auxiliary voltage              |
| H17   | 0.01 kWh| 1    | Discharged energy                      |
| H18   | 0.01 kWh| 1    | Charged energy                         |
| Checksum| —    | —     | Frame checksum byte                    |

#### 1.3.3 Phoenix Inverters

| Label    | Unit | Scale | Description                         |
|----------|------|-------|-------------------------------------|
| PID      | hex  | —     | Product ID                          |
| FW       | —    | —     | Firmware version                    |
| SER#     | —    | —     | Serial number                       |
| V        | mV   | 1     | DC input voltage                    |
| AC_OUT_V | 0.01V| 1     | AC output voltage                   |
| AC_OUT_I | 0.1A | 1     | AC output current                   |
| AC_OUT_S | VA   | 1     | AC output apparent power            |
| CS       | enum | —     | Device state (see enum table)       |
| MODE     | enum | —     | Operating mode (see enum table)     |
| AR       | bitmask| —   | Alarm reason (see bitmask table)    |
| WARN     | bitmask| —   | Warning reason (same bits as AR)    |
| OR       | bitmask| —   | Off reason (see bitmask table)      |
| ERR      | enum | —     | Error code (see enum table)         |
| Checksum | —    | —     | Frame checksum byte                 |

### 1.4 Enum and Bitmask Definitions

#### CS — State of Operation (Charge State)

| Value | Label         | Applicable Devices          |
|-------|---------------|-----------------------------|
| 0     | Off           | All                         |
| 1     | Low Power     | MPPT (AES mode)             |
| 2     | Fault         | All                         |
| 3     | Bulk          | MPPT, chargers              |
| 4     | Absorption    | MPPT, chargers              |
| 5     | Float         | MPPT, chargers              |
| 6     | Storage       | MPPT                        |
| 7     | Equalize (manual) | MPPT                    |
| 8     | Passthru      | Inverter/charger            |
| 9     | Inverting     | Inverter                    |
| 10    | Assisting     | Inverter/charger            |
| 11    | Power Supply  | Inverter/charger            |
| 252   | External Control | MPPT (DVCC/ESS)          |

#### MPPT — Tracker Operating Mode

| Value | Label                  |
|-------|------------------------|
| 0     | Off                    |
| 1     | Voltage/current limited|
| 2     | MPPT Tracker active    |

#### MODE — Device Mode

| Value | Label         |
|-------|---------------|
| 1     | Charger Only  |
| 2     | Inverter Only |
| 3     | On            |
| 4     | Off           |

#### ERR — Error Codes (MPPT Solar Chargers)

| Code | Description                                   |
|------|-----------------------------------------------|
| 0    | No error                                      |
| 1    | Battery temperature too high                  |
| 2    | Battery voltage too high                      |
| 3    | Remote temperature sensor failure (short)     |
| 4    | Remote temperature sensor failure (short)     |
| 5    | Remote temperature sensor failure (disconnected)|
| 6    | Remote battery voltage sense failure (short)  |
| 7    | Remote battery voltage sense failure (short)  |
| 8    | Remote battery voltage sense failure (disconnected)|
| 11   | Battery high ripple voltage                   |
| 14   | Battery low temperature                       |
| 17   | Controller overheated despite reduced output  |
| 18   | Controller over-current                       |
| 20   | Maximum bulk-time exceeded                    |
| 21   | Current sensor issue                          |
| 22   | Internal temperature sensor failure (A)       |
| 23   | Internal temperature sensor failure (B)       |
| 24   | Fan failure                                   |
| 26   | Terminal overheated                           |
| 27   | Charger short circuit                         |
| 28   | Power stage issue                             |
| 29   | Over-charge protection                        |
| 33   | PV over-voltage                               |
| 34   | PV over-current                               |
| 35   | PV over-power                                 |
| 38   | PV input shutdown (excessive current)         |
| 39   | PV input shutdown (excessive current)         |
| 40   | PV input failed to shutdown                   |
| 41   | Inverter shutdown (PV isolation)              |
| 42   | Inverter shutdown (PV isolation)              |
| 43   | Inverter shutdown (ground fault)              |
| 50   | Inverter overload                             |
| 51   | Inverter temperature too high                 |
| 52   | Inverter peak current                         |
| 53   | Inverter output voltage too high              |
| 54   | Inverter output voltage too low               |
| 55   | Inverter self test failed (A)                 |
| 56   | Inverter self test failed (B)                 |
| 58   | Inverter self test failed (C)                 |
| 59   | ACIN1 relay test fault                        |
| 65   | Communication warning                        |
| 66   | Incompatible device                           |
| 67   | BMS connection lost                           |
| 68   | Network misconfigured (A)                     |
| 69   | Network misconfigured (B)                     |
| 70   | Network misconfigured (C)                     |
| 71   | Network misconfigured (D)                     |
| 72   | Phase rotation                                |
| 73   | Multiple AC inputs                            |
| 74   | Phase overload                                |
| 80-87| PV input shutdown (variants)                  |
| 114  | CPU temperature too high                      |
| 116  | Calibration data lost                         |
| 117  | Incompatible firmware                         |
| 119  | Settings data lost                            |
| 121  | Tester fail                                   |
| 200  | Internal DC voltage error (A)                 |
| 201  | Internal DC voltage error (B)                 |
| 202  | Internal GFCI sensor error                    |
| 203  | Internal supply voltage error (A)             |
| 205  | Internal supply voltage error (B)             |
| 212  | Internal supply voltage error (C)             |
| 215  | Internal supply voltage error (D)             |

#### AR — Alarm Reason (Bitmask)

Multiple alarm conditions can be active simultaneously. The value is the sum of active bits,
transmitted as decimal.

| Bit  | Value  | Description              |
|------|--------|--------------------------|
| 0    | 1      | Low voltage              |
| 1    | 2      | High voltage             |
| 2    | 4      | Low SOC                  |
| 3    | 8      | Low starter voltage      |
| 4    | 16     | High starter voltage     |
| 5    | 32     | Low temperature          |
| 6    | 64     | High temperature         |
| 7    | 128    | Mid-point voltage deviation|
| 8    | 256    | Overload                 |
| 9    | 512    | DC ripple                |
| 10   | 1024   | Low AC voltage           |
| 11   | 2048   | High AC voltage          |

**WARN** (Warning Reason): Uses the same bitmask definition as AR. Implemented on inverters only.

#### OR — Off Reason (Bitmask)

| Bit  | Value       | Description                            |
|------|-------------|----------------------------------------|
| 0    | 0x00000001  | No input power                         |
| 1    | 0x00000002  | Switched off (power switch)            |
| 2    | 0x00000004  | Switched off (device mode register)    |
| 3    | 0x00000008  | Remote input                           |
| 4    | 0x00000010  | Protection active                      |
| 5    | 0x00000020  | Paygo                                  |
| 6    | 0x00000040  | BMS                                    |
| 7    | 0x00000080  | Engine shutdown detection              |
| 8    | 0x00000100  | Analysing input voltage                |

### 1.5 HEX Protocol

The HEX protocol runs on the same serial connection as the TEXT protocol and enables
bidirectional communication (read/write registers and configuration). It is used for
commands and configuration changes.

**Frame format:**

```
:<Command><Data bytes in hex><Checksum>\n
```

- Start marker: `:` (colon, 0x3A)
- End marker: `\n` (newline, 0x0A)
- All data bytes encoded as uppercase hex ASCII: `['0'..'9'], ['A'..'F']`
- Numbers are Little Endian

**Checksum (HEX mode):**
Start with 0x55, subtract each data byte (not the ASCII representation, the actual byte
value after hex decoding), result modulo 256. The checksum is appended as two hex
characters.

**Command nibbles:**

| Nibble | Direction        | Description                    |
|--------|------------------|--------------------------------|
| 1      | Host → Device    | Ping                           |
| 3      | Host → Device    | Get register                   |
| 5      | Host → Device    | Set register                   |
| 7      | Host → Device    | Async message (no reply needed)|
| A      | Device → Host    | Ping response                  |
| 1      | Device → Host    | Done (set response)            |
| 3      | Device → Host    | Get response                   |
| 5      | Device → Host    | Set response                   |
| 7      | Device → Host    | Async notification             |

**Get command example:**
```
:7ABED00D6\n     (get register 0xEDAB)
```
The register address is sent in Little Endian (0xAB, 0xED), plus flags byte.

**Response codes:**

| Value | Meaning          |
|-------|------------------|
| 0x00  | OK               |
| 0x01  | Unknown ID       |
| 0x02  | Not supported    |
| 0x04  | Parameter error  |

**Key register addresses (MPPT):**

| Register | Description                |
|----------|----------------------------|
| 0x0200   | Device mode                |
| 0x0201   | Device state               |
| 0xEDDA   | Charger error code         |
| 0xEDDB   | Charge current limit       |
| 0xEDDC   | System yield total         |
| 0xEDDD   | System yield today         |
| 0xEDDE   | Max power today            |
| 0xEDDF   | Yield yesterday            |
| 0xEDE0   | Max power yesterday        |
| 0xEDE1   | Battery voltage setting    |
| 0xEDE2   | Battery current            |
| 0xEDF1   | Battery type               |
| 0xEDB3   | MPPT tracker mode          |
| 0x0FFF   | SOC (BMV)                  |
| 0x0FFE   | TTG (BMV)                  |

---

## 2. Victron VE.Can Protocol

### 2.1 Physical Layer

| Parameter       | Value                                 |
|-----------------|---------------------------------------|
| Bus standard    | CAN 2.0B (29-bit extended identifier) |
| Bit rate        | 250 kbps                              |
| Connector       | RJ-45 (Victron standard)              |
| Termination     | 120Ω at each end of bus               |
| Max devices     | ~25 per bus segment                   |

VE.Can is electrically and physically compatible with NMEA 2000, though most Victron
VE.Can devices are not NMEA 2000 certified. They coexist on the same CAN bus.

### 2.2 Protocol Structure

VE.Can uses standard CAN 2.0B extended frames (29-bit identifiers) with 8-byte data
payloads. It follows the NMEA 2000 / ISO 11783 addressing conventions:

```
29-bit CAN ID:
  Priority (3 bits) | Reserved (1) | Data Page (1) | PDU Format (8) | PDU Specific (8) | Source Address (8)
```

For broadcast PGNs (PDU Format >= 240): PDU Specific extends the PGN.
For addressed PGNs (PDU Format < 240): PDU Specific is the destination address.

### 2.3 Victron Proprietary PGNs

Victron's NMEA 2000 manufacturer code is **358**. Proprietary messages use:
- PGN 0xEF00 (61184) — Single-frame proprietary messages
- PGN 0x1EF00 (126720) — Fast-packet proprietary messages

The Victron "VE.Can Registers Public" document defines proprietary request/response
frames for reading and writing device parameters. These use the proprietary PGN space
with Victron's manufacturer code embedded in the first two bytes of the data field.

### 2.4 Standard NMEA 2000 PGNs on VE.Can

Victron devices also broadcast standard NMEA 2000 PGNs:

| PGN    | Description                  | Broadcast by          |
|--------|------------------------------|-----------------------|
| 127506 | DC Detailed Status           | BMV, SmartShunt       |
| 127508 | Battery Status               | BMV, SmartShunt       |
| 127513 | Battery Configuration Status | BMV                   |
| 126996 | Product Information          | All                   |
| 126998 | Configuration Information    | All                   |

### 2.5 Cerbo GX as Aggregator

The Cerbo GX (or other Venus OS GX devices) acts as the central hub:
- Connects to VE.Can via RJ-45 port (CAN bus at 250 kbps)
- Reads data from all VE.Can devices on the bus
- Maps each device to a D-Bus service internally
- Exposes all data via MQTT, D-Bus, and the VRM portal
- VE.Can devices appear alongside VE.Direct devices in the same namespace

---

## 3. Victron MQTT (via Cerbo GX / dbus-flashmq)

Since Venus OS v3.20, MQTT is provided by **dbus-flashmq** (a FlashMQ plugin replacing
the older dbus-mqtt Python service). Enabled via `Settings → Services → MQTT` on the GX
device. Accessible on TCP port 1883 (local network) or 8883 (TLS, VRM remote).

### 3.1 Topic Structure

```
<prefix>/<portal_id>/<service_type>/<device_instance>/<dbus_path>
```

- **portal_id**: VRM portal ID (found in `Settings → VRM online portal`)
- **service_type**: D-Bus service name suffix (e.g., `solarcharger`, `battery`, `vebus`, `system`)
- **device_instance**: Numeric identifier making same-type services unique
- **dbus_path**: Hierarchical path to specific value

### 3.2 Topic Prefixes

| Prefix | Direction       | Purpose                                  |
|--------|-----------------|------------------------------------------|
| `N/`   | Device → Client | Notifications (published on D-Bus change)|
| `R/`   | Client → Device | Read requests (force immediate refresh)  |
| `W/`   | Client → Device | Write commands (change D-Bus values)     |

### 3.3 Payload Format

All payloads are JSON:

```json
{"value": 936}
```

Special cases:
- Invalid/unavailable value: `{"value": null}`
- Device disappeared: empty payload (zero bytes)
- Settings with limits: `{"value": 1, "min": 0, "max": 1}`

### 3.4 Keep-Alive Mechanism

dbus-flashmq does NOT use retained messages. Instead, clients must actively request data:

1. Send empty message to `R/<portal_id>/keepalive`
2. System republishes all current topic values
3. Completion signalled via `N/<portal_id>/full_publish_completed` with timestamp
4. Timeout: 60 seconds — after expiration, null values are not republished
5. Rate limited to 3 requests/second on recent Venus OS versions

**Suppress republish option** (for periodic keep-alives to reduce traffic):
```json
{"keepalive-options": ["suppress-republish"]}
```

### 3.5 Complete Topic Path Reference

#### 3.5.1 Battery / SmartShunt (`battery`)

| Path                         | Unit    | Description                        |
|------------------------------|---------|------------------------------------|
| `/Dc/0/Voltage`              | V       | Main battery voltage               |
| `/Dc/0/Current`              | A       | Current (positive = charging)      |
| `/Dc/0/Power`                | W       | Power (positive = charging)        |
| `/Dc/0/Temperature`          | °C      | Battery temperature                |
| `/Dc/0/MidVoltage`           | V       | Midpoint voltage (BMV-702)         |
| `/Dc/0/MidVoltageDeviation`  | %       | Midpoint deviation (BMV-702)       |
| `/Dc/1/Voltage`              | V       | Starter battery voltage (BMV-702)  |
| `/Soc`                       | %       | State of charge (0-100)            |
| `/TimeToGo`                  | s       | Time until discharge floor (max 864000) |
| `/ConsumedAmphours`          | Ah      | Consumed energy                    |
| `/Info/MaxChargeCurrent`     | A       | BMS charge current limit (CCL)     |
| `/Info/MaxDischargeCurrent`  | A       | BMS discharge current limit (DCL)  |
| `/Info/MaxChargeVoltage`     | V       | Maximum charge voltage             |
| `/Info/ChargeRequest`        | 0/1     | Extremely low, needs charging      |
| `/Alarms/LowVoltage`        | 0/1/2   | 0=OK, 1=warning, 2=alarm          |
| `/Alarms/HighVoltage`        | 0/1/2   | High voltage alarm                 |
| `/Alarms/LowSoc`             | 0/1/2   | Low state of charge alarm          |
| `/Alarms/HighTemperature`    | 0/1/2   | High temperature alarm             |
| `/Alarms/LowTemperature`     | 0/1/2   | Low temperature alarm              |
| `/Alarms/MidVoltage`         | 0/1/2   | Midpoint deviation alarm (BMV)     |
| `/Alarms/HighChargeCurrent`  | 0/1/2   | Excessive charge current           |
| `/Alarms/HighDischargeCurrent`| 0/1/2  | Excessive discharge current        |
| `/Alarms/CellImbalance`      | 0/1/2  | Cell voltage imbalance             |
| `/Alarms/InternalFailure`    | 0/1/2   | Internal BMS fault                 |
| `/History/DeepestDischarge`  | %       | Deepest discharge recorded         |
| `/History/ChargeCycles`      | count   | Total charge cycles                |
| `/History/TotalAhDrawn`      | Ah      | Total energy drawn                 |
| `/History/MinimumVoltage`    | V       | Lowest voltage recorded            |
| `/History/MaximumVoltage`    | V       | Highest voltage recorded           |
| `/History/DischargedEnergy`  | kWh     | Total discharged energy            |
| `/History/ChargedEnergy`     | kWh     | Total charged energy               |

#### 3.5.2 Solar Charger (`solarcharger`)

| Path                        | Unit | Description                           |
|-----------------------------|------|---------------------------------------|
| `/NrOfTrackers`             | int  | Number of MPPT trackers               |
| `/Pv/V`                     | V    | PV voltage (single tracker)           |
| `/Yield/Power`              | W    | Total PV power                        |
| `/MppOperationMode`         | enum | 0=off, 1=limited, 2=MPPT active       |
| `/Pv/0/V`                   | V    | Tracker 0 voltage (multi-tracker)     |
| `/Pv/0/P`                   | W    | Tracker 0 power (multi-tracker)       |
| `/Pv/0/MppOperationMode`    | enum | Tracker 0 mode                        |
| `/Dc/0/Voltage`             | V    | Battery voltage                       |
| `/Dc/0/Current`             | A    | Charge current (positive = charging)  |
| `/Yield/User`               | kWh  | User-resettable energy total          |
| `/Yield/System`             | kWh  | System energy total (not resettable)  |
| `/Load/State`               | 0/1  | Load relay status                     |
| `/Load/I`                   | A    | Load current                          |
| `/ErrorCode`                | int  | Error/fault code (see ERR table)      |
| `/State`                    | enum | Charger state (0=off, 2=fault, 3=bulk, 4=absorption, 5=float, 6=storage, 7=equalize, 252=external-control) |
| `/Mode`                     | enum | 1=on, 4=off (writable)                |
| `/DeviceOffReason`          | mask | Why device is offline (OR bitmask)    |
| `/Relay/0/State`            | 0/1  | Relay status                          |
| `/Link/ChargeCurrent`       | A    | DVCC charge current limit (writable)  |
| `/Link/ChargeVoltage`       | V    | DVCC charge voltage setpoint (writable)|
| `/Link/NetworkMode`         | mask | Control mode (0x1=external, 0x4=V/I external, 0x8=BMS) |

#### 3.5.3 Inverter/Charger (`vebus`)

| Path                              | Unit | Description                          |
|-----------------------------------|------|--------------------------------------|
| `/Ac/ActiveIn/L1/V`              | V    | AC input phase 1 voltage             |
| `/Ac/ActiveIn/L1/I`              | A    | AC input phase 1 current             |
| `/Ac/ActiveIn/L1/F`              | Hz   | AC input phase 1 frequency           |
| `/Ac/ActiveIn/L1/P`              | W    | AC input phase 1 real power          |
| `/Ac/ActiveIn/L1/S`              | VA   | AC input phase 1 apparent power      |
| `/Ac/ActiveIn/P`                 | W    | Total AC input power                 |
| `/Ac/ActiveIn/ActiveInput`       | enum | 0=ACin-1, 1=ACin-2, 240=inverting   |
| `/Ac/Out/L1/V`                   | V    | AC output phase 1 voltage            |
| `/Ac/Out/L1/I`                   | A    | AC output phase 1 current            |
| `/Ac/Out/L1/P`                   | W    | AC output phase 1 power              |
| `/Ac/Out/P`                      | W    | Total AC output power                |
| `/Ac/In/1/CurrentLimit`          | A    | Input 1 current limit (read/write)   |
| `/Ac/In/1/CurrentLimitIsAdjustable`| 0/1| Whether limit is adjustable          |
| `/Dc/0/Voltage`                  | V    | Battery voltage                      |
| `/Dc/0/Current`                  | A    | Battery current (positive=charging)  |
| `/Dc/0/Power`                    | W    | Battery power                        |
| `/Dc/0/Temperature`              | °C   | Battery temperature                  |
| `/Mode`                          | enum | 1=charger-only, 2=inverter-only, 3=on, 4=off |
| `/State`                         | enum | Charger state (0-11, see CS table)   |
| `/Alarms/LowBattery`            | 0/1/2| Low battery alarm                    |
| `/Alarms/HighDcVoltage`         | 0/1/2| High DC voltage alarm                |
| `/Alarms/HighDcCurrent`         | 0/1/2| High DC current alarm                |
| `/Alarms/L1/Overload`           | 0/1/2| Phase 1 overload alarm               |
| `/Alarms/L1/HighTemperature`    | 0/1/2| Phase 1 temperature alarm            |
| `/Alarms/Ripple`                | 0/1/2| DC ripple alarm                      |
| `/Alarms/PhaseRotation`         | 0/1/2| Phase rotation error                 |
| `/Bms/AllowToCharge`            | 0/1  | BMS charge permission                |
| `/Bms/AllowToDischarge`         | 0/1  | BMS discharge permission             |
| `/Settings/SystemSetup/AcInput1`| enum | 0=unused, 1=grid, 2=genset, 3=shore  |

Note: L2 and L3 paths follow the same pattern as L1 for three-phase systems.

#### 3.5.4 System (`system`)

| Path                             | Unit | Description                          |
|----------------------------------|------|--------------------------------------|
| `/Dc/Battery/Voltage`            | V    | System battery voltage               |
| `/Dc/Battery/Current`            | A    | System battery current               |
| `/Dc/Battery/Power`              | W    | System battery power                 |
| `/Dc/Battery/Soc`                | %    | System state of charge (0-100)       |
| `/Dc/Battery/Temperature`        | °C   | Battery temperature                  |
| `/Dc/Battery/TimeToGo`           | s    | Time until discharge floor           |
| `/Dc/Battery/ConsumedAmphours`   | Ah   | Consumed energy                      |
| `/Dc/Pv/Current`                 | A    | Total solar current                  |
| `/Dc/Pv/Power`                   | W    | Total solar power                    |
| `/Dc/Charger/Power`              | W    | Charger power output                 |
| `/Dc/Vebus/Current`              | A    | VE.Bus system current                |
| `/Dc/Vebus/Power`                | W    | VE.Bus system power                  |
| `/Dc/System/Power`               | W    | Total DC system consumption          |
| `/Ac/ActiveIn/Source`            | enum | 0=unavailable, 1=grid, 2=genset, 3=shore, 240=inverting |
| `/Ac/Consumption/L1/Power`       | W    | Phase 1 AC consumption               |
| `/Ac/Consumption/L2/Power`       | W    | Phase 2 AC consumption               |
| `/Ac/Consumption/L3/Power`       | W    | Phase 3 AC consumption               |
| `/Ac/Grid/L1/Power`              | W    | Grid power phase 1                   |
| `/Ac/Genset/L1/Power`            | W    | Generator power phase 1              |
| `/Ac/PvOnGrid/L1/Power`          | W    | PV power to grid phase 1             |
| `/Ac/PvOnOutput/L1/Power`        | W    | PV power to loads phase 1            |
| `/SystemState/State`             | enum | System operational state              |
| `/SystemState/BatteryLife`       | 0/1  | BatteryLife mode active              |
| `/SystemState/ChargeDisabled`    | 0/1  | Charging disabled by BMS             |
| `/SystemState/DischargeDisabled` | 0/1  | Discharging disabled by BMS          |
| `/Hub`                           | enum | 1=Hub-1, 2=Hub-2, 3=Hub-3, 4=ESS    |
| `/Batteries`                     | JSON | All battery objects in system         |
| `/Timers/TimeOnGrid`            | s    | Grid connected time                  |
| `/Timers/TimeOnGenerator`       | s    | Generator time                       |
| `/Timers/TimeOnInverter`        | s    | Inverting time                       |

#### 3.5.5 ESS Settings (`settings`)

| Path                                           | Unit | Description                    |
|------------------------------------------------|------|--------------------------------|
| `/Settings/CGwacs/Hub4Mode`                     | enum | 1=optimized, 2=keep-charged, 3=external |
| `/Settings/CGwacs/AcPowerSetPoint`              | W    | Grid setpoint                  |
| `/Settings/CGwacs/MaxChargePower`               | W    | Max charge power               |
| `/Settings/CGwacs/MaxDischargePower`             | W    | Max inverter power             |
| `/Settings/CGwacs/BatteryLife/MinimumSocLimit`  | %    | Minimum discharge SOC          |
| `/Settings/CGwacs/OvervoltageFeedIn`            | 0/1  | Allow grid feed-in             |
| `/Settings/CGwacs/PreventFeedback`              | 0/1  | PV zero feed-in                |

### 3.6 VRM Remote MQTT Access

| Parameter  | Value                                               |
|------------|-----------------------------------------------------|
| Broker     | `mqtt<N>.victronenergy.com` where N = `portalId_hash % 128` |
| Port       | 8883 (TLS)                                          |
| Username   | VRM email address                                   |
| Password   | `Token <access_token>` (preferred) or account password |

---

## 4. SAE J1939 Engine PGNs (Marine Diesel)

### 4.1 J1939 CAN ID Structure

J1939 uses CAN 2.0B extended frames (29-bit identifiers) at **250 kbps**.

```
29-bit CAN ID breakdown:
┌──────────┬──────────┬───────────┬──────────────┬───────────────┐
│ Priority │ Reserved │ Data Page │  PDU Format  │  PDU Specific │ Source Address
│ 3 bits   │ 1 bit    │ 1 bit     │  8 bits      │  8 bits       │ 8 bits
└──────────┴──────────┴───────────┴──────────────┴───────────────┘

PGN = (Reserved << 17) | (Data Page << 16) | (PDU Format << 8) | PDU Specific*

* If PDU Format >= 240: PDU Specific extends the PGN (broadcast)
  If PDU Format < 240: PDU Specific = destination address, PGN uses only PDU Format
```

**SPN decoding formula:**
```
Physical Value = (Raw Value × Resolution) + Offset
```

### 4.2 PGN 61444 — Electronic Engine Controller 1 (EEC1)

CAN ID: `0x0CF00400` (priority 3) | Transmission rate: 10-20 ms

| SPN  | Field                          | Byte  | Bits | Resolution   | Offset | Unit  | Range          |
|------|--------------------------------|-------|------|--------------|--------|-------|----------------|
| 899  | Engine Torque Mode             | 1     | 4    | state enum   | 0      | —     | 0-15           |
| 4154 | Actual Engine - Percent Torque (Fractional) | 1.5 | 4 | 0.125 | 0   | %     | 0-0.875        |
| 512  | Driver's Demand Engine Torque  | 2     | 8    | 1            | -125   | %     | -125 to 125    |
| 513  | Actual Engine - Percent Torque | 3     | 8    | 1            | -125   | %     | -125 to 125    |
| **190** | **Engine Speed**            | **4-5** | **16** | **0.125**  | **0**  | **RPM** | **0-8031.875** |
| 1483 | Source Address (controlling)   | 6     | 8    | 1            | 0      | —     | 0-255          |
| 1675 | Engine Starter Mode            | 7     | 4    | state enum   | 0      | —     | 0-15           |
| 2432 | Engine Demand - Percent Torque | 8     | 8    | 1            | -125   | %     | -125 to 125    |

### 4.3 PGN 65262 — Engine Temperature 1 (ET1)

CAN ID: `0x18FEEE00` (priority 6) | Transmission rate: 1000 ms

| SPN  | Field                       | Byte  | Bits | Resolution | Offset | Unit | Range         |
|------|-----------------------------|-------|------|------------|--------|------|---------------|
| **110** | **Engine Coolant Temperature** | **1** | **8** | **1**   | **-40** | **°C** | **-40 to 210** |
| 174  | Fuel Temperature 1          | 2     | 8    | 1          | -40    | °C   | -40 to 210    |
| 175  | Engine Oil Temperature 1    | 3-4   | 16   | 0.03125    | -273   | °C   | -273 to 1735  |
| 176  | Turbo Oil Temperature       | 5-6   | 16   | 0.03125    | -273   | °C   | -273 to 1735  |
| 52   | Engine Intercooler Temperature | 7   | 8    | 1          | -40    | °C   | -40 to 210    |
| 1134 | Engine Intercooler Thermostat Opening | 8 | 8 | 0.4      | 0      | %    | 0-100         |

### 4.4 PGN 65263 — Engine Fluid Level/Pressure 1 (EFL/P1)

CAN ID: `0x18FEEF00` (priority 6) | Transmission rate: 500 ms

| SPN  | Field                        | Byte | Bits | Resolution | Offset | Unit | Range       |
|------|------------------------------|------|------|------------|--------|------|-------------|
| **94** | **Fuel Delivery Pressure** | **1** | **8** | **4**    | **0**  | **kPa** | **0-1000** |
| 22   | Engine Extended Crankcase Blow-by Pressure | 2 | 8 | 0.05 | 0 | kPa | 0-12.5   |
| 98   | Engine Oil Level             | 3    | 8    | 0.4        | 0      | %    | 0-100       |
| **100** | **Engine Oil Pressure**   | **4** | **8** | **4**    | **0**  | **kPa** | **0-1000** |
| 101  | Engine Crankcase Pressure    | 5-6  | 16   | 0.0078125  | -250   | kPa  | -250 to 252 |
| 109  | Engine Coolant Pressure      | 7    | 8    | 2          | 0      | kPa  | 0-500       |
| 111  | Engine Coolant Level         | 8    | 8    | 0.4        | 0      | %    | 0-100       |

### 4.5 PGN 65266 — Fuel Economy (LFE)

CAN ID: `0x18FEF200` (priority 6) | Transmission rate: 100 ms

| SPN  | Field                      | Byte  | Bits | Resolution | Offset | Unit    | Range        |
|------|----------------------------|-------|------|------------|--------|---------|--------------|
| **183** | **Engine Fuel Rate**    | **1-2** | **16** | **0.05** | **0**  | **L/h** | **0-3212.75** |
| 184  | Instantaneous Fuel Economy | 3-4   | 16   | 1/512      | 0      | km/L    | 0-125.5      |
| 185  | Average Fuel Economy       | 5-6   | 16   | 1/512      | 0      | km/L    | 0-125.5      |
| 51   | Throttle Position          | 7     | 8    | 0.4        | 0      | %       | 0-100        |

### 4.6 PGN 65270 — Inlet/Exhaust Conditions 1 (IC1)

CAN ID: `0x18FEF600` (priority 6) | Transmission rate: 500 ms

| SPN  | Field                          | Byte  | Bits | Resolution | Offset | Unit | Range         |
|------|---------------------------------|-------|------|------------|--------|------|---------------|
| 102  | Boost Pressure                 | 1     | 8    | 2          | 0      | kPa  | 0-500         |
| **105** | **Intake Manifold Temperature** | **3** | **8** | **1**   | **-40** | **°C** | **-40 to 210** |
| 106  | Air Inlet Pressure             | 4     | 8    | 2          | 0      | kPa  | 0-500         |
| 107  | Air Filter Differential Pressure | 5   | 8    | 0.05       | 0      | kPa  | 0-12.5        |
| **173** | **Exhaust Gas Temperature** | **6-7** | **16** | **0.03125** | **-273** | **°C** | **-273 to 1735** |
| 112  | Engine Coolant Filter Diff Pressure | 8 | 8 | 0.5       | 0      | kPa  | 0-125         |

### 4.7 PGN 65271 — Vehicle Electrical Power 1 (VEP1)

CAN ID: `0x18FEF700` (priority 6) | Transmission rate: 1000 ms

| SPN  | Field                         | Byte  | Bits | Resolution | Offset | Unit | Range          |
|------|-------------------------------|-------|------|------------|--------|------|----------------|
| 114  | Net Battery Current           | 1-2   | 16   | 0.05       | -1600  | A    | -1600 to 1612.5|
| 115  | Alternator Current            | 3-4   | 16   | 0.05       | -1600  | A    | -1600 to 1612.5|
| 167  | Alternator Potential (Voltage) | 5-6  | 16   | 0.05       | 0      | V    | 0-3212.75      |
| **158** | **Battery Potential, Switched** | **7-8** | **16** | **0.05** | **0** | **V** | **0-3212.75** |

### 4.8 PGN 65253 — Engine Hours, Revolutions (HOURS)

CAN ID: `0x18FEE500` (priority 6) | Transmission rate: on request or 10000 ms

| SPN  | Field                     | Byte  | Bits | Resolution | Offset | Unit  | Range           |
|------|---------------------------|-------|------|------------|--------|-------|-----------------|
| **247** | **Total Engine Hours** | **1-4** | **32** | **0.05** | **0**  | **hr** | **0-210554060.75** |
| 249  | Total Engine Revolutions  | 5-8   | 32   | 1000       | 0      | rev   | 0-4211081215000 |

### 4.9 PGN 65276 — Trip Fuel Information (TFI)

CAN ID: `0x18FEF400` (priority 6) | Transmission rate: 1000 ms

| SPN  | Field                       | Byte  | Bits | Resolution | Offset | Unit | Range         |
|------|-----------------------------|-------|------|------------|--------|------|---------------|
| **182** | **Trip Fuel (total consumed)** | **1-4** | **32** | **0.5** | **0** | **L** | **0-2105540607.5** |
| 250  | Trip Average Fuel Rate     | 5-6   | 16   | 0.05       | 0      | L/h  | 0-3212.75     |

### 4.10 Additional Marine-Relevant PGNs

| PGN   | Name                  | Key SPNs                              | Rate    |
|-------|-----------------------|---------------------------------------|---------|
| 61443 | EEC2                  | Accelerator pedal position, load %    | 50 ms   |
| 65257 | Fuel Consumption      | Total fuel used (lifetime, L)         | 1000 ms |
| 65261 | Cruise Control        | Vehicle speed (km/h, not useful marine)| 100 ms |
| 65269 | Ambient Conditions    | Barometric pressure, ambient temp     | 1000 ms |

---

## 5. J1939 to NMEA 2000 PGN Mapping

NMEA 2000 is an application-layer protocol derived from J1939. Both use CAN 2.0B at
250 kbps with 29-bit identifiers, but NMEA 2000 defines its own PGN space for
marine-specific data.

### 5.1 Engine PGN Mapping Table

| J1939 PGN | J1939 Name              | NMEA 2000 PGN | NMEA 2000 Name                   | Update Rate |
|-----------|-------------------------|----------------|----------------------------------|-------------|
| 61444     | EEC1 (Engine Speed)     | **127488**     | Engine Parameters, Rapid Update  | 100 ms      |
| 65262     | ET1 (Coolant Temp)      | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65263     | EFL/P1 (Oil Pressure)   | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65266     | LFE (Fuel Rate)         | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65270     | IC1 (Exhaust Temp)      | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65271     | VEP1 (Battery Voltage)  | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65253     | HOURS (Engine Hours)    | **127489**     | Engine Parameters, Dynamic       | 1000 ms     |
| 65276     | TFI (Trip Fuel)         | **127497**     | Trip Parameters, Engine          | 1000 ms     |
| —         | —                       | **127498**     | Engine Parameters, Static        | on request  |
| —         | Tank levels             | **127505**     | Fluid Level                      | 2500 ms     |

**Key NMEA 2000 engine PGN fields:**

**PGN 127488** — Engine Parameters, Rapid Update:
- Field 1: Engine Instance (uint8)
- Field 2: Engine Speed (uint16, resolution 0.25 RPM)
- Field 3: Engine Boost Pressure (uint16, resolution 100 Pa)
- Field 4: Engine Tilt/Trim (int8, resolution 1%)

**PGN 127489** — Engine Parameters, Dynamic:
- Engine Oil Pressure (uint16, 100 Pa resolution)
- Engine Oil Temperature (uint16, 0.1 K resolution)
- Engine Temperature / Coolant (uint16, 0.1 K resolution)
- Alternator Potential (int16, 0.01 V resolution)
- Fuel Rate (int16, 0.1 L/h resolution, signed)
- Total Engine Hours (uint32, 1 s resolution)
- Engine Coolant Pressure (uint16, 100 Pa resolution)
- Fuel Pressure (uint16, 1000 Pa resolution)
- Discrete status fields (check engine, over temp, low oil, etc.)

### 5.2 Yacht Devices YDEG-04 Engine Gateway

The YDEG-04 bridges J1939 engine buses to NMEA 2000 marine networks. It reads J1939
PGNs from the engine ECU and translates them into standard NMEA 2000 engine PGNs
(127488, 127489, 127497, 127505, etc.) for display on chart plotters.

**Supported engine brands:**
- Volvo Penta (EVC system, J1939-based, D6-D16 models)
- Caterpillar (ADEM III, Acerts series: C4.4, C6.6, C9, C15, C18, C32)
- Cummins (QSB5-7, QSL, QSM11, QSK19/50/60, CM570/CM850 ECU)
- Yanmar (BY2 series, 4JH series with common rail, VC20 system)
- Mercury / MerCruiser (SmartCraft protocol variant)
- John Deere (PowerTech M, E, Plus)
- Perkins (Series 1100, 1300, 2300, 2800)
- MAN (MMDS series)
- Scania (EMS variants)
- Detroit Diesel (DDEC III/IV, Series 50/60/2000)
- Deutz (EMR 2)
- BRP Rotax
- Crusader (MPI ECM-07)
- MTU (requires J1939 option, not standard)

**Converted parameters:** RPM, total engine hours, coolant temperature, battery voltage
and current, fuel rate, oil pressure, oil temperature, boost pressure, exhaust gas
temperature, transmission data, and more (25+ parameter types).

### 5.3 Engine Brand Protocol Variants

| Brand         | Primary Protocol     | Notes                                           |
|---------------|---------------------|-------------------------------------------------|
| Volvo Penta   | J1939 (via EVC)     | Older EDC system is NOT J1939; needs J1708 gateway |
| Cummins       | J1939 (CM570/CM850) | Older models may use proprietary KCM-II          |
| Yanmar        | J1939 (BY2/VC20)    | 4JH common rail connects via J1939 CAN bus       |
| Caterpillar   | J1939 (ADEM III)    | Standard J1939 on Acerts series                  |
| Mercury       | SmartCraft           | Proprietary protocol; YDEG-04 supports it        |
| John Deere    | J1939 (JDEC)        | Standard J1939                                   |
| MTU           | J1939 (optional)    | Must be ordered with J1939 capability            |
| Perkins       | J1939               | Standard J1939 on Series 1100+                   |

**Transition timeline:** J1939 replaced the older J1708/J1587 protocol around 2004. Most
marine diesels manufactured after ~2006 support J1939. Older engines require a J1708
gateway (e.g., Yacht Devices YDEG-02) instead.

---

## 6. Go Implementation Notes

### 6.1 VE.Direct Serial Adapter

```
Key design decisions for a Go adapter:

1. Use a serial port library (e.g., go.bug.st/serial) at 19200/8N1
2. Implement a state machine for TEXT frame parsing:
   - IDLE → detect \r\n to start field
   - LABEL → accumulate until \t
   - VALUE → accumulate until \r\n
   - CHECKSUM → verify modulo-256 sum of entire block == 0
3. Parse HEX frames when ':' is received (colon starts HEX frame)
4. Values are ASCII strings; parse to int/float per field type
5. Handle the TEXT/HEX protocol interleaving on the same serial port
6. Emit structured events per block with all fields
7. MPPT fields arrive every 1 second; BMV may be slower
```

### 6.2 MQTT Client

```
Key design decisions for a Go MQTT adapter:

1. Use a MQTT v3.1.1 client (e.g., eclipse/paho.mqtt.golang)
2. On connect, send keepalive to R/<portalId>/keepalive
3. Subscribe to N/<portalId>/# for all notifications
4. Parse JSON payloads: {"value": <number|null>}
5. Implement 60-second keepalive timer to maintain subscription
6. Watch for N/<portalId>/full_publish_completed for initial sync
7. For writes, publish to W/<portalId>/<service>/<instance>/<path>
   with payload {"value": <new_value>}
```

### 6.3 J1939 CAN Adapter

```
Key design decisions for a Go J1939 adapter:

1. Use socketcan interface on Linux (go-socketcan or similar)
2. Filter on 29-bit extended CAN IDs
3. Extract PGN from CAN ID: pgn = (canId >> 8) & 0x3FFFF
   - If PDU Format < 240, mask off destination: pgn &= 0x3FF00
4. Decode SPNs using byte position, bit length, resolution, offset
5. Handle multi-byte fields as Little Endian (J1939 standard)
6. Common update rates: EEC1 at 10-20ms, most others at 500-1000ms
7. Source address (low 8 bits of CAN ID) identifies the engine instance
```

---

## Sources

- [Victron VE.Direct Protocol v3.34 (PDF)](https://www.victronenergy.com/upload/documents/VE.Direct-Protocol-3.34.pdf)
- [VE.Direct Protocol FAQ](https://www.victronenergy.com/live/vedirect_protocol:faq)
- [Victron BlueSolar HEX Protocol (PDF)](https://www.victronenergy.com/upload/documents/BlueSolar-HEX-protocol.pdf)
- [VE.Direct HEX Protocol Phoenix Inverter (PDF)](https://www.victronenergy.com/upload/documents/VE.Direct-HEX-Protocol-Phoenix-Inverter.pdf)
- [VE.Can Registers Public (PDF)](https://www.victronenergy.com/upload/documents/VE.Can-registers-public.pdf)
- [Victron Data Communication Technical Information (PDF)](https://www.victronenergy.com/upload/documents/Technical-Information-Data-communication-with-Victron-Energy-products_EN.pdf)
- [victronenergy/dbus-flashmq (GitHub)](https://github.com/victronenergy/dbus-flashmq)
- [Venus OS D-Bus Wiki](https://github.com/victronenergy/venus/wiki/dbus)
- [Venus HTML5 App MQTT Topics](https://github.com/victronenergy/venus-html5-app/blob/master/TOPICS.md)
- [VE.Direct field definitions (foxharp/ve.direct)](https://github.com/foxharp/ve.direct/blob/master/ve.direct)
- [esphome-victron-vedirect (GitHub)](https://github.com/krahabb/esphome-victron-vedirect)
- [Victron VE.Direct Protocol Guide (HardBreak Wiki)](https://www.hardbreak.wiki/hardware-hacking/interface-interaction/ve.direct)
- [Victron VE.Direct (tarthorst.net)](https://www.tarthorst.net/victron-ve-direct/)
- [Victron Error Codes (pkys.com)](https://shop.pkys.com/victron-error-codes)
- [J1939 Explained (CSS Electronics)](https://www.csselectronics.com/pages/j1939-explained-simple-intro-tutorial)
- [J1939 Message Format (Copperhill Tech)](https://copperhilltech.com/blog/sae-j1939-message-format-and-interpretation-of-pgns/)
- [J1939 PGNs for VDR (GitHub Gist)](https://gist.github.com/philbegg/462dd78a0aa78df7073dd1c0b073cf4b)
- [Understanding PGNs: NMEA 2000 and J1939 (Actisense)](https://actisense.com/news/understanding-pgns-nmea-2000-and-j1939/)
- [Yacht Devices YDEG-04 Engine Gateway](https://www.yachtd.com/products/engine_gateway.html)
- [Marine Engines with J1939 Capability (Maretron)](https://www.maretron.com/support/knowledgebase/phpkbv7/article.php?id=544)
- [Maretron J2K100 Datasheet (PDF)](https://www.maretron.com/products/pdf/J2K100%20Datasheet.pdf)
