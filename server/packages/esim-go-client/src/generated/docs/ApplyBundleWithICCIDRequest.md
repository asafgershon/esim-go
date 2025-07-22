# ApplyBundleWithICCIDRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**iccid** | **string** | ICCID of target eSIM to apply Bundle to. If not provided, a new eSIM will be assigned to you. | [optional] [default to undefined]
**name** | **string** | Name of Bundle to apply | [default to undefined]
**repeat** | **number** | How many eSIMs will be assigned with this bundle applied (if left empty Bundle will assign to one eSIM) | [optional] [default to undefined]
**allowReassign** | **boolean** | Allow a new eSIM to be provided if the bundle is not compatible with the eSIM profile | [optional] [default to undefined]

## Example

```typescript
import { ApplyBundleWithICCIDRequest } from '@esim-go/client';

const instance: ApplyBundleWithICCIDRequest = {
    iccid,
    name,
    repeat,
    allowReassign,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
