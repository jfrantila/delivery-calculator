import React, { useState } from "react"
import "./calculator.css"
import DeliveryFeeCalculator from "./DeliveryFeeCalculator"

const App = (): JSX.Element => {
  const [drive, setDrive] = useState<boolean>(false)

  return (
    <>
      <div className='submission-banner'>
        <div className='banner-text ps-0'>
          <div>
            Delivery Calculator
          </div>
          <img
            className={drive ? "driveaway" : "arrive"}
            src='https://upload.wikimedia.org/wikipedia/commons/a/a3/Emojione_1F699.svg'
            alt='Delivery-car'></img>
        </div>
      </div>
      <DeliveryFeeCalculator setDrive={setDrive} />
    </>
  )
}

export default App
