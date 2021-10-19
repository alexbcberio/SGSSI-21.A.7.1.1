# SGSSI-21 A.7.1.1

Activity for SGSSI university.

## Description of the tool

This tool can create sha256 digests of files and text. It also can create a copy
of a file appending its digest on the last line and mine a block.

### Block mining

During the course we are creating a blockchain with all the sha256 digests of
the files we are delivering.

This tool can be used to mine a block, this searches for a 8 hexadecimal string
that creates a digest with a predefined number of zeroes.

## Usage

Precompiled packages are available inside the `dist` directory, run them from
the console with no arguments to get help of usage.

## Run from source/Building

To build from source code you will need NodeJS. The tool was developed with
NodeJs v14.16, older versions might works but have not been tested.

The app does not use any 3rd party dependencies to work, they only are used to
create the executables. In this case you can use the tool with
`node index.js <parameters>`.

If you want to build the app you have to install the dependencies, its
recommended to use yarn. To install it type `npm install -g yarn`, then
install add the dependencies with `yarn`.

Finally use `yarn build`, this will run the build script, you can find the fresh builds inside the `dist` directory.
