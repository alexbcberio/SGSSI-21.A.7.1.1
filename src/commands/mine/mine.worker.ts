import { DigestString, MineOptions } from "./mine.interfaces";
import {
  defaultIncrementValue,
  defaultStartHexNumber,
  maxHexChars,
  maxHexNumValue,
  maxMs,
} from "./mine.config";

import { getTextDigest } from "../../helper/digest";

async function mineLoop(
  content: string,
  options: MineOptions
): Promise<DigestString> {
  const { algorithm, startNumber } = options;

  const signature = options.signature || "";
  const incrementNumber = options.incrementNumber || defaultIncrementValue;
  let hexNum = startNumber || defaultStartHexNumber;
  let currentDigest: string;

  const optimal: DigestString = {
    digest: "",
    string: "",
  };

  const startTimestamp = Date.now();
  do {
    // eslint-disable-next-line no-magic-numbers
    let hexNumString = hexNum.toString(16).toLowerCase();

    hexNum += incrementNumber;

    if (hexNumString.length < maxHexChars) {
      hexNumString =
        "0".repeat(maxHexChars - hexNumString.length) + hexNumString;
    }
    hexNumString += signature;

    const contentWithHex = content + hexNumString;

    currentDigest = await getTextDigest(contentWithHex, algorithm);

    if (!optimal.string || currentDigest < optimal.digest) {
      optimal.digest = currentDigest;
      optimal.string = hexNumString;
    }
  } while (Date.now() - startTimestamp <= maxMs && hexNum < maxHexNumValue);

  if (hexNum >= maxHexNumValue) {
    console.log("Worker overflowed");
  }

  return optimal;
}

export { mineLoop };
