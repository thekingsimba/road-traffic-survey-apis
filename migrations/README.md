# Survey Agent Migration

## Overview
This migration updates the survey system from a single agent structure to a two-agent structure where surveys can have separate agents for the starting point and ending point.

## Changes Made

### Database Schema Changes
- **Removed**: `assignedAgent` field (single agent reference)
- **Removed**: `countingPost` field (enum: 'start' | 'end')
- **Added**: `startPointAgent` field (agent for starting point)
- **Added**: `endPointAgent` field (agent for ending point)

### API Changes
- Updated all survey endpoints to handle the new agent structure
- Modified access control to check both start and end point agents
- Updated population queries to include both agent fields

### Frontend Changes
- Updated survey creation form to support two agents
- Modified survey editing form to handle two agents
- Updated survey list display to show both agents
- Removed counting post functionality

## Migration Process

### 1. Run the Migration Script
```bash
cd road-traffic-survey-apis
node migrations/update-survey-agents.js
```

### 2. Migration Logic
The migration script will:
- Find all existing surveys with the old structure
- Move `assignedAgent` to `startPointAgent` if `countingPost` is 'start'
- Move `assignedAgent` to `endPointAgent` if `countingPost` is 'end'
- Move `assignedAgent` to `startPointAgent` if no `countingPost` specified (default)
- Remove the old `assignedAgent` and `countingPost` fields

### 3. Verification
After migration, verify that:
- All surveys have the new agent structure
- No surveys retain the old fields
- Agent assignments are correctly preserved

## Rollback Plan
If rollback is needed:
1. Restore from database backup taken before migration
2. Revert code changes to use old structure
3. Update frontend to handle old data format

## Testing
After migration:
1. Test survey creation with two agents
2. Test survey editing with two agents
3. Verify agent access control works correctly
4. Test vehicle counting functionality
5. Verify survey statistics are accurate

## Notes
- This is a breaking change that requires both frontend and backend updates
- Existing surveys will be automatically migrated
- New surveys will require both start and end point agents to be specified
- The system now supports more flexible agent assignments
