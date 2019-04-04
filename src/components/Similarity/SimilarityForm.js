import React from 'react'
import {Form, Input, Dropdown} from "semantic-ui-react"

export default ({onChange, direction, persist, concurrency, writeProperty, labelOptions, relationshipTypeOptions}) => (
    <React.Fragment>
        <Form.Field>
            <label>Item Label</label>
            <Dropdown placeholder='Item Label' fluid search selection options={labelOptions}
                      onChange={(evt, data) => onChange("label", data.value)}/>
        </Form.Field>
        <Form.Field>
            <label>Relationship Type</label>
            <Dropdown placeholder='RelationshipType' fluid search selection options={relationshipTypeOptions}
                      onChange={(evt, data) => onChange("relationshipType", data.value)}/>
        </Form.Field>
        <Form.Field>
            <label>Category Label</label>
            <Dropdown placeholder='Category Label' fluid search selection options={labelOptions}
                      onChange={(evt, data) => onChange("label", data.value)}/>
        </Form.Field>

        <Form.Group inline>
            <Form.Field inline>
                <label style={{'width': '10em'}}>Store results</label>
                <input type='checkbox' checked={persist} onChange={evt => {
                    console.log(evt.target, evt)
                    onChange('persist', evt.target.checked)
                }}/>
            </Form.Field>
            {
                persist ?
                    <Form.Field inline>
                        <Input size='mini' basic="true" value={writeProperty} placeholder='Write Property'
                               onChange={evt => onChange('writeProperty', evt.target.value)}/>
                    </Form.Field>
                    : null
            }
        </Form.Group>
        <Form.Field inline>
            <label style={{'width': '10em'}}>Concurrency</label>
            <input
                type='number'
                placeholder="Concurrency"
                min={1}
                max={1000}
                step={1}
                value={concurrency}
                onChange={evt => onChange('concurrency', evt.target.value)}
                style={{'width': '10em'}}
            />
        </Form.Field>
    </React.Fragment>
)
