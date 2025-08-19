# ESIMsDeprecatedApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**esimsIccidBundlesPost**](#esimsiccidbundlespost) | **POST** /esims/{iccid}/bundles | Apply a Bundle to an eSIM (Deprecated)|

# **esimsIccidBundlesPost**
> object esimsIccidBundlesPost()


### Example

```typescript
import {
    ESIMsDeprecatedApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsDeprecatedApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let contentType: string; // (optional) (default to undefined)
let accept: string; // (optional) (default to undefined)
let body: object; // (optional)

const { status, data } = await apiInstance.esimsIccidBundlesPost(
    iccid,
    contentType,
    accept,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **object**|  | |
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **contentType** | [**string**] |  | (optional) defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**object**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
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

