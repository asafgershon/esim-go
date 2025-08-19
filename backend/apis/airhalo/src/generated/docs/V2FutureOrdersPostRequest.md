# V2FutureOrdersPostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**quantity** | **number** | The quantity of items in the order. Maximum of 50. | [default to undefined]
**packageId** | **string** | Required. The package ID associated with the order. You can obtain this from the \&quot;Packages / Get Packages\&quot; endpoint. | [default to undefined]
**dueDate** | **string** | Required. Date and time string field in the format YYYY-MM-DD HH:MM. This date must be minimum two days in the future from current time and maximum 1 year in the future. The order processing starts at the moment the due date arrives. | [default to undefined]
**toEmail** | **string** | If specified, email with esim sharing will be sent. sharing_option should be specified as well.   | [optional] [default to undefined]
**sharingOption** | **Array&lt;string&gt;** | Array. Required when to_email is set. Available options: link, pdf | [optional] [default to undefined]
**copyAddress** | **string** | Array. It is used when to_email is set. | [optional] [default to undefined]
**webhookUrl** | **string** | Optional. A custom, valid url to which you will receive the order details data asynchronously. Note that you can optin or provide in request. The webhook_url if provided in payload will overwrite the one which is opted in. | [optional] [default to undefined]
**description** | **string** | Optional. A custom description for the order, which can help you identify it later. | [optional] [default to undefined]
**brandSettingsName** | **string** | Nullable. The definition under what brand the eSIM should be shared. Null for unbranded. | [optional] [default to undefined]

## Example

```typescript
import { V2FutureOrdersPostRequest } from '@hiilo/airalo';

const instance: V2FutureOrdersPostRequest = {
    quantity,
    packageId,
    dueDate,
    toEmail,
    sharingOption,
    copyAddress,
    webhookUrl,
    description,
    brandSettingsName,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
