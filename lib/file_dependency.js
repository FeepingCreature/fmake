const assert = require('assert');
const fs = require('fs');
const { Dependency } = require('./dependency.js');

class FileDependency extends Dependency
{
    constructor(file)
    {
        if (fs.existsSync(file))
        {
            let stats = fs.statSync(file);

            super(stats.mtime);
        }
        else
        {
            super(Dependency.UnknownAge);
        }
        this.file = file;
    }

    toString()
    {
        let violation = this.violated?`, violated due to ${this.newestDependency}`:"";

        return `FileDependency<${this.file}, ${this.age}${violation}>`;
    }

    build(action)
    {
        if (this.violated)
        {
            let backdate = new Date();

            action();

            assert(fs.existsSync(this.file), `${this.file} did not exist after its build action`);

            let stats = fs.statSync(this.file);

            if (this.newestDependency == Dependency.UnknownAge)
            {
                this.age = stats.mtime;
            }
            else
            {
                // Backdate the modified date of the file to the age when the
                // build command was started, so that in case the dependency has
                // changed after the build started, a rerun will notice and rebuild it.
                let fd = fs.openSync(this.file, 'r');

                fs.futimesSync(fd, stats.atime, backdate);
                fs.closeSync(fd);

                this.age = backdate;
            }

            assert(!this.violated, `${this}: dependency still violated after build`);

            this.complete = true;
        }

        return this;
    }
}

exports.FileDependency = FileDependency;
