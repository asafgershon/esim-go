# ESIMDetailsInstallResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**iccid** | **string** | The ICCID (Integrated Circuit Card Identifier) of the eSIM | [optional] [default to undefined]
**matchingId** | **string** | The matching ID for the eSIM profile | [optional] [default to undefined]
**smdpAddress** | **string** | The address of the Subscription Manager Data Preparation (SM-DP+) server | [optional] [default to undefined]
**profileStatus** | **string** | The current status of the eSIM profile | [optional] [default to undefined]
**pin** | **string** | The PIN (Personal Identification Number) for the eSIM | [optional] [default to undefined]
**puk** | **string** | The PUK (PIN Unlock Key) for the eSIM | [optional] [default to undefined]
**firstInstalledDateTime** | **string** | The date and time when the profile was first installed | [optional] [default to undefined]

## Example

```typescript
import { ESIMDetailsInstallResponse } from '@esim-go/client';

const instance: ESIMDetailsInstallResponse = {
    iccid,
    matchingId,
    smdpAddress,
    profileStatus,
    pin,
    puk,
    firstInstalledDateTime,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
