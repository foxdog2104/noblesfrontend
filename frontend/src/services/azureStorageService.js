const account = process.env.REACT_APP_AZURE_STORAGE_ACCOUNT;
const sasToken = process.env.REACT_APP_AZURE_SAS_TOKEN;
const containerName =
  process.env.REACT_APP_AZURE_STORAGE_CONTAINER || 'scout-submissions';

export const uploadToAzureBlob = async (file, folder) => {
  if (!file) return null;

  if (!account || !sasToken) {
    throw new Error('Azure Storage configuration is missing.');
  }

  const blobName = `${folder}/${Date.now()}-${encodeURIComponent(file.name)}`;

  const url =
    `https://${account}.blob.core.windows.net/` +
    `${containerName}/${blobName}?${sasToken}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Azure upload failed (${response.status}): ${text}`);
  }

  return `https://${account}.blob.core.windows.net/${containerName}/${blobName}`;
};
