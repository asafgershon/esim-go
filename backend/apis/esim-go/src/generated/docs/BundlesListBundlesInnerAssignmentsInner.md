# BundlesListBundlesInnerAssignmentsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | ID of assignment | [optional] [default to undefined]
**callTypeGroup** | **string** | Type of the bundle | [optional] [default to undefined]
**initialQuantity** | **number** | The initial quantity the bundle had (in bytes) | [optional] [default to undefined]
**remainingQuantity** | **number** | The remaining quantity the bundle had (in bytes) | [optional] [default to undefined]
**assignmentDateTime** | **string** | The date and time the bundle was created (utc string) | [optional] [default to undefined]
**assignmentReference** | **string** | Assigment reference | [optional] [default to undefined]
**bundleState** | **string** | Current state of a bundle | [optional] [default to undefined]
**unlimited** | **boolean** | If the bundle is unlimited | [optional] [default to undefined]

## Example

```typescript
import { BundlesListBundlesInnerAssignmentsInner } from '@esim-go/client';

const instance: BundlesListBundlesInnerAssignmentsInner = {
    id,
    callTypeGroup,
    initialQuantity,
    remainingQuantity,
    assignmentDateTime,
    assignmentReference,
    bundleState,
    unlimited,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
