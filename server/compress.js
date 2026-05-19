import { strToU8, compress } from "fflate";

export const compressText = (text) => {
  const input = strToU8(text);

  return new Promise((resolve, reject) => {
    compress(input, { level: 9 }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};