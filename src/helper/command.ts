import { Option } from "commander";
import { defaultAlgorithm } from "../config";

const algorithmOption = new Option(
  "-a, --algorithm <algorithm",
  "Algorithm function name"
);
algorithmOption.default(defaultAlgorithm);

export { algorithmOption };
