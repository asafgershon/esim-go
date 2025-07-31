// Main exports
export { AirHaloClient } from './client';
export type { 
  AirHaloClientConfig, 
  AirHaloPackageFilter,
  AirHaloPackageSearchCriteria,
  EnhancedPackageInfo
} from './client';

// Enhanced types
export * from './types';

// Generated API types - re-export commonly used ones
export type {
  V2PackagesGet200Response,
  V2PackagesGet200ResponseDataInner,
  V2OrdersGet200Response,
  V2OrdersGet200ResponseDataInner,
  V2OrdersPost200Response,
  V2OrdersPost200ResponseData,
  V2TokenPost200Response,
  V2TokenPost200ResponseData,
} from './generated/models';

// Generated API classes for advanced usage
export {
  RESTAPIEndpointsBrowsePackagesApi,
  RESTAPIEndpointsAuthenticateApi,
  RESTAPIEndpointsPlaceOrderApi,
  RESTAPIEndpointsManageOrdersESIMsApi,
  RESTAPIEndpointsInstallESIMApi,
  Configuration,
} from './generated';

// Default export
import { AirHaloClient } from './client';
export default AirHaloClient;