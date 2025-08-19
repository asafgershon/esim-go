# CatalogueApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**catalogueBundleNameGet**](#cataloguebundlenameget) | **GET** /catalogue/bundle/{name} | Get Bundle details from catalogue|
|[**catalogueGet**](#catalogueget) | **GET** /catalogue | Get Bundle catalogue|

# **catalogueBundleNameGet**
> BundleCatalogueResponse catalogueBundleNameGet()

Get details of a specific Bundle from your Organisation\'s catalogue. **Note:** Bundle names are case sensitive e.g. \"esim_1GB_7D_IM_U\".

### Example

```typescript
import {
    CatalogueApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new CatalogueApi(configuration);

let name: string; //(Required) Name of Bundle to get countries for. Bundle names are case sensitive. (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.catalogueBundleNameGet(
    name,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] | (Required) Name of Bundle to get countries for. Bundle names are case sensitive. | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**BundleCatalogueResponse**

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

# **catalogueGet**
> Array<CatalogueResponseInner> catalogueGet()

List all Bundles available to your Organisation for ordering. Bundle names can be used with the `/orders` endpoint to place an order. 

### Example

```typescript
import {
    CatalogueApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new CatalogueApi(configuration);

let accept: string; // (optional) (default to undefined)
let page: number; //Page of Bundles to return (optional) (default to undefined)
let perPage: number; //Number of Bundles to return per page (optional) (default to undefined)
let direction: string; //Direction of ordering (optional) (default to undefined)
let orderBy: string; //Name of column to order by (optional) (default to undefined)
let description: string; //Wildcard search for description (optional) (default to undefined)
let group: string; //Filter by Bundle Group (exact value) e.g. `Standard eSIM Bundles` (optional) (default to undefined)
let countries: string; //Comma-separated list of country ISO codes to filter by. This will search for Bundles that include at least one of the countries as their base country. e.g. `GB, US` (optional) (default to undefined)
let region: string; //This will return Bundles that have a base country in the specified region. e.g. `Europe` (optional) (default to undefined)

const { status, data } = await apiInstance.catalogueGet(
    accept,
    page,
    perPage,
    direction,
    orderBy,
    description,
    group,
    countries,
    region
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **page** | [**number**] | Page of Bundles to return | (optional) defaults to undefined|
| **perPage** | [**number**] | Number of Bundles to return per page | (optional) defaults to undefined|
| **direction** | [**string**] | Direction of ordering | (optional) defaults to undefined|
| **orderBy** | [**string**] | Name of column to order by | (optional) defaults to undefined|
| **description** | [**string**] | Wildcard search for description | (optional) defaults to undefined|
| **group** | [**string**] | Filter by Bundle Group (exact value) e.g. &#x60;Standard eSIM Bundles&#x60; | (optional) defaults to undefined|
| **countries** | [**string**] | Comma-separated list of country ISO codes to filter by. This will search for Bundles that include at least one of the countries as their base country. e.g. &#x60;GB, US&#x60; | (optional) defaults to undefined|
| **region** | [**string**] | This will return Bundles that have a base country in the specified region. e.g. &#x60;Europe&#x60; | (optional) defaults to undefined|


### Return type

**Array<CatalogueResponseInner>**

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

