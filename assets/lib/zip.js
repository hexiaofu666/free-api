/* 极简 ZIP 打包器（store 不压缩模式）——词海工具箱
 * zipMake([{name:"a.png", data:Uint8Array}, ...]) -> Blob
 */
(function (g) {
  var CRC_T = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function u16(v) { return [v & 255, (v >>> 8) & 255]; }
  function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
  function zipMake(files) {
    var locals = [], centrals = [], offset = 0;
    var dosTime = u16(0), dosDate = u16(0x5821); // 固定日期简化
    files.forEach(function (f) {
      var nameBytes = new TextEncoder().encode(f.name);
      var data = f.data, crc = crc32(data);
      var head = [0x50, 0x4B, 0x03, 0x04].concat(u16(20), u16(0x800), u16(0), dosTime, dosDate,
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0));
      var lh = head.concat(Array.prototype.slice.call(nameBytes));
      locals.push(lh, Array.prototype.slice.call(data));
      var ch = [0x50, 0x4B, 0x01, 0x02].concat(u16(20), u16(20), u16(0x800), u16(0), dosTime, dosDate,
        u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset));
      centrals.push(ch.concat(Array.prototype.slice.call(nameBytes)));
      offset += lh.length + data.length;
    });
    var cdSize = centrals.reduce(function (s, c) { return s + c.length; }, 0);
    var end = [0x50, 0x4B, 0x05, 0x06].concat(u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdSize), u32(offset), u16(0));
    var all = locals.concat(centrals, [end]).reduce(function (s, p) { return s.concat(p); }, []);
    return new Blob([new Uint8Array(all)], { type: "application/zip" });
  }
  g.zipMake = zipMake;
  g.crc32 = crc32;
})(window);
