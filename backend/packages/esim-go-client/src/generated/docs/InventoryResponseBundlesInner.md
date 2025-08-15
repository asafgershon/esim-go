# InventoryResponseBundlesInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | The name of the bundle | [optional] [default to undefined]
**desc** | **string** | A description of the bundle | [optional] [default to undefined]
**useDms** | **boolean** | Indicates if DMS is used | [optional] [default to undefined]
**available** | [**Array&lt;InventoryResponseBundlesInnerAvailableInner&gt;**](InventoryResponseBundlesInnerAvailableInner.md) |  | [optional] [default to undefined]
**countries** | **Array&lt;string&gt;** | List of countries where the bundle is valid | [optional] [default to undefined]
**data** | **number** | The amount of data in MB | [optional] [default to undefined]
**duration** | **number** | The duration of the bundle | [optional] [default to undefined]
**durationUnit** | **string** | The unit of duration (day or month) | [optional] [default to undefined]
**autostart** | **boolean** | Indicates if the bundle autostarts | [optional] [default to undefined]
**unlimited** | **boolean** | Indicates if the bundle has unlimited data | [optional] [default to undefined]
**speed** | **Array&lt;string&gt;** | The supported network speeds | [optional] [default to undefined]
**allowances** | [**Array&lt;InventoryResponseBundlesInnerAllowancesInner&gt;**](InventoryResponseBundlesInnerAllowancesInner.md) |  | [optional] [default to undefined]

## Example

```typescript
import { InventoryResponseBundlesInner } from '@esim-go/client';

const instance: InventoryResponseBundlesInner = {
    name,
    desc,
    useDms,
    available,
    countries,
    data,
    duration,
    durationUnit,
    autostart,
    unlimited,
    speed,
    allowances,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
