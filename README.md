# SGSSI-21 A.7.1.1

Activity for SGSSI university course.

## Description of the tool

This tool can create sha256 digests of files and text. It also can create a copy
of a file appending its digest on the last line and mine a block.

### Block mining

During the course we are creating a blockchain with all the sha256 digests of
the files we are delivering.

This tool can be used to mine a block, this searches for a 8 hexadecimal string
that creates a digest with a predefined number of zeroes.

## Usage

Precompiled packages are available inside the `bin` directory, run them from
the console with no arguments to get the help of usage.

## Running and packaging

**Note:** In order to get the maximum performance precompiled packages should be used as
they are compiled with byte code and they will perform much better than running
from the source code.

---

To run the software or build it you need NodeJS, it is also recommended to use
yarn to manage the project dependencies.

1. Clone the repository onto your system
2. Run `yarn` to install all the dependencies.

### Running from source

The project is build on TypeScript, you can run it without compiling it using
the "start" script `yarn start <args>`.

### Compiling

To compile the code use the "build" script `yarn build`. You can also use the
"watch" script to hot-compile it `yarn watch`.

### Packaging

To compile the code into binaries use the "package" script `yarn package`. The
script compiles the TypeScript code into JavaScript and builds it. The binaries
are saved in the `bin` directory.
