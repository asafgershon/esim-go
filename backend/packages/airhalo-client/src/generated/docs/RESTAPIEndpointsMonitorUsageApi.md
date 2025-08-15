# RESTAPIEndpointsMonitorUsageApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2SimsSimIccidUsageGet**](#v2simssimiccidusageget) | **GET** /v2/sims/{sim_iccid}/usage | Get usage (data, text &amp; voice)|

# **v2SimsSimIccidUsageGet**
> V2SimsSimIccidUsageGet200Response v2SimsSimIccidUsageGet()

**Endpoint do support new type of packages - \"Voice and Text\"**    :::highlight blue 💡 **This endpoint comes with a rate limit: 100 requests per minute (per unique iccid)** :::  This endpoint enables you to retrieve the total data, voice & text usage for a specific eSIM identified by its ICCID.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsMonitorUsageApi,
    Configuration
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsMonitorUsageApi(configuration);

let simIccid: string; //The ICCID of the eSIM for which you want to retrieve the data usage details. (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2SimsSimIccidUsageGet(
    simIccid,
    accept,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **simIccid** | [**string**] | The ICCID of the eSIM for which you want to retrieve the data usage details. | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2SimsSimIccidUsageGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |
|**429** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

