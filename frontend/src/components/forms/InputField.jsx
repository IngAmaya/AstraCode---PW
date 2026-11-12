import React from 'react';
import { FormGroup, Label, Input } from 'reactstrap';
function InputField({ label, type = 'text', name, value, onChange, required = false }) {
 return (
 <FormGroup>
 <Label>{label}</Label>
 <Input type={type} name={name} value={value} onChange={onChange} required={required} />
 </FormGroup>
 );
}
export default InputField;