# OrdersPost200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**order** | [**Array&lt;OrderResponseTransactionOrderInner&gt;**](OrderResponseTransactionOrderInner.md) | Order type [ transaction ] | [optional] [default to undefined]
**total** | **number** | Total price | [optional] [default to undefined]
**valid** | **boolean** | Indicates if request is valid | [optional] [default to undefined]
**currency** | **string** | Currency of the transaction | [optional] [default to undefined]
**createdDate** | **string** | Data and time of order creation | [optional] [default to undefined]
**assigned** | **boolean** | Indicates if bundle was assigned to eSIM | [optional] [default to undefined]
**status** | **string** | Status of the order | [optional] [default to undefined]
**statusMessage** | **string** | Status message | [optional] [default to undefined]
**orderReference** | **string** | Order reference | [optional] [default to undefined]
**sourceIP** | **string** | Source IP of the order | [optional] [default to undefined]

## Example

```typescript
import { OrdersPost200Response } from '@esim-go/client';

const instance: OrdersPost200Response = {
    order,
    total,
    valid,
    currency,
    createdDate,
    assigned,
    status,
    statusMessage,
    orderReference,
    sourceIP,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
