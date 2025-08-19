# RESTAPIEndpointsRefundsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2RefundPost**](#v2refundpost) | **POST** /v2/refund | Refund request|

# **v2RefundPost**
> V2RefundPost202Response v2RefundPost()

# Overview  The Airalo Refund API makes it simple to request refunds for eSIMs. This guide walks you through everything you need to know, including the API endpoint, request and response formats, error handling, and sample requests.  ## ⚠️ Important Disclaimer  > **The Refund API helps streamline the refund request process by reducing manual effort. However, submitting a request through this API does *not* guarantee approval.**   >   > Each refund request is **individually** reviewed based on Airalo\'s Refund Policy to ensure it meets all terms and conditions. Refund approvals remain subject to Airalo’s internal policies and decisions.   >  If your request meets the contract terms, the refund will be credited to your account as Airalo credits, ready to use for future transactions. > > **Please note that access to this API requires a contract amendment.** Make sure you have the right agreement in place before intergrating the service into you workflow.    

### Example

```typescript
import {
    RESTAPIEndpointsRefundsApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsRefundsApi(configuration);

let accept: string; //Indicates the expected response format. (optional) (default to undefined)
let authorization: string; //Bearer token for authenticating the request (optional) (default to undefined)
let body: string; // (optional)

const { status, data } = await apiInstance.v2RefundPost(
    accept,
    authorization,
    body
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **body** | **string**|  | |
| **accept** | [**string**] | Indicates the expected response format. | (optional) defaults to undefined|
| **authorization** | [**string**] | Bearer token for authenticating the request | (optional) defaults to undefined|


### Return type

**V2RefundPost202Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: text/plain
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

