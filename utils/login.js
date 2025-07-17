const getLiveData = require("./secure/getLiveData");
const axios = require("axios");

// ✅ Hàm giới hạn chiều dài cookie
function safeCookie(cookie, limit = 4000) {
  if (cookie.length > limit) {
    console.warn("⚠️ Cookie quá dài, đã cắt xuống", limit, "ký tự");
    return cookie.slice(0, limit);
  }
  return cookie;
}

module.exports = async (obj) => {
  let host = null;
  let loginData = null;
  const data = await getLiveData();

  // ✅ OTP + ID login
  if (obj.email && obj.id && obj.code) {
    loginData = await axios({
      method: "POST",
      url: `https://login.live.com/ppsecure/post.srf`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: data.cookies
      },
      data: `login=${obj.email}&loginfmt=${obj.email}&type=27&SentProofIDE=${obj.id}&otc=${obj.code}&PPFT=${data.ppft}`,
    });
  }

  // ✅ Recovery SLK login
  if (obj.slk && obj.email) {
    loginData = await axios({
      method: "POST",
      url: `https://login.live.com/ppsecure/post.srf`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: data.cookies
      },
      data: `login=${obj.email}&loginfmt=${obj.email}&slk=${obj.slk}&psRNGCSLK=${obj.slk}&type=21&PPFT=${data.ppft}`,
    });
  }

  // ✅ Lấy MSAAUTH cookie từ phản hồi
  loginData.headers["set-cookie"]?.forEach((cookie) => {
    const [name, ...values] = cookie.split("=");
    if (name === "__Host-MSAAUTH") {
      host = values.join("=").split(";").shift();
    }
  });

  // ✅ Gửi request polish bằng cookie (có kiểm soát độ dài)
  if (host) {
    await axios({
      method: "POST",
      url: "https://login.live.com/ppsecure/post.srf?uaid=c81c108c53b249209366161b56d8122b&pid=0&opid=C0104E8D0A7E348F&route=C532_SN1",
      headers: {
        Cookie: `__Host-MSAAUTH=${safeCookie(host)}`
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400,
    });
  }

  return host || null;
};
