# V2PackagesGet200ResponseDataInnerOperatorsInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** |  | [default to undefined]
**style** | **string** |  | [default to undefined]
**gradientStart** | **string** |  | [default to undefined]
**gradientEnd** | **string** |  | [default to undefined]
**type** | **string** |  | [default to undefined]
**isPrepaid** | **boolean** |  | [default to undefined]
**title** | **string** |  | [default to undefined]
**esimType** | **string** |  | [default to undefined]
**warning** | **any** |  | [default to undefined]
**apnType** | **string** |  | [default to undefined]
**apnValue** | **string** |  | [default to undefined]
**isRoaming** | **boolean** |  | [default to undefined]
**info** | **Array&lt;string&gt;** |  | [default to undefined]
**image** | [**V2PackagesGet200ResponseDataInnerImage**](V2PackagesGet200ResponseDataInnerImage.md) |  | [default to undefined]
**planType** | **string** |  | [default to undefined]
**activationPolicy** | **string** |  | [default to undefined]
**isKycVerify** | **boolean** |  | [default to undefined]
**rechargeability** | **boolean** |  | [default to undefined]
**otherInfo** | **string** |  | [default to undefined]
**coverages** | [**Array&lt;V2PackagesGet200ResponseDataInnerOperatorsInnerCoveragesInner&gt;**](V2PackagesGet200ResponseDataInnerOperatorsInnerCoveragesInner.md) |  | [default to undefined]
**installWindowDays** | **number** | The # of days from when an eSIM is bought from operator until it can be installed on a device. If this time passes - the sim is recycled and gone (cannot be used/ topped up) | [default to undefined]
**topupGraceWindowDays** | **number** | The # of days from when an eSIM is exhausted or expired until a topup is bought. If this period passes and no topup is bought, the sim is recycled and can no longer be topped up. Note that after each topup this period restarts. | [default to undefined]
**apn** | [**V2PackagesGet200ResponseDataInnerOperatorsInnerApn**](V2PackagesGet200ResponseDataInnerOperatorsInnerApn.md) |  | [default to undefined]
**packages** | [**Array&lt;V2PackagesGet200ResponseDataInnerOperatorsInnerPackagesInner&gt;**](V2PackagesGet200ResponseDataInnerOperatorsInnerPackagesInner.md) |  | [default to undefined]
**countries** | [**Array&lt;V2PackagesGet200ResponseDataInnerOperatorsInnerCountriesInner&gt;**](V2PackagesGet200ResponseDataInnerOperatorsInnerCountriesInner.md) |  | [default to undefined]

## Example

```typescript
import { V2PackagesGet200ResponseDataInnerOperatorsInner } from '@hiilo/airalo';

const instance: V2PackagesGet200ResponseDataInnerOperatorsInner = {
    id,
    style,
    gradientStart,
    gradientEnd,
    type,
    isPrepaid,
    title,
    esimType,
    warning,
    apnType,
    apnValue,
    isRoaming,
    info,
    image,
    planType,
    activationPolicy,
    isKycVerify,
    rechargeability,
    otherInfo,
    coverages,
    installWindowDays,
    topupGraceWindowDays,
    apn,
    packages,
    countries,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
