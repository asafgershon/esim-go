# InventoryResponseBundlesInnerAllowancesInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** | Type of allowances (DATA, SMS, VOICE) | [optional] [default to undefined]
**service** | **string** | Service (Roaming, Standard) | [optional] [default to undefined]
**description** | **string** | Allowance description | [optional] [default to undefined]
**amount** | **number** | The amount of units | [optional] [default to undefined]
**unit** | **string** | MB/MINS/SMS | [optional] [default to undefined]
**unlimited** | **boolean** | Indicates if the allowance is unlimited | [optional] [default to undefined]

## Example

```typescript
import { InventoryResponseBundlesInnerAllowancesInner } from '@esim-go/client';

const instance: InventoryResponseBundlesInnerAllowancesInner = {
    type,
    service,
    description,
    amount,
    unit,
    unlimited,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
