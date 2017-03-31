var vscode = require('vscode');
var fs = require('fs');
var replaceExt = require('replace-ext');
var compileSass = require('./lib/sass.node.spk.js');
var pathModule = require('path');

var CompileSassExtension = function() {

    // Private fields ---------------------------------------------------------

    var outputChannel;

    // Constructor ------------------------------------------------------------

    outputChannel = vscode.window.createOutputChannel("EasySass");

    // Private functions ------------------------------------------------------

    // Processes result of css file generation.
    function handleResult(outputPath, result) {

        if (result.status == 0) {

            try {                
                fs.writeFileSync(outputPath, result.text, { flags: "w" });
            } catch (e) {
                outputChannel.appendLine("Failed to generate CSS: " + e);
            }

            outputChannel.appendLine("Successfully generated CSS: " + outputPath);
        }
        else {

            if (result.formatted) {
                outputChannel.appendLine(result.formatted);
            } else if (result.message) {
                outputChannel.appendLine(result.message);
            } else {
                outputChannel.appendLine("Failed to generate CSS from SASS, but the error is unknown.");
            }

            vscode.window.showErrorMessage('EasySass: could not generate CSS file. See Output panel for details.');
            outputChannel.show(true);
        }
    }

    // Generates target path for scss/sass file basing on its path
    // and easysass.targetDir setting. If the setting specifies
    // relative path, current workspace folder is used as root.
    function generateTargetPath(path) {

        var configuration = vscode.workspace.getConfiguration('easysass');

        var targetDir = pathModule.dirname(path);
        var filename = pathModule.basename(path);
        if (configuration.targetDir != undefined && configuration.targetDir.length > 0) {

            if (pathModule.isAbsolute(configuration.targetDir)) {
                targetDir = configuration.targetDir;
            } else {
                var folder = vscode.workspace.rootPath;
                if (folder == undefined) {
                    throw "Path specified in easysass.targetDir is relative, but there is no open folder in VS Code!";
                }

                targetDir = pathModule.join(folder, configuration.targetDir);
            }
        }

        return {
            targetDir: targetDir,
            filename: filename
        };
    }

    // Compiles single scss/sass file.
    function compileFile(path) {

        outputChannel.clear();

        var configuration = vscode.workspace.getConfiguration('easysass');

        var outputPathData = generateTargetPath(path);

        // Iterate through formats from configuration

        if (configuration.formats.length == 0) {
            throw "No formats are specified. Define easysass.formats setting (or remove to use defaults)";
        }

        for (var i = 0; i < configuration.formats.length; i++) {

            var format = configuration.formats[i];
        
            // Evaluate style for sass generator
            var style;
            switch (format.format) {
                case "nested":
                    style = compileSass.Sass.style.nested;
                    break;
                case "compact":
                    style = compileSass.Sass.style.compact;
                    break;
                case "expanded":
                    style = compileSass.Sass.style.expanded;
                    break;
                case "compressed":
                    style = compileSass.Sass.style.compressed;
                    break;
                default:
                    throw "Invalid format specified for easysass.formats[" + i + "]. Look at setting's hint for available formats.";
            }

            // Check target extension
            if (format.extension == undefined || format.extension.length == 0)
                throw "No extension specified for easysass.formats[" + i + "].";

            var targetPath = pathModule.join(outputPathData.targetDir, replaceExt(outputPathData.filename, format.extension));

            // Using closure to properly pass local variables to callback
            (function(path_, targetPath_, style_) {

                // Run the compilation process
                compileSass(path_, { style: style_ }, function(result) {
                                        
                    handleResult(targetPath_, result);
                });

            })(path, targetPath, style);
        }        
    }

    // Checks, if the file matches the exclude regular expression
    function checkExclude(filename) {
        
        var configuration = vscode.workspace.getConfiguration('easysass');
        return configuration.excludeRegex.length > 0 && new RegExp(configuration.excludeRegex).test(filename);
    }

    // Public -----------------------------------------------------------------

    return {

        OnSave: function (document) {

            try {

                var configuration = vscode.workspace.getConfiguration('easysass');
                var filename = pathModule.basename(document.fileName);

                if (configuration.compileAfterSave) {
                    
                    if (document.fileName.toLowerCase().endsWith('.scss') ||
                        document.fileName.toLowerCase().endsWith('.sass')) {

                        if (!checkExclude(filename)) {
                            compileFile(document.fileName);                
                        } else {
                            outputChannel.appendLine("File " + document.fileName + " is excluded from building to CSS. Check easysass.excludeRegex setting.");
                        }
                    }
                }

            }
            catch (e) {
                vscode.window.showErrorMessage('EasySass: could not generate CSS file: ' + e);
            }
        },
        CompileAll: function() {

            var configuration = vscode.workspace.getConfiguration('easysass');

            vscode.workspace.findFiles("**/*.s[ac]ss").then(function(files) {

                try {
                    for (var i = 0; i < files.length; i++) {
                        
                        var filename = pathModule.basename(files[i].fsPath);
                        if (checkExclude(filename)) {

                            outputChannel.appendLine("File " + filename + " is excluded from building to CSS. Check easysass.excludeRegex setting.");
                            continue;
                        }
                        
                        compileFile(files[i].fsPath);
                    }
                }
                catch (e) {
                    vscode.window.showErrorMessage('EasySass: could not generate CSS file: ' + e);
                }                
            });            
        }
    };
};

function activate(context) {

    var extension = CompileSassExtension();

    vscode.workspace.onDidSaveTextDocument(function(document) { extension.OnSave(document) });

    var disposable = vscode.commands.registerCommand('easysass.compileAll', function() {
        extension.CompileAll();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;
