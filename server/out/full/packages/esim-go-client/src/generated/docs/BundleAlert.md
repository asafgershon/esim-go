# BundleAlert


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**iccid** | **string** | The ICCID (Integrated Circuit Card Identifier) of the SIM card | [optional] [default to undefined]
**alertType** | **string** | The type of alert being sent | [optional] [default to undefined]
**bundle** | [**BundleAlertBundle**](BundleAlertBundle.md) |  | [optional] [default to undefined]

## Example

```typescript
import { BundleAlert } from '@esim-go/client';

const instance: BundleAlert = {
    iccid,
    alertType,
    bundle,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
