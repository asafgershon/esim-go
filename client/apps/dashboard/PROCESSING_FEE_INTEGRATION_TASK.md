# Processing Fee Integration Task

## Overview
Integrate the processing fee configuration system into the existing pricing module to replace hardcoded processing rates with dynamic, configurable fees based on the payment provider quote structure.

## Current State
- ✅ Processing fee management UI implemented
- ✅ Database schema and migration applied
- ✅ GraphQL schema with admin-only endpoints defined
- ❌ Backend resolvers not implemented
- ❌ Frontend not connected to backend API
- ❌ Pricing calculations still use hardcoded rates

## Task Breakdown

### Backend Implementation (High Priority)

#### 1. GraphQL Resolvers
**File**: `server/server/src/resolvers.ts`
**Tasks**:
- Implement `currentProcessingFeeConfiguration` query resolver
- Implement `processingFeeConfigurations` query resolver  
- Implement `processingFeeConfiguration(id)` query resolver
- Implement `createProcessingFeeConfiguration` mutation resolver
- Implement `updateProcessingFeeConfiguration` mutation resolver
- Implement `deactivateProcessingFeeConfiguration` mutation resolver

#### 2. Repository Layer
**File**: `server/server/src/repositories/processing-fees/processing-fee.repository.ts`
**Tasks**:
- Create `ProcessingFeeRepository` extending `BaseSupabaseRepository`
- Implement `getCurrentActive()` method
- Implement `getAll(limit, offset, includeInactive)` method
- Implement `getById(id)` method
- Implement `create(data)` method
- Implement `update(id, data)` method (creates new version)
- Implement `deactivate(id)` method
- Add proper error handling and validation

#### 3. Service Layer Integration
**File**: `server/server/src/services/pricing.service.ts`
**Tasks**:
- Modify `calculatePrice` function to use dynamic processing fees
- Replace hardcoded `processingRate: 0.045` with database lookup
- Implement fee calculation logic based on payment method detection
- Add caching for processing fee configuration (Redis)
- Handle fallback to default rates if no configuration found

#### 4. Type Safety
**Files**: 
- `server/server/src/types.ts`
- `server/server/src/repositories/index.ts`
**Tasks**:
- Export new `ProcessingFeeRepository` 
- Add processing fee types to service interfaces
- Ensure TypeScript compatibility

### Frontend Integration (Medium Priority)

#### 5. GraphQL Queries & Mutations
**File**: `client/apps/dashboard/src/lib/graphql/queries.ts`
**Tasks**:
- Add `GET_CURRENT_PROCESSING_FEE_CONFIGURATION` query
- Add `GET_PROCESSING_FEE_CONFIGURATIONS` query
- Add `CREATE_PROCESSING_FEE_CONFIGURATION` mutation
- Add `UPDATE_PROCESSING_FEE_CONFIGURATION` mutation
- Add `DEACTIVATE_PROCESSING_FEE_CONFIGURATION` mutation

#### 6. Processing Fee Drawer Backend Integration
**File**: `client/apps/dashboard/src/components/processing-fee-drawer.tsx`
**Tasks**:
- Replace localStorage with GraphQL mutations
- Load current configuration on component mount
- Implement save functionality with proper error handling
- Add loading states and success/error feedback
- Handle version conflicts and optimistic updates

#### 7. Pricing Calculations Update
**Files**:
- `client/apps/dashboard/src/components/pricing-simulator-drawer.tsx`
- `client/apps/dashboard/src/components/country-pricing-table-grouped.tsx`
**Tasks**:
- Remove hardcoded `processingRate: 0.045` references
- Use processing fee configuration from backend
- Update calculation logic to handle different fee types
- Add payment method selection for accurate fee calculation

### Enhanced Features (Low Priority)

#### 8. Payment Method Detection
**New Component**: `client/apps/dashboard/src/components/payment-method-selector.tsx`
**Tasks**:
- Create payment method selector (Israeli card, Foreign card, Premium cards, Bit, etc.)
- Integrate with pricing simulator for accurate fee calculation
- Add tooltips explaining different fee rates

#### 9. Historical Processing Fee View
**New Component**: `client/apps/dashboard/src/components/processing-fee-history.tsx`
**Tasks**:
- Display historical processing fee configurations
- Show effective date ranges
- Allow comparison between configurations
- Export functionality for audit purposes

#### 10. Fee Validation & Alerts
**Files**: Multiple components
**Tasks**:
- Add validation for processing fee ranges
- Alert when fees exceed certain thresholds
- Warn about configuration changes affecting profit margins
- Integration with existing pricing validation system

## Technical Requirements

### Database Considerations
- Ensure proper indexing for performance
- Implement proper data validation constraints
- Handle timezone considerations for effective dates
- Consider backup/restore procedures for fee configurations

### API Security
- Validate admin role for all processing fee operations
- Implement rate limiting for configuration changes
- Add audit logging for fee modifications
- Ensure proper error messages without exposing sensitive data

### Performance Optimization
- Cache current processing fee configuration in Redis
- Implement efficient batch processing for pricing calculations
- Consider CDN caching for static fee configurations
- Optimize database queries with proper indexes

### Error Handling
- Graceful fallback to default processing rates
- Proper error messages for invalid configurations
- Handle network failures in frontend gracefully
- Implement retry logic for critical operations

## Testing Strategy

### Unit Tests
- Repository layer CRUD operations
- Service layer fee calculation logic
- Frontend component state management
- GraphQL resolver functionality

### Integration Tests
- End-to-end pricing calculation with fees
- Fee configuration creation and activation
- Frontend-backend integration flows
- Error handling scenarios

### Manual Testing Checklist
- [ ] Create new processing fee configuration
- [ ] Update existing configuration (creates new version)
- [ ] Deactivate configuration
- [ ] Verify pricing calculations use new fees
- [ ] Test admin-only access restrictions
- [ ] Validate effective date handling
- [ ] Check historical configuration viewing

## Acceptance Criteria

### Functional Requirements
- [ ] Admin users can create/update/deactivate processing fee configurations
- [ ] Only one active configuration exists at any time
- [ ] Pricing calculations use dynamic processing fees from database
- [ ] Historical configurations are preserved and viewable
- [ ] Effective date ranges are properly handled
- [ ] Default fallback processing rates work when no configuration exists

### Non-Functional Requirements
- [ ] Processing fee lookups complete within 100ms
- [ ] Configuration changes take effect immediately
- [ ] System handles 1000+ concurrent pricing calculations
- [ ] All processing fee operations are properly logged
- [ ] Frontend provides clear feedback for all operations
- [ ] Mobile-responsive design maintained

## Risk Mitigation

### Data Migration
- Ensure existing pricing calculations continue working during transition
- Plan rollback strategy if processing fee integration fails
- Test with production-like data volumes

### Business Continuity
- Implement fallback to hardcoded rates if database is unavailable
- Ensure fee changes don't break existing order processing
- Validate fee calculations match payment provider expectations

## Timeline Estimate
- **Backend Implementation**: 2-3 days
- **Frontend Integration**: 1-2 days  
- **Enhanced Features**: 1-2 days
- **Testing & Polish**: 1 day
- **Total**: 5-8 days

## Dependencies
- Current processing fee management UI (✅ Complete)
- Database schema and migrations (✅ Complete)
- GraphQL schema definitions (✅ Complete)
- Admin authentication system (✅ Existing)
- Pricing calculation system (✅ Existing)

## Success Metrics
- Processing fee configurations can be managed through UI
- Pricing calculations reflect current processing fee settings
- Zero downtime during implementation
- No regression in existing pricing functionality
- Admin users report improved fee management workflow