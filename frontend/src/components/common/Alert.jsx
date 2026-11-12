import React from 'react';
import { Alert as RsAlert } from 'reactstrap';
function Alert({ color = 'info', children, isOpen = true, toggle }) {
 if (!isOpen) return null;
 return <RsAlert color={color} toggle={toggle}>{children}</RsAlert>;
}
export default Alert;
