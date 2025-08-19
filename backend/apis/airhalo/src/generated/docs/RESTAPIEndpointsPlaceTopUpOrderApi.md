# RESTAPIEndpointsPlaceTopUpOrderApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2OrdersTopupsPost**](#v2orderstopupspost) | **POST** /v2/orders/topups | Submit top-up order|
|[**v2SimsGet**](#v2simsget) | **GET** /v2/sims | Get eSIMs list|
|[**v2SimsIccidPackagesGet**](#v2simsiccidpackagesget) | **GET** /v2/sims/{iccid}/packages | Get  eSIM package history|
|[**v2SimsIccidTopupsGet**](#v2simsiccidtopupsget) | **GET** /v2/sims/{iccid}/topups | Get  top-up package list|

# **v2OrdersTopupsPost**
> V2OrdersTopupsPost200Response v2OrdersTopupsPost()

**To submit a top-up order:**  Make a POST request to the endpoint URL {{url}}/{{version}}/orders/topups  Include a request body in the form of a FormData object, which contains the following required fields:  1) package_id: The ID of the top-up package you want to purchase  2) iccid: The ICCID of the eSIM for which you want to purchase the top-up package.  You can also include an optional description field to provide additional information about the order.  The API will respond with a JSON object containing the details of the order, including the package ID, quantity, price, and other information.  **The complete workflow for buying a top-up package:**  1) GET {{url}}/{{version}}/sims to see the list of purchased eSIMs   2) GET {{url}}/{{version}}/sims/:iccid/topups to see the list of available top-ups for the eSIMs   3) POST {{url}}/{{version}}/orders/topups with the proper \"iccid\" and \"package_id\" values to purchase a top-up   4) GET {{url}}/{{version}}/sims/:iccid/packages to see the list of all packages for the eSIM, including the original package and top-ups  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsPlaceTopUpOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceTopUpOrderApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let packageId: string; //Required. A Topup Package ID, can be obtainer by executing a GET request to the \\\"eSIM: List available top-up packages\\\" endpoint (default to undefined)
let iccid: string; //Required. eSIM ICCID, that identifies the eSIM for the top-up package. Can be obtained by execuring GET to the \\\"eSIMs List\\\" endpoint  (default to undefined)
let description: string; //Optional. Order description to identify the order. (default to undefined)

const { status, data } = await apiInstance.v2OrdersTopupsPost(
    accept,
    authorization,
    packageId,
    iccid,
    description
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **packageId** | [**string**] | Required. A Topup Package ID, can be obtainer by executing a GET request to the \\\&quot;eSIM: List available top-up packages\\\&quot; endpoint | defaults to undefined|
| **iccid** | [**string**] | Required. eSIM ICCID, that identifies the eSIM for the top-up package. Can be obtained by execuring GET to the \\\&quot;eSIMs List\\\&quot; endpoint  | defaults to undefined|
| **description** | [**string**] | Optional. Order description to identify the order. | defaults to undefined|


### Return type

**V2OrdersTopupsPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimsGet**
> V2SimsGet200Response v2SimsGet()

This endpoint allows you to retrieve a list of your eSIMs from the Airalo Partners API. You can customize the results using various filters and include related data in the response by specifying optional parameters.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  **direct_apple_installation_url:**  Partner API now supports direct installation on iOS devices. With the introduction of Universal Links by Apple, users with iOS 17.4 or higher can directly install eSIMs using a special URL, which can be provided to your end clients if they are using iOS version 17.4 or above.

### Example

```typescript
import {
    RESTAPIEndpointsPlaceTopUpOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceTopUpOrderApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let include: string; //Optional. A comma-separated string to include related data in the response. Possible values are \"order\", \"order.status\", \"order.user\" and \"share\". (optional) (default to undefined)
let filterCreatedAt: string; //Optional. A string to filter eSIMs by their creation date. Specify the date range using a dash (-) as a delimiter for correct parsing. (optional) (default to undefined)
let filterIccid: string; //Optional. A string to filter eSIMs by their ICCID. This performs a like search using the format \'%SIM_ICCID%\'. (optional) (default to undefined)
let limit: string; //Optional. An integer specifying how many sims will be returned on each page. (optional) (default to undefined)
let page: string; //Optional. An integer specifying the pagination\'s current page. (optional) (default to undefined)

const { status, data } = await apiInstance.v2SimsGet(
    accept,
    authorization,
    include,
    filterCreatedAt,
    filterIccid,
    limit,
    page
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **include** | [**string**] | Optional. A comma-separated string to include related data in the response. Possible values are \&quot;order\&quot;, \&quot;order.status\&quot;, \&quot;order.user\&quot; and \&quot;share\&quot;. | (optional) defaults to undefined|
| **filterCreatedAt** | [**string**] | Optional. A string to filter eSIMs by their creation date. Specify the date range using a dash (-) as a delimiter for correct parsing. | (optional) defaults to undefined|
| **filterIccid** | [**string**] | Optional. A string to filter eSIMs by their ICCID. This performs a like search using the format \&#39;%SIM_ICCID%\&#39;. | (optional) defaults to undefined|
| **limit** | [**string**] | Optional. An integer specifying how many sims will be returned on each page. | (optional) defaults to undefined|
| **page** | [**string**] | Optional. An integer specifying the pagination\&#39;s current page. | (optional) defaults to undefined|


### Return type

**V2SimsGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimsIccidPackagesGet**
> V2SimsIccidPackagesGet200Response v2SimsIccidPackagesGet()

**This endpoint comes with a Rate Limit:****you can pull specific eSIM history info once every 15 minutes.**  If you send another request too soon, the server\'s going to respond with a 429 HTTP code. Please check the \'Retry-After\' header, it\'ll tell you how many seconds to wait before the rate limit resets and you can fetch fresh info.  **Please, use a caching mechanism on the client side to deal with frequent customer requests.**  **To get and display this eSIM’s data package history, including top-ups:**  Make a GET request to the endpoint URL [https://partners-api.airalo.com/v1/sims/:iccid/packages](https://partners-api.airalo.com/v1/sims/:iccid/packages), replacing :iccid with the ICCID of the eSIM for which you want to retrieve top-up package information.  The API will respond with a JSON object containing an array of purchased top-up packages for the eSIM, each of which includes an ID, remaining data amount, activation and expiration dates, and other information.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsPlaceTopUpOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceTopUpOrderApi(configuration);

let iccid: string; //eSIM ICCID, used to query a list of purchased packages, including top-ups. Required. Can be obtained by execuring GET to the \"eSIMs List\" endpoint  (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2SimsIccidPackagesGet(
    iccid,
    accept,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | eSIM ICCID, used to query a list of purchased packages, including top-ups. Required. Can be obtained by execuring GET to the \&quot;eSIMs List\&quot; endpoint  | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2SimsIccidPackagesGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**429** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimsIccidTopupsGet**
> V2SimsIccidTopupsGet200Response v2SimsIccidTopupsGet()

**Endpoint do support new type of packages - \"Voice and Text\"**   **To get the list of available packages for an eSIM:**  Make a GET request to the endpoint URL [https://partners-api.airalo.com/v1/sims/:iccid/topups](https://partners-api.airalo.com/v1/sims/:iccid/topups), replace :iccid with the ICCID of the eSIM for which you want to purchase a top-up.  The API will respond with a JSON object containing an array of available top-up packages, each of which includes an ID, price, data amount, duration, and other information.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsPlaceTopUpOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceTopUpOrderApi(configuration);

let iccid: string; //eSIM ICCID, used to query a list of available top-up packages. Required. Can be obtained by execuring GET to the \"eSIMs List\" endpoint  (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2SimsIccidTopupsGet(
    iccid,
    accept,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | eSIM ICCID, used to query a list of available top-up packages. Required. Can be obtained by execuring GET to the \&quot;eSIMs List\&quot; endpoint  | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2SimsIccidTopupsGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

