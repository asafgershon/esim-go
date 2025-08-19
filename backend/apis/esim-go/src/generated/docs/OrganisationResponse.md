# OrganisationResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of organisation | [optional] [default to undefined]
**apiKey** | **string** | API Key | [optional] [default to undefined]
**taxLiable** | **string** | If the organisation is tax liable | [optional] [default to undefined]
**addr1** | **string** | Address line 1 | [optional] [default to undefined]
**addr2** | **string** | Address line 2 | [optional] [default to undefined]
**city** | **string** | City | [optional] [default to undefined]
**country** | **string** | Country | [optional] [default to undefined]
**postcode** | **string** | Postal Code | [optional] [default to undefined]
**callbackUrl** | **string** | Callback URL | [optional] [default to undefined]
**notes** | **string** | Notes attached to organisation | [optional] [default to undefined]
**groups** | **Array&lt;string&gt;** | Groups an organisation assigned to | [optional] [default to undefined]
**currency** | **string** | Selected currency | [optional] [default to undefined]
**balance** | **number** | Organisational balance + test credit | [optional] [default to undefined]
**testCredit** | **number** | Organisational test credit | [optional] [default to undefined]
**testCreditExpiry** | **string** | Organisational test credit expiry date | [optional] [default to undefined]
**businessType** | **string** | Business type | [optional] [default to undefined]
**website** | **string** | Website | [optional] [default to undefined]
**productDescription** | **string** | Product Description | [optional] [default to undefined]
**users** | [**Array&lt;OrganisationResponseUsersInner&gt;**](OrganisationResponseUsersInner.md) |  | [optional] [default to undefined]

## Example

```typescript
import { OrganisationResponse } from '@esim-go/client';

const instance: OrganisationResponse = {
    name,
    apiKey,
    taxLiable,
    addr1,
    addr2,
    city,
    country,
    postcode,
    callbackUrl,
    notes,
    groups,
    currency,
    balance,
    testCredit,
    testCreditExpiry,
    businessType,
    website,
    productDescription,
    users,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
