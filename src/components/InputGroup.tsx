import React from "react"

interface Props {
  type: string
  label: string
  setState: React.Dispatch<React.SetStateAction<string>>
  value: string | number
  metric?: string
  selectNow?: any
}

const InputGroup = ({ type, label, setState, value, metric, selectNow }: Props): JSX.Element => {
  return (
    <div className='calc-input-group'>
      <label className='calc-input-label'>{label}</label>
      <input
        data-testid='input-group'
        className='calc-input'
        type={type}
        value={value}
        required
        placeholder={label}
        onChange={(e) => setState(e.target.value)}
      />
      {metric ? <i className='calc-input-metric'>{metric}</i> : null}
      {label === "Time" && (
        <button className='calc-input-now-btn' onClick={(e) => selectNow(e)}>
          Now
        </button>
      )}
    </div>
  )
}

export default InputGroup
