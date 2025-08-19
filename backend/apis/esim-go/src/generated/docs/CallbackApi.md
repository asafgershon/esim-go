# CallbackApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**yourUsageCallbackUrlPost**](#yourusagecallbackurlpost) | **POST** /your-usage-callback-url/ | eSIM Usage Callback|

# **yourUsageCallbackUrlPost**
> yourUsageCallbackUrlPost()

**Note:** V3 of the Callback system is now available and provides additional data as well as HMAC signature validation. **This must be enabled in the eSIM Portal.** V2 of the Callback system is still available by default, but will be disabled in the future.   To enable it on the eSIM Portal go to Account Settings -> API Details -> Callback Version.   **Description:** The eSIMGo API offers a callback functionality that provides real-time notifications about eSIM activity, including data consumption and balance. This feature allows for tracking usage, automating responses, and customizing notifications, enhancing customer account management.  Key benefits include real-time updates, usage tracking, automated responses, and customizable notifications.  When data is used on an eSIM, a usage event can be sent to a URL defined by you in the eSIM Portal. The usage event will report the current bundle in use by an eSIM, and its remaining data.    To set up the URL in the eSIM Portal go to Account Settings -> API Details -> Callback URL.    Example of validating HMAC body in NodeJS:  ```javascript import crypto from \"crypto\";  const signature = crypto     .createHmac(\"sha256\", key) // key is your API Key     .update(body) // body is the raw (string) request body     .digest(\"base64\");  const matches = signature === signatureHeader; ```  Validation uses your API Key as the HMAC key. The body of the request is the raw (string) request body, and should not be parsed as JSON before validation.  **Note:** Bundle names are case sensitive e.g. \"esim_1GB_7D_IM_U\".  **Request Body Notes:** - The \"try\" button for this endpoint is **NOT** functional - The schema defines an example message that is sent to the configured callback URL. - For more information on callback notification types, Please see the [Notifications Page](/api/notifications#overview). 

### Example

```typescript
import {
    CallbackApi,
    Configuration,
    BundleAlert
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new CallbackApi(configuration);

let contentType: string; // (optional) (default to undefined)
let bundleAlert: BundleAlert; // (optional)

const { status, data } = await apiInstance.yourUsageCallbackUrlPost(
    contentType,
    bundleAlert
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **bundleAlert** | **BundleAlert**|  | |
| **contentType** | [**string**] |  | (optional) defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

