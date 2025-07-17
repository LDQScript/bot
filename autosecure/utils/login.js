const getLiveData = require("./secure/getLiveData");
const axios = require("axios");

// ✅ Hàm giới hạn chiều dài cookie để tránh lỗi Header overflow
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

  // ✅ Lấy dữ liệu PPFT, cookies cần thiết từ trang đăng nhập
  const data = await getLiveData();

  try {
    // ✅ Trường hợp đăng nhập bằng Email + Security ID + OTP Code
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

    // ✅ Trường hợp đăng nhập bằng Recovery SLK
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

    // ✅ Trích xuất giá trị __Host-MSAAUTH từ phản hồi
    loginData?.headers?.["set-cookie"]?.forEach((cookie) => {
      const [name, ...values] = cookie.split("=");
      if (name === "__Host-MSAAUTH") {
        host = values.join("=").split(";").shift();
      }
    });

    // ✅ Gửi polish cookie để hoàn tất đăng nhập (tránh lỗi Header overflow)
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

  } catch (err) {
    console.error("❌ Login failed:", err.message);
    return null;
  }
};