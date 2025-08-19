# RESTAPIEndpointsAuthenticateApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2TokenPost**](#v2tokenpost) | **POST** /v2/token | Request access token|

# **v2TokenPost**
> V2TokenPost200Response v2TokenPost()

This endpoint provides an access token required for making authenticated requests to the Airalo Partners API. Submit your client ID and client secret to obtain a token valid for **24 hours**. While the token remains valid for a year, we recommend refreshing it more frequently for enhanced security.    #### Important Notes   - The response contains the access token, which must be cached and reused for subsequent API calls until it expires or is refreshed.   - Store the client ID and client secret securely in an **encrypted format** on your systems.   - All actions performed using these credentials will be considered valid transactions, and the partner will be responsible for any associated costs.  

### Example

```typescript
import {
    RESTAPIEndpointsAuthenticateApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsAuthenticateApi(configuration);

let accept: string; // (default to undefined)
let clientId: string; //Required. Unique identifier of your application. Must be kept secure and never exposed publicly. (default to undefined)
let clientSecret: string; //Required. Confidential key associated with your client ID. Must be kept secure and never exposed publicly. (default to undefined)
let grantType: string; //Required. The grant type should be set to \\\"client_credentials\\\".  It indicates server-to-server authentication, where the client application directly requests an access token without user intervention. (default to undefined)

const { status, data } = await apiInstance.v2TokenPost(
    accept,
    clientId,
    clientSecret,
    grantType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **clientId** | [**string**] | Required. Unique identifier of your application. Must be kept secure and never exposed publicly. | defaults to undefined|
| **clientSecret** | [**string**] | Required. Confidential key associated with your client ID. Must be kept secure and never exposed publicly. | defaults to undefined|
| **grantType** | [**string**] | Required. The grant type should be set to \\\&quot;client_credentials\\\&quot;.  It indicates server-to-server authentication, where the client application directly requests an access token without user intervention. | defaults to undefined|


### Return type

**V2TokenPost200Response**

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

