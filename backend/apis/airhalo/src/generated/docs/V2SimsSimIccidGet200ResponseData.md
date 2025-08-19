# V2SimsSimIccidGet200ResponseData


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**iccid** | **string** |  | [default to undefined]
**lpa** | **string** |  | [default to undefined]
**imsis** | **any** |  | [default to undefined]
**matchingId** | **string** |  | [default to undefined]
**qrcode** | **string** |  | [default to undefined]
**qrcodeUrl** | **string** |  | [default to undefined]
**directAppleInstallationUrl** | **string** |  | [default to undefined]
**voucherCode** | **any** |  | [default to undefined]
**airaloCode** | **any** |  | [default to undefined]
**apnType** | **string** |  | [default to undefined]
**apnValue** | **any** |  | [default to undefined]
**isRoaming** | **boolean** |  | [default to undefined]
**confirmationCode** | **string** |  | [default to undefined]
**order** | **any** |  | [default to undefined]
**brandSettingsName** | **string** |  | [default to undefined]
**recycled** | **boolean** | true - if sim is recycled. - false - otherwise | [default to undefined]
**recycledAt** | **string** | Timestamp of when the sim was recycled in format Y-m-d H:i:s | [default to undefined]
**simable** | [**V2SimsSimIccidGet200ResponseDataSimable**](V2SimsSimIccidGet200ResponseDataSimable.md) |  | [default to undefined]

## Example

```typescript
import { V2SimsSimIccidGet200ResponseData } from '@hiilo/airalo';

const instance: V2SimsSimIccidGet200ResponseData = {
    id,
    createdAt,
    iccid,
    lpa,
    imsis,
    matchingId,
    qrcode,
    qrcodeUrl,
    directAppleInstallationUrl,
    voucherCode,
    airaloCode,
    apnType,
    apnValue,
    isRoaming,
    confirmationCode,
    order,
    brandSettingsName,
    recycled,
    recycledAt,
    simable,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
