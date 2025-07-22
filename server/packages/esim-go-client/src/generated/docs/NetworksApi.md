# NetworksApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**networksGet**](#networksget) | **GET** /networks | Get Country Network Data|

# **networksGet**
> NetworkResponse networksGet()

This endpoint is used to return the networks for a country/countries searched for either by an array of countires or ISO codes (ISOs).   Alternatively, it can be toggled to return all countries and their networks.   Please refer to the rate sheet, availible to download in the eSIM Go Management Portal for a full list of country names and ISO codes. 

### Example

```typescript
import {
    NetworksApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new NetworksApi(configuration);

let accept: string; // (optional) (default to undefined)
let countries: string; //List of Countries e.g. United Kingdom, United States (optional) (default to undefined)
let isos: string; //List of ISOs e.g. GB, US (optional) (default to undefined)
let returnAll: string; //Used to toggle returning of all Countries e.g. true/false (optional) (default to undefined)

const { status, data } = await apiInstance.networksGet(
    accept,
    countries,
    isos,
    returnAll
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **countries** | [**string**] | List of Countries e.g. United Kingdom, United States | (optional) defaults to undefined|
| **isos** | [**string**] | List of ISOs e.g. GB, US | (optional) defaults to undefined|
| **returnAll** | [**string**] | Used to toggle returning of all Countries e.g. true/false | (optional) defaults to undefined|


### Return type

**NetworkResponse**

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

