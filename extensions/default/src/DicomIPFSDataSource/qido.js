/**
 * QIDO - Query based on ID for DICOM Objects
 * search for studies, series and instances by patient ID, and receive their
 * unique identifiers for further usage.
 *
 * Quick: https://www.dicomstandard.org/dicomweb/query-qido-rs/
 * Standard: http://dicom.nema.org/medical/dicom/current/output/html/part18.html#sect_10.6
 *
 * Routes:
 * ==========
 * /studies?
 * /studies/{studyInstanceUid}/series?
 * /studies/{studyInstanceUid}/series/{seriesInstanceUid}/instances?
 *
 * Query Parameters:
 * ================
 * | KEY              | VALUE              |
 * |------------------|--------------------|
 * | {attributeId}    | {value}            |
 * | includeField     | {attribute} or all |
 * | fuzzymatching    | true OR false      |
 * | limit            | {number}           |
 * | offset           | {number}           |
 */
import { DICOMWeb, utils } from '@ohif/core';
import { sortStudySeries } from '@ohif/core/src/utils/sortStudy';
import axios  from 'axios';
import fetch from 'node-fetch';

const { getString, getName, getModalities } = DICOMWeb;

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param {Array} qidoStudies - An array of study objects. Each object contains a keys for DICOM tags.
 * @param {object} qidoStudies[0].qidoStudy - An object where each key is the DICOM Tag group+element
 * @param {object} qidoStudies[0].qidoStudy[dicomTag] - Optional object that represents DICOM Tag
 * @param {string} qidoStudies[0].qidoStudy[dicomTag].vr - Value Representation
 * @param {string[]} qidoStudies[0].qidoStudy[dicomTag].Value - Optional string array representation of the DICOM Tag's value
 * @returns {Array} An array of Study MetaData objects
 */
function processResults(qidoStudies) {
  if (!qidoStudies || !qidoStudies.length) {
    return [];
  }

  const studies = [];

  qidoStudies.forEach(qidoStudy =>
    studies.push({
      studyInstanceUid: getString(qidoStudy['0020000D']),
      date: getString(qidoStudy['00080020']), // YYYYMMDD
      time: getString(qidoStudy['00080030']), // HHmmss.SSS (24-hour, minutes, seconds, fractional seconds)
      accession: getString(qidoStudy['00080050']) || '', // short string, probably a number?
      mrn: getString(qidoStudy['00100020']) || '', // medicalRecordNumber
      patientName: utils.formatPN(getName(qidoStudy['00100010'])) || '',
      instances: Number(getString(qidoStudy['00201208'])) || 0, // number
      description: getString(qidoStudy['00081030']) || '',
      modalities: getString(getModalities(qidoStudy['00080060'], qidoStudy['00080061'])) || '',
    })
  );

  return studies;
}

/**
 * Parses resulting data from a QIDO call into a set of Study MetaData
 *
 * @param {Array} qidoSeries - An array of study objects. Each object contains a keys for DICOM tags.
 * @param {object} qidoSeries[0].qidoSeries - An object where each key is the DICOM Tag group+element
 * @param {object} qidoSeries[0].qidoSeries[dicomTag] - Optional object that represents DICOM Tag
 * @param {string} qidoSeries[0].qidoSeries[dicomTag].vr - Value Representation
 * @param {string[]} qidoSeries[0].qidoSeries[dicomTag].Value - Optional string array representation of the DICOM Tag's value
 * @returns {Array} An array of Study MetaData objects
 */
function processSeriesResults(qidoSeries) {
  const series = [];

  if (qidoSeries && qidoSeries.length) {
    qidoSeries.forEach(qidoSeries =>
      series.push({
        studyInstanceUid: getString(qidoSeries['0020000D']),
        seriesInstanceUid: getString(qidoSeries['0020000E']),
        modality: getString(qidoSeries['00080060']),
        seriesNumber: getString(qidoSeries['00200011']),
        seriesDate: utils.formatDate(getString(qidoSeries['00080021'])),
        numSeriesInstances: Number(getString(qidoSeries['00201209'])),
        description: getString(qidoSeries['0008103E']),
      })
    );
  }

  sortStudySeries(series);

  return series;
}

/**
 *
 * @param {object} config - Client similar to what's provided by `dicomweb-client` library
 * @param {function} dicomWebClient.searchForStudies -
 * @param {string} [studyInstanceUid]
 * @param {string} [seriesInstanceUid]
 * @param {string} [queryParamaters]
 * @returns {Promise<results>} - Promise that resolves results
 */
async function allStudies(config, studyInstanceUid, seriesInstanceUid, queryParameters) {
  let url = `${config.url}/studies`;
  // try {
  //   const response = await fetch(url);
  //   if (!response.ok) {
  //     throw new Error(`HTTP error! status: ${response.status}`);
  //   }
  //   const data = await response.json();
  //   console.log(data);
  // } catch (error) {
  //   console.error(`Error: ${error.message}`);
  // }

  try {
    const response = await axios.get(url);
    return response.data;
  } catch(error) {
    if (error.response) {
      // 服务器响应了错误状态码
      console.error(`Server responded with status code: ${error.response.status}`);
    } else if (error.request) {
      // 请求已发出，但未收到响应
      console.error('No response received from the server');
    } else {
      // 在设置请求时发生了一些问题
      console.error(`Error: ${error.message}`);
    }
  }
}

/**
 *
 * @param {string} studyInstanceUID - ID of study to return a list of series for
 * @returns {Promise} - Resolves SeriesMetadata[] in study
 */
async function seriesInStudy(config, studyInstanceUID) {
  // Series Description
  // Already included?
  const commaSeparatedFields = ['0008103E', '00080021'].join(',');
  const queryParams = {
    includefield: commaSeparatedFields,
  };

  let url = `${config.url}/studies/${studyInstanceUID}/series`;
  try {
    const response = await axios.get(url, queryParams);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

async function retrieveStudyMetadata(config, studyInstanceUID) {
  const queryParams = {
    "StudyInstanceUID": studyInstanceUID,
  };

  let url = `${config.url}/studies/${studyInstanceUID}/metadata`;
  try {
    const response = await axios.get(url, queryParams);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Produces a QIDO URL given server details and a set of specified search filter
 * items
 *
 * @param filter
 * @param serverSupportsQIDOIncludeField
 * @returns {string} The URL with encoded filter query data
 */
function mapParams(params, options = {}) {
  if (!params) {
    return;
  }
  const commaSeparatedFields = [
    '00081030', // Study Description
    '00080060', // Modality
    // Add more fields here if you want them in the result
  ].join(',');

  const { supportsWildcard } = options;
  const withWildcard = value => {
    return supportsWildcard && value ? `*${value}*` : value;
  };

  const parameters = {
    // Named
    PatientName: withWildcard(params.patientName),
    //PatientID: withWildcard(params.patientId),
    '00100020': withWildcard(params.patientId), // Temporarily to make the tests pass with dicomweb-server.. Apparently it's broken?
    AccessionNumber: withWildcard(params.accessionNumber),
    StudyDescription: withWildcard(params.studyDescription),
    ModalitiesInStudy: params.modalitiesInStudy,
    // Other
    limit: params.limit || 101,
    offset: params.offset || 0,
    fuzzymatching: options.supportsFuzzyMatching === true,
    includefield: commaSeparatedFields, // serverSupportsQIDOIncludeField ? commaSeparatedFields : 'all',
  };

  // build the StudyDate range parameter
  if (params.startDate && params.endDate) {
    parameters.StudyDate = `${params.startDate}-${params.endDate}`;
  } else if (params.startDate) {
    const today = new Date();
    const DD = String(today.getDate()).padStart(2, '0');
    const MM = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    const YYYY = today.getFullYear();
    const todayStr = `${YYYY}${MM}${DD}`;

    parameters.StudyDate = `${params.startDate}-${todayStr}`;
  } else if (params.endDate) {
    const oldDateStr = `19700102`;

    parameters.StudyDate = `${oldDateStr}-${params.endDate}`;
  }

  // Build the StudyInstanceUID parameter
  if (params.studyInstanceUid) {
    let studyUids = params.studyInstanceUid;
    studyUids = Array.isArray(studyUids) ? studyUids.join() : studyUids;
    studyUids = studyUids.replace(/[^0-9.]+/g, '\\');
    parameters.StudyInstanceUID = studyUids;
  }

  // Clean query params of undefined values.
  const final = {};
  Object.keys(parameters).forEach(key => {
    if (parameters[key] !== undefined && parameters[key] !== '') {
      final[key] = parameters[key];
    }
  });

  return final;
}

export { allStudies, processResults, processSeriesResults, seriesInStudy, retrieveStudyMetadata, mapParams };
