# ESIMsEsimsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**iccid** | **string** | ICCID of ESIM | [optional] [default to undefined]
**customerRef** | **string** | Reference of ESIM | [optional] [default to undefined]
**lastAction** | **string** | Last action performed on the ESIM (e.g. Bundle Applied) | [optional] [default to undefined]
**actionDate** | **string** | The date of the Last Action performed on the ESIM | [optional] [default to undefined]
**physical** | **boolean** | Type of SIM | [optional] [default to undefined]
**assignedDate** | **string** | The date of ESIM\&#39;s first assignment | [optional] [default to undefined]

## Example

```typescript
import { ESIMsEsimsInner } from '@esim-go/client';

const instance: ESIMsEsimsInner = {
    iccid,
    customerRef,
    lastAction,
    actionDate,
    physical,
    assignedDate,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
