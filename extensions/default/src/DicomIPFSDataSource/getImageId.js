

/**
 * Obtain an imageId for Cornerstone from an image instance
 * /Viewers/extensions/cornerstone/node_modules/@cornerstonejs/dicom-image-loader/dist/esm/imageLoader/wadors/register.js
 * registerImageLoader('ipfs', loadImage);
 * ipfs:http://127.0.0.1:8080/ipfs/QmY    single frame
 * ipfs:http://127.0.0.1:8080/ipfs/QmY/frames/1   multi frame (QmY/frames/2, QmY/frames/3 ...)
 *             metadataProvider.addImageIdToUIDs(imageId, {
 *             StudyInstanceUID,
 *             SeriesInstanceUID: instance.SeriesInstanceUID,
 *             SOPInstanceUID: instance.SOPInstanceUID,
 *          });
 *  metadataProvider.getUIDsFromImageID
 *
 * @param instance
 * @param frame
 * @param thumbnail
 * @returns {string} The imageId to be used by Cornerstone
 */
export default function getImageId({ instance, frame, config, thumbnail = false }) {
  if (!instance) {
    return;
  }
  let imageId = 'wadors:http://127.0.0.1:8080/ipfs/'
  const value = instance['PixelData'];
  if (value && value.BulkDataURI) {
    imageId += value.BulkDataURI;
  }
  if (frame !== undefined) {
    frame = frame || 1;
    imageId += '/frames/' + frame;
  }

  return imageId;
}
