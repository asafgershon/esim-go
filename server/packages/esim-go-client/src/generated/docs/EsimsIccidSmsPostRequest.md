# EsimsIccidSmsPostRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**message** | **string** | UTF-8 compliant message | [optional] [default to 'message']
**from** | **string** | Name of sender that will show in SMS.  This defaults to &#x60;eSIM&#x60; and is the only supported value by default. Unique identifiers can be assigned to your Organisation on request.  | [optional] [default to 'eSIM']

## Example

```typescript
import { EsimsIccidSmsPostRequest } from '@esim-go/client';

const instance: EsimsIccidSmsPostRequest = {
    message,
    from,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
