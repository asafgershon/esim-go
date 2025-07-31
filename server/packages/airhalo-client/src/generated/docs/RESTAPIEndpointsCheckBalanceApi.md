# RESTAPIEndpointsCheckBalanceApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2BalanceGet**](#v2balanceget) | **GET** /v2/balance | Get balance|

# **v2BalanceGet**
> V2BalanceGet200Response v2BalanceGet()

This feature allow you to know your account balances, so you can have an overview on your financial portfolio. You can monitor my balances and can top-up my Airalo credit to avoid order failing due to Insufficient funds If there is no account, the response should be an empty array for the accounts  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsCheckBalanceApi,
    Configuration
} from '@airhalo/client';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsCheckBalanceApi(configuration);

let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2BalanceGet(
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2BalanceGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

