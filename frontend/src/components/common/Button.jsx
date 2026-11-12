import React from 'react';
import { Button as RsButton } from 'reactstrap';
function Button({ children, color = 'primary', onClick, type = 'button', ...rest }) {
 return (
 <RsButton color={color} onClick={onClick} type={type} {...rest}>
 {children}
 </RsButton>
 );
}
export default Button;