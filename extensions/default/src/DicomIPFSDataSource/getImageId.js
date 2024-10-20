

/**
 * Obtain an imageId for Cornerstone from an image instance
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

  let imageId = 'ipfs:'
  const value = instance['PixelData'];
  if (value && value.BulkDataURI) {
    imageId += value.BulkDataURI;
  }
  return imageId;
}
