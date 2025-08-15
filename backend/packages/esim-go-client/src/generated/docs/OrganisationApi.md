# OrganisationApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**organisationBalancePost**](#organisationbalancepost) | **POST** /organisation/balance | Topup Organisation Balance|
|[**organisationGet**](#organisationget) | **GET** /organisation | Get Current Organisation Details|
|[**organisationGroupsGet**](#organisationgroupsget) | **GET** /organisation/groups | Get Bundle Groups|

# **organisationBalancePost**
> TopupResponse organisationBalancePost()

Update the pre-payed balance held by your organisation. Initial payment is done using the Portal: https://portal.esim-go.com/. This will store your card details for future use. Follow up payments can be done using the API.   Note: The minimum top-up amount is $1000 and the maximum daily top-up is set at $5000. If you wish to raise or lower this amount, please contact your account manager. 

### Example

```typescript
import {
    OrganisationApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrganisationApi(configuration);

let accept: string; // (optional) (default to undefined)
let amount: string; //(Required) The amount of to be charged to the saved card (optional) (default to undefined)

const { status, data } = await apiInstance.organisationBalancePost(
    accept,
    amount
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **amount** | [**string**] | (Required) The amount of to be charged to the saved card | (optional) defaults to undefined|


### Return type

**TopupResponse**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  * Content-Type -  <br>  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **organisationGet**
> OrganisationResponse organisationGet()

This endpoint allows you to retrieve comprehensive information about your organisation, including details of all associated users.

### Example

```typescript
import {
    OrganisationApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrganisationApi(configuration);

let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.organisationGet(
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**OrganisationResponse**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  * Content-Type -  <br>  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **organisationGroupsGet**
> BundleGroupList organisationGroupsGet()

This endpoint returns a list of the groups of Bundles available for your Organisation to order. Bundles in eSIM Go are categorised into groups.    Name of the bundle group depends on your account tier. In the example below you will find the groups description for **standard** organisation tier.   Standard Fixed  * All these bundles are for a finite and fixed amount of data.  * eg. the moniker for a Standard Fixed Turkey 1GB 7 Days bundle is esim_1GB_7D_TR_V2   Standard Long Duration  * All these bundles are for a finite and fixed amount of data.  * eg. the moniker for a Standard 50GB 90 Days Long Duration Bundle is esim_50GB_90D_RGBS_V2   Standard Unlimited Lite  * These bundles will provide 1GB of unthrottled data every 24 hours, once this is depleted data will be throttled to 512kbps. This repeats each day for the duration of the bundle.  * eg. the moniker for a Standard Unlimited Lite Turkey 1 day bundle is esim_UL_1D_TR_V2   Standard Unlimited Essential  * These bundles will provide 1GB of unthrottled data every 24 hours, once this is depleted data will be throttled to 1.25mbps. This repeats each day for the duration of the bundle.  * eg. the moniker for a Standard Unlimited Lite Turkey 1 day bundle is esim_ULE_1D_TR_V2   Standard Unlimited Plus  * These bundles will provide 2GB of unthrottled data every 24 hours, once this is depleted data will be throttled to 2mbps. This repeats each day for the duration of the bundle.  * eg. the moniker for a Standard Unlimited Plus Turkey 1 day bundle is esim_ULP_1D_TR_V2 

### Example

```typescript
import {
    OrganisationApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrganisationApi(configuration);

let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.organisationGroupsGet(
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**BundleGroupList**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  * Content-Type -  <br>  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

