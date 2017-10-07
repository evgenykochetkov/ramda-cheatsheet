const path = require('path');
const fs = require('fs');
const R = require('ramda');
const jsdoc = require('jsdoc-api');
const handlebars = require('handlebars');

const getCategories = R.pipe(
  R.objOf('source'),
  jsdoc.explainSync,
  R.reject(R.anyPass([
    R.prop('undocumented'),
    R.propEq('access', 'private'),
    R.propEq('scope', 'inner'),
    R.propEq('kind', 'package'),
  ])),
  R.groupBy(R.pipe(
    R.prop('tags'),
    // NOTE: There are some functions with multiple @category tags(addIndex, bind, project).
    // But in official docs they have only single categoty, so let's not bother with this.
    R.find(R.propEq('title', 'category')),
    R.prop('value'),
  )),
  R.map(R.pipe(
    R.map(R.pick(['name', 'description'])),
    R.sortBy(R.pipe(R.prop('name'), R.toLower)),
  )),
);

const ramdaVersion = require('./node_modules/ramda/package.json').version;
const ramdaSource = fs.readFileSync(path.resolve(__dirname, './node_modules/ramda/dist/ramda.js'), 'utf8');
const templateSource = fs.readFileSync(path.resolve(__dirname, './index.html.handlebars'), 'utf8');

const template = handlebars.compile(templateSource);
const categories = getCategories(ramdaSource);

const rendered = template({ version: ramdaVersion, categories });
fs.writeFileSync(path.resolve(__dirname, './dist/index.html'), rendered, 'utf8');
