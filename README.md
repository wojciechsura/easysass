# EasySass README

It's about time someone created a standalone extension to compile SASS/SCSS files in Visual Studio Code. Don't you think?

## Features

Automatically compiles SASS/SCSS files to .css and .min.css upon saving. You may also quickly compile all SCSS/SASS files in your project.

![Demo](demo.gif)

## Commands

* `Compile all SCSS/SASS files in the project` - compiles all sass and scss files in selected folder

## Extension Settings

This extension contributes the following settings:

* `easysass.compileAfterSave`: enable or disable automatic compilation after saving
* `easysass.formats`: specify extensions and formats for exported files.
* `easysass.targetDir`: define target directory for generated files.
* `easysass.excludeRegex`: exclude files from compilation with regular expression

## Release Notes

### [0.0.5]
- Fixed bug with global paths in import directive
- Added support for tilde character in import directive (will resolve to currently opened folder in VS Code)

**Enjoy!**