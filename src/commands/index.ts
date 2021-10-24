import { Command } from "../interfaces/Command";
import { append } from "./append";
import { file } from "./file";
import { mine } from "./mine";
import { text } from "./text";
import { validate } from "./validate";
import { zeroes } from "./zeroes";

const commands: Array<Command> = [text, file, append, zeroes, mine, validate];

export { commands };
