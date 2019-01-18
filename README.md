# fmake

fmake is a functional make system. It's a build system - like GNU Make - that uses functions, rather than rules,
as its elements. Because of this, it is exceedingly simple.

Note that fmake is not intended for Javascript projects. There are many other build systems optimized for building
Javascript packages. The goal of fmake is to use Javascript to automate traditional build workflows for languages
such as C, C++ or D.

## Premise

The core functionality of fmake is dependency tracking. Conceptually, a build step consists of a generated file
that depends on several other files and an action that should be taken when the file is older than some of the
dependencies, or does not exist.
For instance, when an object file is compiled using `gcc bla.c -o bla.o`, then `bla.o` depends on `bla.c` and
should be rebuilt if `bla.c` is newer than `bla.o`.

## Helpers

fmake exports a small set of utility functions.

- `print(string)` prints the string to the console followed by a newline.
- `print.<color>(string)` prints a colored message.
- `sh(<shell command>)` executes a shell command. If '--verbose' is set, the command is logged.
- `run(<executable>, <arguments>)` is like `sh`, but the command and its arguments are specified directly, rather than
using the shell.

## How to use

By convention, define your rules in a file called `build.js`.

fmake treats your project in terms of dependencies.
Whereas `Makefile`s define dependency rules based on the filename, fmake uses Javascript functions.
For instance, to build an object file from a corresponding source file, you would write a function
that takes source and object filenames as parameters and returns a `Dependency` object. Note that all functions
of `Dependency` are chainable.

Dependencies have the property of being 'violated'. If a dependency is violated, it must be rebuilt using
the build action defined by `build()`. After the build action has been executed, the dependency must
no longer be violated.

At its simplest, you can define a dependency of a file on a Javascript function as such:

```
    file('filename').build(() => {
        sh('touch filename');
    });
```

`file(filename)` returns a dependency on a file. It is violated if the file does not exist.

IMPORTANT: Calling `file(filename)` does not "register" a dependency on `filename`! The dependency is evaluated
purely in the `file().build()` call, and has no effects on later calls.

Further dependencies can be added using the chainable `depend()` function.
When a dependency is made to depend on another dependency, it is violated if the other dependency was violated.
(But see "Age Adjustment below".)

For instance, an object file that is built from a source file must declare the dependency on the source file,
so that it is rebuilt when the source file is changed.

```
    file('file.o')
        .depend(file('file.c'))
        .build(() => {
            sh(`gcc -c -o file.o file.c`);
        });
```

### Composing dependencies

You should never depend on generated files. Instead, your build rules should be functions that return dependencies.

```
    function compile(object, source) {
        return file(object)
            .depend(file(source))
            .build(() => {
                sh(`gcc -c -o ${object} ${source}`);
            });
    }
```

Then you can, for instance, write a `link()` function that depends on `compile()` calls.

### Age Adjustment

There is a common issue with modification date based dependency systems.

Consider a slow build step that produces `file.o` from `file.cpp`. If you save changes to `file.cpp` after
the build step has begun, then the `file.o` will have a modification date that is later than `file.cpp`,
and so will not be rebuilt. This happens even though the modification date of `file.cpp` is newer than the
version that the compiler has read to produce `file.o`!

In this way, builds can become corrupted.

To sidestep this problem, fmake will **backdate** generated files to the time when the build action was **started**.

## Tasks

For convenience (and similarity to make), fmake also allows you to define "tasks". A task is a function that may
be invoked sequentially from the command line.

```
    task('build', 'Build the binary.', () => {
        /* invoke rule to produce binary here */
    });
```

Note that tasks cannot be invoked explicitly from within fmake. That's because you are supposed to define them
as functions to be called - the `task` helper is solely meant for commandline use.

To process tasks and their associated command line arguments, call `fmake();` at the end of your `build.js`.
If a parameter is passed to `fmake()`, it is used as the default task to run when no tasks are specified.

Note that tasks are entirely optional. Nothing stops you from calling build rules directly.

## License
fmake is released under the terms of the [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).

To reduce ambiguity: as the licensor, I **do not** consider build scripts that declare dependencies
with fmake to be derivative works under the GPL.
