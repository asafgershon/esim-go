# Pet


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | Pet ID | [default to undefined]
**category** | [**Category**](Category.md) | group | [default to undefined]
**name** | **string** | name | [default to undefined]
**photoUrls** | **Array&lt;string&gt;** | image URL | [default to undefined]
**tags** | [**Array&lt;Tag&gt;**](Tag.md) | tag | [default to undefined]
**status** | **string** | Pet Sales Status | [default to undefined]

## Example

```typescript
import { Pet } from '@hiilo/airalo';

const instance: Pet = {
    id,
    category,
    name,
    photoUrls,
    tags,
    status,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
