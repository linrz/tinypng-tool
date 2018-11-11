function getReadableSize(bytes) {
  const array = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, Math.floor(index))).toFixed(2)} ${array[index]}`;
}

function isImageExt(name) {
  return name.match(/.(png|jpg|jpeg|PNG|JPG|JPEG)$/);
}

module.exports = {
  getReadableSize,
  isImageExt
};