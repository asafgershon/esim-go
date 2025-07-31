# RESTAPIEndpointsManageOrdersESIMsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2CancelFutureOrdersPost**](#v2cancelfutureorderspost) | **POST** /v2/cancel-future-orders | Cancel future orders|
|[**v2OrdersGet**](#v2ordersget) | **GET** /v2/orders | Get order list|
|[**v2OrdersOrderIdGet**](#v2ordersorderidget) | **GET** /v2/orders/{order_id} | Get order|
|[**v2SimsSimIccidBrandPut**](#v2simssimiccidbrandput) | **PUT** /v2/sims/{sim_iccid}/brand | Update eSIM brand|

# **v2CancelFutureOrdersPost**
> V2CancelFutureOrdersPost200Response v2CancelFutureOrdersPost()

This endpoint allows you to submit future order cancellation requests via the Airalo Partner API.  To proceed, provide an array of request_id strings from the \"Create Future Order\" endpoint response.  Please note: - Future orders can be canceled up to 24 hours before the due date. - You can include up to 10 future orders in a single request. - An access token from the \"Request Access Token\" endpoint is required.  For more details and best practices, visit our [FAQ page](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ). 

### Example

```typescript
import {
    RESTAPIEndpointsManageOrdersESIMsApi,
    Configuration,
    V2CancelFutureOrdersPostRequest
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsManageOrdersESIMsApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let v2CancelFutureOrdersPostRequest: V2CancelFutureOrdersPostRequest; // (optional)

const { status, data } = await apiInstance.v2CancelFutureOrdersPost(
    accept,
    authorization,
    v2CancelFutureOrdersPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **v2CancelFutureOrdersPostRequest** | **V2CancelFutureOrdersPostRequest**|  | |
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2CancelFutureOrdersPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2OrdersGet**
> V2OrdersGet200Response v2OrdersGet()

This endpoint allows you to retrieve a list of your orders from the Airalo Partners API. By using various filters, you can customize the results to match specific criteria. The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsManageOrdersESIMsApi,
    Configuration
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsManageOrdersESIMsApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let include: string; //Optional. A comma-separated string to include related data in the response. Possible values are \"sims\", \"user\", and \"status\". (optional) (default to undefined)
let filterCreatedAt: string; //Optional. A string to filter orders by their creation date. Specify the date range using a dash (-) as a delimiter for correct parsing. (optional) (default to undefined)
let filterCode: string; //Optional. Filter orders by their order code. This performs a like search using the format \'%ORDER_CODE%\'. (optional) (default to undefined)
let filterOrderStatus: string; //Optional. A string to filter orders by their status. Possible values could be obtained from the \"Get Order Statuses List\" endpoint, and currently limited to\"completed\", \"failed\", and \"refunded\". (optional) (default to undefined)
let filterIccid: string; //Optional. Filter orders by the sim\'s ICCID. This performs a like search using the format \'%SIM_ICCID%\'. (optional) (default to undefined)
let filterDescription: string; //Optional. A string to filter orders by their description. This performs a like search using the format \'%DESCRIPTION%\'. (optional) (default to undefined)
let limit: string; //Optional. An integer specifying how many orders will be returned on each page. (optional) (default to undefined)
let page: string; //Optional. An integer specifying the pagination\'s current page. (optional) (default to undefined)

const { status, data } = await apiInstance.v2OrdersGet(
    accept,
    authorization,
    include,
    filterCreatedAt,
    filterCode,
    filterOrderStatus,
    filterIccid,
    filterDescription,
    limit,
    page
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **include** | [**string**] | Optional. A comma-separated string to include related data in the response. Possible values are \&quot;sims\&quot;, \&quot;user\&quot;, and \&quot;status\&quot;. | (optional) defaults to undefined|
| **filterCreatedAt** | [**string**] | Optional. A string to filter orders by their creation date. Specify the date range using a dash (-) as a delimiter for correct parsing. | (optional) defaults to undefined|
| **filterCode** | [**string**] | Optional. Filter orders by their order code. This performs a like search using the format \&#39;%ORDER_CODE%\&#39;. | (optional) defaults to undefined|
| **filterOrderStatus** | [**string**] | Optional. A string to filter orders by their status. Possible values could be obtained from the \&quot;Get Order Statuses List\&quot; endpoint, and currently limited to\&quot;completed\&quot;, \&quot;failed\&quot;, and \&quot;refunded\&quot;. | (optional) defaults to undefined|
| **filterIccid** | [**string**] | Optional. Filter orders by the sim\&#39;s ICCID. This performs a like search using the format \&#39;%SIM_ICCID%\&#39;. | (optional) defaults to undefined|
| **filterDescription** | [**string**] | Optional. A string to filter orders by their description. This performs a like search using the format \&#39;%DESCRIPTION%\&#39;. | (optional) defaults to undefined|
| **limit** | [**string**] | Optional. An integer specifying how many orders will be returned on each page. | (optional) defaults to undefined|
| **page** | [**string**] | Optional. An integer specifying the pagination\&#39;s current page. | (optional) defaults to undefined|


### Return type

**V2OrdersGet200Response**

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

# **v2OrdersOrderIdGet**
> V2OrdersOrderIdGet200Response v2OrdersOrderIdGet()

This endpoint allows you to retrieve the details of a specific order from the Airalo Partners API using the order ID. You can also include related data in the response by specifying optional parameters. The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsManageOrdersESIMsApi,
    Configuration
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsManageOrdersESIMsApi(configuration);

let orderId: string; //The order ID for which you want to retrieve the details. (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let include: string; //Optional. A comma-separated string to include related data in the response. Possible values are \"sims\", \"user\", and \"status\". (optional) (default to undefined)

const { status, data } = await apiInstance.v2OrdersOrderIdGet(
    orderId,
    accept,
    authorization,
    include
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **orderId** | [**string**] | The order ID for which you want to retrieve the details. | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **include** | [**string**] | Optional. A comma-separated string to include related data in the response. Possible values are \&quot;sims\&quot;, \&quot;user\&quot;, and \&quot;status\&quot;. | (optional) defaults to undefined|


### Return type

**V2OrdersOrderIdGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**401** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimsSimIccidBrandPut**
> V2SimsSimIccidBrandPut200Response v2SimsSimIccidBrandPut()

This endpoint allows you to update assigned brand settings name of a specific eSIM from the Airalo Partners API using the eSIM\'s ICCID. This brand is used to apply branding on sharing link or share e-mails.If brand is set as null value, eSIM will be shared with unbranded visual.     The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.     For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsManageOrdersESIMsApi,
    Configuration
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsManageOrdersESIMsApi(configuration);

let simIccid: string; //The ICCID of the eSIM for which you want to update the brand. (default to undefined)
let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let brandSettingsName: string; //Nullable. The definition under what brand the eSIM should be shared. Null for unbranded. (default to undefined)

const { status, data } = await apiInstance.v2SimsSimIccidBrandPut(
    simIccid,
    accept,
    authorization,
    brandSettingsName
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **simIccid** | [**string**] | The ICCID of the eSIM for which you want to update the brand. | defaults to undefined|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **brandSettingsName** | [**string**] | Nullable. The definition under what brand the eSIM should be shared. Null for unbranded. | defaults to undefined|


### Return type

**V2SimsSimIccidBrandPut200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

