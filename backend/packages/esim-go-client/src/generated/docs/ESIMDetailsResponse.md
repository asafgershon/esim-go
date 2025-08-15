# ESIMDetailsResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**iccid** | **string** | The Integrated Circuit Card Identifier of the SIM card | [optional] [default to undefined]
**pin** | **string** | The Personal Identification Number for the SIM card | [optional] [default to undefined]
**puk** | **string** | The Personal Unblocking Key for the SIM card | [optional] [default to undefined]
**matchingId** | **string** | A unique identifier for matching purposes (used for eSIM activation) | [optional] [default to undefined]
**smdpAddress** | **string** | The Subscription Manager Data Preparation server address (used for eSIM activation) | [optional] [default to undefined]
**profileStatus** | **string** | The current status of the SIM profile | [optional] [default to undefined]
**firstInstalledDateTime** | **number** | The timestamp of when the profile was first installed (in milliseconds since epoch) | [optional] [default to undefined]
**customerRef** | **string** | Customer reference information | [optional] [default to undefined]

## Example

```typescript
import { ESIMDetailsResponse } from '@esim-go/client';

const instance: ESIMDetailsResponse = {
    iccid,
    pin,
    puk,
    matchingId,
    smdpAddress,
    profileStatus,
    firstInstalledDateTime,
    customerRef,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
