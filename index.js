// @ts-check
'use strict';

// usage
//   node index.js mysql://root:passwd@mysql-server.example.com/database [-d destdir]
//   node index.js mysql://root:passwd@mysql-server.example.com/database/table [-d destdir]

const pMap = require('p-map');
const mysql = require('mysql2/promise');
const fs = require('fs');
const commandLineArgs = require('command-line-args');

/** @type {{dir?:string, src:string}} */ // @ts-ignore
const options = commandLineArgs([
  {name: 'dir', alias: 'd', type: String},
  {name: 'src', alias: 's', type: String, defaultOption: true}
]);

/**
 * @typedef EnumTypeMap
 * @type {Map<string, string>}
 * @description K: "enum('Y','N')", V: enumType01
 */
const enumToTypeMap = new Map();
const enumTypeUsed = new Set();


/**
 * enum('A','B') -> K:"enum('A','B')", V:"'A' | 'B'"
 * @param {Object} params
 * @param {mysql.Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 * @param {Array<string>} lines
 */
const makeEnumMap = async (params, lines) => {
  const sql = `SELECT DISTINCT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS where TABLE_SCHEMA = ? AND DATA_TYPE = 'enum'`;

  /** @type {[Array<{COLUMN_TYPE:string}>]} */ // @ts-ignore
  const [enumList] = await params.conn.query(sql, [params.database]);
  enumList.forEach((row) => {
    if (enumToTypeMap.has(row.COLUMN_TYPE))  return;
    const declare = row.COLUMN_TYPE.replace('enum(', '').replace(')', '').replace(/,/g, ' | ');
    enumToTypeMap.set(row.COLUMN_TYPE, declare);
  });
};


const sqlColumns = `SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_TYPE, COLUMN_KEY, COLUMN_COMMENT FROM COLUMNS
WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`;
/**
 * fields of 'COLUMNS'
 * @typedef ColumnInfo
 * @type {Object}
 * @property {string} COLUMN_NAME
 * @property {string} IS_NULLABLE
 * @property {string} DATA_TYPE
 * @property {string} COLUMN_TYPE
 * @property {string} COLUMN_KEY
 * @property {string} COLUMN_COMMENT
 * @description  ex: {COLUMN_NAME: 'sub_id', IS_NULLABLE: 'NO', DATA_TYPE: 'bigint', COLUMN_TYPE: 'bigint(20)', COLUMN_KEY: '', COLUMN_COMMENT: 'sub ID' }
 */
/**
 * declare each column
 * @param {ColumnInfo} row
 */
const makeColumnInfo = (row) => {
    let type = 'string';

    if (row.DATA_TYPE.includes('int')) type = 'number';
    if (row.DATA_TYPE === 'timestamp' || row.DATA_TYPE === 'date' || row.DATA_TYPE === 'datetime') type = 'Date';
    const nullOk = (row.IS_NULLABLE === 'YES') ? ' | null' : '';

    if (enumToTypeMap.has(row.COLUMN_TYPE)) {
      type = enumToTypeMap.get(row.COLUMN_TYPE);
      enumTypeUsed.add(row.COLUMN_TYPE);
    }

    const columnType = row.COLUMN_TYPE.replace(/enum\(.+\)/, 'enum()').toLocaleUpperCase();
    const comment = row.COLUMN_COMMENT.replace(/[\x00-\x1f]/g, ' ');

    const optional = row.COLUMN_KEY ? '' : '?';
    return `${row.COLUMN_NAME}${optional}: ${type}${nullOk};  // ${row.COLUMN_KEY} ${columnType}  ${comment}`;
};


/**
 * @param {Object} params
 * @param {mysql.Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 * @param {Array<string>} lines
 */
const makeTableInfo = async (params, lines) => {
  const sql = `SELECT DISTINCT TABLE_NAME FROM COLUMNS WHERE TABLE_SCHEMA = ?`;

  /** @type {[Array<{TABLE_NAME:string}>]} */ // @ts-ignore
  const [res] = await params.conn.query(sql, [params.database]);
  const tableList = res.filter((e) => { return (params.table === null || params.table === e.TABLE_NAME)}).map((e) => { return e.TABLE_NAME; });

  await pMap(tableList, async (table) => {
    lines.push(`export interface ${table} {`);
    /** @type {[Array<ColumnInfo>]} */ // @ts-ignore
    const [res] = await params.conn.query(sqlColumns, [params.database, table]);
    res.forEach((e) => {
      const line = makeColumnInfo(e);
      lines.push(`  ${line}`);
    });
    lines.push('}\n');
  }, {concurrency: 1});
};


/**
 * @param {Object} params
 * @param {mysql.Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 */
const generate = async (params) => {
  const lines = ['/* tslint:disable */', '', `declare module '${params.database}';`, ''];

  await makeEnumMap(params, lines);
  await makeTableInfo(params, lines);

  if ('dir' in options) {
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
    console.error('mysql uri is required. ex mysql://root:pass@server.com/DABASE[/TABLE]');
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
  try {
    conn = await mysql.createConnection(connectionOptions);
    await generate({conn: conn, database: requestDatabase, table: requestTable});
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (conn)  conn.end();
  }
};

if (require.main === module)  main();
