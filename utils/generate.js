// utils/generate.js
module.exports = () => {
  const charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  const segment = () => {
    let part = "";
    for (let i = 0; i < 5; i++) {
      part += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return part;
  };

  return `maous-${segment()}-${segment()}-${segment()}-${segment()}`;
};
