export const MySqlFieldTypeMap: Record<number, string> = {
    0: 'DECIMAL',
    1: 'TINY',
    2: 'SHORT',
    3: 'LONG',
    4: 'FLOAT',
    5: 'DOUBLE',
    6: 'NULL',
    7: 'TIMESTAMP',
    8: 'LONGLONG',
    9: 'INT24',
    10: 'DATE',
    11: 'TIME',
    12: 'DATETIME',
    13: 'YEAR',
    14: 'NEWDATE',
    15: 'VARCHAR',
    16: 'BIT',
    253: 'VARCHAR',
    254: 'CHAR',
    246: 'NEWDECIMAL',
};

export function getMySqlTypeByCode(code: number | undefined) {
    return code ? MySqlFieldTypeMap[code] : 'Unknown';
}
