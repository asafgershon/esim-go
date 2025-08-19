# RESTAPIEndpointsPlaceOrderApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2FutureOrdersPost**](#v2futureorderspost) | **POST** /v2/future-orders | Future orders|
|[**v2OrdersAsyncPost**](#v2ordersasyncpost) | **POST** /v2/orders-async | Submit order async|
|[**v2OrdersPost**](#v2orderspost) | **POST** /v2/orders | Submit order|
|[**v2VoucherEsimPost**](#v2voucheresimpost) | **POST** /v2/voucher/esim | eSIM voucher|

# **v2FutureOrdersPost**
> V2FutureOrdersPost200Response v2FutureOrdersPost()

This endpoint allows you to submit an order to the Airalo Partner API, which will be created on the specified due date.  To proceed, provide the required information: - Due date - Quantity - Package ID - Description (optional)  Please note: - On success, the endpoint response will include a unique 25-character request_id. - You must store this value in your system to cancel the order later if needed and to know for which order you got a response on your webhook URL. - An access token from the \"Request Access Token\" endpoint is required in the request.   **Delivery modes** **What is a webhook URL?** Webhook URL is a URL that is configured on your domain and your won webserver. That URL should be able to receive HTTP POST requests with your order data that will be sent from our servers . NOTE: We check the liveness of your webhook URL with an HTTP HEAD request to which we expect 200 OK response.  **What happens when the due date arrives?** When the due date arrives your order is processed and the order details are sent as a POST HTTP request to  either your opted in \"async_orders\" notification type url (more info [here](https://partner-api-airalo.apidog.io/async-orders-11883038e0) ) or on the \"webhhok_url\" optional parameter of this endpoint which overrides the above opted in URL. NOTE that you must have one of the above (either opted in URL or webhhok_url) provided in order to make a future order.  if you provide the optional parameter \"sharing_option\", which goes together with the \"to_email\" parameter  then an email with the eSim details will also be sent to the email provided in the \"to_email\" parameter as well. Depending from the selected sharing option which can be one of link or pdf or both you will get the eSim data  either in a PDF format attached to the email or as a link.  **What is the format of the message that is sent to the webhook URL?** The format of the message that is sent to the webhook URL is the same as the response of the [regular order](https://partner-api-airalo.apidog.io/submit-order-11883024e0). It only has one additional parameter named \"request_id\" which is the same request_id that you got in the response  when you made the future order at the time of making the order,  so that you know for which future order you got details on your webhook URL.   For more details and best practices, visit our [FAQ page](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ).

### Example

```typescript
import {
    RESTAPIEndpointsPlaceOrderApi,
    Configuration,
    V2FutureOrdersPostRequest
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceOrderApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let v2FutureOrdersPostRequest: V2FutureOrdersPostRequest; // (optional)

const { status, data } = await apiInstance.v2FutureOrdersPost(
    accept,
    authorization,
    v2FutureOrdersPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **v2FutureOrdersPostRequest** | **V2FutureOrdersPostRequest**|  | |
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2FutureOrdersPost200Response**

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

# **v2OrdersAsyncPost**
> object v2OrdersAsyncPost()

This endpoint allows you to submit an asynchronous order to the Airalo Partners API. This ensures greater performance and reduces the wait time for your desired flow. Each async order will generate unique `nanoid` stored in reponse\'s `request_id` - Make sure you store this id in your system, as it is a reference for the order which is pending processing. You should check map it for every successfully received order response on your webhook url.    Provide the required information, such as quantity and package ID, and include optional description if needed.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)  **direct_apple_installation_url:**  Partner API now supports direct installation on iOS devices. With the introduction of Universal Links by Apple, users with iOS 17.4 or higher can directly install eSIMs using a special URL, which can be provided to your end clients if they are using iOS version 17.4 or above.

### Example

```typescript
import {
    RESTAPIEndpointsPlaceOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceOrderApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let quantity: string; //Required. The quantity of items in the order. Maximum of 50. (default to undefined)
let packageId: string; //Required. The package ID associated with the order. You can obtain this from the \\\"Packages / Get Packages\\\" endpoint. (default to undefined)
let type: string; //Optional. The only possible value for this endpoint is \\\"sim\\\". If left empty, default \\\"sim\\\" value will be used. (default to undefined)
let description: string; //Optional. A custom description for the order, which can help you identify it later. (default to undefined)
let webhookUrl: string; //Optional. A custom, valid url to which you will receive the order details data asynchronously. Note that you can optin or provide in request. `The webhook_url if provided in payload will overwrite the one which is opted in.` (default to undefined)

const { status, data } = await apiInstance.v2OrdersAsyncPost(
    accept,
    authorization,
    quantity,
    packageId,
    type,
    description,
    webhookUrl
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **quantity** | [**string**] | Required. The quantity of items in the order. Maximum of 50. | defaults to undefined|
| **packageId** | [**string**] | Required. The package ID associated with the order. You can obtain this from the \\\&quot;Packages / Get Packages\\\&quot; endpoint. | defaults to undefined|
| **type** | [**string**] | Optional. The only possible value for this endpoint is \\\&quot;sim\\\&quot;. If left empty, default \\\&quot;sim\\\&quot; value will be used. | defaults to undefined|
| **description** | [**string**] | Optional. A custom description for the order, which can help you identify it later. | defaults to undefined|
| **webhookUrl** | [**string**] | Optional. A custom, valid url to which you will receive the order details data asynchronously. Note that you can optin or provide in request. &#x60;The webhook_url if provided in payload will overwrite the one which is opted in.&#x60; | defaults to undefined|


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: */*, application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**202** |  |  -  |
|**422** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2OrdersPost**
> V2OrdersPost200Response v2OrdersPost()

This endpoint allows you to submit an order to the Airalo Partners API. Provide the required information, such as quantity and package ID, and include optional description if needed.  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)  **direct_apple_installation_url:**  Partner API now supports direct installation on iOS devices. With the introduction of Universal Links by Apple, users with iOS 17.4 or higher can directly install eSIMs using a special URL, which can be provided to your end clients if they are using iOS version 17.4 or above.      When **to_email** is set email will be sent asynchronously, the template is configured in multiple languages, as of now the  message body and subject cannot be given by the Partner

### Example

```typescript
import {
    RESTAPIEndpointsPlaceOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceOrderApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let quantity: string; //Required. The quantity of items in the order. Maximum of 50. (default to undefined)
let packageId: string; //Required. The package ID associated with the order. You can obtain this from the \\\"Packages / Get Packages\\\" endpoint. (default to undefined)
let type: string; //Optional. The only possible value for this endpoint is \\\"sim\\\". If left empty, default \\\"sim\\\" value will be used. (default to undefined)
let description: string; //Optional. A custom description for the order, which can help you identify it later. (default to undefined)
let brandSettingsName: string; //Nullable. The definition under what brand the eSIM should be shared. Null for unbranded. (default to undefined)
let toEmail: string; //Optional. If specified, email with esim sharing will be sent. sharing_option should be specified as well.  (default to undefined)
let sharingOption: string; //Optional. Array. Required when to_email is set. Available options: link, pdf (default to undefined)
let copyAddress: string; //Optional. Array. It uses when to_email is set. (default to undefined)

const { status, data } = await apiInstance.v2OrdersPost(
    accept,
    authorization,
    quantity,
    packageId,
    type,
    description,
    brandSettingsName,
    toEmail,
    sharingOption,
    copyAddress
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **quantity** | [**string**] | Required. The quantity of items in the order. Maximum of 50. | defaults to undefined|
| **packageId** | [**string**] | Required. The package ID associated with the order. You can obtain this from the \\\&quot;Packages / Get Packages\\\&quot; endpoint. | defaults to undefined|
| **type** | [**string**] | Optional. The only possible value for this endpoint is \\\&quot;sim\\\&quot;. If left empty, default \\\&quot;sim\\\&quot; value will be used. | defaults to undefined|
| **description** | [**string**] | Optional. A custom description for the order, which can help you identify it later. | defaults to undefined|
| **brandSettingsName** | [**string**] | Nullable. The definition under what brand the eSIM should be shared. Null for unbranded. | defaults to undefined|
| **toEmail** | [**string**] | Optional. If specified, email with esim sharing will be sent. sharing_option should be specified as well.  | defaults to undefined|
| **sharingOption** | [**string**] | Optional. Array. Required when to_email is set. Available options: link, pdf | defaults to undefined|
| **copyAddress** | [**string**] | Optional. Array. It uses when to_email is set. | defaults to undefined|


### Return type

**V2OrdersPost200Response**

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

# **v2VoucherEsimPost**
> V2VoucherEsimPost200Response v2VoucherEsimPost()

This endpoint allows you to create an esim voucher to the Airalo Partners API. Provide the required information, such as quantity and package id  The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)  **Body Structure:**  ``` json {     \"vouchers\": [         {             \"package_id\": \"replace with actual package slug\",             \"quantity\": 3,             \"booking_reference\": \"123\"         }     ] }   ```  **Request parameters:**  - **vouchers** (array, required):          - An array of voucher objects to be created for eSIMs. Each voucher object contains the following fields:                  - **package_id** (string, required):                          - The unique identifier (slug) of the eSIM package for which the voucher is being issued.                              - Example: \"package_id\": \"eu-europe-5gb-30days\"                          - **quantity** (integer, required):                          - The number of vouchers you wish to purchase for the specified package.                              - Example: \"quantity\": 3                          - **booking_reference** (string, optional):                          - An optional field used to store the booking reference for this voucher, which can be used for tracking purposes in your own system.                              - Example: \"booking_reference\": \"123\"                              - If not provided, this field will be ignored.

### Example

```typescript
import {
    RESTAPIEndpointsPlaceOrderApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsPlaceOrderApi(configuration);

let authorization: string; // (default to undefined)
let contentType: string; // (default to undefined)

const { status, data } = await apiInstance.v2VoucherEsimPost(
    authorization,
    contentType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] |  | defaults to undefined|
| **contentType** | [**string**] |  | defaults to undefined|


### Return type

**V2VoucherEsimPost200Response**

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

