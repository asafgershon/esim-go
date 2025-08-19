# V2FutureOrdersPost200ResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**requestId** | **string** | A unique string from 25 charachers for your submitted order that you can use it later to make other operations on the order. For example to cancel it if needed. | [default to undefined]
**dueDate** | **string** | The submitted due date with the order | [default to undefined]
**latestCancellationDate** | **string** | Latest cancelation date | [default to undefined]

## Example

```typescript
import { V2FutureOrdersPost200ResponseData } from '@hiilo/airalo';

const instance: V2FutureOrdersPost200ResponseData = {
    requestId,
    dueDate,
    latestCancellationDate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
