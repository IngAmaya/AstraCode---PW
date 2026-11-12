import React from 'react';
import { Spinner } from 'reactstrap';
function Loader() {
 return (
 <div className="d-flex justify-content-center py-5">
 <Spinner color="primary" />
 </div>
 );
}
export default Loader;