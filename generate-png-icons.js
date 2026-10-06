// Pure Node.js script using built-in zlib to create PNG icons
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height) {
  // Simple PNG header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression method
  ihdr.writeUInt8(0, 11); // filter method
  ihdr.writeUInt8(0, 12); // interlace method

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // CRC calculation
    const toCrc = Buffer.concat([typeBuf, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < toCrc.length; i++) {
      crc ^= toCrc[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Create image scanlines: dark blue gradient background with green candlestick bar
  const scanlines = [];
  for (let y = 0; y < height; y++) {
    scanlines.push(0); // filter type: None
    const bgR = Math.floor(14 + (y / height) * 10);
    const bgG = Math.floor(23 + (y / height) * 15);
    const bgB = Math.floor(38 + (y / height) * 20);

    for (let x = 0; x < width; x++) {
      // Draw a sleek candlestick icon in the center
      const inWick = (x >= width * 0.48 && x <= width * 0.52) && (y >= height * 0.2 && y <= height * 0.8);
      const inBody = (x >= width * 0.38 && x <= width * 0.62) && (y >= height * 0.35 && y <= height * 0.65);
      const inTrend = Math.abs(y - (height * 0.75 - Math.sin((x / width) * Math.PI) * (height * 0.4))) < (width * 0.03);

      if (inBody) {
        scanlines.push(16, 185, 129, 255); // Green Candle Body (#10b981)
      } else if (inWick) {
        scanlines.push(16, 185, 129, 255); // Green Wick
      } else if (inTrend) {
        scanlines.push(59, 130, 246, 255); // Blue Trend Line (#3b82f6)
      } else {
        scanlines.push(bgR, bgG, bgB, 255); // Background
      }
    }
  }

  const rawData = Buffer.from(scanlines);
  const compressed = zlib.deflateSync(rawData);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), createPng(192, 192));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), createPng(512, 512));
console.log('Successfully generated icon-192.png and icon-512.png!');
