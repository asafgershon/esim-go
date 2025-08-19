# RESTAPIEndpointsInstallESIMApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2SimsSimIccidGet**](#v2simssimiccidget) | **GET** /v2/sims/{sim_iccid} | Get eSIM|
|[**v2SimsSimIccidInstructionsGet**](#v2simssimiccidinstructionsget) | **GET** /v2/sims/{sim_iccid}/instructions | Get installation instructions|

# **v2SimsSimIccidGet**
> V2SimsSimIccidGet200Response v2SimsSimIccidGet()

This endpoint allows you to retrieve the details of a specific eSIM from the Airalo Partners API using the eSIM\'s ICCID. Note that only eSIM orders made via the API are retrievable via this endpoint. You can include related data in the response by specifying optional parameters.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)  **direct_apple_installation_url:**  Partner API now supports direct installation on iOS devices. With the introduction of Universal Links by Apple, users with iOS 17.4 or higher can directly install eSIMs using a special URL, which can be provided to your end clients if they are using iOS version 17.4 or above.

### Example

```typescript
import {
    RESTAPIEndpointsInstallESIMApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsInstallESIMApi(configuration);

let simIccid: string; //The ICCID of the eSIM for which you want to retrieve the details. (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let include: string; //Optional. A comma-separated string to include related data in the response. Possible values are \"order\", \"order.status\", \"order.user\" and \"share\". (optional) (default to undefined)

const { status, data } = await apiInstance.v2SimsSimIccidGet(
    simIccid,
    accept,
    authorization,
    include
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **simIccid** | [**string**] | The ICCID of the eSIM for which you want to retrieve the details. | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **include** | [**string**] | Optional. A comma-separated string to include related data in the response. Possible values are \&quot;order\&quot;, \&quot;order.status\&quot;, \&quot;order.user\&quot; and \&quot;share\&quot;. | (optional) defaults to undefined|


### Return type

**V2SimsSimIccidGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimsSimIccidInstructionsGet**
> V2SimsSimIccidInstructionsGet200Response v2SimsSimIccidInstructionsGet()

This endpoint allows you to retrieve the language specific installation instructions of a specific eSIM from the Airalo Partners API using the eSIM\'s ICCID.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)  **direct_apple_installation_url:**  Partner API now supports direct installation on iOS devices. With the introduction of Universal Links by Apple, users with iOS 17.4 or higher can directly install eSIMs using a special URL, which can be provided to your end clients if they are using iOS version 17.4 or above.

### Example

```typescript
import {
    RESTAPIEndpointsInstallESIMApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsInstallESIMApi(configuration);

let simIccid: string; //The ICCID of the eSIM for which you want to retrieve the details. (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let acceptLanguage: string; // (default to undefined)

const { status, data } = await apiInstance.v2SimsSimIccidInstructionsGet(
    simIccid,
    accept,
    authorization,
    acceptLanguage
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **simIccid** | [**string**] | The ICCID of the eSIM for which you want to retrieve the details. | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **acceptLanguage** | [**string**] |  | defaults to undefined|


### Return type

**V2SimsSimIccidInstructionsGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

