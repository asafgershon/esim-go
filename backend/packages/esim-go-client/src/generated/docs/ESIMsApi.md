# ESIMsApi

All URIs are relative to *https://api.esim-go.com/v2.4*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**esimsApplyPost**](#esimsapplypost) | **POST** /esims/apply | Apply Bundle to an eSIM|
|[**esimsAssignmentsGet**](#esimsassignmentsget) | **GET** /esims/assignments | Get eSIM Install Details|
|[**esimsGet**](#esimsget) | **GET** /esims | List eSIMs|
|[**esimsIccidBundlesGet**](#esimsiccidbundlesget) | **GET** /esims/{iccid}/bundles | List Bundles applied to eSIM|
|[**esimsIccidBundlesNameAssignmentsAssignmentIdDelete**](#esimsiccidbundlesnameassignmentsassignmentiddelete) | **DELETE** /esims/{iccid}/bundles/{name}/assignments/{assignmentId} | Revoke specific Bundle|
|[**esimsIccidBundlesNameDelete**](#esimsiccidbundlesnamedelete) | **DELETE** /esims/{iccid}/bundles/{name} | Revoke applied Bundle|
|[**esimsIccidBundlesNameGet**](#esimsiccidbundlesnameget) | **GET** /esims/{iccid}/bundles/{name} | Get applied Bundle status|
|[**esimsIccidCompatibleBundleGet**](#esimsiccidcompatiblebundleget) | **GET** /esims/{iccid}/compatible/{bundle} | Check eSIM and Bundle Compatibility|
|[**esimsIccidGet**](#esimsiccidget) | **GET** /esims/{iccid} | Get eSIM details|
|[**esimsIccidHistoryGet**](#esimsiccidhistoryget) | **GET** /esims/{iccid}/history | Get eSIM history|
|[**esimsIccidLocationGet**](#esimsiccidlocationget) | **GET** /esims/{iccid}/location | Get eSIM Location|
|[**esimsIccidRefreshGet**](#esimsiccidrefreshget) | **GET** /esims/{iccid}/refresh | Refresh eSIM|
|[**esimsIccidSmsPost**](#esimsiccidsmspost) | **POST** /esims/{iccid}/sms | Send SMS to eSIM|
|[**esimsPut**](#esimsput) | **PUT** /esims | Update eSIM Details|

# **esimsApplyPost**
> ESIMApplyResponse esimsApplyPost(esimsApplyPostRequest)

# eSIM Provisioning and Bundle Application Endpoint  This endpoint allows you to obtain a new eSIM with a pre-applied Bundle or apply a Bundle to an existing eSIM.  ## Key Features: 1. Assign Bundles to new or existing eSIMs 2. Option to request multiple eSIMs with the same Bundle 3. Ability to assign different Bundles to separate new eSIMs  ## Usage Guidelines: - Provide either \'Bundle\' or \'Bundles\' parameter - ICCID is optional for existing eSIMs - \'Repeat\' parameter for multiple new eSIMs (incompatible with ICCID) - Bundle names are case-sensitive (e.g., \"esim_1GB_7D_IM_U\")  ## Important Notes: - Requires pre-purchased Bundles in your account inventory - Bundle activation usually instant, but allow up to 10 minutes for full processing - eSIM can be installed and registered on a network during processing - The Bundle Status can be checked through [Get the Status of a bundle assigned to an eSIM](/api/v2_4/operations/esimsiccidbundlesname/get/)  The endpoint always returns the ICCID in the response. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration,
    EsimsApplyPostRequest
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let esimsApplyPostRequest: EsimsApplyPostRequest; //Details of Bundle to apply to eSIM

const { status, data } = await apiInstance.esimsApplyPost(
    esimsApplyPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **esimsApplyPostRequest** | **EsimsApplyPostRequest**| Details of Bundle to apply to eSIM | |


### Return type

**ESIMApplyResponse**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success message |  -  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **esimsAssignmentsGet**
> ESIMDetailsInstallResponse esimsAssignmentsGet()

# eSIM SMDP+ Details Retrieval Endpoint  This API endpoint retrieves eSIM SMDP+ details based on provided Order or Apply References.  ## Key features:  1. Input: One or multiple reference numbers can be submitted via query parameters. 2. Output: For each reference, the system returns:    - ICCID (Integrated Circuit Card Identifier)    - SMDP+ (Subscription Manager Data Preparation) address    - Matching ID 3. Output format options:    - Default: text/csv    - Alternative formats: application/json, application/zip    - Format selection is controlled via the \'Accept\' header in the request 4. Special functionality: When requesting \'application/zip\', the response is a ZIP file containing QR code images in PNG format. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let reference: string; //(Required) Order Reference or Apply Reference (optional) (default to undefined)
let additionalFields: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsAssignmentsGet(
    reference,
    additionalFields
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **reference** | [**string**] | (Required) Order Reference or Apply Reference | (optional) defaults to undefined|
| **additionalFields** | [**string**] |  | (optional) defaults to undefined|


### Return type

**ESIMDetailsInstallResponse**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **esimsGet**
> ESIMs esimsGet()

This endpoint retrieves all eSIMs currently assigned to your organization. It provides a comprehensive view of your eSIM inventory with flexible options for data retrieval and management.  **Key Features:**   1. Pagination: Efficiently manage large datasets by specifying the page number and items per page.   2. Sorting: Customize the order of results using the \'direction\' and \'orderBy\' parameters.   3. Filtering: Refine your search with multiple filter options for precise data retrieval. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let page: string; //Page of ESIMs to return (optional) (default to undefined)
let perPage: 10 | 25 | 50 | 100; //Number of ESIMs to return per page (optional) (default to undefined)
let direction: 'asc' | 'desc'; //Direction of ordering (optional) (default to undefined)
let orderBy: 'iccid'; //Name of column to order by (optional) (default to undefined)
let filterBy: 'iccid, customerRef, lastAction, actionDate, assignedDate'; //Name of column to filter by. eSIMs can be filtered by ICCID, Customer Reference, Last Action (Bundle Refund, Bundle Applied, Bundle Revoked, eSIM Updated, eSIM Refreshed, eSIM Utilisation Alert), Last Action Date and SIM Assignment Date. (optional) (default to undefined)
let filter: string; //Value to filter by (optional) (default to undefined)

const { status, data } = await apiInstance.esimsGet(
    page,
    perPage,
    direction,
    orderBy,
    filterBy,
    filter
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**string**] | Page of ESIMs to return | (optional) defaults to undefined|
| **perPage** | [**10 | 25 | 50 | 100**]**Array<10 &#124; 25 &#124; 50 &#124; 100>** | Number of ESIMs to return per page | (optional) defaults to undefined|
| **direction** | [**&#39;asc&#39; | &#39;desc&#39;**]**Array<&#39;asc&#39; &#124; &#39;desc&#39;>** | Direction of ordering | (optional) defaults to undefined|
| **orderBy** | [**&#39;iccid&#39;**]**Array<&#39;iccid&#39;>** | Name of column to order by | (optional) defaults to undefined|
| **filterBy** | [**&#39;iccid, customerRef, lastAction, actionDate, assignedDate&#39;**]**Array<&#39;iccid, customerRef, lastAction, actionDate, assignedDate&#39;>** | Name of column to filter by. eSIMs can be filtered by ICCID, Customer Reference, Last Action (Bundle Refund, Bundle Applied, Bundle Revoked, eSIM Updated, eSIM Refreshed, eSIM Utilisation Alert), Last Action Date and SIM Assignment Date. | (optional) defaults to undefined|
| **filter** | [**string**] | Value to filter by | (optional) defaults to undefined|


### Return type

**ESIMs**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of your eSIMs |  -  |
|**400** | Bad Request - returned when incorrect data given |  -  |
|**403** | Unauthorised - returned when the api token is invalid |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **esimsIccidBundlesGet**
> BundlesList esimsIccidBundlesGet()

This endpoint allows you to retrieve a list of all bundles that have been applied to a specific eSIM. This endpoint is useful for tracking the service history and current status of an eSIM.  Remaining data can be found here.  Each Bundle can have multiple assignments.  Bundle Assignment States: - **Processing:**   The bundle assignment is currently processing.   This is usually instant but can, on occasion, take up to 10 minutes to complete.   The eSIM can still be installed and will register on a network while the bundle is processing. - **Queued:**   The bundle has been successfully assigned, has not been used yet, and is queued for use. - **Active:**   The bundle has successfully been used.   It has data remaining and is within the bundle duration. - **Depleted:**   The bundle has no data remaining but is still within the bundle duration. - **Expired:**   The bundle has expired, and the bundle duration has been exceeded. - **Revoked:**   The bundle has been revoked, and is no longer on the esim. - **Lapsed:**   The bundle has expired without being used and is no longer on the eSIM. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let accept: string; // (optional) (default to undefined)
let includeUsed: string; //Include used & expired Bundles Backward compatibility for v2.1  (optional) (default to undefined)
let limit: string; //Number of assignments to return. Must be between 1 and 200. Default is 15  (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidBundlesGet(
    iccid,
    accept,
    includeUsed,
    limit
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **includeUsed** | [**string**] | Include used &amp; expired Bundles Backward compatibility for v2.1  | (optional) defaults to undefined|
| **limit** | [**string**] | Number of assignments to return. Must be between 1 and 200. Default is 15  | (optional) defaults to undefined|


### Return type

**BundlesList**

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

# **esimsIccidBundlesNameAssignmentsAssignmentIdDelete**
> StatusMessage esimsIccidBundlesNameAssignmentsAssignmentIdDelete()

This endpoint revokes a specific bundle from an eSIM using assignment ID.          **IMPORTANT:** If there are no bundles left on the eSIM AFTER the revoke, AND if the eSIM is not installed, the eSIM may undergo the eSIM Go returns process. The start of the returns process will REMOVE the eSIM from your account - you will no longer be able to access it. After a minimum of 4 days: if during the returns process, the eSIM is now installed (e.g. by your end user), the eSIM will be returned to your account. If you DO NOT want the eSIM to be given back to eSIM Go, ensure the eSIM either: - Is installed - Has more than 1 bundle on it at the time of revoking  Revokes latest assignment of a given Bundle type. If a bundle assignment has not been started and no data has been consumed, the bundle assignment can either be returned to the inventory or credited back to the organisations balance. If the bundle assignment has started, or was purchased outside of their permitted refund period, typically 60 days, it cannot be returned to the inventory or taken as a credit.  **Note:** Bundle names are case sensitive and should be typed like the following \"esim_1GB_7D_IM_U\". 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let name: string; //(Required) Name of Bundle Format as defined in [List Catalogue](/api/#get-/catalogue) API call. Example: `esim_10GB_30D_IM_U`  (default to undefined)
let assignmentId: string; //(Required) ID of individual Bundle Assignment to revoke from an eSIM (default to undefined)
let accept: string; // (optional) (default to undefined)
let type: string; //type `validate` will provide options for the revoke and the behaviours, if any. type `transaction` will execute the revoke. Defaults to `transaction` (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidBundlesNameAssignmentsAssignmentIdDelete(
    iccid,
    name,
    assignmentId,
    accept,
    type
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **name** | [**string**] | (Required) Name of Bundle Format as defined in [List Catalogue](/api/#get-/catalogue) API call. Example: &#x60;esim_10GB_30D_IM_U&#x60;  | defaults to undefined|
| **assignmentId** | [**string**] | (Required) ID of individual Bundle Assignment to revoke from an eSIM | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **type** | [**string**] | type &#x60;validate&#x60; will provide options for the revoke and the behaviours, if any. type &#x60;transaction&#x60; will execute the revoke. Defaults to &#x60;transaction&#x60; | (optional) defaults to undefined|


### Return type

**StatusMessage**

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

# **esimsIccidBundlesNameDelete**
> StatusMessage esimsIccidBundlesNameDelete()

This endpoint is used to revoke the latest assignment of a given bundle type from an eSIM. It requires two parameters: the ICCID of the eSIM and the name of the bundle to be revoked. If the specified ICCID has multiple bundles with the same name, the oldest unused bundle will be revoked.  Example: For an eSIM with ICCID 8943108165015003887 that has the following bundles:  • ESIM_1G_UK (Assignment ID: 243)  • ESIM_1G_UK (Assignment ID: 245)  • ESIM_1G_US (Assignment ID: 247)  If you revoke the \"ESIM_1G_UK\" bundle, the oldest unused assignment (ID: 243) will be revoked.  **IMPORTANT:** If there are no bundles left on the eSIM AFTER the revoke, AND if the eSIM is not installed, the eSIM may undergo the eSIM Go returns process. The start of the returns process will REMOVE the eSIM from your account - you will no longer be able to access it. After a minimum of 4 days: if during the returns process, the eSIM is now installed (e.g. by your end user), the eSIM will be returned to your account. If you DO NOT want the eSIM to be given back to eSIM Go, ensure the eSIM either: - Is installed - Has more than 1 bundle on it at the time of revoking  Revokes latest assignment of a given Bundle type. If a bundle assignment has not been started and no data has been consumed, the bundle assignment can either be returned to the inventory or credited back to the organisations balance. If the bundle assignment has started, or was purchased outside of their permitted refund period, typically 60 days, it cannot be returned to the inventory or taken as a credit.  **Note:** Bundle names are case sensitive and should be typed like the following \"esim_1GB_7D_IM_U\". 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //The ICCID of the eSIM (default to undefined)
let name: string; //Name of Bundle  Format as defined in [List Catalogue](/api/v2_4/operations/catalogue/get) API call. Example: `esim_10GB_30D_IM_U`  (default to undefined)
let refundToBalance: boolean; //If Applicable, refund the value of this bundle to organisation balance (optional) (default to undefined)
let offerId: string; //If Applicable, the offerId of the bundle to revoke. needed for refunding to balance (optional) (default to undefined)
let type: 'validate' | 'transaction'; //type `validate` will provide options for the revoke and the behaviours, if any. type `transaction` will execute the revoke. Defaults to `transaction` (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidBundlesNameDelete(
    iccid,
    name,
    refundToBalance,
    offerId,
    type
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | The ICCID of the eSIM | defaults to undefined|
| **name** | [**string**] | Name of Bundle  Format as defined in [List Catalogue](/api/v2_4/operations/catalogue/get) API call. Example: &#x60;esim_10GB_30D_IM_U&#x60;  | defaults to undefined|
| **refundToBalance** | [**boolean**] | If Applicable, refund the value of this bundle to organisation balance | (optional) defaults to undefined|
| **offerId** | [**string**] | If Applicable, the offerId of the bundle to revoke. needed for refunding to balance | (optional) defaults to undefined|
| **type** | [**&#39;validate&#39; | &#39;transaction&#39;**]**Array<&#39;validate&#39; &#124; &#39;transaction&#39;>** | type &#x60;validate&#x60; will provide options for the revoke and the behaviours, if any. type &#x60;transaction&#x60; will execute the revoke. Defaults to &#x60;transaction&#x60; | (optional) defaults to undefined|


### Return type

**StatusMessage**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Success message |  -  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the eSIM is not accessible by the user |  -  |
|**500** | Server Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **esimsIccidBundlesNameGet**
> AssignmentResponse esimsIccidBundlesNameGet()

Provides details about an individual assignment of a Bundle applied to an eSIM.   Bundle Assignment States:   - Processing: The bundle assignment is currently processing. This is usually      instant but can occasionally take up to 10 minutes to complete. The eSIM      can still be installed and will register on a network while the bundle is      processing.   - Queued: The bundle has been successfully assigned, has not been used yet,      and is queued for use.   - Active: The bundle has successfully been used. It has data remaining and      is within the bundle duration.   - Depleted: The bundle has no data remaining but is still within the bundle      duration.   - Expired: The bundle has expired, and the bundle duration has been exceeded.   - Revoked: The bundle has been revoked and is no longer on the eSIM.   - Lapsed: The bundle has expired without being used and is no longer on the eSIM.  Notes:   - If multiple of the same bundle are applied to a single eSIM, the status      bundle with the latest assignment will be returned.   - Bundle names are case sensitive and should be typed exactly as shown,      e.g., \"esim_1GB_7D_IM_U\".   - Remaining data can be found in the response. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let name: string; //(Required) Name of Bundle Format as defined in [List Catalogue](/api/#get-/catalogue) API call. Example: `esim_10GB_30D_IM_U`  (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidBundlesNameGet(
    iccid,
    name,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **name** | [**string**] | (Required) Name of Bundle Format as defined in [List Catalogue](/api/#get-/catalogue) API call. Example: &#x60;esim_10GB_30D_IM_U&#x60;  | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**AssignmentResponse**

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

# **esimsIccidCompatibleBundleGet**
> CompatibilityResponse esimsIccidCompatibleBundleGet()

To ensure optimal service, eSIM Go utilizes multiple providers. As a result, certain bundles may be incompatible with existing eSIMs if they originate from different providers, preventing eSIM top-ups.    This endpoint is designed to verify eSIM-bundle compatibility.

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let bundle: string; // (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidCompatibleBundleGet(
    iccid,
    bundle,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **bundle** | [**string**] |  | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**CompatibilityResponse**

### Authorization

[apikeyAuth](../README.md#apikeyAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request - returned when request format is not accepted |  -  |
|**403** | Unauthorised - returned when the api token is invalid; the user does not have any available Bundles left or the ICCID is not accessible by the user |  -  |
|**429** | Too Many Requests |  -  |
|**500** | Server Error |  -  |
|**503** | Processing - Please come back later or use the *Retry-After* (seconds) header |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **esimsIccidGet**
> ESIMDetailsResponse esimsIccidGet()

This endpoint allows you to retrieve detailed information about a specific eSIM using its ICCID (Integrated Circuit Card Identifier).  

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let accept: string; // (optional) (default to undefined)
let additionalFields: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidGet(
    iccid,
    accept,
    additionalFields
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **additionalFields** | [**string**] |  | (optional) defaults to undefined|


### Return type

**ESIMDetailsResponse**

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

# **esimsIccidHistoryGet**
> ESIMHistory esimsIccidHistoryGet()

This endpoint returns the history of a specific eSIM. It provides a chronological list of actions performed on the eSIM, including bundle assignments and their states.  This endpoint is useful for tracking the lifecycle of an eSIM, including bundle assignments, updates, and other significant events.  Bundle Assignment States: - **Bundle Applied:**   The bundle has been successfully assigned to the eSIM - **eSIM Updated:**   The eSIM Reference has been updated. - **eSIM Refreshed:**   eSIM was forcibly disconnected from the network, prompting it to reestablish its connection. - **eSIM Utilisation Alert:**   A notification has been triggered due to the eSIM reaching a certain usage threshold. - **eSIM Returned:**   The eSIM is no longer assigned to your organisation after undergoing the returns process. - **Bundle Refunded To Balance:**   The unused bundle has been credited back to the organization\'s account balance. - **Bundle Refunded to Inventory:**   The unused bundle has been returned to the organization\'s inventory for potential reassignment. - **Bundle Revoked:**   The bundle has been removed from the eSIM. - **eSIM First Attachment:**   The eSIM has successfully connected to a mobile network for the first time since activation. - **eSIM First Use:**  The eSIM has been used for the first time to consume data service. - **Bundle Expired:**   The bundle\'s validity period has ended and/or has been used in full. It is no longer active or usable. - **Bundle Lapsed:**   The bundle has become inactive after no activity for 12 months. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidHistoryGet(
    iccid,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**ESIMHistory**

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

# **esimsIccidLocationGet**
> LocationResponse esimsIccidLocationGet()

This endpoint provides the most recent location and associated network operator information for a specified eSIM.

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; // (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidLocationGet(
    iccid,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] |  | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**LocationResponse**

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

# **esimsIccidRefreshGet**
> StatusMessage esimsIccidRefreshGet()

This request generates a cancel location request to the network, prompting it to reestablish its connection. Please note that this process disconnects the customer from the network and should be used solely for troubleshooting. It is not intended for canceling locations in bulk.

### Example

```typescript
import {
    ESIMsApi,
    Configuration
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let accept: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.esimsIccidRefreshGet(
    iccid,
    accept
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|


### Return type

**StatusMessage**

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

# **esimsIccidSmsPost**
> StatusMessage esimsIccidSmsPost()

The Send SMS endpoint is a powerful feature of the eSIMGo API that allows you to send text messages directly to eSIMs. This endpoint becomes particularly useful when combined with eSIMGo\'s real-time notification system, which provides updates about eSIM activity through callback functionality. The callback should be set up separatelly.   Key points:  1. Message requirements:   - UTF-8 compliant   - Length: 1-160 characters  2. Default recipient: \'eSIM\' (currently the only supported value)   - Custom identifiers available upon request  Note: For custom identifiers, please contact your Account Manager. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration,
    EsimsIccidSmsPostRequest
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let iccid: string; //(Required) The ICCID of the eSIM (default to undefined)
let contentType: string; // (optional) (default to undefined)
let accept: string; // (optional) (default to undefined)
let esimsIccidSmsPostRequest: EsimsIccidSmsPostRequest; // (optional)

const { status, data } = await apiInstance.esimsIccidSmsPost(
    iccid,
    contentType,
    accept,
    esimsIccidSmsPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **esimsIccidSmsPostRequest** | **EsimsIccidSmsPostRequest**|  | |
| **iccid** | [**string**] | (Required) The ICCID of the eSIM | defaults to undefined|
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

# **esimsPut**
> StatusMessage esimsPut()

A feature that enables the association of a unique identifier with an eSIM. This functionality allows for the integration of relevant operational data, such as customer order IDs. 

### Example

```typescript
import {
    ESIMsApi,
    Configuration,
    UpdateSimDetails
} from '@esim-go/client';

const configuration = new Configuration();
const apiInstance = new ESIMsApi(configuration);

let contentType: string; // (optional) (default to undefined)
let accept: string; // (optional) (default to undefined)
let iccid: string; //(Required) ICCID of eSIM (optional) (default to undefined)
let customerRef: string; //(Required) New Customer Reference (optional) (default to undefined)
let updateSimDetails: UpdateSimDetails; // (optional)

const { status, data } = await apiInstance.esimsPut(
    contentType,
    accept,
    iccid,
    customerRef,
    updateSimDetails
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updateSimDetails** | **UpdateSimDetails**|  | |
| **contentType** | [**string**] |  | (optional) defaults to undefined|
| **accept** | [**string**] |  | (optional) defaults to undefined|
| **iccid** | [**string**] | (Required) ICCID of eSIM | (optional) defaults to undefined|
| **customerRef** | [**string**] | (Required) New Customer Reference | (optional) defaults to undefined|


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

