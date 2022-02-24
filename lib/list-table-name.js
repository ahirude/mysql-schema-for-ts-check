// @ts-check
'use strict';

/**
 * list table names from information_schema
 * @param {Object} params
 * @param {import('mysql2/promise').Connection} params.conn
 * @param {string}  params.database
 * @param {string|null}  params.table
 * @returns {Promise<Array<string>>}
 */
const listTableName = async (params) => {
  const { conn, database, table } = params;

  const sql = `SELECT DISTINCT TABLE_NAME FROM COLUMNS WHERE TABLE_SCHEMA = ?`;
  /** @type {[Array<{TABLE_NAME:string}>]} */ // @ts-ignore
  const [res] = await params.conn.query(sql, [params.database]);
  const tableList = res.filter(e => params.table === null || params.table === e.TABLE_NAME).map(e => e.TABLE_NAME);
  return tableList;
};

module.exports = listTableName;
