# OrdersApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**ordersGet**](#ordersget) | **GET** /orders | List orders|
|[**ordersOrderReferenceGet**](#ordersorderreferenceget) | **GET** /orders/{orderReference} | Get order detail|
|[**ordersPost**](#orderspost) | **POST** /orders | Create orders|

# **ordersGet**
> OrderResponseTransaction ordersGet()

Get details on all previous orders, including total cost and contents. Response data is paginated. 

### Example

```typescript
import {
    OrdersApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let accept: string; // (optional) (default to undefined)
let includeIccids: boolean; //Set to true to include eSIM data (ICCID, Matching ID and SMDP Address) in the response, and an ICCIDs array.  (optional) (default to undefined)
let page: number; //Page number to return.  (optional) (default to undefined)
let limit: number; //Number of results to return per page.  (optional) (default to undefined)
let createdAt: string; //Specifies the date range for filtering orders. This parameter has a \'lte:\' prefix to specify the end date. For example, to query orders from March 1, 2024, to March 31, 2024, use the following format: `createdAt=gte:2024-03-01T00:00:00.000Z&createdAt=lte:2024-03-31T23:59:59.999Z`.  (optional) (default to undefined)

const { status, data } = await apiInstance.ordersGet(
    accept,
    includeIccids,
    page,
    limit,
    createdAt
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **includeIccids** | [**boolean**] | Set to true to include eSIM data (ICCID, Matching ID and SMDP Address) in the response, and an ICCIDs array.  | (optional) defaults to undefined|
| **page** | [**number**] | Page number to return.  | (optional) defaults to undefined|
| **limit** | [**number**] | Number of results to return per page.  | (optional) defaults to undefined|
| **createdAt** | [**string**] | Specifies the date range for filtering orders. This parameter has a \&#39;lte:\&#39; prefix to specify the end date. For example, to query orders from March 1, 2024, to March 31, 2024, use the following format: &#x60;createdAt&#x3D;gte:2024-03-01T00:00:00.000Z&amp;createdAt&#x3D;lte:2024-03-31T23:59:59.999Z&#x60;.  | (optional) defaults to undefined|


### Return type

**OrderResponseTransaction**

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

# **ordersOrderReferenceGet**
> OrderResponseTransaction ordersOrderReferenceGet()

Get details on an order, including total cost and contents 

### Example

```typescript
import {
    OrdersApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let orderReference: string; //(Required) Reference for your order (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.ordersOrderReferenceGet(
    orderReference,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **orderReference** | [**string**] | (Required) Reference for your order | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**OrderResponseTransaction**

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

# **ordersPost**
> OrdersPost200Response ordersPost()

Orders can be validated and processed using this endpoint. Total will be deducted from your Organisation\'s balance.  ## Auto-assign By specifying ICCID(s) of eSIM(s) belonging to your Organisation and setting \'assign\' to true, a bundle can be automatically assigned to eSIM(s).  If specified ICCID(s) of eSIM(s) and the specified bundle(s) are not compatible, and ‘allowReassign’ set to true, the bundle(s) will be assigned to new ICCID(s).  Bundle assignments to an eSIM are usually instant but please allow for up to 10 minutes for the bundle to fully process. While the bundle is processing the eSIM can be successfully installed and the eSIM will register onto a network if within coverage.  The Bundle Status can be checked through [Get the Status of a bundle assigned to an eSIM](/api/v2_4/operations/esimsiccidbundlesname/get/)  ## Usage: - eSIM ICCIDs can only be specified if assign is set to true - If assign is set to true, but no ICCIDs are provided, bundles are   assigned to new eSIMs - If ICCIDs are provided, quantity is required to match the number of   ICCIDs for each bundle - If quantity is specified and assign is set to false, the quantity of   that bundle is purchased into inventory - If new bundles and specified eSIM ICCIDs are not compatible and ‘allowReassign’ set to true, bundles will be assigned to new ICCIDs 

### Example

```typescript
import {
    OrdersApi,
    Configuration,
    OrderRequest
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let contentType: string; // (optional) (default to undefined)
let orderRequest: OrderRequest; // (optional)

const { status, data } = await apiInstance.ordersPost(
    contentType,
    orderRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **orderRequest** | **OrderRequest**|  | |
| **contentType** | [**string**] |  | (optional) defaults to undefined|


### Return type

**OrdersPost200Response**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json, text/plain


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**503** | Service Unavailable |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

