## ADDED Requirements

### Requirement: Session Window Bounded Rendering
The system MUST render log table and latency chart based on a shared session window, and MUST limit the rendering data scope to entries within that window instead of the full retained dataset.

#### Scenario: Realtime mode uses moving window
- **WHEN** monitoring is running in realtime mode and new log entries arrive
- **THEN** the session window end MUST move forward with latest timestamp and rendered data MUST remain bounded by the configured window size.

#### Scenario: History mode freezes window anchor
- **WHEN** user switches to history mode and chooses a specific timestamp
- **THEN** both log table and chart MUST render from the same frozen window anchor without scanning full history on each tick.

### Requirement: Virtualized Session List Rendering
The system MUST virtualize log row rendering against session-windowed data, and MUST avoid full-list row object reconstruction for each incoming tick.

#### Scenario: Incoming tick does not rebuild all rows
- **WHEN** one new aggregated log entry is appended during an active session
- **THEN** row derivation MUST update incrementally and visible row rendering MUST not require remapping all historical entries.

#### Scenario: Large dataset keeps stable interaction
- **WHEN** retained logs exceed the in-memory window budget
- **THEN** scrolling and pointer interactions in the log table MUST remain responsive by rendering only visible rows plus overscan.

### Requirement: Rendering Budget and Degradation Policy
The system MUST enforce explicit rendering budgets for table rows and chart points per series, and MUST apply deterministic degradation when budgets are exceeded.

#### Scenario: Chart series exceeds point budget
- **WHEN** points in a target series exceed the configured per-series budget inside current window
- **THEN** the system MUST reduce points using the defined sampling/truncation policy before sending data to chart rendering.

#### Scenario: Session window exceeds memory budget
- **WHEN** entries in current session window exceed configured in-memory budget
- **THEN** the system MUST keep only budgeted in-memory entries for hot rendering and preserve full history in persistent storage.

### Requirement: Decoupled Persistence from Hot Rendering
The system MUST decouple persistence operations from hot rendering updates, and MUST avoid full persistent dataset rewrite for each new tick.

#### Scenario: Incremental persistence on append
- **WHEN** a new log entry is generated
- **THEN** persistence MUST append or upsert incrementally, and UI rendering MUST proceed without waiting for full-store rewrite.

#### Scenario: Retention cleanup is independent
- **WHEN** retention cleanup is triggered
- **THEN** cleanup MUST run as a separate operation and MUST NOT block realtime rendering updates.
