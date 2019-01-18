'use strict';

const { print, file, task, fmake, sh } = require('fmake');

function object(objectFile, sourceFile, headerFiles)
{
    return file(objectFile)
        .depend(file(sourceFile))
        .depend(headerFiles.map(headerFile => file(headerFile)))
        .build(() => {
            sh(`gcc -c -o ${objectFile} ${sourceFile}`);
        });
}

function link(binaryFile, objectFiles, headerFiles)
{
    return file(binaryFile)
        .depend(objectFiles.map(objectFile => {
            let sourceFile = objectFile.replace(/.o$/g, '.c');

            return object(objectFile, sourceFile, headerFiles);
        }))
        .build(() => {
            sh(`gcc -o ${binaryFile} ${objectFiles.join(" ")}`);
        });
}

task('build', 'Build the main binary.', () => {
    print.green("Build 'test'");

    link(
        'test',
        ['test.o', 'test2.o'],
        ['test2.h']);
});

fmake('build');
