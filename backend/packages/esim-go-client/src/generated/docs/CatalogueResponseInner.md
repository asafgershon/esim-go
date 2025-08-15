# CatalogueResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Bundle Name | [optional] [default to undefined]
**description** | **string** | Bundle Description | [optional] [default to undefined]
**groups** | **Array&lt;string&gt;** | Bundle Group | [optional] [default to undefined]
**countries** | [**Array&lt;CatalogueResponseInnerCountriesInner&gt;**](CatalogueResponseInnerCountriesInner.md) |  | [optional] [default to undefined]
**dataAmount** | **number** | Data Amount (MB) | [optional] [default to undefined]
**duration** | **number** | Bundle Duration | [optional] [default to undefined]
**speed** | **Array&lt;string&gt;** | Bundle Speed | [optional] [default to undefined]
**autostart** | **boolean** | If the bundle auto starts | [optional] [default to undefined]
**unlimited** | **boolean** | If the bundle is unlimited | [optional] [default to undefined]
**roamingEnabled** | [**Array&lt;CatalogueResponseInnerCountriesInner&gt;**](CatalogueResponseInnerCountriesInner.md) |  | [optional] [default to undefined]
**price** | **number** | Bundle price in the organisation currency | [optional] [default to undefined]
**billingType** | **string** | Billing type of the bundle | [optional] [default to undefined]

## Example

```typescript
import { CatalogueResponseInner } from '@esim-go/client';

const instance: CatalogueResponseInner = {
    name,
    description,
    groups,
    countries,
    dataAmount,
    duration,
    speed,
    autostart,
    unlimited,
    roamingEnabled,
    price,
    billingType,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
