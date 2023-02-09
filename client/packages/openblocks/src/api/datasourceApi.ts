import { AxiosPromise } from "axios";
import Api from "./api";
import { GenericApiResponse } from "./apiResponses";
import { DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS } from "../constants/apiConstants";
import { Datasource as CEDatasource } from "../constants/datasourceConstants";
import { DatasourceType } from "@openblocks-ee/constants/queryConstants";
import { JSONArray } from "../util/jsonTypes";
import { AuthType, HttpOAuthGrantType } from "../pages/datasource/form/httpDatasourceForm";
import { Datasource } from "@openblocks-ee/constants/datasourceConstants";
import { DataSourcePluginMeta } from "openblocks-sdk/dataSource";

export interface PreparedStatementConfig {
  enableTurnOffPreparedStatement: boolean;
}

export interface SQLConfig extends PreparedStatementConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  usingSsl: boolean;
}

export interface MongoConfig extends SQLConfig {
  uri: string;
  usingUri: boolean;
}

export interface OracleConfig extends SQLConfig {
  serviceName: string;
  sid: string;
  usingSid: boolean;
}

export interface EsConfig {
  connectionString: string;
  username: string;
  password: string;
  skipTls: boolean;
}

export interface GoogleSheetsConfig {
  serviceAccount: string;
}

type KeyValue = {
  key: string;
  value: string;
}[];

// oAuth-like authorization basic config
export interface OAuthBasicConfig {
  grantType: HttpOAuthGrantType;
  clientId: string; // app_id | app_key | suite_key
  clientSecret: string; // app_secret | suite_secret
}

export interface OAuthConfig extends OAuthBasicConfig {
  scopeString: string;
  authorizationUrl: string;
  accessTokenUrl: string;

  // FIXME(zhangqinyao): oauth custom config
  isAuthorizationHeader: true;
  isTokenHeader: true; // set access token insertion position
  refreshTokenClientCredentialsLocation: "BODY"; // set refresh token insertion position
  sendScopeWithRefreshToken: false; // whether sending scope when refreshing token
  customAuthenticationParameters: KeyValue;

  // headerPrefix: "Bearer";

  // audience: "f";
  // resource: "ff";
  // isAuthorized: false;
}

export enum SSLCertVerificationEnum {
  VERIFY_CA_CERT = "VERIFY_CA_CERT",
  VERIFY_SELF_SIGNED_CERT = "VERIFY_SELF_SIGNED_CERT",
  DISABLED = "DISABLED",
}

export interface SSLConfig {
  sslCertVerificationType: SSLCertVerificationEnum;
  selfSignedCert?: string;
}

export interface HttpConfig {
  url: string;
  headers: KeyValue;
  params: KeyValue;
  // body: string;
  bodyFormData: KeyValue;

  authConfig: {
    type: AuthType;
  } & (
    | {
        username: string; // basic auth
        password: string;
      }
    | OAuthConfig
  );

  sslConfig: SSLConfig;
}

export type DatasourceConfigType =
  | SQLConfig
  | HttpConfig
  | MongoConfig
  | OAuthBasicConfig
  | EsConfig
  | OracleConfig
  | GoogleSheetsConfig;

export interface DatasourceInfo {
  datasource: Datasource;
  edit: boolean;
  creatorName?: string;
}

export interface NodePluginDatasourceInfo extends Omit<CEDatasource, "datasourceConfig"> {
  pluginDefinition: DataSourcePluginMeta;
}

export interface DatasourceStructure {
  columns: {
    name: string;
    type: string;
    defaultValue: string;
    isAutogenerated: boolean;
  }[];
  keys: JSONArray;
  name: string;
  type: "TABLE" | "VIEW" | "ALIAS" | "COLLECTION";
}

export interface DataSourceTypeInfo {
  id: DatasourceType;
  name: string;
  version: string;
  hasStructureInfo: boolean;
  definition?: DataSourcePluginMeta;
}

export class DatasourceApi extends Api {
  static url = "v1/datasources";

  // this api can be accessed by anonymous users when app is public.
  static fetchJsDatasourceByApp(
    appId: string
  ): AxiosPromise<GenericApiResponse<NodePluginDatasourceInfo[]>> {
    return Api.get(DatasourceApi.url + `/jsDatasourcePlugins?appId=${appId}`);
  }

  static fetchDatasourceByApp(appId: string): AxiosPromise<GenericApiResponse<DatasourceInfo[]>> {
    return Api.get(DatasourceApi.url + `/listByApp?appId=${appId}`);
  }

  static fetchDatasourceByOrg(orgId: string): AxiosPromise<GenericApiResponse<DatasourceInfo[]>> {
    return Api.get(DatasourceApi.url + `/listByOrg?orgId=${orgId}`);
  }

  static createDatasource(
    datasourceConfig: Partial<Datasource>
  ): AxiosPromise<GenericApiResponse<Datasource>> {
    return Api.post(DatasourceApi.url, datasourceConfig);
  }

  static testDatasource(
    datasourceConfig: Partial<Datasource>
  ): AxiosPromise<GenericApiResponse<Datasource>> {
    return Api.post(`${DatasourceApi.url}/test`, datasourceConfig, undefined, {
      timeout: DEFAULT_TEST_DATA_SOURCE_TIMEOUT_MS,
    });
  }

  static updateDatasource(
    datasourceConfig: Partial<Datasource>,
    id: string
  ): AxiosPromise<GenericApiResponse<Datasource>> {
    return Api.put(DatasourceApi.url + `/${id}`, datasourceConfig);
  }

  static deleteDatasource(id: string): AxiosPromise<GenericApiResponse<Datasource>> {
    return Api.delete(DatasourceApi.url + `/${id}`);
  }

  static fetchDatasourceStructure(
    id: string,
    ignoreCache = false
  ): AxiosPromise<GenericApiResponse<{ tables: DatasourceStructure[] }>> {
    return Api.get(DatasourceApi.url + `/${id}/structure?ignoreCache=${ignoreCache}`);
  }

  static fetchDatasourceType(
    orgId: string
  ): AxiosPromise<GenericApiResponse<DataSourceTypeInfo[]>> {
    return Api.get(`/v1/organizations/${orgId}/datasourceTypes`);
  }

  static fetchDynamicPluginConfig<T = any>(
    pluginName: string,
    path: string,
    dataSourceConfig: any,
    dataSourceId?: string
  ): AxiosPromise<GenericApiResponse<T[]>> {
    return Api.post(DatasourceApi.url + `/getPluginDynamicConfig`, [
      { pluginName, path, dataSourceConfig, dataSourceId },
    ]);
  }
}
