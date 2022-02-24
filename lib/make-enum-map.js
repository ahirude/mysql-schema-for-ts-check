// @ts-check
'use strict';

/**
 * @typedef EnumTypeMap
 * @type {Map<string, string>}
 * @description K: "enum('Y','N')", V: enumType01
 */

/**
 * enum('A','B') -> K:"enum('A','B')", V:"'A' | 'B'"
 * @param {Object} params
 * @param {import('mysql2/promise').Connection} params.conn
 * @param {string} params.database
 * @param {string|null} params.table
 * @returns {Promise<EnumTypeMap>}
 */
 const makeEnumMap = async (params) => {
  /** @type {EnumTypeMap} */
  const enumToTypeMap = new Map();

  const sql = `
    SELECT DISTINCT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE DATA_TYPE = 'enum' AND TABLE_SCHEMA = ?
  `;

  /** @type {[Array<{COLUMN_TYPE:string}>]} */ // @ts-ignore
  const [enumList] = await params.conn.query(sql, [params.database]);
  enumList.forEach((row) => {
    if (enumToTypeMap.has(row.COLUMN_TYPE))  return;
    const declare = row.COLUMN_TYPE.replace('enum(', '').replace(')', '').replace(/,/g, ' | '); // "'Y' | 'N'""
    enumToTypeMap.set(row.COLUMN_TYPE, `string | (${declare})`); // for working with JS on VS-Code
  });
  return enumToTypeMap;
};

module.exports = makeEnumMap;
