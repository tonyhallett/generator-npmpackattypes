# generator-npmpackattypes
yeoman generator for npm pack and movement of folders to node_modules/@types

Why ?

You are writing definition files that you do not want to add to definitely typed or cannot but want to store these files in github/npm.

Usage 

Example:  
I want type checking for yeoman and currently there is yeoman-generator on definitely typed that is missing some properties and types are not correct.
In addition there are no definition files for yeoman-helpers and yeoman-environment.

a) Publish to github/npm with folder structure :
root
 package.json
 yeoman-generator
   index.d.ts
 yeoman-test
   index.d.ts
   run-context.d.ts
 yeoman-environment
   index.d.ts

b) npm install -g yo
c) npm install -g generator-npmpackattypes
d) determine the argument for this generator depending on where your typescript definition folders can be found
This generator calls npm pack with this argument and as such works with the definition of a package - see https://docs.npmjs.com/cli/install
for this example, the package is on github and npm so any of the following could be used:

https://github.com/tonyhallett/yeoman-ts-definitions/tarball/master ( definition c )
git://github.com/tonyhallett/yeoman-ts-definitions.git#master ( definition g )
yeoman-ts-definitions ( definition f )

e) npm yo npmpackattypes argumentFromD)









