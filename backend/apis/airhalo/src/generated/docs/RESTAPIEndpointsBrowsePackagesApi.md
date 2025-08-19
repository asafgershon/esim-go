# RESTAPIEndpointsBrowsePackagesApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**v2CompatibleDevicesGet**](#v2compatibledevicesget) | **GET** /v2/compatible-devices | Get compatible device list|
|[**v2PackagesGet**](#v2packagesget) | **GET** /v2/packages | Get packages|

# **v2CompatibleDevicesGet**
> V2CompatibleDevicesGet200Response v2CompatibleDevicesGet()

This endpoint provides a comprehensive list of devices that are compatible with eSIMs. Use this information to ensure that your customers have devices that support eSIM functionality.    #### Important Notes   - Include the access token, obtained from the **Request Access Token** endpoint, in the request headers to authenticate your API call.   - The returned list is regularly updated to include the latest compatible devices, ensuring accurate and reliable information for your integration.   - Use this endpoint to validate device compatibility before processing eSIM orders.  

### Example

```typescript
import {
    RESTAPIEndpointsBrowsePackagesApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsBrowsePackagesApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2CompatibleDevicesGet(
    accept,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2CompatibleDevicesGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2PackagesGet**
> V2PackagesGet200Response v2PackagesGet()

:::highlight blue 💡 **Action Required: Synchronize at least once every hour.** This step is vital for ensuring newly introduced packages are available and out-of-stock packages are excluded. :::  Retrieve a list of local and global eSIM packages available through the Airalo Partners API. Local packages cover a single country, while global packages span multiple countries and regions. This endpoint helps you synchronize eSIM plans/packages with your system, ensuring newly introduced packages are available to your clients and out-of-stock packages are handled properly.    #### Features   - **Package Types**: Supports standard data packages and the new \"Voice and Text\" packages.   - **Filtering**: Filter results by operator type or country code to tailor the package list to your needs.   - **Pagination**: Adjust pagination settings to retrieve results in manageable chunks.   - **Limit**: Set the `limit` parameter to a high value (e.g., 1,000) to fetch all packages in a single request without using pagination.   - **Include Top-Up**: Use the `include:top-up` parameter to fetch eSIM packages along with their associated top-up packages.    #### Rate Limit   - This endpoint allows up to **40 requests per minute**. Ensure your implementation respects this limit to avoid rate limit errors.    #### Important Notes   - Include the access token, obtained from the **Request Access Token** endpoint, in the request headers for authentication.  

### Example

```typescript
import {
    RESTAPIEndpointsBrowsePackagesApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsBrowsePackagesApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let filterType: string; //Optional. A string to filter packages by operator type. Possible values are \"local\" and \"global\".    If the filter is set to \"global,\" the output will include only global and regional eSims. Global and regional packages do not use the \"country_code\" field, which will be empty. The \"type\" field in the operator object within the response will be set to \"global.\" A package is considered worldwide if its \"slug\" field is set to \"world\" and regional if \"slug\" contains a region name, for example, \"europe\" or \"Africa\".    If the filter is set to \"local,\" the response will contain only country-specific packages. To get the list of packages for a single country, you can use it in combination with filter[country] parameter. The \"type\" field in the operator object of the response will indicate a \"local\" type.    When the filter is not set, we return all types of eSIMs: local, regional, and global. (optional) (default to undefined)
let filterCountry: string; //Optional. A string to filter packages by country code. Examples include US, DE, GB, IT, and UA. (optional) (default to undefined)
let limit: string; //Optional. An integer specifying how many items will be returned on each page. (optional) (default to undefined)
let page: string; //Optional. An integer specifying the pagination\'s current page.  If the page is set to 2 or beyond, the response will have different format and contain an object representing the country\'s index in the list of packages. (optional) (default to undefined)
let include: string; //Optional. Valid value is topup. Includes topup packages to the response (optional) (default to undefined)

const { status, data } = await apiInstance.v2PackagesGet(
    accept,
    authorization,
    filterType,
    filterCountry,
    limit,
    page,
    include
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|
| **filterType** | [**string**] | Optional. A string to filter packages by operator type. Possible values are \&quot;local\&quot; and \&quot;global\&quot;.    If the filter is set to \&quot;global,\&quot; the output will include only global and regional eSims. Global and regional packages do not use the \&quot;country_code\&quot; field, which will be empty. The \&quot;type\&quot; field in the operator object within the response will be set to \&quot;global.\&quot; A package is considered worldwide if its \&quot;slug\&quot; field is set to \&quot;world\&quot; and regional if \&quot;slug\&quot; contains a region name, for example, \&quot;europe\&quot; or \&quot;Africa\&quot;.    If the filter is set to \&quot;local,\&quot; the response will contain only country-specific packages. To get the list of packages for a single country, you can use it in combination with filter[country] parameter. The \&quot;type\&quot; field in the operator object of the response will indicate a \&quot;local\&quot; type.    When the filter is not set, we return all types of eSIMs: local, regional, and global. | (optional) defaults to undefined|
| **filterCountry** | [**string**] | Optional. A string to filter packages by country code. Examples include US, DE, GB, IT, and UA. | (optional) defaults to undefined|
| **limit** | [**string**] | Optional. An integer specifying how many items will be returned on each page. | (optional) defaults to undefined|
| **page** | [**string**] | Optional. An integer specifying the pagination\&#39;s current page.  If the page is set to 2 or beyond, the response will have different format and contain an object representing the country\&#39;s index in the list of packages. | (optional) defaults to undefined|
| **include** | [**string**] | Optional. Valid value is topup. Includes topup packages to the response | (optional) defaults to undefined|


### Return type

**V2PackagesGet200Response**

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

