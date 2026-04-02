# Testing Specification

**Date:** 2026-03-31
**Status:** Draft v1
**Parent:** [Engineering Standards](../engineering-standards.md)
**References:** [Technical Architecture](../../above-deck-technical-architecture.md) section 13, [Protocol Adapters Spec](../../features/platform/protocol-adapters/spec.md)

---

## 1. Go Backend Testing

### 1.1 Test Organisation

Test files live alongside source code. Every `.go` file with meaningful logic has a corresponding `_test.go` file in the same package. Test fixtures live in `testdata/` directories at the package level.

```
adapters/
  nmea0183/
    parser.go
    parser_test.go
    testdata/
      recorded-sentences.nmea
      checksum-failures.nmea
  nmea2000/
    decoder.go
    decoder_test.go
    fast_packet.go
    fast_packet_test.go
    testdata/
      ikonvert-frames.bin
      navlink2-seasmart.nmea
      pgn-127508-battery.bin
      pgn-129025-position.bin
      fast-packet-126996-product-info.bin
  victron/
    vedirect.go
    vedirect_test.go
    testdata/
      smartsolar-mppt.txt
      smartshunt.txt
  ais/
    decoder.go
    decoder_test.go
    testdata/
      class-a-position.nmea
      class-b-position.nmea
      multi-sentence-type5.nmea
model/
  datamodel.go
  datamodel_test.go
  pubsub.go
  pubsub_test.go
monitoring/
  rules.go
  rules_test.go
  alerts.go
  alerts_test.go
sync/
  engine.go
  engine_test.go
  hlc.go
  hlc_test.go
agents/
  runtime.go
  runtime_test.go
  tools.go
  tools_test.go
```

### 1.2 Table-Driven Tests

All Go tests use the table-driven pattern with subtests. Each test case has a descriptive name that explains the scenario, not the expected result.

```go
func TestParsePGN127508(t *testing.T) {
    tests := []struct {
        name     string
        frame    []byte
        wantV    float64
        wantA    float64
        wantTemp float64
        wantErr  bool
    }{
        {
            name:     "house battery nominal values",
            frame:    []byte{0x00, 0x40, 0x67, 0x00, 0x38, 0xFF, 0x7F, 0xFF},
            wantV:    26.432,
            wantA:    -20.0,
            wantTemp: 0, // not available
        },
        {
            name:     "all fields data not available",
            frame:    []byte{0x00, 0xFF, 0x7F, 0xFF, 0x7F, 0xFF, 0xFF, 0xFF},
            wantV:    0,
            wantA:    0,
            wantTemp: 0,
        },
        {
            name:    "frame too short",
            frame:   []byte{0x00, 0x40},
            wantErr: true,
        },
        {
            name:     "zero voltage zero current",
            frame:    []byte{0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x7F, 0xFF},
            wantV:    0,
            wantA:    -327.67, // 0x0000 = -327.67A at 0.01A resolution with offset
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := ParsePGN127508(tt.frame)
            if tt.wantErr {
                if err == nil {
                    t.Fatal("expected error, got nil")
                }
                return
            }
            if err != nil {
                t.Fatalf("unexpected error: %v", err)
            }
            if math.Abs(result.Voltage-tt.wantV) > 0.001 {
                t.Errorf("voltage: got %f, want %f", result.Voltage, tt.wantV)
            }
            if math.Abs(result.Current-tt.wantA) > 0.01 {
                t.Errorf("current: got %f, want %f", result.Current, tt.wantA)
            }
        })
    }
}
```

### 1.3 Database Tests

Database tests use in-memory SQLite so they are fast and isolated. Each test creates a fresh database, runs migrations, and tears down on completion.

```go
func newTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db, err := sql.Open("sqlite3", ":memory:")
    if err != nil {
        t.Fatalf("open test db: %v", err)
    }
    t.Cleanup(func() { db.Close() })

    if err := RunMigrations(db); err != nil {
        t.Fatalf("run migrations: %v", err)
    }
    return db
}

func TestStoreAndRetrieveLogEntry(t *testing.T) {
    db := newTestDB(t)
    store := NewLogStore(db)

    entry := LogEntry{
        Timestamp: time.Now(),
        Type:      "auto",
        Position:  Position{Lat: 48.117, Lng: -1.183},
        SOG:       5.2,
    }

    id, err := store.Insert(entry)
    if err != nil {
        t.Fatalf("insert: %v", err)
    }

    got, err := store.Get(id)
    if err != nil {
        t.Fatalf("get: %v", err)
    }

    if got.Type != entry.Type {
        t.Errorf("type: got %q, want %q", got.Type, entry.Type)
    }
}
```

For integration tests that need file-backed SQLite (testing WAL mode, concurrent access, crash recovery), use `t.TempDir()`:

```go
func TestConcurrentWrites(t *testing.T) {
    dbPath := filepath.Join(t.TempDir(), "test.db")
    db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
    // ...
}
```

### 1.4 Protocol Adapter Testing

#### NMEA 2000

**Binary CAN frame fixtures:**

Store recorded CAN frames as binary files in `testdata/`. Each frame is 13 bytes: 4 bytes extended CAN ID (big-endian) + 1 byte data length + up to 8 bytes data.

```go
func TestDecodeRecordedFrames(t *testing.T) {
    data, err := os.ReadFile("testdata/ikonvert-frames.bin")
    if err != nil {
        t.Fatal(err)
    }

    decoder := NewDecoder(DefaultPGNDatabase())

    for i := 0; i < len(data); {
        frame, n, err := ParseCANFrame(data[i:])
        if err != nil {
            t.Fatalf("frame at offset %d: %v", i, err)
        }
        i += n

        msg, err := decoder.Decode(frame)
        if err != nil {
            // Unknown PGNs are expected — count them, don't fail
            continue
        }
        // Validate decoded message has non-zero fields
        if msg.PGN == 0 {
            t.Errorf("decoded message with PGN 0 at offset %d", i)
        }
    }
}
```

**PGN parsing tests:** Each supported PGN has its own test with known input bytes and expected decoded values. Values are verified against a reference decoder (canboat or manufacturer documentation).

**Fast-packet reassembly tests:**

```go
func TestFastPacketReassembly(t *testing.T) {
    tests := []struct {
        name       string
        frames     []CANFrame // sequence of frames in order
        wantPGN    uint32
        wantLength int
        wantErr    bool
    }{
        {
            name:       "PGN 126996 product info complete",
            frames:     loadFrames(t, "testdata/fast-packet-126996-product-info.bin"),
            wantPGN:    126996,
            wantLength: 134,
        },
        {
            name:       "incomplete packet times out",
            frames:     loadFrames(t, "testdata/fast-packet-incomplete.bin"),
            wantErr:    true,
        },
        {
            name:       "interleaved sources",
            frames:     loadFrames(t, "testdata/fast-packet-interleaved.bin"),
            wantPGN:    129794,
            wantLength: 420,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            reassembler := NewFastPacketReassembler(750 * time.Millisecond)
            // Feed frames, check final assembled result...
        })
    }
}
```

#### NMEA 0183

**Recorded sentence fixtures:**

Store as plain text files, one sentence per line. Include both valid sentences and known-bad examples.

```go
func TestParseRecordedSentences(t *testing.T) {
    file, err := os.Open("testdata/recorded-sentences.nmea")
    if err != nil {
        t.Fatal(err)
    }
    defer file.Close()

    parser := NewNMEA0183Parser()
    scanner := bufio.NewScanner(file)
    var parsed, failed int

    for scanner.Scan() {
        line := scanner.Text()
        _, err := parser.Parse(line)
        if err != nil {
            failed++
            continue
        }
        parsed++
    }

    t.Logf("parsed: %d, failed: %d", parsed, failed)
    if parsed == 0 {
        t.Fatal("no sentences parsed successfully")
    }
}
```

**Checksum validation tests:**

```go
func TestChecksumValidation(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        wantErr bool
    }{
        {"valid GGA", "$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47", false},
        {"wrong checksum", "$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*FF", true},
        {"missing checksum", "$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,", true},
        {"truncated sentence", "$GPGGA,123", true},
        {"empty string", "", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateChecksum(tt.input)
            if (err != nil) != tt.wantErr {
                t.Errorf("got err=%v, wantErr=%v", err, tt.wantErr)
            }
        })
    }
}
```

#### Victron VE.Direct

**Recorded text protocol fixtures:**

Store recorded VE.Direct output as text files — the raw serial output including all key-value pairs and checksum lines.

```go
func TestVEDirectBlockParsing(t *testing.T) {
    data, err := os.ReadFile("testdata/smartsolar-mppt.txt")
    if err != nil {
        t.Fatal(err)
    }

    parser := NewVEDirectParser()
    blocks := parser.ParseAll(data)

    if len(blocks) == 0 {
        t.Fatal("no blocks parsed")
    }

    // Verify first block has expected fields
    block := blocks[0]
    if block.PID == "" {
        t.Error("PID missing from first block")
    }
    if block.Voltage == 0 {
        t.Error("voltage is zero — expected non-zero from recorded data")
    }
}
```

Test the text block checksum validation: sum all bytes in the block (including the checksum byte) modulo 256 must equal zero.

#### AIS

**6-bit ASCII decoding tests:**

```go
func TestAIS6BitDecode(t *testing.T) {
    tests := []struct {
        name    string
        payload string
        msgType int
        mmsi    uint32
    }{
        {
            name:    "class A position report type 1",
            payload: "177KQJ5000G?tO`K>RA1wUbN0TKH",
            msgType: 1,
            mmsi:    477553000,
        },
        {
            name:    "class B position report type 18",
            payload: "B43JRQ00LhTgnH:4K@4b6H3L0000",
            msgType: 18,
            mmsi:    271041015,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            bits := Decode6Bit(tt.payload)
            msgType := bits.Uint(0, 6)
            mmsi := bits.Uint(8, 30)

            if int(msgType) != tt.msgType {
                t.Errorf("message type: got %d, want %d", msgType, tt.msgType)
            }
            if mmsi != tt.mmsi {
                t.Errorf("MMSI: got %d, want %d", mmsi, tt.mmsi)
            }
        })
    }
}
```

**Multi-sentence reassembly:** Test that type 5 messages spanning two AIVDM sentences are correctly reassembled before decoding.

#### Capturing Real Data for Test Fixtures

Recording real NMEA and Victron data from a boat for use as test fixtures:

**NMEA 0183 (TCP):**
```bash
# Record raw sentences from a WiFi gateway
nc 192.168.1.100 10110 | tee testdata/recorded-$(date +%Y%m%d).nmea

# Record for a fixed duration
timeout 300 nc 192.168.1.100 10110 > testdata/coastal-sailing-5min.nmea
```

**NMEA 2000 via iKonvert (USB serial):**
```bash
# Record raw iKonvert output
cat /dev/ttyUSB0 > testdata/ikonvert-raw-$(date +%Y%m%d).txt

# With baud rate set
stty -F /dev/ttyUSB0 230400
cat /dev/ttyUSB0 > testdata/ikonvert-raw.txt
```

**NMEA 2000 via NavLink2 (TCP):**
```bash
# Record SeaSmart ($PCDIN) sentences
nc 192.168.1.100 2000 > testdata/navlink2-seasmart-$(date +%Y%m%d).nmea
```

**Victron VE.Direct (USB serial):**
```bash
# Record raw VE.Direct text output
stty -F /dev/ttyUSB1 19200
cat /dev/ttyUSB1 > testdata/vedirect-smartsolar-$(date +%Y%m%d).txt
```

**CAN bus (Linux with socketcan):**
```bash
# Record raw CAN frames (requires vcan or real CAN interface)
candump can0 -l -f testdata/canbus-$(date +%Y%m%d).log
```

See section 6 for anonymisation requirements before committing recorded data.

### 1.5 Data Model Testing

**Concurrent read/write:**

```go
func TestDataModelConcurrentAccess(t *testing.T) {
    dm := NewDataModel()

    var wg sync.WaitGroup
    const numWriters = 10
    const numReads = 100

    // Concurrent writers
    for i := 0; i < numWriters; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for j := 0; j < numReads; j++ {
                dm.Set(fmt.Sprintf("electrical/batteries/%d/voltage", id), 26.0+float64(j)*0.01)
            }
        }(i)
    }

    // Concurrent readers
    for i := 0; i < numWriters; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for j := 0; j < numReads; j++ {
                dm.Get(fmt.Sprintf("electrical/batteries/%d/voltage", id))
            }
        }(i)
    }

    wg.Wait()
}
```

**Pub/sub tests:**

```go
func TestPubSubDelivery(t *testing.T) {
    dm := NewDataModel()
    received := make(chan DataUpdate, 10)

    dm.Subscribe("electrical/batteries/house/*", func(update DataUpdate) {
        received <- update
    })

    dm.Set("electrical/batteries/house/voltage", 26.41)

    select {
    case update := <-received:
        if update.Path != "electrical/batteries/house/voltage" {
            t.Errorf("path: got %q, want %q", update.Path, "electrical/batteries/house/voltage")
        }
    case <-time.After(100 * time.Millisecond):
        t.Fatal("subscriber did not receive update within 100ms")
    }
}
```

**Persistence tests:** Write values to the data model, close and reopen the SQLite database, verify values are restored.

### 1.6 Monitoring and Alert Testing

**Rule evaluation:**

```go
func TestAnchorDragRule(t *testing.T) {
    tests := []struct {
        name         string
        anchorPos    Position
        currentPos   Position
        radiusMetres float64
        wantAlert    bool
    }{
        {"within radius", Position{48.117, -1.183}, Position{48.1171, -1.1831}, 50, false},
        {"at boundary", Position{48.117, -1.183}, Position{48.1174, -1.183}, 50, false},
        {"outside radius", Position{48.117, -1.183}, Position{48.118, -1.183}, 50, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            rule := NewAnchorDragRule(tt.anchorPos, tt.radiusMetres)
            alert := rule.Evaluate(tt.currentPos)
            if alert != tt.wantAlert {
                t.Errorf("got alert=%v, want %v", alert, tt.wantAlert)
            }
        })
    }
}
```

**Escalation timing:** Verify that alerts escalate from local notification to push to SMS after the configured timeouts when unacknowledged.

**Threshold crossing:** Test hysteresis — an alert should trigger when crossing the threshold and clear only after the value returns past the clear threshold (preventing flapping).

### 1.7 Sync Engine Testing

**Conflict resolution:**

```go
func TestSyncConflictResolution(t *testing.T) {
    tests := []struct {
        name       string
        hubValue   SyncRecord
        spokeValue SyncRecord
        strategy   ConflictStrategy
        wantValue  interface{}
    }{
        {
            name:       "last write wins — spoke newer",
            hubValue:   SyncRecord{Value: "Odyssey", HLC: HLC{WallTime: 100, Counter: 1}},
            spokeValue: SyncRecord{Value: "Odyssey II", HLC: HLC{WallTime: 200, Counter: 0}},
            strategy:   LastWriteWins,
            wantValue:  "Odyssey II",
        },
        {
            name:       "hub wins for community data",
            hubValue:   SyncRecord{Value: "moderated content"},
            spokeValue: SyncRecord{Value: "unmoderated content"},
            strategy:   HubWins,
            wantValue:  "moderated content",
        },
        {
            name:       "spoke wins for instrument data",
            hubValue:   SyncRecord{Value: 26.4},
            spokeValue: SyncRecord{Value: 26.5},
            strategy:   SpokeWins,
            wantValue:  26.5,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            resolver := NewConflictResolver(tt.strategy)
            result := resolver.Resolve(tt.hubValue, tt.spokeValue)
            if result.Value != tt.wantValue {
                t.Errorf("got %v, want %v", result.Value, tt.wantValue)
            }
        })
    }
}
```

**HLC ordering:** Verify that hybrid logical clocks produce correct causal ordering even when wall clocks differ between hub and spoke.

**Offline queue:** Write items to the sync queue, simulate reconnection, verify queue drains in order and hub acknowledges each item.

### 1.8 AI Agent Testing

Agent tests mock the LLM response. The agent runtime, tool execution, and message routing are tested with deterministic mock responses — never calling the real Claude API in automated tests.

```go
func TestNavigatorToolExecution(t *testing.T) {
    // Mock LLM that returns a tool_use response
    mockLLM := &MockLLM{
        Response: LLMResponse{
            ToolUse: &ToolUse{
                Name:  "get_weather",
                Input: map[string]interface{}{"lat": 48.117, "lng": -1.183},
            },
        },
    }

    // Mock weather tool
    mockWeather := &MockTool{
        Name:   "get_weather",
        Result: `{"wind_speed": 15, "wind_direction": 225}`,
    }

    agent := NewNavigator(mockLLM, ToolRegistry{mockWeather})
    response, err := agent.HandleMessage("What's the weather at my position?")
    if err != nil {
        t.Fatal(err)
    }

    // Verify the tool was called
    if !mockWeather.WasCalled {
        t.Error("expected get_weather tool to be called")
    }

    // Verify tool result was fed back to the LLM
    if mockLLM.LastToolResult == "" {
        t.Error("expected tool result to be passed back to LLM")
    }
}
```

**Message routing:** Verify that the Watchman orchestrator routes messages to the correct specialist agent based on content.

**Inter-agent communication:** Verify that when Navigator asks Engineer a question, the message is correctly routed and the response returned.

### 1.9 HTTP and WebSocket Endpoint Testing

**REST endpoints** use `net/http/httptest`:

```go
func TestGetBatteryStatus(t *testing.T) {
    dm := NewDataModel()
    dm.Set("electrical/batteries/house/voltage", 26.41)
    dm.Set("electrical/batteries/house/current", -12.5)

    handler := NewAPIHandler(dm)
    req := httptest.NewRequest("GET", "/api/v1/electrical/batteries/house", nil)
    w := httptest.NewRecorder()

    handler.ServeHTTP(w, req)

    if w.Code != http.StatusOK {
        t.Fatalf("status: got %d, want %d", w.Code, http.StatusOK)
    }

    var resp BatteryResponse
    if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
        t.Fatalf("decode: %v", err)
    }
    if resp.Voltage != 26.41 {
        t.Errorf("voltage: got %f, want 26.41", resp.Voltage)
    }
}
```

**WebSocket endpoints** use `gorilla/websocket` test helpers with `httptest.Server`:

```go
func TestWebSocketInstrumentStream(t *testing.T) {
    dm := NewDataModel()
    handler := NewWSHandler(dm)
    server := httptest.NewServer(handler)
    defer server.Close()

    wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/instruments"
    conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
    if err != nil {
        t.Fatal(err)
    }
    defer conn.Close()

    // Subscribe to battery updates
    conn.WriteJSON(WSSubscribe{Paths: []string{"electrical/batteries/house/*"}})

    // Trigger a data model update
    dm.Set("electrical/batteries/house/voltage", 26.41)

    // Read the update from WebSocket
    var msg WSUpdate
    conn.SetReadDeadline(time.Now().Add(time.Second))
    if err := conn.ReadJSON(&msg); err != nil {
        t.Fatalf("read: %v", err)
    }

    if msg.Path != "electrical/batteries/house/voltage" {
        t.Errorf("path: got %q", msg.Path)
    }
}
```

### 1.10 Benchmark Tests

Performance-critical paths have benchmark tests. These run in CI to detect regressions and locally during optimisation work.

```go
func BenchmarkDecodePGN129025(b *testing.B) {
    frame := []byte{0x40, 0x67, 0xCB, 0x1C, 0x80, 0xBB, 0xF6, 0xFF}
    decoder := NewDecoder(DefaultPGNDatabase())

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        decoder.DecodePGN(129025, frame)
    }
}

func BenchmarkDataModelWrite(b *testing.B) {
    dm := NewDataModel()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        dm.Set("electrical/batteries/house/voltage", 26.0+float64(i)*0.001)
    }
}

func BenchmarkDataModelConcurrentWrite(b *testing.B) {
    dm := NewDataModel()
    b.RunParallel(func(pb *testing.PB) {
        i := 0
        for pb.Next() {
            dm.Set("electrical/batteries/house/voltage", 26.0+float64(i)*0.001)
            i++
        }
    })
}

func BenchmarkAIS6BitDecode(b *testing.B) {
    payload := "177KQJ5000G?tO`K>RA1wUbN0TKH"
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        Decode6Bit(payload)
    }
}

func BenchmarkNMEA0183Parse(b *testing.B) {
    sentence := "$GPGGA,123456.00,4807.038,N,01131.000,E,1,08,0.9,545.4,M,47.0,M,,*47"
    parser := NewNMEA0183Parser()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        parser.Parse(sentence)
    }
}
```

**Performance targets (indicative, validated during implementation):**

| Operation | Target |
|-----------|--------|
| PGN decode (single frame) | < 500ns |
| NMEA 0183 sentence parse | < 1us |
| AIS 6-bit decode | < 200ns |
| Data model write (single path) | < 1us |
| Data model write (concurrent, 10 writers) | < 5us per write |

### 1.11 Race Condition Detection

All CI test runs include the race detector:

```bash
go test -race ./...
```

This is non-negotiable. The spoke handles concurrent data from multiple protocol adapters, WebSocket connections, AI agents, and the monitoring service. Any data race is a bug, even if it does not cause a visible failure.

The race detector adds ~2-10x overhead. This is acceptable for CI. For local development, running with `-race` on the specific package being worked on is sufficient.

### 1.12 Coverage Targets

| Package | Target | Rationale |
|---------|--------|-----------|
| `adapters/*` | 80%+ | Protocol parsing is safety-adjacent. Incorrect parsing could produce wrong depth, position, or battery readings. |
| `monitoring/` | 80%+ | Alert rules protect people and boats. |
| `model/` | 80%+ | Data model is the foundation everything else depends on. |
| `sync/` | 70%+ | Conflict resolution must be correct. |
| `agents/` | 60%+ | Agent logic depends on LLM responses that are mocked. Coverage reflects testable code paths. |
| `api/` | 60%+ | Standard HTTP handler testing. |
| Overall | 60%+ | Balanced against development velocity for a solo builder. |

Generate coverage reports with:

```bash
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

---

## 2. NMEA Simulator

A Go program that generates realistic marine instrument data for development and testing without a boat. The simulator is a first-class tool in the project — it runs in development, CI, and is available for contributors who want to work on the frontend without any marine hardware.

### 2.1 Architecture

The simulator is a standalone Go binary in `cmd/simulator/`. It generates data according to a configurable boat profile and scenario, then outputs it as protocol-native streams that the spoke's protocol adapters consume as if they were real hardware.

```
cmd/simulator/
  main.go              — entry point, scenario selection
  profile.go           — boat profile configuration
  scenario.go          — scenario definitions (at anchor, sailing, etc.)
  generators/
    position.go        — GPS position generation (along routes, drift, etc.)
    navigation.go      — heading, speed, depth, wind
    electrical.go      — battery, solar, alternator, shore power
    engine.go          — RPM, temperatures, pressures
    tanks.go           — fuel, water, waste levels
    ais.go             — nearby vessel generation
  outputs/
    nmea0183.go        — NMEA 0183 sentence formatter, TCP/UDP server
    nmea2000.go        — CAN frame formatter, vcan output (Linux)
    vedirect.go        — VE.Direct text protocol formatter, virtual serial (socat)
  testdata/
    profiles/
      catamaran-42.yaml
      monohull-38.yaml
    scenarios/
      at-anchor.yaml
      coastal-sailing.yaml
      offshore-passage.yaml
      motoring.yaml
      engine-alarm.yaml
```

### 2.2 Boat Profile

A YAML configuration file defining the boat's characteristics:

```yaml
# profiles/catamaran-42.yaml
vessel:
  name: "Test Vessel"
  type: catamaran
  length: 12.8     # metres
  beam: 7.2
  draft: 1.3
  displacement: 10000  # kg

electrical:
  batteries:
    - id: house
      capacity: 400  # Ah
      voltage_nominal: 24
      chemistry: lifepo4
    - id: start
      capacity: 100
      voltage_nominal: 12
      chemistry: agm
  solar:
    - id: array1
      capacity: 600  # Wp
    - id: array2
      capacity: 400
  inverter:
    capacity: 3000  # W

engines:
  - id: port
    type: diesel
    power: 40  # HP
  - id: starboard
    type: diesel
    power: 40

tanks:
  fuel:
    - id: port
      capacity: 200  # litres
    - id: starboard
      capacity: 200
  freshwater:
    - id: main
      capacity: 400
  blackwater:
    - id: holding
      capacity: 80
```

### 2.3 Scenarios

Scenarios define the boat's state and how it changes over time. Each scenario is a state machine with transitions.

**At anchor:**
- Position: drifts slowly within an anchor circle (configurable radius)
- Heading: swings with wind/current
- Speed: 0-0.3 kts (current drag on hull)
- Depth: constant with tidal variation
- Wind: configurable direction and speed, with gusts
- Batteries: solar charging during day, slow discharge at night
- Engines: off
- Tanks: slow freshwater consumption

**Coastal sailing:**
- Position: follows a predefined waypoint route
- Heading: matches course to next waypoint with helm variation
- Speed: 5-8 kts, varies with wind angle
- Depth: varies along route (read from a depth profile)
- Wind: shifts gradually, gusts
- Batteries: solar + wind charging
- Engines: off
- AIS: 5-20 targets generated, some on collision course (CPA/TCPA testing)

**Offshore passage:**
- Position: great-circle route between two points
- Speed: 6-7 kts sustained
- Wind: shifts over hours, occasional squalls
- Batteries: solar charging cycle with overnight discharge
- Swell and motion data

**Motoring:**
- Engines: running, RPM 2200-2800
- Oil pressure, coolant temp, exhaust temp — all nominal
- Fuel consumption: 3-5 l/hr per engine
- Alternator charging
- Tank levels decreasing

**Engine alarm:**
- Starts as motoring scenario
- After configurable delay, engine oil pressure drops below threshold
- Coolant temperature rises above threshold
- Triggers monitoring alerts (for testing the alert pipeline)

### 2.4 Output Formats

**NMEA 0183 via TCP/UDP:**

The simulator listens on a TCP port (default 10110) and broadcasts on a UDP port (default 10110), emitting standard NMEA 0183 sentences at realistic intervals:

- GGA/RMC: 1 Hz
- HDG/HDM: 2 Hz
- MWV: 1 Hz
- DBT: 1 Hz
- VHW: 1 Hz
- XDR: 0.5 Hz

All sentences include valid checksums.

**CAN frames via virtual CAN bus (Linux vcan):**

On Linux, the simulator can output raw CAN frames to a virtual CAN interface. This exercises the full NMEA 2000 adapter code path including CAN ID parsing and fast-packet reassembly.

```bash
# Set up virtual CAN interface
sudo modprobe vcan
sudo ip link add dev vcan0 type vcan
sudo ip link set up vcan0

# Run simulator with vcan output
./simulator --profile profiles/catamaran-42.yaml --scenario coastal-sailing --output vcan0
```

**Victron VE.Direct via virtual serial port (socat):**

Uses `socat` to create a pair of linked virtual serial ports. The simulator writes VE.Direct text protocol to one end; the spoke's VE.Direct adapter reads from the other.

```bash
# Create virtual serial pair
socat -d -d pty,raw,echo=0,link=/tmp/vedirect-sim pty,raw,echo=0,link=/tmp/vedirect-spoke &

# Run simulator — writes to /tmp/vedirect-sim
./simulator --profile profiles/catamaran-42.yaml --output vedirect:/tmp/vedirect-sim

# Configure spoke adapter to read from /tmp/vedirect-spoke
```

### 2.5 CI Usage

In CI, the simulator runs as a background process during integration tests. It provides deterministic data (seeded random number generator) so tests produce repeatable results.

```yaml
# GitHub Actions workflow excerpt
- name: Start NMEA simulator
  run: |
    go build -o simulator ./cmd/simulator
    ./simulator --profile profiles/catamaran-42.yaml \
                --scenario at-anchor \
                --seed 42 \
                --output tcp:10110 &

- name: Run integration tests
  run: go test -tags integration ./...
```

---

## 3. Frontend Testing

### 3.1 Vitest Configuration

Vitest runs unit and component tests for the Astro + React frontend. Configuration handles JSX transform, ThemeProvider wrapping, and module aliases.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['src/test/**', '**/*.d.ts', '**/*.config.*'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@above-deck/shared': resolve(__dirname, '../shared/src'),
    },
  },
});
```

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### 3.2 Component Testing with Testing Library

React island components are tested with `@testing-library/react`. Every component test renders within a ThemeProvider to ensure theme and styles work correctly.

```typescript
// src/test/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/theme-provider';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}
```

```typescript
// src/components/BatteryGauge.test.tsx
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { BatteryGauge } from './BatteryGauge';

describe('BatteryGauge', () => {
  it('displays voltage and state of charge', () => {
    renderWithProviders(
      <BatteryGauge voltage={26.41} current={-12.5} soc={78} label="House" />
    );

    expect(screen.getByText('26.4V')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('House')).toBeInTheDocument();
  });

  it('shows warning state below 20% SOC', () => {
    renderWithProviders(
      <BatteryGauge voltage={24.0} current={-8.0} soc={15} label="House" />
    );

    expect(screen.getByRole('status')).toHaveAttribute('data-warning', 'true');
  });

  it('shows critical state below 10% SOC', () => {
    renderWithProviders(
      <BatteryGauge voltage={23.2} current={-5.0} soc={8} label="House" />
    );

    expect(screen.getByRole('status')).toHaveAttribute('data-critical', 'true');
  });
});
```

### 3.3 API Mocking with MSW

Mock Service Worker intercepts HTTP requests in tests and provides deterministic responses. MSW handlers are defined per test suite and can be overridden per test.

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/electrical/batteries', () => {
    return HttpResponse.json({
      batteries: [
        { id: 'house', voltage: 26.41, current: -12.5, soc: 78 },
        { id: 'start', voltage: 12.8, current: 0.1, soc: 95 },
      ],
    });
  }),

  http.get('/api/v1/navigation/position', () => {
    return HttpResponse.json({
      latitude: 48.117,
      longitude: -1.183,
      timestamp: '2026-03-31T10:30:00Z',
    });
  }),
];
```

```typescript
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/test/setup.ts (updated)
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3.4 Zustand Store Testing

Zustand stores are tested in isolation. Each test creates a fresh store instance to prevent state leaking between tests. Never use the global store in tests.

```typescript
// src/stores/boat.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BoatState {
  name: string;
  anchorWatch: { active: boolean; lat: number; lng: number; radius: number } | null;
  setName: (name: string) => void;
  setAnchorWatch: (lat: number, lng: number, radius: number) => void;
  clearAnchorWatch: () => void;
}

export const createBoatStore = (initialState?: Partial<BoatState>) =>
  create<BoatState>((set) => ({
    name: '',
    anchorWatch: null,
    setName: (name) => set({ name }),
    setAnchorWatch: (lat, lng, radius) =>
      set({ anchorWatch: { active: true, lat, lng, radius } }),
    clearAnchorWatch: () => set({ anchorWatch: null }),
    ...initialState,
  }));
```

```typescript
// src/stores/boat.test.ts
import { createBoatStore } from './boat';

describe('BoatStore', () => {
  it('sets anchor watch with position and radius', () => {
    const store = createBoatStore();

    store.getState().setAnchorWatch(48.117, -1.183, 50);

    const state = store.getState();
    expect(state.anchorWatch).toEqual({
      active: true,
      lat: 48.117,
      lng: -1.183,
      radius: 50,
    });
  });

  it('clears anchor watch', () => {
    const store = createBoatStore({
      anchorWatch: { active: true, lat: 48.117, lng: -1.183, radius: 50 },
    });

    store.getState().clearAnchorWatch();

    expect(store.getState().anchorWatch).toBeNull();
  });
});
```

### 3.5 TanStack Query Testing

Components using TanStack Query are tested through the `renderWithProviders` helper (section 3.2), which creates a fresh `QueryClient` per test with retry disabled. For testing hooks directly, use `renderHook` with the same provider wrapper.

```typescript
// src/hooks/useBatteries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/render';
import { useBatteries } from './useBatteries';

describe('useBatteries', () => {
  it('fetches battery data', async () => {
    const { result } = renderHook(() => useBatteries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.batteries).toHaveLength(2);
    expect(result.current.data?.batteries[0].id).toBe('house');
  });
});
```

### 3.6 MapLibre GL JS

MapLibre GL JS requires WebGL, which is not available in jsdom. Two approaches:

**Unit tests (Vitest):** Mock `maplibre-gl` entirely. Test the data layer logic (vessel filtering, route rendering, layer visibility) without rendering a map.

```typescript
// src/test/mocks/maplibre.ts
vi.mock('maplibre-gl', () => ({
  Map: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn().mockReturnValue({ setData: vi.fn() }),
    remove: vi.fn(),
    fitBounds: vi.fn(),
  })),
  Marker: vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  })),
}));
```

**Visual tests (Playwright):** Test actual map rendering, layer interactions, and visual correctness in a real browser. See section 4.

### 3.7 WebSocket Testing

Test WebSocket-dependent components with a mock WebSocket server.

```typescript
// src/test/mocks/ws.ts
import { WebSocketServer } from 'ws';

export function createMockWSServer(port: number) {
  const wss = new WebSocketServer({ port });
  const messages: unknown[] = [];

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });
  });

  return {
    wss,
    messages,
    broadcast(data: unknown) {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify(data));
      });
    },
    close() {
      wss.close();
    },
  };
}
```

### 3.8 Accessibility Testing

Integrate `axe-core` via `@axe-core/react` in development and via Playwright in CI.

**Component-level (Vitest):**

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderWithProviders } from '@/test/render';
import { InstrumentDashboard } from './InstrumentDashboard';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = renderWithProviders(<InstrumentDashboard />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Page-level (Playwright):** See section 4.

### 3.9 Snapshot Testing

Use snapshot tests sparingly — only for component structure that must not change accidentally (e.g., the alert notification structure that screen readers depend on). Never snapshot CSS or styling.

```typescript
it('renders alert structure correctly', () => {
  const { container } = renderWithProviders(
    <Alert severity="critical" title="Anchor Drag" message="Vessel outside anchor radius" />
  );

  expect(container.firstChild).toMatchSnapshot();
});
```

Review snapshot diffs carefully. If a snapshot changes, update it intentionally — never blindly accept snapshot updates.

---

## 4. E2E Testing (Playwright)

### 4.1 Flows to Test

| Flow | Priority | Description |
|------|----------|-------------|
| Setup wizard | High | First-run: boat profile creation, gateway discovery, adapter configuration |
| MFD shell navigation | High | App grid, launching apps, split view, switching apps, closing apps |
| Instrument dashboard | High | Gauge rendering with simulated data, layout switching, night mode |
| Settings app | Medium | WiFi join, gateway configuration, adapter status, display settings |
| Alert system | High | Trigger alarm (from simulator), visual and audio alert, acknowledge, escalate |
| Logbook | Medium | Auto-entry on state change, manual entry form, entry editing, export to GPX/CSV |
| Anchor watch | High | Set anchor position, configure radius, drag detection alert |
| Chartplotter | Medium | Map rendering, AIS targets, route overlay, POI interaction |
| Night mode | High | Toggle night mode, verify all components switch to red-on-black |

### 4.2 Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro 11'],
        viewport: { width: 768, height: 1024 },
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

**Browsers:**
- **Chromium** — primary. The spoke's embedded browser is Chromium-based.
- **Firefox** — secondary. Catches Chromium-specific bugs and exercises broader web compatibility.
- Webkit/Safari not tested in CI — not a target platform for the spoke. Hub site users on Safari are covered by progressive enhancement, not e2e tests.

**Viewports:**
- 1920x1080 — standard desktop/helm display
- 768x1024 — tablet at nav station

### 4.3 Test Data

E2E tests use deterministic fixtures. The NMEA simulator runs with a fixed seed (section 2.5) so instrument values are reproducible. Database state is seeded from fixture files before each test suite.

```typescript
// e2e/fixtures/seed.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Seed the database before each test
  page: async ({ page }, use) => {
    await page.goto('/api/test/reset');  // Test-only endpoint that resets to fixture state
    await use(page);
  },
});
```

The `/api/test/reset` endpoint only exists when the Go binary is built with the `test` build tag. It resets the SQLite database to a known fixture state. This endpoint is never available in production builds.

### 4.4 Visual Regression

Screenshot comparison for key screens ensures visual consistency, especially for night mode (red-on-black is safety-critical — white light destroys night vision).

```typescript
// e2e/visual/night-mode.spec.ts
import { test, expect } from '@playwright/test';

test('instrument dashboard in night mode', async ({ page }) => {
  await page.goto('/mfd/instruments');
  await page.getByRole('button', { name: 'Night mode' }).click();

  await expect(page).toHaveScreenshot('instruments-night-mode.png', {
    maxDiffPixelRatio: 0.01,
  });
});

test('MFD shell in night mode', async ({ page }) => {
  await page.goto('/mfd');
  await page.getByRole('button', { name: 'Night mode' }).click();

  await expect(page).toHaveScreenshot('mfd-shell-night-mode.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

Screenshot baselines are committed to the repository. When a visual change is intentional, update the baselines with `npx playwright test --update-snapshots`.

### 4.5 Performance Testing

Playwright tests include performance assertions for latency-sensitive operations.

```typescript
test('app switch completes within 500ms', async ({ page }) => {
  await page.goto('/mfd/instruments');
  await page.waitForLoadState('networkidle');

  const start = Date.now();
  await page.getByRole('button', { name: 'Chartplotter' }).click();
  await page.waitForSelector('[data-app="chartplotter"]');
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(500);
});

test('instrument dashboard initial render under 2 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/mfd/instruments');
  await page.waitForSelector('[data-gauge="voltage"]');
  const elapsed = Date.now() - start;

  expect(elapsed).toBeLessThan(2000);
});
```

---

## 5. Safety-Critical Testing

Safety-critical features protect people and boats. Their tests have strict timing assertions and run in CI on every push. These tests are not optional — a failing safety test blocks the merge.

### 5.1 MOB (Man Overboard) Activation

**Requirement:** MOB activation must trigger within 1 second of the activation event. The activation event can be a physical button press (via NMEA 2000 PGN), a software button press, or a crew AIS beacon detection.

```go
func TestMOBActivationTiming(t *testing.T) {
    dm := NewDataModel()
    monitor := NewMonitoringService(dm)
    alerts := make(chan Alert, 1)
    monitor.OnAlert(func(a Alert) { alerts <- a })

    start := time.Now()
    dm.Set("notifications/mob/active", true)

    select {
    case alert := <-alerts:
        elapsed := time.Since(start)
        if elapsed > 1*time.Second {
            t.Fatalf("MOB alert took %v, must be under 1 second", elapsed)
        }
        if alert.Severity != SeverityCritical {
            t.Errorf("MOB severity: got %v, want Critical", alert.Severity)
        }
        if alert.Type != AlertTypeMOB {
            t.Errorf("MOB type: got %v, want MOB", alert.Type)
        }
    case <-time.After(2 * time.Second):
        t.Fatal("MOB alert never received")
    }
}
```

### 5.2 Anchor Drag Detection

**Requirement:** Anchor drag must alert within 5 seconds of the vessel position exceeding the configured anchor radius.

```go
func TestAnchorDragAlertTiming(t *testing.T) {
    dm := NewDataModel()
    monitor := NewMonitoringService(dm)
    alerts := make(chan Alert, 1)
    monitor.OnAlert(func(a Alert) { alerts <- a })

    // Set anchor at known position with 50m radius
    dm.Set("navigation/anchor/position/latitude", 48.117)
    dm.Set("navigation/anchor/position/longitude", -1.183)
    dm.Set("navigation/anchor/radius", 50.0)
    dm.Set("navigation/anchor/active", true)

    // Move vessel outside radius
    start := time.Now()
    dm.Set("navigation/position/latitude", 48.118)   // ~111m north — well outside 50m
    dm.Set("navigation/position/longitude", -1.183)

    select {
    case alert := <-alerts:
        elapsed := time.Since(start)
        if elapsed > 5*time.Second {
            t.Fatalf("anchor drag alert took %v, must be under 5 seconds", elapsed)
        }
        if alert.Type != AlertTypeAnchorDrag {
            t.Errorf("type: got %v, want AnchorDrag", alert.Type)
        }
    case <-time.After(10 * time.Second):
        t.Fatal("anchor drag alert never received")
    }
}
```

### 5.3 Bilge Alarm

**Requirement:** Bilge pump cycle analysis must detect abnormal pump activity (running too frequently or for too long) and alert within the analysis window.

```go
func TestBilgePumpCycleAlert(t *testing.T) {
    dm := NewDataModel()
    monitor := NewMonitoringService(dm)
    alerts := make(chan Alert, 1)
    monitor.OnAlert(func(a Alert) { alerts <- a })

    // Simulate rapid bilge pump cycling (every 30 seconds — abnormal)
    for i := 0; i < 5; i++ {
        dm.Set("switching/circuits/bilge_pump/state", true)
        time.Sleep(10 * time.Millisecond) // Simulated time
        dm.Set("switching/circuits/bilge_pump/state", false)
        time.Sleep(10 * time.Millisecond)
    }

    select {
    case alert := <-alerts:
        if alert.Type != AlertTypeBilge {
            t.Errorf("type: got %v, want Bilge", alert.Type)
        }
    case <-time.After(5 * time.Second):
        t.Fatal("bilge cycle alert never received")
    }
}
```

### 5.4 CO Detection

**Requirement:** Carbon monoxide detection must escalate immediately to the highest severity with no acknowledgement delay. There is no "snooze" or "dismiss" for CO alerts.

```go
func TestCODetectionImmediate(t *testing.T) {
    dm := NewDataModel()
    monitor := NewMonitoringService(dm)
    alerts := make(chan Alert, 1)
    monitor.OnAlert(func(a Alert) { alerts <- a })

    start := time.Now()
    dm.Set("environment/inside/salon/co_detected", true)

    select {
    case alert := <-alerts:
        elapsed := time.Since(start)
        if elapsed > 500*time.Millisecond {
            t.Fatalf("CO alert took %v, must be under 500ms", elapsed)
        }
        if alert.Severity != SeverityEmergency {
            t.Errorf("CO severity: got %v, want Emergency", alert.Severity)
        }
        if alert.Dismissable {
            t.Error("CO alert must not be dismissable")
        }
    case <-time.After(2 * time.Second):
        t.Fatal("CO alert never received")
    }
}
```

### 5.5 Chaos Testing

Chaos tests simulate real-world failure modes. These run in CI but are also valuable during manual testing with the simulator.

**Gateway disconnection:**

```go
func TestGatewayDisconnectionHandling(t *testing.T) {
    // Start adapter connected to mock TCP server
    server := newMockNMEAServer(t)
    adapter := NewNMEA0183Adapter()
    adapter.Connect(context.Background(), AdapterConfig{
        Source:    server.Addr(),
        Transport: "tcp",
    })

    // Verify data flows
    waitForData(t, adapter, 2*time.Second)

    // Kill the server (simulate gateway power loss)
    server.Close()

    // Adapter should enter error/disconnected state
    waitForState(t, adapter, StateDisconnected, 5*time.Second)

    // Restart server
    server = newMockNMEAServer(t)

    // Adapter should reconnect automatically
    waitForState(t, adapter, StateConnected, 30*time.Second)
    waitForData(t, adapter, 2*time.Second)
}
```

**GPS loss:**

```go
func TestGPSLossDetection(t *testing.T) {
    dm := NewDataModel()
    monitor := NewMonitoringService(dm)

    // Set initial position
    dm.Set("navigation/position/latitude", 48.117)
    dm.Set("navigation/position/longitude", -1.183)

    // Stop updating position — simulate GPS loss
    time.Sleep(30 * time.Second) // GPS stale timeout

    health := dm.GetHealth("navigation/position")
    if health.State != DataStale {
        t.Errorf("expected position data to be stale after timeout")
    }
}
```

**Power interruption:** Test that the data model persists correctly to SQLite and survives a simulated crash (kill the process, restart, verify state). Uses file-backed SQLite in `t.TempDir()`.

---

## 6. Test Data Management

### 6.1 Recorded Data Format and Storage

Test fixtures from real boats are stored in `testdata/` directories alongside the code that uses them. File naming convention:

```
testdata/
  {protocol}-{source}-{scenario}-{date}.{ext}

Examples:
  nmea0183-navlink2-coastal-20260315.nmea
  nmea2000-ikonvert-at-anchor-20260315.bin
  vedirect-smartsolar-sunny-day-20260315.txt
  ais-rtlsdr-busy-harbour-20260315.nmea
```

### 6.2 Capturing Real Data

See section 1.4 for specific capture commands per protocol. General guidelines:

- Record in real-time — do not modify or truncate data
- Capture a variety of scenarios: calm conditions, rough weather, busy AIS traffic, multiple engine states
- Include at least one capture with deliberate errors (gateway resets, corrupt frames) for robustness testing
- Note the conditions when capturing: date, location (general), weather, what equipment was running

### 6.3 Anonymisation

Before committing recorded data to the repository, strip personally identifiable information:

| Field | Action |
|-------|--------|
| MMSI (own vessel) | Replace with test MMSI (use 200000000-299999999 range, reserved for testing) |
| MMSI (AIS targets) | Replace with test MMSIs |
| Vessel name (own) | Replace with "TEST VESSEL" |
| Vessel name (AIS targets) | Replace with generated names ("AIS TARGET 1", etc.) |
| Callsign | Replace with "TEST01" |
| IMO number | Replace with 0000000 |
| GPS position | Offset by a random fixed amount (same offset for entire capture) or use a known test location |
| Serial numbers | Replace with "TESTSERIAL001" |

Provide a script in `scripts/anonymise-testdata.sh` that processes recorded files and applies these substitutions.

**Never commit unanonymised data.** Even in a private repository, real vessel identifiers and positions must not be stored.

### 6.4 Test Data Versioning

Test data is committed to the repository alongside the code. When protocol parsers change (new PGN support, updated field definitions), the corresponding test data may need updating.

- Tag test data files with a version comment or metadata file
- When adding a new PGN or sentence type, add corresponding test data captured from a real device
- If no real device is available, document the fabricated test data as synthetic and note which specification (NMEA 2000 PGN definition, IEC 61162-1, ITU-R M.1371) was used as the reference

---

## 7. CI Integration

### 7.1 Test Parallelisation Strategy

**Go tests:**

```bash
# Run all unit tests in parallel (default: GOMAXPROCS)
go test -race -count=1 ./...

# Integration tests (tagged, may need simulator)
go test -race -tags integration -count=1 ./...
```

Go's test runner parallelises at the package level by default. Within a package, tests marked with `t.Parallel()` run concurrently. Database tests that share a file-backed SQLite must not use `t.Parallel()` — use in-memory databases for parallel tests.

**Frontend tests:**

```bash
# Vitest — parallel by default
pnpm vitest run

# Playwright — parallel with worker limit
pnpm playwright test --workers=2
```

Playwright workers are limited to 2 in CI to avoid resource contention. Locally, the default (half of CPU cores) is used.

### 7.2 Test Timeouts and Flakiness Handling

**Timeouts:**

| Test type | Timeout | Rationale |
|-----------|---------|-----------|
| Go unit test | 30s (per test) | Default is generous. Most unit tests complete in milliseconds. |
| Go integration test | 2 minutes | May involve simulator startup and data flow. |
| Playwright test | 30s (per test) | UI interactions should be fast. Slow tests indicate a performance bug. |
| Safety-critical tests | Defined per test | Each safety test has its own strict timing assertion. |

**Flakiness policy:**

- Tests must be deterministic. A test that fails intermittently is a bug.
- Playwright tests get 2 retries in CI (configured in playwright.config.ts). If a test requires retries to pass, it must be investigated and fixed.
- CI logs trace output on first retry (`trace: 'on-first-retry'`) to assist debugging.
- Flaky tests are tracked in GitHub Issues with the `flaky-test` label.
- A test that has been flaky three times without a fix is quarantined (moved to a `skip` block with a comment linking the issue) until the root cause is resolved.

### 7.3 Coverage Reporting

Coverage is collected in CI and uploaded to a coverage service (Codecov or Coveralls).

**Go:**
```bash
go test -race -coverprofile=coverage.out -covermode=atomic ./...
# Upload to Codecov
```

**Frontend:**
```bash
pnpm vitest run --coverage
# Upload lcov report to Codecov
```

Coverage thresholds are enforced per package (section 1.12). CI fails if a PR drops coverage below the threshold for any covered package.

Coverage reports are linked from the PR comment for easy review.

### 7.4 Test Result Caching

**Go:** The Go test cache (`GOCACHE`) caches passing test results. Tests are only re-run when source code or test code changes. In CI, the Go build cache is preserved between runs via GitHub Actions cache:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: go-${{ runner.os }}-${{ hashFiles('**/go.sum') }}
    restore-keys: go-${{ runner.os }}-
```

Use `-count=1` to bypass the test cache when you need a fresh run (already included in CI commands above).

**Frontend:** Vitest does not cache test results by default. The `node_modules/` cache (via pnpm store) speeds up dependency installation.

**Playwright:** Screenshot baselines are committed to the repository, not cached. Browser binaries are cached:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 7.5 GitHub Actions Workflow Summary

```
Push to any branch:
  ├── Go: lint (golangci-lint) + test -race + coverage
  ├── Frontend: lint (ESLint) + typecheck (tsc) + vitest + coverage
  └── Safety tests (Go, strict timing)

PR to main (adds):
  ├── Start NMEA simulator (seeded, background)
  ├── Go integration tests (with simulator)
  ├── Playwright e2e (Chromium + Firefox)
  ├── Visual regression (screenshot comparison)
  ├── Accessibility audit (axe-core via Playwright)
  └── Coverage threshold check

Merge to main (adds):
  ├── Full Playwright suite (all viewports)
  └── Build verification (Docker multi-arch, Astro static)
```

All test results are reported as GitHub check runs on the PR. Failures block merge via branch protection rules on main.
