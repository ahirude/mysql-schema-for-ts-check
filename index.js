// @ts-check
'use strict';

// usage
//   node index.js mysql://root:passwd@mysql-server.example.com/database [-d destdir] [-j]
//   node index.js mysql://root:passwd@mysql-server.example.com/database/table [-d destdir] [-j]

const pMap = require('p-map');
const mysql = require('mysql2/promise');
const fs = require('fs');
const commandLineArgs = require('command-line-args');

const makeEnumMap = require('./lib/make-enum-map');
const listTableName = require('./lib/list-table-name');
const listColumn = require('./lib/list-column');
const makeColumnInfo = require('./lib/make-column-info');

/** @type {{dir?:string, src:string}} */ // @ts-ignore
const options = commandLineArgs([
  {name: 'dir', alias: 'd', type: String},
  {name: 'src', alias: 's', type: String, defaultOption: true},
  {name: 'jsdoc', alias: 'j', type:String}
]);


/**
 * @param {Object} params
 * @param {mysql.Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 */
const generateTS = async (params) => {
  const enumToTypeMap = await makeEnumMap(params);
  const tableList = await listTableName(params);

  const lines = ['/* tslint:disable */', '', `declare module '${params.database}';`, ''];
  await pMap(tableList, async (table) => {
    lines.push(`export interface ${table} {`);
    const columnList = await listColumn({ ...params, table });
    columnList.forEach(e => lines.push(`  ${makeColumnInfo({ enumToTypeMap, column: e, jsdoc: false })}`));
    lines.push('}\n');
  }, {concurrency: 1});

  if ('dir' in options) { // need to write file
    try { fs.mkdirSync(options.dir); } catch (err) {};  // ignore error
    fs.writeFileSync(`${options.dir}/index.js`, '');
    fs.writeFileSync(`${options.dir}/index.d.ts`, lines.join('\n'));
    console.log(`${options.dir}/index.d.ts, index.js  created`);
  } else {
    console.log(lines.join('\n'));
  }
};


/**
 * @param {Object} params
 * @param {mysql.Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 */
 const generateJSDoc = async (params) => {
  const enumToTypeMap = await makeEnumMap(params);
  const tableList = await listTableName(params);

  const lines = ['// @ts-check', `// Database: ${params.database}`, ''];

  await pMap(tableList, async (table) => {
    lines.push(`/**`);
    // lines.push(` * @memberof ${params.database}`);
    lines.push(` * @typedef {Object} ${table}`);
    const columnList = await listColumn({ ...params, table });
    columnList.forEach(e => lines.push(makeColumnInfo({ enumToTypeMap, column: e, jsdoc: true })));
    lines.push(' */\n');
  }, {concurrency: 1});

  lines.push('module.exports = {};');

  if ('dir' in options) { // need to write file
    try { fs.mkdirSync(options.dir); } catch (err) {};  // ignore error
    fs.writeFileSync(`${options.dir}/index.js`, '');
    fs.writeFileSync(`${options.dir}/index.d.ts`, lines.join('\n'));
    console.log(`${options.dir}/index.d.ts, index.js  created`);
  } else {
    console.log(lines.join('\n'));
  }
};


const main = async () => {
  if (! ('src' in options)) {
    console.error('MySQL uri is required. ex mysql://root:pass@server.com/DABASE[/TABLE]');
    process.exit();
  }
  const uri = new URL(options.src);

  /** @type {mysql.ConnectionOptions} */
  const connectionOptions = {
    host: uri.hostname, port: parseInt(uri.port) || 3306, user: uri.username, password: uri.password,
    database: 'information_schema',
  };

  const path = uri.pathname.split('/'); // '/database/table'
  const requestDatabase = path[1];
  const requestTable = path[2] || null;

  let conn;

  const generateFunc = ('jsdoc' in options) ? generateJSDoc : generateTS;

  try {
    conn = await mysql.createConnection(connectionOptions);
    await generateFunc({conn: conn, database: requestDatabase, table: requestTable});
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (conn)  conn.end();
  }
};

if (require.main === module)  main();
