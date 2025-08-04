# InventoryApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**inventoryGet**](#inventoryget) | **GET** /inventory | Get bundle inventory|
|[**inventoryRefundPost**](#inventoryrefundpost) | **POST** /inventory/refund | Refund bundle from inventory|

# **inventoryGet**
> InventoryResponse inventoryGet()

All of your Organisation\'s currently purchased Bundles and their remaining usages. 

### Example

```typescript
import {
    InventoryApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new InventoryApi(configuration);

let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.inventoryGet(
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**InventoryResponse**

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

# **inventoryRefundPost**
> StatusMessage inventoryRefundPost()

Refunds an item in the inventory to the organisations balance. Takes a usageId and a quantity. The usageId\'s can be found by querying the /inventory endpoint The quantity of a refund cannot exceed the remaining quantity left for the specific usageId. If you wish to refund multiple usageId\'s, multiple calls to this endpoint will need to be done. If a bundle assignment has not been started and no data has been consumed, the bundle can be refunded as a credit back to the organisations balance. If the bundle assignment has started, or was purchased outside of their permitted refund period, typically 60 days, it cannot be refunded. 

### Example

```typescript
import {
    InventoryApi,
    Configuration,
    RefundInventoryItem
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new InventoryApi(configuration);

let contentType: string; // (optional) (default to undefined)
let accept: string; // (optional) (default to undefined)
let refundInventoryItem: RefundInventoryItem; // (optional)

const { status, data } = await apiInstance.inventoryRefundPost(
    contentType,
    accept,
    refundInventoryItem
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **refundInventoryItem** | **RefundInventoryItem**|  | |
| **contentType** | [**string**] |  | (optional) defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**StatusMessage**

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

