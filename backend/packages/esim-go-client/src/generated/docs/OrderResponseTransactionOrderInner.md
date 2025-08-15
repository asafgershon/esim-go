# OrderResponseTransactionOrderInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**esims** | [**Array&lt;OrderResponseTransactionOrderInnerEsimsInner&gt;**](OrderResponseTransactionOrderInnerEsimsInner.md) |  | [optional] [default to undefined]
**type** | **string** | Item type [ bundle ] | [optional] [default to undefined]
**item** | **string** | Name of the bundle | [optional] [default to undefined]
**iccids** | **Array&lt;string&gt;** | ICCID of eSIM new bundle was assigned to | [optional] [default to undefined]
**quantity** | **number** | Quantity of items | [optional] [default to undefined]
**subTotal** | **number** | Cost of a bundle multiplied by its quantity | [optional] [default to undefined]
**pricePerUnit** | **number** | Price per each item | [optional] [default to undefined]
**allowReassign** | **boolean** | Allow a new eSIM to be provided if the bundle is not compatible with the eSIM profile | [optional] [default to undefined]

## Example

```typescript
import { OrderResponseTransactionOrderInner } from '@esim-go/client';

const instance: OrderResponseTransactionOrderInner = {
    esims,
    type,
    item,
    iccids,
    quantity,
    subTotal,
    pricePerUnit,
    allowReassign,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
