// @ts-check
'use strict';

/**
 * fields of 'COLUMNS'
 * @typedef {Object} ColumnInfo
 * @property {string} COLUMN_NAME
 * @property {string} IS_NULLABLE
 * @property {string} DATA_TYPE
 * @property {string} COLUMN_TYPE
 * @property {string} COLUMN_KEY
 * @property {string} COLUMN_COMMENT
 * @description  ex: {COLUMN_NAME: 'sub_id', IS_NULLABLE: 'NO', DATA_TYPE: 'bigint', COLUMN_TYPE: 'bigint(20)', COLUMN_KEY: '', COLUMN_COMMENT: 'sub ID' }
 */

const sqlColumns = `
  SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE, COLUMN_TYPE, COLUMN_KEY, COLUMN_COMMENT
  FROM COLUMNS
  WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION
`;

/**
 * 動作
 * @param {Object} params
 * @param {import('mysql2/promise').Connection}  params.conn
 * @param {string} params.table
 * @returns {Promise<Array<ColumnInfo>>}
 */
const listColumn = async (params) => {
  const { conn, table } = params;

  /** @type {[Array<ColumnInfo>]} */ // @ts-ignore
  const [columnList] = await conn.query(sqlColumns, [params.database, table]);

  return columnList;
};

module.exports = listColumn;
