import { FormGroup, Label, Input } from 'reactstrap';
function SelectField({ label, name, value, onChange, options = [] }) {
 return (
 <FormGroup>
 <Label>{label}</Label>
 <Input type="select" name={name} value={value} onChange={onChange}>
 {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
 </Input>
 </FormGroup>
 );
}
export default SelectField;