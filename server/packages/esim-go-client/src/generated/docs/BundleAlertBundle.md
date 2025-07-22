# BundleAlertBundle


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Unique identifier for the bundle | [optional] [default to undefined]
**reference** | **string** | Reference code for the bundle | [optional] [default to undefined]
**name** | **string** | Name of the bundle | [optional] [default to undefined]
**description** | **string** | Description of the bundle | [optional] [default to undefined]
**initialQuantity** | **number** | The initial quantity the bundle had (in bytes) | [optional] [default to undefined]
**remainingQuantity** | **number** | The remaining quantity the bundle had (in bytes) | [optional] [default to undefined]
**startTime** | **string** | Start time of the bundle validity | [optional] [default to undefined]
**endTime** | **string** | End time of the bundle validity | [optional] [default to undefined]
**unlimited** | **boolean** | Indicates if the bundle has unlimited usage | [optional] [default to undefined]

## Example

```typescript
import { BundleAlertBundle } from '@esim-go/client';

const instance: BundleAlertBundle = {
    id,
    reference,
    name,
    description,
    initialQuantity,
    remainingQuantity,
    startTime,
    endTime,
    unlimited,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
