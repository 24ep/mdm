# Real-Time Charts Best Practices

## Current Implementation ✅

### Fixed Issues:
1. **Infinite Loading Loop** - Fixed by:
   - Using refs to track loading state
   - Only fetching when cache key changes (not on every render)
   - Preventing duplicate requests
   - Auto-refresh is opt-in (not default)

2. **Data Fetching**:
   - Loads once when data source changes
   - Caches data to prevent unnecessary fetches
   - Only refreshes when explicitly enabled

### Best Practices Applied:

#### 1. **Load Once, Cache Data** (Default)
- Charts load data once when mounted
- Data is cached and reused
- No unnecessary re-fetches
- **Best for**: Static/semi-static data, dashboards

#### 2. **Polling with Intervals** (Opt-in)
- Only enabled when `autoRefresh: true` AND `refreshInterval > 0`
- Respects loading state (won't fetch while loading)
- Configurable intervals (30s, 1min, 5min, etc.)
- **Best for**: Near-real-time data (30s-5min updates)

#### 3. **WebSockets** (Available but not required)
- `useRealtimeData` hook supports WebSockets
- Use for true real-time (< 1 second latency)
- More complex setup required
- **Best for**: Live dashboards, chat, notifications

## When to Use Each Approach

### Static/Semi-Static Data
```typescript
// Default behavior - no auto-refresh
useDataSource({
  dataSource: 'data-model',
  dataModelId: '...',
  autoRefresh: false  // Default
})
```
✅ **Loads once** when component mounts  
✅ **No constant loading**  
✅ **Best performance**  
✅ **No server load**

### Near-Real-Time (Polling)
```typescript
// Enable polling for dashboards that need updates
useDataSource({
  dataSource: 'data-model',
  dataModelId: '...',
  autoRefresh: true,        // Enable
  refreshInterval: 30       // 30 seconds
})
```
✅ **Good for most use cases**  
✅ **Simple to implement**  
✅ **Configurable intervals**  
⚠️ **Uses more server resources**  
⚠️ **Not true real-time**

### True Real-Time (WebSockets)
```typescript
// Use WebSocket hook for true real-time
const { data, loading } = useRealtimeData(
  dataModelId,
  query,
  {
    useWebSocket: true,
    interval: 0  // No polling, only WebSocket
  }
)
```
✅ **True real-time (< 1s latency)**  
✅ **Efficient (server pushes updates)**  
⚠️ **More complex**  
⚠️ **Requires WebSocket server**

## Current Status

✅ **Charts load once** - no infinite loops  
✅ **Auto-refresh is opt-in** - disabled by default  
✅ **Proper caching** - prevents duplicate fetches  
✅ **Loading state management** - prevents concurrent requests  

## To Enable Real-Time Updates

1. **For Polling (Recommended)**:
   - Set `autoRefresh: true` in widget properties
   - Set `refreshInterval: 30` (seconds)
   - Works automatically, no WebSocket needed

2. **For WebSockets (Advanced)**:
   - Use `useRealtimeData` hook instead of `useDataSource`
   - Requires WebSocket server setup
   - Best for high-frequency updates

## Performance Impact

- **Without auto-refresh**: Loads once, minimal server load
- **With polling (30s)**: ~2 requests/minute per chart
- **With WebSocket**: Persistent connection, efficient for many updates

## Recommendation

**For most use cases**: Use polling with reasonable intervals (30s-5min).  
**For real-time dashboards**: Use WebSockets if you need < 1s latency.  
**For static data**: Keep auto-refresh disabled (default).

