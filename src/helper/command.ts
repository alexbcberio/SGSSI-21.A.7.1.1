import { Argument, Option } from "commander";

import { defaultAlgorithm } from "../config";

const algorithmOption = new Option(
  "-a, --algorithm <algorithm>",
  "Algorithm function name"
);
algorithmOption.default(defaultAlgorithm);

const fileArgument = new Argument("<file>", "Relative path to the file");

export { algorithmOption, fileArgument };
