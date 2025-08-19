# RESTAPIEndpointsNotificationsApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**rootPost**](#rootpost) | **POST** / | Webhook definition|
|[**v2NotificationsOptInGet**](#v2notificationsoptinget) | **GET** /v2/notifications/opt-in | Get low data notification|
|[**v2NotificationsOptInPost**](#v2notificationsoptinpost) | **POST** /v2/notifications/opt-in | Credit limit notification|
|[**v2NotificationsOptOutPost**](#v2notificationsoptoutpost) | **POST** /v2/notifications/opt-out | Low data notification - opt out|
|[**v2SimulatorWebhookPost**](#v2simulatorwebhookpost) | **POST** /v2/simulator/webhook | Webhook simulator|

# **rootPost**
> object rootPost()

A webhook is a method in the context of Airalo\'s API, which serves as a means to seamlessly push real-time data updates to our partner\'s designated endpoint URL. This functionality ensures timely and efficient data synchronization between our systems and those of our valued partners.  **NOTE: Whenever an optin is performed, the webhook_url parameter is checked by the system via HEAD request, to which it must respond with 200 OK to be considered successful**  There are three types:   \\- _**Credit Limit Notification**_   \\- _**Low Data Notification**_ \\- _**Async Order**_  ### Custom Header for Payload Signing  To enhance the security and integrity of transmitted data, our webhook implementation includes a custom header for payload signing which is a HMAC value with sha512 algorithm. Partners are _**strongly encouraged**_ to include this header in their requests to validate the authenticity and integrity of the payload.  Header name: `airalo-signature`  **Examples on how to verify the integrity of the received webhook event:**  ``` php function calculateHMAC($data, $key) {     return hash_hmac(\'sha512\', $data, $key); } // Your API secret define(\"API_SECRET\", \"<YOUR_API_SECRET>\"); // This is the JSON payload pushed by Airalo\'s webhook. Depending on the framework you are using, retrieve the payload. $payload = []; // Assign the actual payload here $airaloSignature = \"<AIRALO_SIGNATURE>\"; // Assign the actual header here, located in key `airalo-signature` // Check if the payload is an object, if so, convert it to a JSON string if (is_array($payload) || is_object($payload)) {     $payload = json_encode($payload); } // Calculate the expected signature using HMAC with SHA512 $expectedSignature = calculateHMAC($payload, API_SECRET); if ($expectedSignature === $airaloSignature) {     // Here you are guaranteed the payload came from Airalo\'s system, and it is not from any third party or attacker.     // You can safely proceed with your flow.     echo \'Yay!\'; } else {     // We wouldn\'t trust this payload and the system that sent it... Better to reject it or proceed at your own risk.     echo \'Hmm.... it is suspicious\'; }   ```  ``` javascript const crypto = require(\'crypto\'); const API_SECRET = \"<YOUR_API_SECRET>\"; // This is the JSON payload pushed by Airalo\'s webhook. Depending on the framework you are using, retrieve the payload. let payload = \'{}\'; // Assign the actual payload here const airaloSignature = \"<AIRALO_SIGNATURE>\"; // Assign the actual header here, located in key `airalo-signature` if (typeof payload === \'object\') {     payload = JSON.stringify(payload); } const expectedSignature = crypto.createHmac(\'sha512\', API_SECRET).update(payload).digest(\'hex\'); if (expectedSignature === airaloSignature) {     // Here you are guaranteed the payload came from Airalo\'s system, and it is not from any third party or attacker.     // You can safely proceed with your flow.     console.log(\'Yay!\'); } else {     // We wouldn\'t trust this payload and the system that sent it... Better to reject it or proceed at your own risk.     console.log(\'Hmm.... it is suspicious\'); }   ```  ``` python import hashlib import hmac import json API_SECRET = \"<YOUR_API_SECRET>\" # This is the JSON payload pushed by Airalo\'s webhook. Depending on the framework you are using, retrieve the payload. # Assign the actual payload here payload = {     \"foo\": \"bar\",     \"baz:\": \"mqu\", }  # Replace with the actual payload # Assign the actual header here, located in key `airalo-signature` airalo_signature = \"<AIRALO_SIGNATURE>\" if isinstance(payload, dict):     payload = json.dumps(payload, separators=(\',\', \':\')) expected_signature = hmac.new(bytes(API_SECRET, \'utf-8\'), msg=bytes(payload, \'utf-8\'), digestmod=hashlib.sha512).hexdigest() if hmac.compare_digest(expected_signature, airalo_signature):     # Here you are guaranteed the payload came from Airalo\'s system, and it is not from any third party or attacker.     # You can safely proceed with your flow.     print(\'Yay!\') else:     # We wouldn\'t trust this payload and the system that sent it... Better to reject it or proceed at your own risk.     print(\'Hmm.... it is suspicious\')   ```  ``` java import java.nio.charset.StandardCharsets; import java.security.MessageDigest; import java.security.NoSuchAlgorithmException; import javax.crypto.Mac; import javax.crypto.spec.SecretKeySpec; import java.util.Base64; public class AiraloWebhookVerification {     private static final String API_SECRET = \"<YOUR_API_SECRET>\";     public static void main(String[] args) {         // This is the JSON payload pushed by Airalo\'s webhook. Depending on the framework you are using, retrieve the payload.         // Assign the actual payload here         String payload = \"{}\";  // Replace with the actual payload         // Assign the actual header here, located in key `airalo-signature`         String airaloSignature = \"<AIRALO_SIGNATURE>\";         if (payload instanceof String) {             try {                 MessageDigest digest = MessageDigest.getInstance(\"SHA-512\");                 byte[] hash = digest.digest(payload.getBytes(StandardCharsets.UTF_8));                 payload = bytesToHex(hash);             } catch (NoSuchAlgorithmException e) {                 e.printStackTrace();             }         }         String expectedSignature = generateHmacSHA512(API_SECRET, payload);         if (expectedSignature.equals(airaloSignature)) {             // Here you are guaranteed the payload came from Airalo\'s system, and it is not from any third party or attacker.             // You can safely proceed with your flow.             System.out.println(\"Yay!\");         } else {             // We wouldn\'t trust this payload and the system that sent it... Better to reject it or proceed at your own risk.             System.out.println(\"Hmm.... it is suspicious\");         }     }     private static String generateHmacSHA512(String key, String data) {         try {             Mac sha512_HMAC = Mac.getInstance(\"HmacSHA512\");             SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), \"HmacSHA512\");             sha512_HMAC.init(secret_key);             byte[] bytes = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));             return bytesToHex(bytes);         } catch (Exception e) {             e.printStackTrace();             return null;         }     }     private static String bytesToHex(byte[] bytes) {         StringBuilder result = new StringBuilder();         for (byte b : bytes) {             result.append(String.format(\"x\", b));         }         return result.toString();     } }   ```

### Example

```typescript
import {
    RESTAPIEndpointsNotificationsApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsNotificationsApi(configuration);

let contentType: string; // (default to undefined)

const { status, data } = await apiInstance.rootPost(
    contentType
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **contentType** | [**string**] |  | defaults to undefined|


### Return type

**object**

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

# **v2NotificationsOptInGet**
> V2NotificationsOptInGet200Response v2NotificationsOptInGet()

This endpoint allows you to retrieve the details of low data notification from the Airalo Partners API. The access token, obtained from the \"Request Access Token\" endpoint, should be included in the request.  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsNotificationsApi,
    Configuration
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsNotificationsApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)

const { status, data } = await apiInstance.v2NotificationsOptInGet(
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

**V2NotificationsOptInGet200Response**

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

# **v2NotificationsOptInPost**
> V2NotificationsOptInPost200Response v2NotificationsOptInPost()

Receive notifications regarding your credit limit as it reaches specific thresholds. You have   the flexibility to opt-in for various levels based on your requirements. For instance, you can   choose to receive notifications at 90% of your credit limit or select multiple thresholds such   as 50%, 70%, and 90%. These notifications can be delivered either to your webhook or your   company email address.  **Parameters**  - \"type\": \"webhook_credit_limit\", - use this value to receive notification via webhook - \"email_credit_limit\" use this value to receive notification via email - \"webhook_url\": \"[https://example.com\"](https://example.com\") - in case of notification to be       delivered via your webhook implementation, provide your webhook       implementation url - “email” – email address is case of notification via company email address - “language” – “en” – in case of email based notification

### Example

```typescript
import {
    RESTAPIEndpointsNotificationsApi,
    Configuration,
    V2NotificationsOptInPostRequest
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsNotificationsApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let v2NotificationsOptInPostRequest: V2NotificationsOptInPostRequest; // (optional)

const { status, data } = await apiInstance.v2NotificationsOptInPost(
    accept,
    authorization,
    v2NotificationsOptInPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **v2NotificationsOptInPostRequest** | **V2NotificationsOptInPostRequest**|  | |
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2NotificationsOptInPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2NotificationsOptOutPost**
> object v2NotificationsOptOutPost()

This feature allows you to opt out of notifications regarding low data usage depending upon the type passed in the request payload  For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsNotificationsApi,
    Configuration,
    V2NotificationsOptOutPostRequest
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsNotificationsApi(configuration);

let accept: string; // (default to undefined)
let authorization: string; // (default to undefined)
let v2NotificationsOptOutPostRequest: V2NotificationsOptOutPostRequest; // (optional)

const { status, data } = await apiInstance.v2NotificationsOptOutPost(
    accept,
    authorization,
    v2NotificationsOptOutPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **v2NotificationsOptOutPostRequest** | **V2NotificationsOptOutPostRequest**|  | |
| **accept** | [**string**] |  | defaults to undefined|
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **v2SimulatorWebhookPost**
> V2SimulatorWebhookPost200Response v2SimulatorWebhookPost()

With this endpoint parthers can trigger a Low Data Notification webhook event with mock data to their opted-in wehbook url. This is useful during testing/integration phase where developers can test their server when receiving such events.  Parameters  - \"event\" - string **required**      - \"type\" - string **required**      - \"iccid\" - string **optional**       For more informations, best practices visit our FAQ page: [https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ](https://airalopartners.zendesk.com/hc/en-us/sections/13207524820893-FAQ)

### Example

```typescript
import {
    RESTAPIEndpointsNotificationsApi,
    Configuration,
    V2SimulatorWebhookPostRequest
} from '@hiilo/airalo';

const configuration = new Configuration();
const apiInstance = new RESTAPIEndpointsNotificationsApi(configuration);

let authorization: string; // (default to undefined)
let v2SimulatorWebhookPostRequest: V2SimulatorWebhookPostRequest; // (optional)

const { status, data } = await apiInstance.v2SimulatorWebhookPost(
    authorization,
    v2SimulatorWebhookPostRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **v2SimulatorWebhookPostRequest** | **V2SimulatorWebhookPostRequest**|  | |
| **authorization** | [**string**] |  | defaults to undefined|


### Return type

**V2SimulatorWebhookPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

