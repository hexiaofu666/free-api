/* 公共哈希库：MD5（纯 JS，输入 Uint8Array，输出小写十六进制） */
function md5hex(u8) {
  const S=[7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K=new Array(64);
  for (let i=0;i<64;i++) K[i]=Math.floor(Math.abs(Math.sin(i+1))*4294967296);
  const bitLen=u8.length*8;
  const newLen=(((u8.length+8)>>6)+1)*64;
  const m=new Uint8Array(newLen); m.set(u8); m[u8.length]=0x80;
  const dv=new DataView(m.buffer);
  dv.setUint32(newLen-8, bitLen>>>0, true);
  dv.setUint32(newLen-4, Math.floor(bitLen/4294967296), true);
  let a0=0x67452301,b0=0xefcdab89,c0=0x98badcfe,d0=0x10325476;
  for (let off=0; off<newLen; off+=64) {
    const O=[]; for (let j=0;j<16;j++) O[j]=dv.getUint32(off+j*4,true);
    let A=a0,B=b0,C=c0,D=d0;
    for (let i=0;i<64;i++) {
      let F,g;
      if (i<16){F=(B&C)|(~B&D); g=i;}
      else if (i<32){F=(D&B)|(~D&C); g=(5*i+1)%16;}
      else if (i<48){F=B^C^D; g=(3*i+5)%16;}
      else {F=C^(B|~D); g=(7*i)%16;}
      F=(F+A+K[i]+O[g])|0;
      A=D; D=C; C=B;
      B=(B+((F<<S[i])|(F>>>(32-S[i]))))|0;
    }
    a0=(a0+A)|0; b0=(b0+B)|0; c0=(c0+C)|0; d0=(d0+D)|0;
  }
  const h=n=>{let s='';for(let i=0;i<4;i++)s+=((n>>>(i*8))&255).toString(16).padStart(2,'0');return s;};
  return h(a0)+h(b0)+h(c0)+h(d0);
}
/* latin1 字符串（每字符取低 8 位）转字节并求 MD5 —— 用于二进制安全的哈希 */
function md5latin(str) {
  const u8=new Uint8Array(str.length);
  for (let i=0;i<str.length;i++) u8[i]=str.charCodeAt(i)&0xff;
  return md5hex(u8);
}
/* latin1 十六进制串转字符 */
function hex2latin(hex) {
  let s='';
  for (let i=0;i<hex.length;i+=2) s+=String.fromCharCode(parseInt(hex.substr(i,2),16));
  return s;
}
