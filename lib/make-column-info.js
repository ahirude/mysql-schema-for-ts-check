// @ts-check
'use strict';

/**
 * declare each column
 * @param {Object} params
 * @param {import('./make-enum-map').EnumTypeMap} params.enumToTypeMap
 * @param {import('./list-column').ColumnInfo} params.column
 * @param {boolean} params.jsdoc
 * @returns {string}
 */
 const makeColumnInfo = (params) => {
  const { enumToTypeMap, column, jsdoc } = params;

  let type = 'string';
  switch(column.DATA_TYPE) {
    default: type = 'string';  break;

    case 'json':
      type = 'string|Object';  break;

    case 'decimal':
    case 'double':
    case 'bigint':
    case 'float':
    case 'int':
    case 'mediumint':
    case 'smallint':
    case 'tinyint':
      type = 'number';  break;

    case 'datetime':
    case 'time':
    case 'timestamp':
      type = 'Date';  break;
  }

  const nullOk = (column.IS_NULLABLE === 'YES') ? ' | null' : '';

  if (enumToTypeMap.has(column.COLUMN_TYPE)) {
    type = enumToTypeMap.get(column.COLUMN_TYPE);
  }

  const columnType = column.COLUMN_TYPE.replace(/enum\(.+\)/, 'enum()').toLocaleUpperCase();
  const comment = column.COLUMN_COMMENT.replace(/[\x00-\x1f]/g, ' ');

  const optional = column.COLUMN_KEY ? '' : '?';

  if (! jsdoc) {
    return `${column.COLUMN_NAME}${optional}: ${type}${nullOk};  // ${column.COLUMN_KEY} ${columnType}  ${comment}`;
  } else {
    const suffix = (optional !== '' ? '=': ''); // Optional param
    if (type.includes('('))  type = 'string';
    if (nullOk !== '')  type = `(null|${type})`;

    return ` * @property {${type}${suffix}} ${column.COLUMN_NAME}    ${column.COLUMN_KEY} ${column.COLUMN_TYPE}  ${comment}`;
  }
};

module.exports = makeColumnInfo;
