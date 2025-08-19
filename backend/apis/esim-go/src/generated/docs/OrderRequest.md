# OrderRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [optional] [default to undefined]
**assign** | **boolean** | To specify if bundle(s) to be assigned to eSIM(s) | [optional] [default to undefined]
**order** | [**Array&lt;BundleOrder&gt;**](BundleOrder.md) |  | [optional] [default to undefined]

## Example

```typescript
import { OrderRequest } from '@esim-go/client';

const instance: OrderRequest = {
    type,
    assign,
    order,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
