const assert = require('assert');

class Dependency
{
    constructor(age)
    {
        this.age = age;
        this.newestDependency = age;
        this.complete = !this.violated;

        if (new.target === Dependency) {
            throw new TypeError("Cannot construct Dependency directly");
        }
    }

    toString()
    {
        return `Dependency<${this.age}${this.violated?", violated":""}>`;
    }

    depend(dependency)
    {
        if (Array.isArray(dependency))
        {
            let dependencies = dependency;

            for (let dependency of dependencies)
            {
                this.depend(dependency);
            }
            return this;
        }

        assert(dependency.complete, `Cannot depend on ${dependency}: no 'build()' action defined`);

        if (this.newestDependency == Dependency.UnknownAge)
        {
            this.newestDependency = dependency.age;
        }
        else if (dependency.age != Dependency.UnknownAge)
        {
            this.newestDependency = (this.newestDependency > dependency.age) ? this.newestDependency : dependency.age;
        }
        return this;
    }

    build(action)
    {
        assert(false, "define build() in Dependency subclasses.");
    }

    get violated()
    {
        if (this.age == Dependency.UnknownAge)
        {
            return true;
        }
        if (this.newestDependency == Dependency.UnknownAge)
        {
            return false;
        }

        return this.newestDependency > this.age;
    }
}

Dependency.UnknownAge = new Object();
Dependency.UnknownAge.toString = () => "Unknown Age";

exports.Dependency = Dependency;
