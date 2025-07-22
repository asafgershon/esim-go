# OrderResponseValidate


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**order** | [**Array&lt;OrderResponseValidateOrderInner&gt;**](OrderResponseValidateOrderInner.md) | Order type [ validate ] | [optional] [default to undefined]
**total** | **number** | Total price | [optional] [default to undefined]
**valid** | **boolean** | Indicates if request is valid | [optional] [default to undefined]
**currency** | **string** | Currency of the transaction | [optional] [default to undefined]
**createdDate** | **string** | Data and time of order creation | [optional] [default to undefined]
**assigned** | **boolean** | Indicates if bundle was assigned to eSIM | [optional] [default to undefined]

## Example

```typescript
import { OrderResponseValidate } from '@esim-go/client';

const instance: OrderResponseValidate = {
    order,
    total,
    valid,
    currency,
    createdDate,
    assigned,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
