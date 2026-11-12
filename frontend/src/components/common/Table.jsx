import React from 'react';
import { Table as RsTable } from 'reactstrap';
function Table({ columns, data, renderRow }) {
 return (
 <RsTable hover responsive>
 <thead>
 <tr>{columns.map((col) => <th key={col}>{col}</th>)}</tr>
 </thead>
 <tbody>
 {data && data.map((item, idx) => renderRow(item, idx))}
 </tbody>
 </RsTable>
 );
}
export default Table;