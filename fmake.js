'use strict';

const fs = require('fs');
const assert = require('assert');
const { execFileSync, execSync } = require('child_process');
const colors = require('ansi-colors');
const { Dependency } = require('./lib/dependency.js');
const { FileDependency } = require('./lib/file_dependency.js');

let configuration = {
    "tasks": new Map(),
    "verbose": false
};

function print(string)
{
    process.stdout.write(string + '\n');
}

print.black   = string => print(colors.blackBright  (string));
print.red     = string => print(colors.redBright    (string));
print.green   = string => print(colors.greenBright  (string));
print.yellow  = string => print(colors.yellowBright (string));
print.blue    = string => print(colors.blueBright   (string));
print.magenta = string => print(colors.magentaBright(string));
print.cyan    = string => print(colors.cyanBright   (string));
print.white   = string => print(colors.whiteBright  (string));

function fail(string)
{
    process.stderr.write(string + '\n');
    process.exit(1);
}

function run(file, args = [])
{
    if (configuration.verbose)
    {
        print(`> ${file} ${args.join(" ")}`);
    }

    execFileSync(file, args);
}

function sh(cmd, options = null)
{
    if (configuration.verbose)
    {
        print(`> ${cmd}`);
    }

    if (options)
    {
        execSync(cmd, options);
    }
    else
    {
        execSync(cmd);
    }
}

function file(filename)
{
    return new FileDependency(filename);
}

class Task
{
    constructor(name, description, action)
    {
        this.name = name;
        this.description = description;
        this.action = action;
    }
}

function task(name, ...args)
{
    let description = null;
    let action = null;

    if (args.length == 1)
    {
        action = args[0];
    }
    else if (args.length == 2)
    {
        description = args[0];
        action = args[1];
    }
    else
    {
        throw new TypeError('Expected task(name, action) or task(name, description, action)');
    }

    assert(!configuration.tasks.has(name), `Task '${name}' is already defined`);

    configuration.tasks.set(name, new Task(name, description, action));
}

function fmake(default_task = null)
{
    let runTasks = [];
    let argv = require('yargs')
        .strict()
        .describe('T', 'list defined tasks with their description')
        .alias('T', 'tasks')
        .describe('A', 'list all defined tasks, even without description')
        .alias('A', 'all')
        .describe('v', 'Verbosely log shell commands before they are executed')
        .alias('v', 'verbose')
        .help('h')
        .alias('h', 'help')
        .argv;

    configuration.verbose = argv.verbose;

    let args = argv._;

    if (default_task && args.length == 0)
    {
        args = [default_task]
    }

    for (let arg of args)
    {
        // TODO [] parsing
        if (!configuration.tasks.has(arg))
        {
            fail(`No such task: '${arg}'`);
        }

        runTasks.push(configuration.tasks.get(arg));
    }

    if (argv.tasks)
    {
        print('Tasks:');
        print('');

        for (let name of [...configuration.tasks.keys()].sort())
        {
            let task = configuration.tasks.get(name);

            if (task.description || argv.all)
            {
                if (task.description)
                {
                    print(`- ${task.name}\t: ${task.description}`);
                }
                else
                {
                    print(`- ${task.name}`);
                }
            }
        }

        print('');
    }

    for (let task of runTasks)
    {
        task.action();
    }
}

exports.print = print;
exports.run = run;
exports.sh = sh;
exports.file = file;
exports.task = task;
exports.fmake = fmake;
