# SGSSI-21 A.7.1.1

Activity for SGSSI university course.

## Description of the tool

This is a helper tool for cryptographic works done on the course. Some of the
use cases of the tool:

- Get a hash of a text or file.
- Create a copy of a file with its hash appended.
- Search a digest with a predefined number of zeroes.
- Mine a block

### Block mining

During the course we are creating a blockchain with all the sha256 digests of
the files we are delivering.

This tool can be used to mine a block, this searches for a 8 hexadecimal string
that creates a digest with a predefined number of zeroes.

## Usage

Precompiled packages are available on the [releases page](https://github.com/alexbcberio/sgssi-crypto/releases)
of the repository.

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
the "start" script `yarn start ...`.

### Compiling

To compile the code use the "build" script `yarn build`. You can also use the
"watch" script to hot-compile it `yarn watch`.

### Packaging

To compile the code into binaries use the "package" script `yarn package`. The
script compiles the TypeScript code into JavaScript and builds it. The binaries
are saved in the `bin` directory.
