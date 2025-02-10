import { api } from 'dicomweb-client';
import { DicomMetadataStore, IWebApiDataSource, utils, errorHandler, classes } from '@ohif/core';

import {
  mapParams,
  allStudies,
  seriesInStudy,
  processResults,
  processSeriesResults,
  retrieveStudyMetadata,
} from './qido.js';

import dcmjs from 'dcmjs';
import getDirectURL from '../utils/getDirectURL';
import getImageId from './getImageId.js';

const { DicomMetaDictionary, DicomDict } = dcmjs.data;

const { naturalizeDataset, denaturalizeDataset } = DicomMetaDictionary;

const metadataProvider = classes.MetadataProvider;

/**
 * Creates a DICOM Web API based on the provided configuration.
 *
 * @param {object} dicomWebConfig - Configuration for the DICOM Web API
 * @param {string} dicomWebConfig.name - Data source name
 * @param {string} dicomWebConfig.wadoUriRoot - Legacy? (potentially unused/replaced)
 * @param {string} dicomWebConfig.qidoRoot - Base URL to use for QIDO requests
 * @param {string} dicomWebConfig.wadoRoot - Base URL to use for WADO requests
 * @param {string} dicomWebConfig.wadoUri - Base URL to use for WADO URI requests
 * @param {boolean} dicomWebConfig.qidoSupportsIncludeField - Whether QIDO supports the "Include" option to request additional fields in response
 * @param {string} dicomWebConfig.imageRendering - wadors | ? (unsure of where/how this is used)
 * @param {string} dicomWebConfig.thumbnailRendering - wadors | ? (unsure of where/how this is used)
 * @param {boolean} dicomWebConfig.supportsReject - Whether the server supports reject calls (i.e. DCM4CHEE)
 * @param {boolean} dicomWebConfig.lazyLoadStudy - "enableStudyLazyLoad"; Request series meta async instead of blocking
 * @param {string|boolean} dicomWebConfig.singlepart - indicates if the retrieves can fetch singlepart. Options are bulkdata, video, image, or boolean true
 * @param {string} dicomWebConfig.requestTransferSyntaxUID - Transfer syntax to request from the server
 * @param {object} dicomWebConfig.acceptHeader - Accept header to use for requests
 * @param {boolean} dicomWebConfig.omitQuotationForMultipartRequest - Whether to omit quotation marks for multipart requests
 * @param {boolean} dicomWebConfig.supportsFuzzyMatching - Whether the server supports fuzzy matching
 * @param {boolean} dicomWebConfig.supportsWildcard - Whether the server supports wildcard matching
 * @param {boolean} dicomWebConfig.supportsNativeDICOMModel - Whether the server supports the native DICOM model
 * @param {boolean} dicomWebConfig.enableStudyLazyLoad - Whether to enable study lazy loading
 * @param {boolean} dicomWebConfig.enableRequestTag - Whether to enable request tag
 * @param {boolean} dicomWebConfig.enableStudyLazyLoad - Whether to enable study lazy loading
 * @param {boolean} dicomWebConfig.bulkDataURI - Whether to enable bulkDataURI
 * @param {function} dicomWebConfig.onConfiguration - Function that is called after the configuration is initialized
 * @param {boolean} dicomWebConfig.staticWado - Whether to use the static WADO client
 * @param {object} userAuthenticationService - User authentication service
 * @param {object} userAuthenticationService.getAuthorizationHeader - Function that returns the authorization header
 * @returns {object} - DICOM Web API object
 */
function createDicomIpfsApi(dicomWebConfig, servicesManager) {
  const { userAuthenticationService, customizationService } = servicesManager.services;
  let dicomWebConfigCopy,
    qidoConfig,
    getAuthrorizationHeader;

  const implementation = {
    initialize: ({ params, query }) => {
      if (dicomWebConfig.onConfiguration && typeof dicomWebConfig.onConfiguration === 'function') {
        dicomWebConfig = dicomWebConfig.onConfiguration(dicomWebConfig, {
          params,
          query,
        });
      }

      dicomWebConfigCopy = JSON.parse(JSON.stringify(dicomWebConfig));

      getAuthrorizationHeader = () => {
        const xhrRequestHeaders = {};
        const authHeaders = userAuthenticationService.getAuthorizationHeader();
        if (authHeaders && authHeaders.Authorization) {
          xhrRequestHeaders.Authorization = authHeaders.Authorization;
        }
        return xhrRequestHeaders;
      };

      qidoConfig = {
        url: dicomWebConfig.qidoRoot,
        staticWado: dicomWebConfig.staticWado,
        singlepart: dicomWebConfig.singlepart,
        headers: userAuthenticationService.getAuthorizationHeader(),
        errorInterceptor: errorHandler.getHTTPErrorHandler(),
      };
    },
    query: {
      studies: {
        mapParams: mapParams.bind(),
        search: async function (origParams) {
          const { studyInstanceUid, seriesInstanceUid, ...mappedParams } =
            mapParams(origParams, {
              supportsFuzzyMatching: dicomWebConfig.supportsFuzzyMatching,
              supportsWildcard: dicomWebConfig.supportsWildcard,
            }) || {};

          const results = await allStudies(qidoConfig, undefined, undefined, mappedParams);

          return processResults(results);
        },
        processResults: processResults.bind(),
      },
      series: {
        // mapParams: mapParams.bind(),
        search: async function (studyInstanceUid) {
          const results = await seriesInStudy(qidoConfig, studyInstanceUid);

          return processSeriesResults(results);
        },
        // processResults: processResults.bind(),
      },
      instances: {
        search: () => {
          console.warn(' DICOMJson QUERY instances SEARCH not implemented');
        },
      },
    },
    retrieve: {
      /**
       * Generates a URL that can be used for direct retrieve of the bulkdata
       *
       * @param {object} params
       * @param {string} params.tag is the tag name of the URL to retrieve
       * @param {object} params.instance is the instance object that the tag is in
       * @param {string} params.defaultType is the mime type of the response
       * @param {string} params.singlepart is the type of the part to retrieve
       * @returns an absolute URL to the resource, if the absolute URL can be retrieved as singlepart,
       *    or is already retrieved, or a promise to a URL for such use if a BulkDataURI
       */
      directURL: params => {
        return getDirectURL(
          {
            wadoRoot: dicomWebConfig.wadoRoot,
            singlepart: dicomWebConfig.singlepart,
          },
          params
        );
      },


      bulkDataURI: async ({ StudyInstanceUID, BulkDataURI }) => {
        console.warn(' IPFS bulkDataURI not implemented');
      },
      series: {
        metadata: async ({
          StudyInstanceUID,
          madeInClient = false,
        } = {}) => {
          if (!StudyInstanceUID) {
            throw new Error('Unable to query for SeriesMetadata without StudyInstanceUID');
          }

          const results = await retrieveStudyMetadata(qidoConfig, StudyInstanceUID);
          // data is all SOPInstanceUIDs

          // first naturalize the data
          const naturalizedInstancesMetadata = results.map(naturalizeDataset);

          const seriesSummaryMetadata = {};
          const instancesPerSeries = {};

          naturalizedInstancesMetadata.forEach(instance => {
            if (!seriesSummaryMetadata[instance.SeriesInstanceUID]) {
              seriesSummaryMetadata[instance.SeriesInstanceUID] = {
                StudyInstanceUID: instance.StudyInstanceUID,
                StudyDescription: instance.StudyDescription,
                SeriesInstanceUID: instance.SeriesInstanceUID,
                SeriesDescription: instance.SeriesDescription,
                SeriesNumber: instance.SeriesNumber,
                SeriesTime: instance.SeriesTime,
                SOPClassUID: instance.SOPClassUID,
                ProtocolName: instance.ProtocolName,
                Modality: instance.Modality,
              };
            }

            if (!instancesPerSeries[instance.SeriesInstanceUID]) {
              instancesPerSeries[instance.SeriesInstanceUID] = [];
            }

            const imageId = implementation.getImageIdsForInstance({
              instance,
            });

            instance.imageId = imageId;
            instance.wadoRoot = dicomWebConfig.wadoRoot;
            instance.wadoUri = dicomWebConfig.wadoUri;

            metadataProvider.addImageIdToUIDs(imageId, {
              StudyInstanceUID,
              SeriesInstanceUID: instance.SeriesInstanceUID,
              SOPInstanceUID: instance.SOPInstanceUID,
            });

            instancesPerSeries[instance.SeriesInstanceUID].push(instance);
          });

          function setSuccessFlag() {
            const study = DicomMetadataStore.getStudy(StudyInstanceUID, madeInClient);
            study.isLoaded = true;
          }
          // grab all the series metadata
          const seriesMetadata = Object.values(seriesSummaryMetadata);
          DicomMetadataStore.addSeriesMetadata(seriesMetadata, madeInClient);

          Object.keys(instancesPerSeries).forEach(seriesInstanceUID =>
            DicomMetadataStore.addInstances(instancesPerSeries[seriesInstanceUID], madeInClient)
          );
          setSuccessFlag();

          return seriesSummaryMetadata;
        },
      },
    },

    store: {
      dicom: () => {
        console.warn(' DICOMJson store dicom not implemented');
      },
    },
    getImageIdsForDisplaySet(displaySet) {
      const images = displaySet.images;
      const imageIds = [];

      if (!images) {
        return imageIds;
      }

      displaySet.images.forEach(instance => {
        const NumberOfFrames = instance.NumberOfFrames;

        if (NumberOfFrames > 1) {
          for (let frame = 1; frame <= NumberOfFrames; frame++) {
            const imageId = this.getImageIdsForInstance({
              instance,
              frame,
            });
            imageIds.push(imageId);
          }
        } else {
          const imageId = this.getImageIdsForInstance({ instance });
          imageIds.push(imageId);
        }
      });

      return imageIds;
    },
    getImageIdsForInstance({ instance, frame = undefined }) {
      const imageIds = getImageId({
        instance,
        frame,
        config: dicomWebConfig,
      });
      return imageIds;
    },
    getConfig() {
      return dicomWebConfigCopy;
    },
    getStudyInstanceUIDs({ params, query }) {
      const { StudyInstanceUIDs: paramsStudyInstanceUIDs } = params;
      const queryStudyInstanceUIDs = utils.splitComma(query.getAll('StudyInstanceUIDs'));

      const StudyInstanceUIDs =
        (queryStudyInstanceUIDs.length && queryStudyInstanceUIDs) || paramsStudyInstanceUIDs;
      const StudyInstanceUIDsAsArray =
        StudyInstanceUIDs && Array.isArray(StudyInstanceUIDs)
          ? StudyInstanceUIDs
          : [StudyInstanceUIDs];

      return StudyInstanceUIDsAsArray;
    },
  };

  return IWebApiDataSource.create(implementation);
}

export { createDicomIpfsApi };
