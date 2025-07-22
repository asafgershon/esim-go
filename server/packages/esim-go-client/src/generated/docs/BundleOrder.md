# BundleOrder


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**type** | **string** |  | [optional] [default to undefined]
**quantity** | **number** | Quantity of the bundles to purchase. If you purchase several different bundles, specify the quantity of each item separately. | [optional] [default to undefined]
**item** | **string** | Name of the bundle | [optional] [default to undefined]
**iccids** | **Array&lt;string&gt;** | ICCID of the eSIM to assign bundle to (quantity of items and number of ICCIDs should match) | [optional] [default to undefined]
**allowReassign** | **boolean** | Allow a new eSIM to be provided if the bundle is not compatible with the eSIM profile | [optional] [default to undefined]

## Example

```typescript
import { BundleOrder } from '@esim-go/client';

const instance: BundleOrder = {
    type,
    quantity,
    item,
    iccids,
    allowReassign,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
